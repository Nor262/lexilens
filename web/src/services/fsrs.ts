import {
  fsrs,
  generatorParameters,
  Rating,
  RecordLogItem,
  Card as FSRSCard,
  State,
} from 'ts-fsrs';
import { Flashcard, FSRSRating } from '../types';

const params = generatorParameters({
  enable_fuzz: false,
});

const scheduler = fsrs(params);

export function reviewCard(card: Flashcard, rating: FSRSRating): Flashcard {
  const now = new Date();

  // Convert our Flashcard to ts-fsrs internal Card representation
  const fsrsCard: FSRSCard = {
    due: new Date(card.due),
    stability: card.stability || 0,
    difficulty: card.difficulty || 0,
    elapsed_days: card.elapsed_days || 0,
    scheduled_days: card.scheduled_days || 0,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
    state: card.state as State,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
    learning_steps: (card as any).learning_steps || 0,
  };

  let fsrsRating = Rating.Good;
  switch (rating) {
    case 1:
      fsrsRating = Rating.Again;
      break;
    case 2:
      fsrsRating = Rating.Hard;
      break;
    case 3:
      fsrsRating = Rating.Good;
      break;
    case 4:
      fsrsRating = Rating.Easy;
      break;
  }

  const record: RecordLogItem = scheduler.repeat(fsrsCard, now)[fsrsRating];
  const updated = record.card;

  return {
    ...card,
    due: updated.due.toISOString(),
    stability: updated.stability,
    difficulty: updated.difficulty,
    elapsed_days: updated.elapsed_days,
    scheduled_days: updated.scheduled_days,
    reps: updated.reps,
    lapses: updated.lapses,
    state: updated.state,
    last_review: now.toISOString(),
  };
}
