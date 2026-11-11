export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
  meanings?: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

/**
 * Free Dictionary API lookup (open-source Wiktionary data)
 * Free 100%, no API key required
 */
export async function lookupFreeDictionary(word: string): Promise<{
  ipa?: string;
  audioUrl?: string;
  pos?: string;
  definitions?: string[];
} | null> {
  try {
    const cleanWord = word.trim().toLowerCase().replace(/[^a-zA-Z-]/g, '');
    if (!cleanWord || cleanWord.includes(' ')) {
      return null; // Free dictionary API does not support multi-word phrases
    }

    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (!response.ok) {
      return null;
    }

    const data: DictionaryEntry[] = await response.json();
    if (!data || data.length === 0) return null;

    const firstEntry = data[0];

    // Extract cleanest IPA
    let ipa = firstEntry.phonetic;
    let audioUrl: string | undefined;

    if (firstEntry.phonetics && firstEntry.phonetics.length > 0) {
      for (const p of firstEntry.phonetics) {
        if (!ipa && p.text) ipa = p.text;
        if (p.audio && p.audio.trim().length > 0) {
          // Prefer US or UK audio
          audioUrl = p.audio;
          if (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3')) {
            break;
          }
        }
      }
    }

    const firstMeaning = firstEntry.meanings?.[0];
    const pos = firstMeaning?.partOfSpeech;
    const definitions = firstMeaning?.definitions?.map(d => d.definition).slice(0, 3);

    return {
      ipa,
      audioUrl,
      pos,
      definitions,
    };
  } catch (error) {
    console.warn('[LexiLens] Free Dictionary API error (fallback triggered):', error);
    return null;
  }
}
