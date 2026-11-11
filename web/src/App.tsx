import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { StudyDeckView } from './components/StudyDeckView';
import { LibraryView } from './components/LibraryView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { InstallExtensionModal } from './components/InstallExtensionModal';
import { FloatingExtensionBubble } from './components/FloatingExtensionBubble';
import { AuthGateView } from './components/AuthGateView';
import { Flashcard, ReviewLog, UserProfile, FSRSRating } from './types';
import {
  getCards,
  saveCard,
  deleteCard,
  getReviews,
  logReview,
  calculateDynamicStats,
  supabase,
} from './services/supabase';

function getCachedUserId(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)lexilens_auth=([^;]+)/);
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (parsed?.user?.id) return parsed.user.id;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('-auth-token') || key.startsWith('sb-'))) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed?.user?.id) return parsed.user.id;
        }
      }
    }
  } catch {}
  return null;
}

export const App: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<ReviewLog[]>([]);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    display_name: 'Học viên',
    daily_target: 20,
    current_streak: 0,
    last_active_date: new Date().toISOString().slice(0, 10),
  });

  // Check user session on startup
  useEffect(() => {
    const syncAuthCookie = (session: any) => {
      try {
        if (session?.user && session?.access_token) {
          const authData = JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
          });
          document.cookie = `lexilens_auth=${encodeURIComponent(authData)}; path=/; max-age=2592000; SameSite=Lax`;
        } else {
          document.cookie = `lexilens_auth=; path=/; max-age=0; SameSite=Lax`;
        }
      } catch (e) {
        console.warn('Cookie sync error:', e);
      }
    };

    const broadcastAuth = (session: any) => {
      syncAuthCookie(session);
      if (session?.user && session?.access_token) {
        window.postMessage(
          {
            type: 'LEXILENS_AUTH_STATE_CHANGE',
            payload: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              user: session.user,
            },
          },
          '*'
        );
      }
    };

    // Check if session exists in Supabase or Cookie, OR sync from Extension
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let activeSession = session;

      if (!activeSession) {
        try {
          const match = document.cookie.match(/(?:^|;\s*)lexilens_auth=([^;]+)/);
          if (match) {
            const parsed = JSON.parse(decodeURIComponent(match[1]));
            if (parsed?.access_token && parsed?.refresh_token) {
              const { data } = await supabase.auth.setSession({
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token,
              });
              if (data?.session) activeSession = data.session;
            }
            if (!activeSession && parsed?.user) {
              activeSession = { user: parsed.user, access_token: parsed.access_token } as any;
            }
          }
        } catch {}
      }

      if (activeSession?.user) {
        setSessionUser(activeSession.user);
        setProfile((prev) => ({
          ...prev,
          id: activeSession.user.id,
          email: activeSession.user.email,
          display_name: activeSession.user.user_metadata?.full_name || 'Học viên',
        }));
        loadAllData(activeSession.user.id);
        broadcastAuth(activeSession);
        setAuthLoading(false);
      } else {
        // Request session from Extension content script bridge
        window.postMessage({ type: 'LEXILENS_REQUEST_EXTENSION_SESSION' }, '*');
        setTimeout(() => {
          setAuthLoading(false);
        }, 350);
      }
    });

    // Listen to session delivered by Extension
    // Listen to session & card sync events delivered by Extension content script
    const extensionBridgeListener = async (event: MessageEvent) => {
      if (event.data?.type === 'LEXILENS_REQUEST_WEB_SESSION') {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          broadcastAuth(data.session);
        }
      }

      if (event.data?.type === 'LEXILENS_EXTENSION_SESSION_RESPONSE' && event.data?.payload) {
        const { access_token, refresh_token, user } = event.data.payload;
        if (access_token && refresh_token) {
          const { data } = await supabase.auth.setSession({ access_token, refresh_token });
          const activeUser = data?.user || user;
          if (activeUser?.id) {
            setSessionUser(activeUser);
            setProfile((prev) => ({
              ...prev,
              id: activeUser.id,
              email: activeUser.email,
              display_name: activeUser.user_metadata?.full_name || 'Học viên',
            }));
            loadAllData(activeUser.id);
          }
          setAuthLoading(false);
        } else if (user?.id) {
          setSessionUser(user);
          setProfile((prev) => ({
            ...prev,
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || 'Học viên',
          }));
          loadAllData(user.id);
          setAuthLoading(false);
        }
      }

      // Live card saved from extension
      if (event.data?.type === 'CARD_SAVED_FROM_EXTENSION' && event.data?.payload) {
        const newCard: Flashcard = event.data.payload;
        setCards((prev) => {
          if (
            prev.some(
              (c) =>
                c.id === newCard.id ||
                (c.headword.toLowerCase() === newCard.headword.toLowerCase() &&
                  c.meaning_vi === newCard.meaning_vi)
            )
          ) {
            return prev;
          }
          const updated = [newCard, ...prev];
          const uid = sessionUser?.id || profile?.id || getCachedUserId();
          if (uid) {
            localStorage.setItem(`lexilens_cards_${uid}`, JSON.stringify(updated));
            saveCard(newCard, uid).catch(() => {});
          }
          return updated;
        });
      }

      // Direct cards sync from extension storage
      if (event.data?.type === 'LEXILENS_CARDS_SYNC_PUSH' && Array.isArray(event.data?.payload)) {
        const incomingCards: Flashcard[] = event.data.payload;
        if (incomingCards.length > 0) {
          setCards((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const existingHeadwords = new Set(prev.map((c) => c.headword.toLowerCase()));
            let hasNew = false;
            const merged = [...prev];
            for (const c of incomingCards) {
              if (!existingIds.has(c.id) && !existingHeadwords.has(c.headword.toLowerCase())) {
                merged.push(c);
                existingIds.add(c.id);
                existingHeadwords.add(c.headword.toLowerCase());
                hasNew = true;
              }
            }
            if (hasNew) {
              const uid = sessionUser?.id || profile?.id || getCachedUserId();
              if (uid) {
                localStorage.setItem(`lexilens_cards_${uid}`, JSON.stringify(merged));
                for (const c of incomingCards) {
                  saveCard(c, uid).catch(() => {});
                }
              }
            }
            return hasNew ? merged : prev;
          });
        }
      }
    };
    window.addEventListener('message', extensionBridgeListener);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        setProfile((prev) => ({
          ...prev,
          id: session.user.id,
          email: session.user.email,
          display_name: session.user.user_metadata?.full_name || 'Học viên',
        }));
        loadAllData(session.user.id);
        broadcastAuth(session);
      } else {
        setSessionUser(null);
        setCards([]);
        setReviews([]);
      }
      setAuthLoading(false);
    });

    // Auto-refresh when tab receives focus (e.g. user just saved a card in extension and switches to web)
    const handleFocus = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          loadAllData(session.user.id);
          broadcastAuth(session);
        }
      });
      // Also request latest cards from extension content script
      window.postMessage({ type: 'LEXILENS_REQUEST_EXTENSION_CARDS' }, '*');
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('message', extensionBridgeListener);
    };
  }, []);

  const loadAllData = async (userId: string) => {
    const [fetchedCards, fetchedReviews] = await Promise.all([
      getCards(userId),
      getReviews(userId),
    ]);
    setCards(fetchedCards);
    setReviews(fetchedReviews);

    // Request extension to push any local cards with slight retries for script injection readiness
    window.postMessage({ type: 'LEXILENS_REQUEST_EXTENSION_CARDS' }, '*');
    setTimeout(() => {
      window.postMessage({ type: 'LEXILENS_REQUEST_EXTENSION_CARDS' }, '*');
    }, 300);
    setTimeout(() => {
      window.postMessage({ type: 'LEXILENS_REQUEST_EXTENSION_CARDS' }, '*');
    }, 1000);

    // Compute real streak dynamically from review dates
    const stats = calculateDynamicStats(fetchedCards, fetchedReviews);
    setProfile((prev) => ({
      ...prev,
      current_streak: stats.streak,
    }));
  };

  const handleAuthenticated = (user: any) => {
    setSessionUser(user);
    setProfile((prev) => ({
      ...prev,
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || 'Học viên',
    }));
    loadAllData(user.id);
  };

  // When a card is rated in StudyDeck
  const handleUpdateCard = async (updated: Flashcard, rating: FSRSRating = 3) => {
    if (!sessionUser) return;
    const userId = sessionUser.id;

    // 1. Update Card State
    await saveCard(updated, userId);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    // 2. Log Review into History
    const newReview: ReviewLog = {
      id: `rev-${Date.now()}`,
      card_id: updated.id,
      user_id: userId,
      rating,
      duration_ms: 2500,
      reviewed_at: new Date().toISOString(),
    };
    await logReview(newReview, userId);

    setReviews((prev) => {
      const nextReviews = [newReview, ...prev];
      const stats = calculateDynamicStats(cards, nextReviews);
      setProfile((p) => ({ ...p, current_streak: stats.streak }));
      return nextReviews;
    });
  };

  // Add new card
  const handleAddCard = async (newCard: Flashcard) => {
    if (!sessionUser) return;
    const userId = sessionUser.id;
    await saveCard(newCard, userId);
    setCards((prev) => [newCard, ...prev]);
  };

  // Delete card
  const handleDeleteCard = async (cardId: string) => {
    if (!sessionUser) return;
    const userId = sessionUser.id;
    await deleteCard(cardId, userId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  // Update daily goal target
  const handleUpdateTarget = (target: number) => {
    setProfile((prev) => ({ ...prev, daily_target: target }));
  };

  // Reset data to initial state
  const handleResetData = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại dữ liệu học tập về ban đầu không?')) {
      if (sessionUser?.id) {
        localStorage.removeItem(`lexilens_cards_${sessionUser.id}`);
        localStorage.removeItem(`lexilens_reviews_${sessionUser.id}`);
        loadAllData(sessionUser.id);
      }
    }
  };

  // Explicit Logout Handler
  const handleLogout = async () => {
    document.cookie = 'lexilens_auth=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'lexilens_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

    await supabase.auth.signOut();
    window.postMessage({ type: 'LEXILENS_AUTH_LOGOUT' }, '*');

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') || k.includes('-auth-token'))) {
        localStorage.removeItem(k);
      }
    }

    setSessionUser(null);
    setCards([]);
    setReviews([]);
    setProfile({
      id: '',
      display_name: 'Học viên',
      daily_target: 20,
      current_streak: 0,
      last_active_date: new Date().toISOString().slice(0, 10),
    });
  };

  // 1. Loading screen while verifying auth session with smooth shimmer & pulse
  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 select-none">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-academic mb-3"
        >
          <span className="font-serif text-xl font-bold">L</span>
        </motion.div>
        <p className="font-serif text-base font-bold text-primary tracking-wide">LexiLens</p>
        <p className="font-sans text-xs text-on-surface-muted mt-1">Đang đồng bộ phiên học thuật...</p>
      </div>
    );
  }

  // 2. Strict Auth Gate: MUST sign in / register before viewing app or data
  if (!sessionUser) {
    return <AuthGateView onAuthenticated={handleAuthenticated} />;
  }

  const now = new Date();
  const dueCount = cards.filter((c) => new Date(c.due) <= now).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col w-full overflow-x-hidden">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueCount={dueCount}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 md:px-8 pt-3.5 sm:pt-6 pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full"
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                cards={cards}
                profile={profile}
                onStartStudy={() => setActiveTab('study')}
                onOpenLibrary={() => setActiveTab('library')}
                onOpenInstallModal={() => setIsInstallModalOpen(true)}
              />
            )}

            {activeTab === 'study' && (
              <StudyDeckView
                cards={cards}
                onUpdateCard={handleUpdateCard}
                onFinish={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'library' && (
              <LibraryView
                cards={cards}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
            )}

            {activeTab === 'stats' && (
              <StatsView cards={cards} reviews={reviews} profile={profile} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                profile={profile}
                onUpdateTarget={handleUpdateTarget}
                onResetData={handleResetData}
                onLogout={handleLogout}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Bubble at bottom-right corner */}
      <FloatingExtensionBubble onOpen={() => setIsInstallModalOpen(true)} />

      <InstallExtensionModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        downloadUrl="https://github.com/Nor262/lexilens/raw/master/lexilens-chrome-extension.zip"
      />
    </div>
  );
};

export default App;
