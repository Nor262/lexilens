import { createClient } from '@supabase/supabase-js';
import { Flashcard, UserProfile } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xrtjffpjpkmmwsjylxko.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydGpmZnBqcGttbXdzanlseGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjU4NTEsImV4cCI6MjA3Nzg0MTg1MX0.HZ43vBs42BpKRoMR-M07_L_eh_LAK2Ppl1IFT3xJKFE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Local storage key for offline or non-logged-in guest sessions
const LOCAL_CARDS_KEY = 'lexilens_web_cards';

export const mockInitialCards: Flashcard[] = [
  {
    id: 'mock-1',
    headword: 'ephemeral',
    pos: 'adjective',
    ipa: '/ɪˈfem.ər.əl/',
    meaning_vi: 'phù du, sớm nở tối tàn, ngắn ngủi',
    definition_en: 'Lasting for only a short time; transitory.',
    why: 'Đi cùng cụm từ "trends on social media" chỉ sự tồn tại chớp nhoáng của các trào lưu mạng xã hội.',
    collocations: ['ephemeral fame', 'ephemeral pleasure', 'ephemeral beauty'],
    sentence: 'The author argues that viral internet fame is largely ephemeral, fading as swiftly as the algorithms shift.',
    simplified_sentence: 'The writer says online fame lasts only a very short time because algorithms change quickly.',
    due: new Date().toISOString(),
    stability: 2.1,
    difficulty: 5.2,
    elapsed_days: 1,
    scheduled_days: 1,
    reps: 1,
    lapses: 0,
    state: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    source_article_title: 'Digital Culture and Modern Attention Spans — The Atlantic',
    source_article_url: 'https://theatlantic.com/technology/archive/2026/02/digital-culture',
  },
  {
    id: 'mock-2',
    headword: 'paradigm',
    pos: 'noun',
    ipa: '/ˈpær.ə.daɪm/',
    meaning_vi: 'mô hình mẫu, hệ biến hóa, hệ chuẩn mực',
    definition_en: 'A typical example or pattern of something; a model or framework.',
    why: 'Ngữ cảnh bài nghiên cứu so sánh các khung lý thuyết (theoretical framework) trong ngôn ngữ học tri nhận.',
    collocations: ['paradigm shift', 'dominant paradigm', 'new paradigm'],
    sentence: 'The discovery of large language models sparked a radical paradigm shift in computational linguistics.',
    simplified_sentence: 'Large language models fundamentally changed how scientists study language using computers.',
    due: new Date().toISOString(),
    stability: 3.5,
    difficulty: 4.8,
    elapsed_days: 2,
    scheduled_days: 2,
    reps: 2,
    lapses: 0,
    state: 2,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    source_article_title: 'The Evolution of Cognitive Linguistics in the AI Era — Nature',
    source_article_url: 'https://nature.com/articles/comp-ling-ai',
  },
  {
    id: 'mock-3',
    headword: 'nuance',
    pos: 'noun',
    ipa: '/ˈnjuː.ɑːns/',
    meaning_vi: 'sắc thái tinh tế (ý nghĩa, cảm xúc)',
    definition_en: 'A subtle difference in or shade of meaning, expression, or sound.',
    why: 'Bổ nghĩa cho động từ "distinguish" khi phân biệt hai từ đồng nghĩa nhưng mang sắc thái trang trọng khác nhau.',
    collocations: ['subtle nuance', 'semantic nuance', 'cultural nuance'],
    sentence: 'Advanced English learners must learn to discern semantic nuances between formal academic prose and casual conversation.',
    simplified_sentence: 'Good students need to notice the small differences between formal writing and everyday speaking.',
    due: new Date(Date.now() + 86400000).toISOString(),
    stability: 5.0,
    difficulty: 4.0,
    elapsed_days: 3,
    scheduled_days: 4,
    reps: 3,
    lapses: 0,
    state: 2,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    source_article_title: 'Stylistics and Discourse Analysis Guide — Cambridge University Press',
    source_article_url: 'https://cambridge.org/elt/stylistics',
  },
];

/**
 * Load flashcards either from Supabase (if logged in) or local fallback
 */
export async function getCards(userId?: string): Promise<Flashcard[]> {
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Flashcard[];
      }
    } catch (e) {
      console.warn('Could not fetch from Supabase, falling back to local:', e);
    }
  }

  // Fallback to local storage
  const stored = localStorage.getItem(LOCAL_CARDS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  // Seed default academic cards for first-time presentation
  localStorage.setItem(LOCAL_CARDS_KEY, JSON.stringify(mockInitialCards));
  return mockInitialCards;
}

/**
 * Save / Update a flashcard
 */
export async function saveCard(card: Flashcard, userId?: string): Promise<void> {
  // Update local storage
  const localCards = await getCards();
  const index = localCards.findIndex((c) => c.id === card.id);
  if (index >= 0) {
    localCards[index] = card;
  } else {
    localCards.unshift(card);
  }
  localStorage.setItem(LOCAL_CARDS_KEY, JSON.stringify(localCards));

  // Sync to Supabase if logged in
  if (userId) {
    try {
      await supabase.from('cards').upsert({
        ...card,
        user_id: userId,
      });
    } catch (err) {
      console.error('Failed to sync card to Supabase:', err);
    }
  }
}
