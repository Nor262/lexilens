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
    const broadcastAuth = (session: any) => {
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

    supabase.auth.getSession().then(({ data: { session } }) => {
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
      }
      setAuthLoading(false);
    });

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
    };
    window.addEventListener('focus', handleFocus);

    // Listen to direct broadcast/extension events
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const extensionMsgListener = (msg: any) => {
        if (msg?.type === 'CARD_SAVED_FROM_EXTENSION') {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) loadAllData(session.user.id);
          });
        }
      };
      // @ts-ignore
      chrome.runtime.onMessage.addListener(extensionMsgListener);
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadAllData = async (userId: string) => {
    const [fetchedCards, fetchedReviews] = await Promise.all([
      getCards(userId),
      getReviews(userId),
    ]);
    setCards(fetchedCards);
    setReviews(fetchedReviews);

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
        downloadUrl="https://github.com/Nor262/lexilens/releases/download/v1.0.0/lexilens-chrome-extension.zip"
      />
    </div>
  );
};

export default App;
