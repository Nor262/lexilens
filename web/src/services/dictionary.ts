import { Flashcard } from '../types';

export interface DictionaryApiResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
}

/**
 * Fetch authentic word data from Free Dictionary API (Wiktionary live data)
 */
export async function lookupWordOnline(
  word: string,
  customSentence?: string
): Promise<Partial<Flashcard>> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) {
    throw new Error('Từ cần tra không được để trống.');
  }

  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Không tìm thấy từ "${word}" trong từ điển học thuật.`);
    }
    throw new Error(`Lỗi kết nối từ điển (${response.status}).`);
  }

  const data: DictionaryApiResponse[] = await response.json();
  const entry = data[0];

  // Extract phonetic IPA and Human Audio MP3
  let ipa = entry.phonetic || '';
  let audioUrl = '';

  if (entry.phonetics && entry.phonetics.length > 0) {
    for (const p of entry.phonetics) {
      if (!ipa && p.text) ipa = p.text;
      if (!audioUrl && p.audio && p.audio.endsWith('.mp3')) {
        audioUrl = p.audio;
      }
    }
  }

  const primaryMeaning = entry.meanings[0];
  const pos = primaryMeaning?.partOfSpeech || 'noun';
  const primaryDef = primaryMeaning?.definitions[0];
  const definitionEn = primaryDef?.definition || '';
  const exampleSentence =
    customSentence ||
    primaryDef?.example ||
    `The scholar conducted an extensive analysis of ${cleanWord} in modern linguistic corpora.`;

  // Auto-generate collocations and contextual why
  const collocations = (primaryDef?.synonyms || []).slice(0, 3);
  if (collocations.length === 0) {
    collocations.push(`academic ${cleanWord}`, `deep ${cleanWord}`);
  }

  return {
    headword: cleanWord,
    pos,
    ipa: ipa || `/${cleanWord}/`,
    audio_url: audioUrl,
    definition_en: definitionEn,
    sentence: exampleSentence,
    collocations,
  };
}
