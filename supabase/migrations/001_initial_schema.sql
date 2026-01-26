-- DogTale Daily - Initial Database Schema
-- Migration: 001_initial_schema
-- Description: Creates core tables for user profiles, pets, journals, social features, and gamification

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- CORE USER & PET TABLES
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location GEOGRAPHY(POINT, 4326),
    location_name TEXT,
    timezone TEXT DEFAULT 'UTC',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Subscription info
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'luxury')),
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,

    -- Settings synced from app
    settings JSONB DEFAULT '{}'::jsonb,

    -- Feature flags
    features_enabled JSONB DEFAULT '{}'::jsonb
);

-- User pets
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
    breed TEXT,
    birth_date DATE,
    adoption_date DATE,
    weight_kg DECIMAL(5,2),
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    bio TEXT,
    avatar_url TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_deceased BOOLEAN DEFAULT FALSE,
    deceased_at DATE,
    memorial_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pet photos gallery
CREATE TABLE pet_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    is_profile_photo BOOLEAN DEFAULT FALSE,
    taken_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOURNAL & FAVORITES
-- ============================================

-- Journal entries (migrated from localStorage)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    mood TEXT,
    tags TEXT[],
    image_url TEXT,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, date)
);

-- Favorites (migrated from localStorage)
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT CHECK (image_type IN ('dog', 'cat')),
    breed TEXT,
    date_shown DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, image_url)
);

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Friendships (bidirectional after acceptance)
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Activity feed posts
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'walk', 'feeding', 'grooming', 'vet_visit', 'training',
        'playtime', 'photo', 'journal', 'achievement', 'milestone',
        'favorite', 'friend_added', 'quest_completed', 'level_up'
    )),
    content TEXT,
    image_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    visibility TEXT DEFAULT 'friends' CHECK (visibility IN ('private', 'friends', 'public')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity reactions (likes, etc)
CREATE TABLE activity_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'paw', 'wow')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(activity_id, user_id)
);

-- Activity comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMIFICATION
-- ============================================

-- User progress tracking
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    progress_type TEXT NOT NULL,
    progress_key TEXT NOT NULL,
    value INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, progress_type, progress_key)
);

-- Achievements/badges earned
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, achievement_key)
);

-- Quest progress
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quest_key TEXT NOT NULL,
    quest_type TEXT CHECK (quest_type IN ('daily', 'weekly', 'seasonal', 'story')),
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    rewards_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, quest_key, created_at::DATE)
);

-- Virtual pet state
CREATE TABLE virtual_pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pet_name TEXT DEFAULT 'Buddy',
    pet_type TEXT DEFAULT 'dog',
    happiness INTEGER DEFAULT 100 CHECK (happiness >= 0 AND happiness <= 100),
    energy INTEGER DEFAULT 100 CHECK (energy >= 0 AND energy <= 100),
    hunger INTEGER DEFAULT 0 CHECK (hunger >= 0 AND hunger <= 100),
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_fed_at TIMESTAMPTZ DEFAULT NOW(),
    last_played_at TIMESTAMPTZ DEFAULT NOW(),
    last_rested_at TIMESTAMPTZ DEFAULT NOW(),
    customization JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Season pass progress
CREATE TABLE season_pass (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    season_id TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    rewards_claimed INTEGER[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, season_id)
);

-- ============================================
-- HEALTH TRACKING
-- ============================================

-- Health records
CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN (
        'vaccination', 'vet_visit', 'medication', 'weight',
        'symptom', 'allergy', 'surgery', 'dental', 'other'
    )),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    next_due_date DATE,
    vet_name TEXT,
    vet_clinic TEXT,
    cost DECIMAL(10,2),
    documents TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN (
        'vaccination', 'medication', 'vet_appointment', 'grooming',
        'feeding', 'walk', 'quest', 'custom'
    )),
    title TEXT NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ NOT NULL,
    repeat_interval TEXT CHECK (repeat_interval IN ('daily', 'weekly', 'monthly', 'yearly', 'none')),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI CHAT HISTORY
-- ============================================

CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI usage tracking (for rate limiting)
CREATE TABLE ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,

    UNIQUE(user_id, date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_journal_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX idx_favorites_user ON favorites(user_id, created_at DESC);
CREATE INDEX idx_friendships_users ON friendships(requester_id, addressee_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id) WHERE status = 'pending';
CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_visibility ON activities(visibility, created_at DESC) WHERE visibility = 'public';
CREATE INDEX idx_activity_reactions_activity ON activity_reactions(activity_id);
CREATE INDEX idx_comments_activity ON comments(activity_id);
CREATE INDEX idx_quests_user_active ON quests(user_id) WHERE completed_at IS NULL;
CREATE INDEX idx_health_records_pet ON health_records(pet_id, date DESC);
CREATE INDEX idx_reminders_user_due ON reminders(user_id, due_at) WHERE NOT is_completed;
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_pass ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, update only their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Pets: users can manage their own pets, friends can view
CREATE POLICY "Users can manage own pets" ON pets FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Friends can view pets" ON pets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND ((requester_id = auth.uid() AND addressee_id = owner_id)
            OR (addressee_id = auth.uid() AND requester_id = owner_id))
    )
);

-- Pet photos: same as pets
CREATE POLICY "Users can manage own pet photos" ON pet_photos FOR ALL USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = pet_photos.pet_id AND pets.owner_id = auth.uid())
);

-- Journal entries: users can manage their own, friends can view non-private
CREATE POLICY "Users can manage own journal entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Favorites: users can only access their own
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Friendships: users can manage their own requests
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friend requests" ON friendships FOR INSERT
    WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships they're part of" ON friendships FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can delete own friend requests" ON friendships FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Activities: based on visibility
CREATE POLICY "Users can manage own activities" ON activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Friends can view friend activities" ON activities FOR SELECT USING (
    visibility = 'public' OR
    (visibility = 'friends' AND EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND ((requester_id = auth.uid() AND addressee_id = user_id)
            OR (addressee_id = auth.uid() AND requester_id = user_id))
    ))
);

-- Activity reactions: users can manage their own
CREATE POLICY "Users can manage own reactions" ON activity_reactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view reactions" ON activity_reactions FOR SELECT USING (true);

-- Comments: users can manage their own
CREATE POLICY "Users can manage own comments" ON comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view comments on visible activities" ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM activities WHERE activities.id = comments.activity_id)
);

-- Gamification tables: users can only access their own
CREATE POLICY "Users can manage own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quests" ON quests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own virtual pet" ON virtual_pets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own season pass" ON season_pass FOR ALL USING (auth.uid() = user_id);

-- Health records: only pet owners
CREATE POLICY "Users can manage pet health records" ON health_records FOR ALL USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = health_records.pet_id AND pets.owner_id = auth.uid())
);

-- Reminders: users can only access their own
CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);

-- AI tables: users can only access their own
CREATE POLICY "Users can manage own AI conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own AI messages" ON ai_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid())
);
CREATE POLICY "Users can manage own AI usage" ON ai_usage FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Also create a default virtual pet
    INSERT INTO virtual_pets (user_id) VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_virtual_pets_updated_at BEFORE UPDATE ON virtual_pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to calculate XP and level
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp INTEGER)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
    current_xp INTEGER;
    current_level INTEGER;
    xp_for_next_level INTEGER;
    did_level_up BOOLEAN := FALSE;
BEGIN
    SELECT xp, level INTO current_xp, current_level FROM profiles WHERE id = p_user_id;

    current_xp := current_xp + p_xp;

    -- Level formula: each level requires level * 100 XP
    LOOP
        xp_for_next_level := current_level * 100;
        EXIT WHEN current_xp < xp_for_next_level;
        current_xp := current_xp - xp_for_next_level;
        current_level := current_level + 1;
        did_level_up := TRUE;
    END LOOP;

    UPDATE profiles SET xp = current_xp, level = current_level WHERE id = p_user_id;

    RETURN QUERY SELECT current_xp, current_level, did_level_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    last_active DATE;
    current_streak INTEGER;
    today DATE := CURRENT_DATE;
BEGIN
    SELECT last_active_at::DATE, streak_days INTO last_active, current_streak
    FROM profiles WHERE id = p_user_id;

    IF last_active = today THEN
        -- Already active today
        RETURN current_streak;
    ELSIF last_active = today - 1 THEN
        -- Continue streak
        current_streak := current_streak + 1;
    ELSE
        -- Streak broken
        current_streak := 1;
    END IF;

    UPDATE profiles
    SET streak_days = current_streak, last_active_at = NOW()
    WHERE id = p_user_id;

    RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check AI rate limit
CREATE OR REPLACE FUNCTION check_ai_rate_limit(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, messages_used INTEGER, messages_limit INTEGER) AS $$
DECLARE
    tier TEXT;
    daily_limit INTEGER;
    used INTEGER;
BEGIN
    SELECT subscription_tier INTO tier FROM profiles WHERE id = p_user_id;

    daily_limit := CASE tier
        WHEN 'free' THEN 5
        WHEN 'premium' THEN 50
        WHEN 'luxury' THEN 500
        ELSE 5
    END;

    SELECT COALESCE(message_count, 0) INTO used
    FROM ai_usage
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    RETURN QUERY SELECT used < daily_limit, used, daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment AI usage
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_tokens INTEGER DEFAULT 0)
RETURNS VOID AS $$
BEGIN
    INSERT INTO ai_usage (user_id, date, message_count, token_count)
    VALUES (p_user_id, CURRENT_DATE, 1, p_tokens)
    ON CONFLICT (user_id, date) DO UPDATE
    SET message_count = ai_usage.message_count + 1,
        token_count = ai_usage.token_count + p_tokens;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
