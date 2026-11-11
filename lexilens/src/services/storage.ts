import { Flashcard, UserSettings, WordLookupResult, SentenceAnalysisResult } from '../types';
import { isCardDueToday } from './fsrs';

const DEFAULT_SETTINGS: UserSettings = {
  geminiApiKey: '',
  preferredModel: 'gemini-1.5-flash',
  defaultTopic: 'auto',
  dailyReminderHour: 20,
  customTopics: ['CNTT & AI', 'Kinh tế & Tài chính', 'Học thuật & NCKH', 'Văn hóa & Xã hội'],
};

/**
 * Generate a deterministic hash for caching lookups
 */
export function generateCacheKey(prefix: string, text: string, context: string, topic: string): string {
  const raw = `${prefix}:${text.trim().toLowerCase()}|${context.trim().toLowerCase()}|${topic.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `cache_${Math.abs(hash).toString(36)}`;
}

export async function getSettings(): Promise<UserSettings> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(DEFAULT_SETTINGS);
      return;
    }
    chrome.storage.local.get(['settings'], (res) => {
      resolve({ ...DEFAULT_SETTINGS, ...(res.settings || {}) });
    });
  });
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings: updated }, () => {
      resolve(updated);
    });
  });
}

export async function getFlashcards(): Promise<Flashcard[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve([]);
      return;
    }
    chrome.storage.local.get(['flashcards'], (res) => {
      resolve(res.flashcards || []);
    });
  });
}

export async function saveFlashcard(card: Flashcard): Promise<{ success: boolean; isDuplicate: boolean }> {
  const cards = await getFlashcards();
  // Check duplicate by headword and meaning
  const exists = cards.some(
    (c) => c.headword.toLowerCase() === card.headword.toLowerCase() && c.meaning_vi === card.meaning_vi
  );

  if (exists) {
    return { success: true, isDuplicate: true };
  }

  const updatedCards = [card, ...cards];
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ flashcards: updatedCards }, () => {
      resolve();
    });
  });

  await updateExtensionBadge();
  return { success: true, isDuplicate: false };
}

export async function updateFlashcard(card: Flashcard): Promise<void> {
  const cards = await getFlashcards();
  const index = cards.findIndex((c) => c.id === card.id);
  if (index !== -1) {
    cards[index] = card;
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ flashcards: cards }, () => {
        resolve();
      });
    });
    await updateExtensionBadge();
  }
}

export async function deleteFlashcard(cardId: string): Promise<void> {
  const cards = await getFlashcards();
  const filtered = cards.filter((c) => c.id !== cardId);
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ flashcards: filtered }, () => {
      resolve();
    });
  });
  await updateExtensionBadge();
}

/**
 * Updates badge on extension icon to show how many cards are due for review today
 */
export async function updateExtensionBadge(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.action) return;

  const cards = await getFlashcards();
  const dueCount = cards.filter(isCardDueToday).length;

  if (dueCount > 0) {
    chrome.action.setBadgeText({ text: dueCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#9a4023' }); // Terracotta Clay from DESIGN.md
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

/**
 * Cache lookup queries for instant 0ms retrieval on repeated clicks
 */
export async function getCachedLookup<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(null);
      return;
    }
    chrome.storage.local.get([key], (res) => {
      resolve(res[key] || null);
    });
  });
}

export async function setCachedLookup<T>(key: string, data: T): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  chrome.storage.local.set({ [key]: data });
}
