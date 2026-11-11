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
    if (data.session?.user) return data.session.user;

    // 1. Check saved session in local storage
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const stored = await chrome.storage.local.get(['lexilens_saved_user', 'lexilens_session']);
      if (stored.lexilens_session?.access_token) {
        const { data: refreshed } = await supabase.auth.setSession({
          access_token: stored.lexilens_session.access_token,
          refresh_token: stored.lexilens_session.refresh_token,
        });
        if (refreshed?.user) return refreshed.user;
      }
      if (stored.lexilens_saved_user) return stored.lexilens_saved_user;
    }

    // 2. Check shared Cookie from Web App
    const cookieUser = await syncSessionFromCookie();
    if (cookieUser) return cookieUser;

    // 3. Check open Web tabs
    return await tryAutoSyncFromWebTab();
  } catch {
    // fallback
  }
  return null;
}

export async function syncSessionFromCookie(): Promise<any | null> {
  if (typeof chrome === 'undefined' || !chrome.cookies) return null;

  const cookieUrls = [
    'https://lexilens-app.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  for (const url of cookieUrls) {
    try {
      const cookie = await chrome.cookies.get({ url, name: 'lexilens_auth' });
      if (cookie?.value) {
        const tokenData = JSON.parse(decodeURIComponent(cookie.value));
        if (tokenData?.access_token || tokenData?.user) {
          const user = await setSessionFromTokenData(tokenData);
          if (user) return user;
        }
      }
    } catch {
      // continue
    }
  }
  return null;
}

export async function signInExtension(email: string, pass: string) {
  try {
    const res = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (res.data?.session?.user) {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({
          lexilens_saved_user: res.data.session.user,
          lexilens_session: {
            access_token: res.data.session.access_token,
            refresh_token: res.data.session.refresh_token,
          },
        });
      }
      // Auto-upload any offline cards saved on this machine
      await syncAllLocalCardsToCloud(res.data.session.user.id);
    }
    return res;
  } catch (err: any) {
    return { data: { user: null, session: null }, error: err };
  }
}

export async function signUpExtension(email: string, pass: string) {
  try {
    const res = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
    });
    if (res.data?.session?.user) {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({
          lexilens_saved_user: res.data.session.user,
          lexilens_session: {
            access_token: res.data.session.access_token,
            refresh_token: res.data.session.refresh_token,
          },
        });
      }
      await syncAllLocalCardsToCloud(res.data.session.user.id);
    }
    return res;
  } catch (err: any) {
    return { data: { user: null, session: null }, error: err };
  }
}

export async function signOutExtension() {
  if (typeof chrome !== 'undefined') {
    if (chrome.storage?.local) {
      await chrome.storage.local.remove(['lexilens_saved_user', 'lexilens_session']);
    }
    if (chrome.cookies) {
      chrome.cookies.remove({ url: 'https://lexilens-app.vercel.app', name: 'lexilens_auth' }).catch(() => {});
      chrome.cookies.remove({ url: 'http://localhost:3000', name: 'lexilens_auth' }).catch(() => {});
      chrome.cookies.remove({ url: 'http://localhost:5173', name: 'lexilens_auth' }).catch(() => {});
    }
  }
  return await supabase.auth.signOut();
}

export async function syncAllLocalCardsToCloud(userId: string): Promise<number> {
  if (!userId || typeof chrome === 'undefined' || !chrome.storage?.local) return 0;
  try {
    const res = await chrome.storage.local.get(['cards']);
    const localCards = Array.isArray(res.cards) ? res.cards : [];
    if (localCards.length === 0) return 0;

    let syncedCount = 0;
    for (const card of localCards) {
      const ok = await syncCardToCloud(card, userId);
      if (ok) syncedCount++;
    }
    return syncedCount;
  } catch (err) {
    console.warn('[LexiLens] syncAllLocalCardsToCloud error:', err);
    return 0;
  }
}

export async function setSessionFromTokenData(tokenData: {
  access_token?: string;
  refresh_token?: string;
  user?: any;
}): Promise<any | null> {
  try {
    const rawUser = tokenData.user || null;

    // Immediately persist so the extension UI reflects user identity without blocking
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({
        lexilens_saved_user: rawUser,
        lexilens_session: tokenData.access_token
          ? {
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token || '',
            }
          : undefined,
      });
    }

    if (tokenData.access_token && tokenData.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      });

      const activeUser = (!error && data?.user) ? data.user : rawUser;
      if (activeUser) {
        if (typeof chrome !== 'undefined') {
          if (chrome.storage?.local) {
            await chrome.storage.local.set({
              lexilens_saved_user: activeUser,
              lexilens_session: {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
              },
            });
          }
          // Also sync to Web App cookies so Web App gets the session automatically
          if (chrome.cookies) {
            const cookieVal = encodeURIComponent(
              JSON.stringify({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                user: activeUser,
              })
            );
            const cookieUrls = [
              'https://lexilens-app.vercel.app',
              'http://localhost:3000',
              'http://localhost:5173',
            ];
            for (const cUrl of cookieUrls) {
              chrome.cookies.set({
                url: cUrl,
                name: 'lexilens_auth',
                value: cookieVal,
                path: '/',
                expirationDate: Math.floor(Date.now() / 1000) + 2592000,
              }).catch(() => {});
            }
          }
        }
        if (activeUser.id) {
          syncAllLocalCardsToCloud(activeUser.id).catch(() => {});
        }
        console.log('[LexiLens] Session successfully synced from Web App:', activeUser.email);
        return activeUser;
      }
    } else if (rawUser) {
      return rawUser;
    }
  } catch (err) {
    console.warn('[LexiLens] setSessionFromTokenData error:', err);
    if (tokenData.user) {
      return tokenData.user;
    }
  }
  return null;
}

/**
 * Attempts to automatically capture active user session from open Web App tabs
 */
export async function tryAutoSyncFromWebTab(): Promise<any | null> {
  try {
    const tabs = await chrome.tabs.query({});
    const targetTabs = tabs.filter((t) => {
      const u = t.url || '';
      return (
        u.includes('lexilens-app.vercel.app') ||
        u.includes('localhost:3000') ||
        u.includes('localhost:5173')
      );
    });

    for (const tab of targetTabs) {
      if (!tab.id) continue;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: () => {
            try {
              // 1. Check shared cookie
              const cookieMatch = document.cookie.match(/(?:^|;\s*)lexilens_auth=([^;]+)/);
              if (cookieMatch) {
                try {
                  const parsedCookie = JSON.parse(decodeURIComponent(cookieMatch[1]));
                  if (parsedCookie?.access_token || parsedCookie?.user) {
                    return parsedCookie;
                  }
                } catch {}
              }

              // 2. Check localStorage
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('-auth-token') || key.startsWith('sb-'))) {
                  const item = localStorage.getItem(key);
                  if (item) {
                    try {
                      const parsed = JSON.parse(item);
                      if (parsed?.access_token || parsed?.user) {
                        return parsed;
                      }
                    } catch {
                      // continue
                    }
                  }
                }
              }
            } catch {
              // ignore
            }
            return null;
          },
        });

        const tokenData = results?.[0]?.result;
        if (tokenData?.access_token || tokenData?.user) {
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
