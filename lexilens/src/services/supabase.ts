import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrtjffpjpkmmwsjylxko.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydGpmZnBqcGttbXdzanlseGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjU4NTEsImV4cCI6MjA3Nzg0MTg1MX0.HZ43vBs42BpKRoMR-M07_L_eh_LAK2Ppl1IFT3xJKFE';

// Chrome extension local storage adapter for Supabase session persistence
const chromeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const res = await chrome.storage.local.get(key);
      return res[key] ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (e) {
      console.warn('[LexiLens] Failed setting supabase storage item:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await chrome.storage.local.remove(key);
    } catch (e) {
      console.warn('[LexiLens] Failed removing supabase storage item:', e);
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface AuthUserState {
  user: any | null;
  session: any | null;
}

export async function getExtensionUser(): Promise<any | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  } catch {
    return null;
  }
}

export async function signInExtension(email: string, pass: string) {
  return await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pass,
  });
}

export async function signUpExtension(email: string, pass: string) {
  return await supabase.auth.signUp({
    email: email.trim(),
    password: pass,
  });
}

export async function signOutExtension() {
  return await supabase.auth.signOut();
}

export async function setSessionFromTokenData(tokenData: { access_token: string; refresh_token: string }): Promise<any | null> {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });
    if (!error && data?.user) {
      console.log('[LexiLens] Session successfully synced from Web App:', data.user.email);
      return data.user;
    }
  } catch (err) {
    console.warn('[LexiLens] setSessionFromTokenData error:', err);
  }
  return null;
}

/**
 * Attempts to automatically capture active user session from open Web App tabs
 */
export async function tryAutoSyncFromWebTab(): Promise<any | null> {
  try {
    const tabs = await chrome.tabs.query({
      url: ['https://lexilens-app.vercel.app/*', 'http://localhost:3000/*'],
    });

    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('-auth-token') || key.startsWith('sb-'))) {
                const item = localStorage.getItem(key);
                if (item) {
                  try {
                    return JSON.parse(item);
                  } catch {
                    return null;
                  }
                }
              }
            }
            return null;
          },
        });

        const tokenData = results?.[0]?.result;
        if (tokenData?.access_token && tokenData?.refresh_token) {
          const user = await setSessionFromTokenData(tokenData);
          if (user) return user;
        }
      } catch (err) {
        // Tab might be in restricted state, continue to next tab
      }
    }
  } catch (err) {
    console.warn('[LexiLens] Auto sync tab error:', err);
  }
  return null;
}

/**
 * Sync a flashcard to Supabase database (table 'cards')
 */
export async function syncCardToCloud(rawCard: any, userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanId = UUID_REGEX.test(rawCard.id) ? rawCard.id : crypto.randomUUID();
    rawCard.id = cleanId;

    const cloudPayload = {
      id: cleanId,
      user_id: userId,
      headword: rawCard.headword,
      pos: rawCard.pos || 'word',
      ipa: rawCard.ipa || '',
      meaning_vi: rawCard.meaning_vi,
      root_meaning: rawCard.root_meaning || '',
      definition_en: rawCard.definition_en || '',
      why: rawCard.why || '',
      collocations: rawCard.collocations || [],
      sentence: rawCard.sentence,
      simplified_sentence: rawCard.simplified_sentence || '',
      source_article_title: rawCard.article_title || 'Tài liệu tra cứu',
      source_article_url: rawCard.article_url || '',
      audio_url: rawCard.audio_url || '',
      due: rawCard.fsrs?.due ? new Date(rawCard.fsrs.due).toISOString() : new Date().toISOString(),
      stability: rawCard.fsrs?.stability || 2,
      difficulty: rawCard.fsrs?.difficulty || 5,
      elapsed_days: 0,
      scheduled_days: 1,
      reps: rawCard.fsrs?.reps || 0,
      lapses: rawCard.fsrs?.lapses || 0,
      state: rawCard.fsrs?.state || 0,
      created_at: new Date(rawCard.created_at || Date.now()).toISOString(),
    };

    const { error } = await supabase.from('cards').upsert(cloudPayload);
    if (error) {
      console.warn('[LexiLens] Supabase upsert failed:', error.message);
      return false;
    }

    // Notify any open web app tabs that new card was saved so they can refresh live
    notifyWebTabsOfNewCard(rawCard);
    return true;
  } catch (err) {
    console.error('[LexiLens] syncCardToCloud error:', err);
    return false;
  }
}

/**
 * Fetch all cards belonging to the logged in user from Supabase
 */
export async function fetchCardsFromCloud(userId: string): Promise<any[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('[LexiLens] Could not fetch cards from Supabase:', err);
  }
  return [];
}

function notifyWebTabsOfNewCard(card: any) {
  chrome.tabs.query(
    { url: ['https://lexilens-app.vercel.app/*', 'http://localhost:3000/*'] },
    (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'CARD_SAVED_FROM_EXTENSION',
            payload: card,
          }).catch(() => {});
        }
      });
    }
  );
}
