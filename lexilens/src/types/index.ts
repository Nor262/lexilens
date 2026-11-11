export interface WordLookupResult {
  headword: string;
  pos: string;
  ipa: string;
  meaning_vi: string;
  root_meaning?: string;
  definition_en: string;
  why: string;
  other_meanings: string[];
  collocations: string[];
  detected_topic: string;
  audio_url?: string;
  source: 'dictionary+gemini' | 'gemini_fallback' | 'quick+gemini';
}

export interface QuickLookupResult {
  isSentence: boolean;
  headword?: string;
  pos?: string;
  ipa?: string;
  meaning_vi: string;
  definition_en?: string;
  audio_url?: string;
  translation_vi?: string;
}

export interface ClauseBreakdown {
  type: 'main' | 'subordinate' | 'relative' | 'participial';
  text: string;
  role: string;
}

export interface SentenceAnalysisResult {
  translation_vi: string;
  clauses: ClauseBreakdown[];
  simplified: string;
  grammar_points: string[];
}

export interface OCRResult {
  full_text: string;
  sentences: Array<{
    sentence: string;
    translation_vi?: string;
  }>;
}

export interface Flashcard {
  id: string;
  user_id?: string;
  headword: string;
  pos: string;
  ipa: string;
  meaning_vi: string;
  root_meaning?: string;
  definition_en: string;
  why: string;
  sentence: string;
  article_title: string;
  article_url: string;
  topic: string;
  collocations?: string[];
  simplified_sentence?: string;
  image_crop?: string;
  audio_url?: string;
  created_at: number;
  fsrs: {
    due: string;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    state: number; // 0 = New, 1 = Learning, 2 = Review, 3 = Relearning
    last_review?: string;
  };
}

export type ReviewRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface UserSettings {
  geminiApiKey: string;
  preferredModel: string;
  defaultTopic: string;
  dailyReminderHour: number;
  customTopics: string[];
}

export interface ExtensionMessage {
  type: 
    | 'QUICK_LOOKUP'
    | 'ANALYZE_WORD_CONTEXT'
    | 'ANALYZE_SENTENCE_CONTEXT'
    | 'LOOKUP_WORD'
    | 'ANALYZE_SENTENCE'
    | 'PERFORM_OCR'
    | 'SAVE_FLASHCARD'
    | 'GET_CARDS'
    | 'UPDATE_CARD_FSRS'
    | 'GET_SETTINGS'
    | 'SAVE_SETTINGS'
    | 'CAPTURE_VISIBLE_TAB'
    | 'GET_USER'
    | 'SIGN_IN'
    | 'SIGN_UP'
    | 'SIGN_OUT'
    | 'TRY_AUTO_SYNC_AUTH'
    | 'SYNC_SESSION_FROM_PAGE'
    | 'MANUAL_SYNC_ALL_CARDS'
    | 'SYNC_CARDS_FROM_CLOUD';
  payload?: any;
}
