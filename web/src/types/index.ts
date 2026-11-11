export type FSRSRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface Flashcard {
  id: string;
  user_id?: string;
  headword: string;
  pos?: string;
  ipa?: string;
  audio_url?: string;
  meaning_vi: string;
  definition_en?: string;
  why?: string;
  collocations?: string[];
  sentence: string;
  simplified_sentence?: string;
  image_url?: string;
  article_id?: string;
  topic_id?: string;
  source_article_title?: string;
  source_article_url?: string;
  // FSRS fields
  due: string; // ISO string
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number; // 0: New, 1: Learning, 2: Review, 3: Relearning
  last_review?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  daily_target: number;
  current_streak: number;
  last_active_date: string;
}

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at?: string;
}

export interface Article {
  id: string;
  user_id: string;
  url: string;
  title: string;
  domain?: string;
  saved_at: string;
}
