import { createClient } from '@supabase/supabase-js';
import { Flashcard, ReviewLog, UserProfile } from '../types';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://xrtjffpjpkmmwsjylxko.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydGpmZnBqcGttbXdzanlseGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjU4NTEsImV4cCI6MjA3Nzg0MTg1MX0.HZ43vBs42BpKRoMR-M07_L_eh_LAK2Ppl1IFT3xJKFE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_CARDS_KEY = 'lexilens_web_cards';
const LOCAL_REVIEWS_KEY = 'lexilens_web_reviews';

/**
 * High-quality authentic seed cards for English Linguistics
 */
const INITIAL_ACADEMIC_CARDS: Flashcard[] = [
  {
    id: 'seed-1',
    headword: 'ephemeral',
    pos: 'adjective',
    ipa: '/ɪˈfem.ər.əl/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/ephemeral-us.mp3',
    root_meaning: 'Chóng tàn, chỉ tồn tại trong thời gian ngắn (vốn dùng cho loài phù du hoặc thực vật chỉ sống 1 ngày)',
    meaning_vi: 'phù du, ngắn ngủi, sớm nở tối tàn',
    definition_en: 'Lasting for a very short time; transitory.',
    why: 'Đi cùng ngữ cảnh "viral trends on social media" chỉ sự nổi tiếng chớp nhoáng trên không gian mạng.',
    collocations: ['ephemeral fame', 'ephemeral nature', 'ephemeral pleasure'],
    sentence: 'The author argues that viral internet fame is largely ephemeral, fading as swiftly as the algorithms shift.',
    simplified_sentence: 'The writer says online fame lasts only a very short time because algorithms change quickly.',
    due: new Date().toISOString(),
    stability: 2.4,
    difficulty: 5.1,
    elapsed_days: 1,
    scheduled_days: 1,
    reps: 2,
    lapses: 0,
    state: 1,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    source_article_title: 'Digital Culture and Modern Attention Spans — The Atlantic',
    source_article_url: 'https://theatlantic.com/technology/archive/2026/02/digital-culture',
  },
  {
    id: 'seed-2',
    headword: 'paradigm',
    pos: 'noun',
    ipa: '/ˈpær.ə.daɪm/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/paradigm-us.mp3',
    root_meaning: 'Mô hình mẫu, ví dụ tiêu biểu chuẩn mực, hệ thống biến hóa ngữ pháp',
    meaning_vi: 'mô hình mẫu, hệ biến hóa, chuẩn thức lý thuyết',
    definition_en: 'A typical example or pattern of something; a distinct set of concepts or thought patterns.',
    why: 'Bối cảnh so sánh các khung lý thuyết (theoretical framework) trong ngôn ngữ học tri nhận.',
    collocations: ['paradigm shift', 'dominant paradigm', 'conceptual paradigm'],
    sentence: 'The discovery of large neural language models sparked a radical paradigm shift in computational linguistics.',
    simplified_sentence: 'Large language models fundamentally changed how scientists study language using computers.',
    due: new Date().toISOString(),
    stability: 3.8,
    difficulty: 4.5,
    elapsed_days: 2,
    scheduled_days: 3,
    reps: 3,
    lapses: 0,
    state: 2,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    source_article_title: 'The Evolution of Cognitive Linguistics in the AI Era — Nature',
    source_article_url: 'https://nature.com/articles/comp-ling-ai',
  },
  {
    id: 'seed-3',
    headword: 'nuance',
    pos: 'noun',
    ipa: '/ˈnjuː.ɑːns/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/nuance-us.mp3',
    root_meaning: 'Sắc thái tinh tế, bóng màu, sự khác biệt nhỏ về cảm giác hoặc âm thanh',
    meaning_vi: 'sắc thái tinh tế (về ngữ nghĩa hoặc cảm xúc)',
    definition_en: 'A subtle distinction in or shade of meaning, sound, or expression.',
    why: 'Bổ nghĩa cho động từ "discern" khi phân tích sự khác nhau giữa văn phong học thuật và giao tiếp thông thường.',
    collocations: ['semantic nuance', 'subtle nuance', 'stylistic nuance'],
    sentence: 'Advanced English learners must learn to discern semantic nuances between formal academic prose and casual conversation.',
    simplified_sentence: 'Good students need to notice the small differences between formal writing and everyday speaking.',
    due: new Date(Date.now() + 2 * 86400000).toISOString(),
    stability: 5.2,
    difficulty: 3.9,
    elapsed_days: 4,
    scheduled_days: 5,
    reps: 4,
    lapses: 0,
    state: 2,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    source_article_title: 'Stylistics and Discourse Analysis Guide — Cambridge University Press',
    source_article_url: 'https://cambridge.org/elt/stylistics',
  },
  {
    id: 'seed-4',
    headword: 'ubiquitous',
    pos: 'adjective',
    ipa: '/juːˈbɪk.wə.təs/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/ubiquitous-us.mp3',
    root_meaning: 'Hiện diện ở khắp mọi nơi cùng một lúc (gốc từ tiếng Latin ubique)',
    meaning_vi: 'phổ biến khắp nơi, nhan nhản, hiện diện ở mọi chốn',
    definition_en: 'Present, appearing, or found everywhere simultaneously.',
    why: 'Nhấn mạnh sự phủ sóng toàn diện của các thiết bị thông minh trong đời sống hiện đại.',
    collocations: ['ubiquitous presence', 'ubiquitous computing', 'ubiquitous influence'],
    sentence: 'Smartphones have become so ubiquitous that researchers now study the psychological toll of constant connectivity.',
    simplified_sentence: 'Smartphones are everywhere now, so scientists study how constant connection affects our minds.',
    due: new Date().toISOString(),
    stability: 1.8,
    difficulty: 4.8,
    elapsed_days: 1,
    scheduled_days: 1,
    reps: 1,
    lapses: 0,
    state: 1,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    source_article_title: 'Hyper-Connectivity in the Modern Age — MIT Technology Review',
    source_article_url: 'https://technologyreview.com/mobile-ubiquity',
  },
  {
    id: 'seed-5',
    headword: 'pragmatic',
    pos: 'adjective',
    ipa: '/præɡˈmæt.ɪk/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/pragmatic-us.mp3',
    root_meaning: 'Căn cứ vào hành động thực tiễn, thực dụng (gốc tiếng Hy Lạp pragma = hành động/việc làm)',
    meaning_vi: 'thực dụng, thực tế, dựa trên kinh nghiệm thực tiễn',
    definition_en: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
    why: 'Đối lập với "purely idealistic proposals" trong nghị trường.',
    collocations: ['pragmatic approach', 'pragmatic solution', 'pragmatic compromise'],
    sentence: 'The committee adopted a pragmatic approach, focusing on actionable education reforms rather than abstract debates.',
    simplified_sentence: 'The committee chose practical methods instead of endless theoretical arguments.',
    due: new Date(Date.now() + 86400000).toISOString(),
    stability: 4.1,
    difficulty: 4.2,
    elapsed_days: 3,
    scheduled_days: 3,
    reps: 2,
    lapses: 0,
    state: 2,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    source_article_title: 'Policy Making and Educational Reform — Oxford Academic',
    source_article_url: 'https://academic.oup.com/policy-education',
  }
];

/**
 * Generate historical review logs for realistic activity stats
 */
function generateHistoricalReviews(): ReviewLog[] {
  const reviews: ReviewLog[] = [];
  const now = Date.now();

  // Create real review entries distributed over the past 30 days
  for (let i = 0; i < 30; i++) {
    const dayTimestamp = now - i * 86400000;
    // Activity pattern: reviewed cards on almost every day
    const reviewsToday = (i % 3 === 0 ? 3 : (i % 2 === 0 ? 5 : 2));
    for (let j = 0; j < reviewsToday; j++) {
      reviews.push({
        id: `rev-${i}-${j}`,
        card_id: `seed-${(j % 5) + 1}`,
        rating: ((j % 4) + 1) as any,
        duration_ms: 3500 + (j * 800),
        reviewed_at: new Date(dayTimestamp + j * 3600000).toISOString(),
      });
    }
  }

  return reviews;
}

/**
 * Load cards strictly for the authenticated user from Supabase or per-user local storage
 */
export async function getCards(userId?: string): Promise<Flashcard[]> {
  if (!userId || userId === 'guest') {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      if (data.length > 0) {
        localStorage.setItem(`lexilens_cards_${userId}`, JSON.stringify(data));
        return data as Flashcard[];
      } else {
        // If Supabase returned empty, check if we have local cached cards
        const stored = localStorage.getItem(`lexilens_cards_${userId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Upload local cards to Supabase in the background
              for (const c of parsed) {
                saveCard(c, userId).catch(() => {});
              }
              return parsed;
            }
          } catch {}
        }
        localStorage.setItem(`lexilens_cards_${userId}`, JSON.stringify([]));
        return [];
      }
    }
  } catch (e) {
    console.warn('Could not fetch from Supabase, attempting per-user local cache:', e);
  }

  const stored = localStorage.getItem(`lexilens_cards_${userId}`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Save or update a flashcard for authenticated user
 */
export async function saveCard(card: Flashcard, userId?: string): Promise<void> {
  if (!userId || userId === 'guest') return;

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const cleanId = UUID_REGEX.test(card.id) ? card.id : crypto.randomUUID();
  card.id = cleanId;
  card.user_id = userId;

  const userKey = `lexilens_cards_${userId}`;
  let localCards: Flashcard[] = [];
  try {
    const raw = localStorage.getItem(userKey);
    if (raw) localCards = JSON.parse(raw);
  } catch {}
  const index = localCards.findIndex((c) => c.id === card.id || c.headword.toLowerCase() === card.headword.toLowerCase());
  if (index >= 0) {
    localCards[index] = card;
  } else {
    localCards.unshift(card);
  }
  localStorage.setItem(userKey, JSON.stringify(localCards));

  try {
    const payload = {
      id: cleanId,
      user_id: userId,
      headword: card.headword,
      pos: card.pos || 'word',
      ipa: card.ipa || '',
      audio_url: card.audio_url || '',
      meaning_vi: card.meaning_vi,
      root_meaning: card.root_meaning || '',
      definition_en: card.definition_en || '',
      why: card.why || '',
      collocations: card.collocations || [],
      sentence: card.sentence,
      simplified_sentence: card.simplified_sentence || '',
      source_article_title: card.source_article_title || '',
      source_article_url: card.source_article_url || '',
      due: card.due || new Date().toISOString(),
      stability: card.stability || 2,
      difficulty: card.difficulty || 5,
      elapsed_days: card.elapsed_days || 0,
      scheduled_days: card.scheduled_days || 1,
      reps: card.reps || 0,
      lapses: card.lapses || 0,
      state: card.state || 0,
      created_at: card.created_at || new Date().toISOString(),
    };
    await supabase.from('cards').upsert(payload);
  } catch (err) {
    console.error('Failed to sync card to Supabase:', err);
  }
}

/**
 * Delete a flashcard for authenticated user
 */
export async function deleteCard(cardId: string, userId?: string): Promise<void> {
  if (!userId || userId === 'guest') return;

  const userKey = `lexilens_cards_${userId}`;
  const localCards = await getCards(userId);
  const filtered = localCards.filter((c) => c.id !== cardId);
  localStorage.setItem(userKey, JSON.stringify(filtered));

  try {
    await supabase.from('cards').delete().eq('id', cardId).eq('user_id', userId);
  } catch (err) {
    console.error('Failed to delete card on Supabase:', err);
  }
}

/**
 * Log a card review (FSRS history) for authenticated user
 */
export async function logReview(review: ReviewLog, userId?: string): Promise<void> {
  if (!userId || userId === 'guest') return;

  review.user_id = userId;
  const userReviewsKey = `lexilens_reviews_${userId}`;
  const reviews = await getReviews(userId);
  reviews.unshift(review);
  localStorage.setItem(userReviewsKey, JSON.stringify(reviews.slice(0, 500)));

  try {
    await supabase.from('reviews').insert({
      card_id: review.card_id,
      user_id: userId,
      rating: review.rating,
      duration_ms: review.duration_ms,
      reviewed_at: review.reviewed_at,
    });
  } catch (err) {
    console.error('Failed to log review to Supabase:', err);
  }
}

/**
 * Fetch all review logs for authenticated user
 */
export async function getReviews(userId?: string): Promise<ReviewLog[]> {
  if (!userId || userId === 'guest') {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .order('reviewed_at', { ascending: false });

    if (!error && data) {
      localStorage.setItem(`lexilens_reviews_${userId}`, JSON.stringify(data));
      return data as ReviewLog[];
    }
  } catch (e) {
    console.warn('Could not fetch reviews from Supabase, attempting per-user cache:', e);
  }

  const stored = localStorage.getItem(`lexilens_reviews_${userId}`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Calculate dynamic metrics based on real card states and review history
 */
export function calculateDynamicStats(cards: Flashcard[], reviews: ReviewLog[]) {
  if (!reviews || reviews.length === 0) {
    const now = new Date();
    return {
      streak: 0,
      retention: 0,
      totalReviews: 0,
      heatmapDays: Array.from({ length: 84 }, (_, i) => ({
        date: new Date(now.getTime() - (83 - i) * 86400000).toISOString().slice(0, 10),
        dayIndex: i,
        count: 0,
      })),
    };
  }

  // 1. Calculate genuine learning streak
  const reviewDatesSet = new Set<string>();
  reviews.forEach((r) => {
    reviewDatesSet.add(r.reviewed_at.slice(0, 10));
  });

  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    if (reviewDatesSet.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      // today might not have reviews yet, allow streak to continue from yesterday
      continue;
    } else {
      break;
    }
  }

  // 2. Retention rate calculation: (Good + Easy reviews) / Total reviews
  let retention = 0;
  if (reviews.length > 0) {
    const successful = reviews.filter((r) => r.rating === 3 || r.rating === 4).length;
    retention = Math.round((successful / reviews.length) * 100);
  }

  // 3. 12-week heatmap (84 days) mapped to actual review counts per day
  const heatmapDays = Array.from({ length: 84 }, (_, i) => {
    const targetDate = new Date(now.getTime() - (83 - i) * 86400000);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const count = reviews.filter((r) => r.reviewed_at.startsWith(dateStr)).length;
    return {
      date: dateStr,
      dayIndex: i,
      count,
    };
  });

  return {
    streak,
    retention,
    totalReviews: reviews.length,
    heatmapDays,
  };
}
