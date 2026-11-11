import React, { useState, useEffect } from 'react';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { StudyDeckView } from './components/StudyDeckView';
import { LibraryView } from './components/LibraryView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { InstallExtensionModal } from './components/InstallExtensionModal';
import { FloatingExtensionBubble } from './components/FloatingExtensionBubble';
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
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<ReviewLog[]>([]);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: 'guest',
    display_name: 'Học viên NNA',
    daily_target: 20,
    current_streak: 1,
    last_active_date: new Date().toISOString().slice(0, 10),
  });

  // Initial data loading from Supabase / Storage
  useEffect(() => {
    loadAllData();

    // Listen to Supabase Auth state change
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setProfile((prev) => ({
          ...prev,
          id: session.user.id,
          email: session.user.email,
          display_name: session.user.user_metadata?.full_name || prev.display_name,
        }));
        loadAllData(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setProfile((prev) => ({
          ...prev,
          id: session.user.id,
          email: session.user.email,
          display_name: session.user.user_metadata?.full_name || prev.display_name,
        }));
        loadAllData(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAllData = async (userId?: string) => {
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

  // When a card is rated in StudyDeck
  const handleUpdateCard = async (updated: Flashcard, rating: FSRSRating = 3) => {
    const userId = profile.id !== 'guest' ? profile.id : undefined;

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
    const userId = profile.id !== 'guest' ? profile.id : undefined;
    await saveCard(newCard, userId);
    setCards((prev) => [newCard, ...prev]);
  };

  // Delete card
  const handleDeleteCard = async (cardId: string) => {
    const userId = profile.id !== 'guest' ? profile.id : undefined;
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
      localStorage.removeItem('lexilens_web_cards');
      localStorage.removeItem('lexilens_web_reviews');
      loadAllData();
    }
  };

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
          <StatsView
            cards={cards}
            reviews={reviews}
            profile={profile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdateTarget={handleUpdateTarget}
            onResetData={handleResetData}
          />
        )}
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
