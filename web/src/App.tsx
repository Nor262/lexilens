import React, { useState, useEffect } from 'react';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { StudyDeckView } from './components/StudyDeckView';
import { LibraryView } from './components/LibraryView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { Flashcard, UserProfile } from './types';
import { getCards, saveCard, supabase } from './services/supabase';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    id: 'guest',
    display_name: 'Học viên NNA',
    daily_target: 20,
    current_streak: 5,
    last_active_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    // Initial fetch of cards
    getCards().then((fetched) => setCards(fetched));

    // Listen to Supabase Auth state change
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setProfile((prev) => ({
          ...prev,
          id: session.user.id,
          email: session.user.email,
          display_name: session.user.user_metadata?.full_name || prev.display_name,
        }));
        getCards(session.user.id).then((userCards) => setCards(userCards));
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
        getCards(session.user.id).then((userCards) => setCards(userCards));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateCard = (updated: Flashcard) => {
    saveCard(updated, profile.id !== 'guest' ? profile.id : undefined);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleUpdateTarget = (target: number) => {
    setProfile((prev) => ({ ...prev, daily_target: target }));
  };

  const now = new Date();
  const dueCount = cards.filter((c) => new Date(c.due) <= now).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueCount={dueCount}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            cards={cards}
            profile={profile}
            onStartStudy={() => setActiveTab('study')}
            onOpenLibrary={() => setActiveTab('library')}
          />
        )}

        {activeTab === 'study' && (
          <StudyDeckView
            cards={cards}
            onUpdateCard={handleUpdateCard}
            onFinish={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'library' && <LibraryView cards={cards} />}

        {activeTab === 'stats' && <StatsView cards={cards} profile={profile} />}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdateTarget={handleUpdateTarget}
          />
        )}
      </main>
    </div>
  );
};

export default App;
