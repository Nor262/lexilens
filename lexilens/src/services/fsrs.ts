import { fsrs, createEmptyCard, Rating, Card as FSRSCard, RecordLogItem } from 'ts-fsrs';
import { Flashcard, ReviewRating } from '../types';

const scheduler = fsrs();

export function createNewFsrsState() {
  const card = createEmptyCard();
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
  };
}

export function reviewFsrsCard(card: Flashcard, rating: ReviewRating): {
  updatedCard: Flashcard;
  scheduledDays: number;
} {
  const now = new Date();
  
  // Reconstruct ts-fsrs Card object
  const currentFsrsCard: FSRSCard = {
    due: new Date(card.fsrs.due),
    stability: card.fsrs.stability,
    difficulty: card.fsrs.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: card.fsrs.reps,
    lapses: card.fsrs.lapses,
    state: card.fsrs.state,
    last_review: card.fsrs.last_review ? new Date(card.fsrs.last_review) : undefined,
  };

  const fsrsRating = 
    rating === 1 ? Rating.Again :
    rating === 2 ? Rating.Hard :
    rating === 3 ? Rating.Good :
    Rating.Easy;

  const schedulingCards = scheduler.repeat(currentFsrsCard, now);
  const nextItem: RecordLogItem = schedulingCards[fsrsRating];

  const updatedCard: Flashcard = {
    ...card,
    fsrs: {
      due: nextItem.card.due.toISOString(),
      stability: nextItem.card.stability,
      difficulty: nextItem.card.difficulty,
      reps: nextItem.card.reps,
      lapses: nextItem.card.lapses,
      state: nextItem.card.state,
      last_review: now.toISOString(),
    },
  };

  return {
    updatedCard,
    scheduledDays: nextItem.card.scheduled_days,
  };
}

export function isCardDueToday(card: Flashcard): boolean {
  const dueDate = new Date(card.fsrs.due);
  const now = new Date();
  return dueDate <= now;
}
