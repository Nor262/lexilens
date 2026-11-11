/**
 * LexiLens Instant Translation Service
 * Powered by high-speed translation API (< 150ms latency)
 */

export interface QuickWordResult {
  headword: string;
  pos?: string;
  ipa?: string;
  meaning_vi: string;
  definition_en?: string;
  audio_url?: string;
}

export async function quickTranslateText(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data[0] && Array.isArray(data[0])) {
      const translated = data[0]
        .map((item: any) => item[0])
        .filter(Boolean)
        .join(' ');
      return translated.trim();
    }
  } catch (err) {
    console.warn('[LexiLens] Quick Translate failed:', err);
  }
  return '';
}
