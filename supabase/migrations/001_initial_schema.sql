-- ==============================================================================
-- LexiLens Database Schema & Row Level Security (RLS)
-- Multi-device Academic Vocabulary & FSRS Spaced Repetition Engine
-- ==============================================================================

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    daily_target INT DEFAULT 20,
    current_streak INT DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    preferences JSONB DEFAULT '{"dailyReminderHour": 20, "defaultTopic": "auto"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Topics / Categories
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#9a4023',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Articles & Web Sources
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    domain TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Vocabulary Flashcards (FSRS SRS State)
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    headword TEXT NOT NULL,
    pos TEXT,
    ipa TEXT,
    audio_url TEXT,
    meaning_vi TEXT NOT NULL,
    definition_en TEXT,
    why TEXT,
    collocations JSONB DEFAULT '[]'::jsonb,
    sentence TEXT NOT NULL,
    simplified_sentence TEXT,
    image_url TEXT,
    -- FSRS Algorithm Metrics
    due TIMESTAMPTZ DEFAULT NOW(),
    stability DOUBLE PRECISION DEFAULT 0.0,
    difficulty DOUBLE PRECISION DEFAULT 0.0,
    elapsed_days INT DEFAULT 0,
    scheduled_days INT DEFAULT 0,
    reps INT DEFAULT 0,
    lapses INT DEFAULT 0,
    state INT DEFAULT 0, -- 0: New, 1: Learning, 2: Review, 3: Relearning
    last_review TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Review Logs (History & Analytics)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INT NOT NULL, -- 1: Again, 2: Hard, 3: Good, 4: Easy
    duration_ms INT DEFAULT 0,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_cards_user_due ON public.cards(user_id, due);
CREATE INDEX IF NOT EXISTS idx_cards_user_headword ON public.cards(user_id, headword);
CREATE INDEX IF NOT EXISTS idx_articles_user ON public.articles(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_reviewed ON public.reviews(user_id, reviewed_at);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Topics
CREATE POLICY "Users can manage own topics" ON public.topics FOR ALL USING (auth.uid() = user_id);

-- Articles
CREATE POLICY "Users can manage own articles" ON public.articles FOR ALL USING (auth.uid() = user_id);

-- Cards
CREATE POLICY "Users can manage own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);

-- Reviews
CREATE POLICY "Users can manage own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- Trigger: Auto-create Profile on Auth Signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
