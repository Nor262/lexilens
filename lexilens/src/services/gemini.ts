import { WordLookupResult, SentenceAnalysisResult, OCRResult } from '../types';

const DEFAULT_MODEL = 'gemini-2.5-flash';

export interface AvailableModel {
  name: string;
  displayName: string;
  apiVersion: 'v1beta' | 'v1';
}

/**
 * Strips markdown code fences from JSON output
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Dynamically queries Google Generative Language ModelService.ListModels
 * across v1beta and v1 to discover what models this API key has access to.
 */
export async function fetchAvailableModels(apiKey: string): Promise<AvailableModel[]> {
  const versions: ('v1beta' | 'v1')[] = ['v1beta', 'v1'];
  const foundModels: AvailableModel[] = [];

  for (const v of versions) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data?.models)) {
        for (const m of data.models) {
          const supported = m.supportedGenerationMethods || [];
          if (supported.includes('generateContent')) {
            const rawName = m.name || '';
            const cleanName = rawName.replace(/^models\//, '');
            if (!foundModels.some((item) => item.name === cleanName)) {
              foundModels.push({
                name: cleanName,
                displayName: m.displayName || cleanName,
                apiVersion: v,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[LexiLens] Failed querying ${v}/models:`, e);
    }
  }

  return foundModels;
}

/**
 * Chooses the best model suited for fast & accurate contextual linguistic analysis
 */
export function pickBestModel(models: AvailableModel[]): AvailableModel | null {
  if (!models || models.length === 0) return null;

  const priorityOrder = [
    /gemini-3\.0-flash/i,
    /gemini-3-flash/i,
    /gemini-2\.5-flash/i,
    /gemini-2\.0-flash/i,
    /gemini-1\.5-flash-latest/i,
    /gemini-1\.5-flash/i,
    /gemini-1\.5-flash-8b/i,
    /gemini-3\.0-pro/i,
    /gemini-2\.5-pro/i,
    /gemini-1\.5-pro/i,
    /flash/i,
    /gemini/i,
  ];

  for (const regex of priorityOrder) {
    const match = models.find((m) => regex.test(m.name));
    if (match) return match;
  }

  return models[0];
}

/**
 * Call Gemini REST API directly with dynamic model discovery and auto-fallback
 */
async function callGemini(apiKey: string, model: string, contents: any[]): Promise<string> {
  const candidateModels: { name: string; apiVersion: 'v1beta' | 'v1' }[] = [];

  if (model) {
    candidateModels.push({ name: model, apiVersion: 'v1beta' });
    candidateModels.push({ name: model, apiVersion: 'v1' });
  }

  const fallbackNames = [
    'gemini-3.0-flash',
    'gemini-3-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-3.0-pro',
    'gemini-2.5-pro',
    'gemini-1.5-pro',
  ];

  for (const fb of fallbackNames) {
    if (!candidateModels.some((c) => c.name === fb && c.apiVersion === 'v1beta')) {
      candidateModels.push({ name: fb, apiVersion: 'v1beta' });
    }
    if (!candidateModels.some((c) => c.name === fb && c.apiVersion === 'v1')) {
      candidateModels.push({ name: fb, apiVersion: 'v1' });
    }
  }

  const makeRequest = async (m: string, v: string) => {
    const url = `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${apiKey}`;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2, // Low temperature for high precision
          responseMimeType: 'application/json',
        },
      }),
    });
  };

  let lastErrorText = '';

  // 1. Try static candidates in order
  for (const candidate of candidateModels) {
    try {
      const response = await makeRequest(candidate.name, candidate.apiVersion);
      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return cleanJsonString(text);
        }
      } else {
        lastErrorText = await response.text();
        if (response.status === 400 && lastErrorText.includes('API_KEY_INVALID')) {
          throw new Error('API Key Gemini không hợp lệ. Vui lòng kiểm tra lại trong phần Cài đặt.');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('API Key Gemini không hợp lệ')) {
        throw err;
      }
    }
  }

  // 2. Dynamic discovery via Google ModelService.ListModels
  try {
    console.info('[LexiLens] Discovering available models via ModelService.ListModels...');
    const available = await fetchAvailableModels(apiKey);
    const best = pickBestModel(available);
    if (best) {
      console.info(`[LexiLens] Selected discovered model: ${best.name} (${best.apiVersion})`);
      const response = await makeRequest(best.name, best.apiVersion);
      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return cleanJsonString(text);
        }
      } else {
        lastErrorText = await response.text();
      }
    }
  } catch (discoveryErr) {
    console.warn('[LexiLens] Dynamic model discovery failed:', discoveryErr);
  }

  throw new Error(`Gemini API Error: Không thể gọi model khả dụng. Chi tiết: ${lastErrorText}`);
}

/**
 * 1. Word / Phrase lookup in Context
 */
export async function lookupWordWithGemini(
  apiKey: string,
  model: string,
  selection: string,
  sentence: string,
  pageTitle: string,
  topic: string,
  knownIpa?: string
): Promise<WordLookupResult> {
  const prompt = `
Bạn là trợ lý từ vựng học thuật cho sinh viên Việt Nam học chuyên ngành Ngôn ngữ Anh.
Lĩnh vực/Chủ đề: ${topic || 'auto'} ("auto" = tự đoán từ tiêu đề trang và câu văn).
Tiêu đề trang: ${pageTitle || 'Bài báo'}
Câu chứa từ: "${sentence}"
Từ/cụm từ cần giải thích: "${selection}"
${knownIpa ? `Phiên âm IPA chuẩn từ điển: ${knownIpa}` : ''}

Quy tắc bắt buộc:
1. "meaning_vi": Nghĩa tiếng Việt CHÍNH XÁC trong ngữ cảnh câu này (ưu tiên thuật ngữ chuyên ngành nếu có).
2. "why": Một câu tiếng Việt ngắn gọn chỉ ra manh mối ngữ cảnh (từ nào, cấu trúc nào xung quanh) quyết định nghĩa này.
3. "definition_en": Định nghĩa súc tích bằng tiếng Anh (simple English).
4. "other_meanings": Mảng tối đa 2-3 nghĩa phổ thông khác thường gặp.
5. "collocations": 2-3 cụm kết hợp từ phổ biến.
6. Chỉ trả về JSON tuân thủ đúng cấu trúc. Không thêm văn bản phụ.

JSON format:
{
  "headword": "từ gốc (lemma)",
  "pos": "verb | noun | adjective | adverb | idiom | phrase",
  "ipa": "${knownIpa || '/phiên âm/'}",
  "meaning_vi": "nghĩa trong ngữ cảnh",
  "definition_en": "english definition",
  "why": "Lý do vì sao nghĩa này...",
  "other_meanings": ["nghĩa 1", "nghĩa 2"],
  "collocations": ["collocation 1", "collocation 2"],
  "detected_topic": "lĩnh vực phát hiện được"
}
`;

  const jsonStr = await callGemini(apiKey, model, [
    {
      parts: [{ text: prompt }],
    },
  ]);

  const parsed = JSON.parse(jsonStr);
  return {
    ...parsed,
    source: knownIpa ? 'dictionary+gemini' : 'gemini_fallback',
  };
}

/**
 * 2. Sentence Grammar & Syntax Breakdown
 */
export async function analyzeSentenceWithGemini(
  apiKey: string,
  model: string,
  sentence: string
): Promise<SentenceAnalysisResult> {
  const prompt = `
Phân tích ngữ pháp và cấu trúc câu tiếng Anh sau cho sinh viên chuyên ngành Ngôn ngữ Anh:
Câu: "${sentence}"

Yêu cầu học thuật:
1. Dịch câu sang tiếng Việt tự nhiên, chuẩn văn phong học thuật.
2. Tách câu thành các mệnh đề ("clauses"):
   - type: "main" (mệnh đề chính), "subordinate" (mệnh đề phụ trạng ngữ/danh từ), "relative" (mệnh đề quan hệ), "participial" (cụm phân từ/rút gọn).
   - text: đoạn văn bản gốc tương ứng.
   - role: vai trò ngữ pháp (ví dụ: "chủ ngữ chính và vị ngữ", "bổ nghĩa thời gian", "bổ ngữ cho danh từ X").
3. "simplified": Viết lại câu bằng cấu trúc đơn giản, dễ hiểu hơn.
4. "grammar_points": Tối đa 3 điểm ngữ pháp đáng chú ý (ví dụ: "Đảo ngữ", "Câu bị động kép", "Rút gọn mệnh đề quan hệ").

Chỉ trả về JSON thuần theo format:
{
  "translation_vi": "bản dịch tiếng Việt",
  "clauses": [
    { "type": "main", "text": "...", "role": "..." },
    { "type": "relative", "text": "...", "role": "..." }
  ],
  "simplified": "câu đơn giản hóa",
  "grammar_points": ["điểm 1", "điểm 2"]
}
`;

  const jsonStr = await callGemini(apiKey, model, [
    {
      parts: [{ text: prompt }],
    },
  ]);

  return JSON.parse(jsonStr);
}

/**
 * 3. Multimodal OCR via Gemini Flash
 */
export async function ocrImageWithGemini(
  apiKey: string,
  model: string,
  imageBase64: string
): Promise<OCRResult> {
  // Strip data:image/...;base64, prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `
Đọc toàn bộ văn bản tiếng Anh trong ảnh cắt này.
1. Nhận diện chính xác 100% từng chữ và dấu câu.
2. Tách văn bản thành danh sách các câu hoàn chỉnh ("sentences").
3. Cung cấp bản dịch tiếng Việt sơ bộ cho từng câu.

Chỉ trả về JSON:
{
  "full_text": "toàn bộ đoạn văn",
  "sentences": [
    {
      "sentence": "câu tiếng Anh",
      "translation_vi": "bản dịch tiếng Việt"
    }
  ]
}
`;

  const jsonStr = await callGemini(apiKey, model, [
    {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Data,
          },
        },
      ],
    },
  ]);

  return JSON.parse(jsonStr);
}
