-- DogTale Daily - Battle System Schema
-- Migration: 002_battle_system
-- Description: Creates tables for PvP/Team battle matchmaking and results tracking

-- ============================================
-- BATTLE SYSTEM TABLES
-- ============================================

-- Battle sessions (matchmaking and game sessions)
CREATE TABLE battle_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_type TEXT NOT NULL CHECK (battle_type IN ('1v1', '2v2', 'race', 'coop')),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    max_participants INTEGER DEFAULT 2,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Battle participants (users in a battle session)
CREATE TABLE battle_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES battle_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
    team TEXT CHECK (team IN ('team_a', 'team_b', 'solo')),
    score INTEGER DEFAULT 0,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(session_id, user_id)
);

-- Battle results (outcome tracking)
CREATE TABLE battle_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES battle_sessions(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    loser_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    winning_team TEXT CHECK (winning_team IN ('team_a', 'team_b', NULL)),
    xp_awarded INTEGER DEFAULT 100,
    rewards JSONB DEFAULT '{}'::jsonb,
    match_duration_seconds INTEGER,
    completed_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(session_id)
);

-- Battle rankings (ELO/rating system)
CREATE TABLE battle_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    battle_type TEXT NOT NULL CHECK (battle_type IN ('1v1', '2v2', 'race', 'coop')),
    rating INTEGER DEFAULT 1000,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    best_win_streak INTEGER DEFAULT 0,
    rank_tier TEXT DEFAULT 'bronze' CHECK (rank_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master')),
    season_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, battle_type)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Battle sessions indexes
CREATE INDEX idx_battle_sessions_status ON battle_sessions(status) WHERE status = 'waiting';
CREATE INDEX idx_battle_sessions_type_status ON battle_sessions(battle_type, status);
CREATE INDEX idx_battle_sessions_created ON battle_sessions(created_at DESC);

-- Battle participants indexes
CREATE INDEX idx_battle_participants_session ON battle_participants(session_id);
CREATE INDEX idx_battle_participants_user ON battle_participants(user_id);
CREATE INDEX idx_battle_participants_user_session ON battle_participants(user_id, session_id);

-- Battle results indexes
CREATE INDEX idx_battle_results_session ON battle_results(session_id);
CREATE INDEX idx_battle_results_winner ON battle_results(winner_id, completed_at DESC);
CREATE INDEX idx_battle_results_loser ON battle_results(loser_id, completed_at DESC);
CREATE INDEX idx_battle_results_completed ON battle_results(completed_at DESC);

-- Battle rankings indexes
CREATE INDEX idx_battle_rankings_user ON battle_rankings(user_id);
CREATE INDEX idx_battle_rankings_type_rating ON battle_rankings(battle_type, rating DESC);
CREATE INDEX idx_battle_rankings_type_tier ON battle_rankings(battle_type, rank_tier);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_rankings ENABLE ROW LEVEL SECURITY;

-- Battle sessions: anyone can view waiting sessions, participants can view their sessions
CREATE POLICY "Anyone can view waiting battle sessions" ON battle_sessions
    FOR SELECT USING (status = 'waiting');

CREATE POLICY "Participants can view their battle sessions" ON battle_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM battle_participants
            WHERE battle_participants.session_id = battle_sessions.id
            AND battle_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create battle sessions" ON battle_sessions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can update their battle sessions" ON battle_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM battle_participants
            WHERE battle_participants.session_id = battle_sessions.id
            AND battle_participants.user_id = auth.uid()
        )
    );

-- Battle participants: users can manage their own participation
CREATE POLICY "Users can view battle participants in their sessions" ON battle_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM battle_participants bp
            WHERE bp.session_id = battle_participants.session_id
            AND bp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join battle sessions" ON battle_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON battle_participants
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave battle sessions" ON battle_participants
    FOR DELETE USING (user_id = auth.uid());

-- Battle results: participants can view and create results
CREATE POLICY "Participants can view their battle results" ON battle_results
    FOR SELECT USING (
        winner_id = auth.uid() OR
        loser_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM battle_participants
            WHERE battle_participants.session_id = battle_results.session_id
            AND battle_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can submit battle results" ON battle_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM battle_participants
            WHERE battle_participants.session_id = session_id
            AND battle_participants.user_id = auth.uid()
        )
    );

-- Battle rankings: anyone can view, users can only modify their own
CREATE POLICY "Anyone can view battle rankings" ON battle_rankings
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own rankings" ON battle_rankings
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-set max_participants based on battle type
CREATE OR REPLACE FUNCTION set_battle_max_participants()
RETURNS TRIGGER AS $$
BEGIN
    NEW.max_participants := CASE NEW.battle_type
        WHEN '1v1' THEN 2
        WHEN '2v2' THEN 4
        WHEN 'race' THEN 2
        WHEN 'coop' THEN 4
        ELSE 2
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_battle_participants_trigger
    BEFORE INSERT ON battle_sessions
    FOR EACH ROW EXECUTE FUNCTION set_battle_max_participants();

-- Auto-set started_at when battle goes in_progress
CREATE OR REPLACE FUNCTION handle_battle_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'waiting' AND NEW.status = 'in_progress' THEN
        NEW.started_at := NOW();
    ELSIF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
        NEW.completed_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER battle_status_change_trigger
    BEFORE UPDATE ON battle_sessions
    FOR EACH ROW EXECUTE FUNCTION handle_battle_status_change();

-- Function to update battle rankings after a match
CREATE OR REPLACE FUNCTION update_battle_rankings(
    p_winner_id UUID,
    p_loser_id UUID,
    p_battle_type TEXT,
    p_xp_awarded INTEGER DEFAULT 100
)
RETURNS VOID AS $$
DECLARE
    winner_rating INTEGER;
    loser_rating INTEGER;
    rating_change INTEGER;
    new_winner_rating INTEGER;
    new_loser_rating INTEGER;
BEGIN
    -- Get or create rankings for both players
    INSERT INTO battle_rankings (user_id, battle_type)
    VALUES (p_winner_id, p_battle_type)
    ON CONFLICT (user_id, battle_type) DO NOTHING;

    INSERT INTO battle_rankings (user_id, battle_type)
    VALUES (p_loser_id, p_battle_type)
    ON CONFLICT (user_id, battle_type) DO NOTHING;

    -- Get current ratings
    SELECT rating INTO winner_rating FROM battle_rankings
    WHERE user_id = p_winner_id AND battle_type = p_battle_type;

    SELECT rating INTO loser_rating FROM battle_rankings
    WHERE user_id = p_loser_id AND battle_type = p_battle_type;

    -- Calculate ELO change (simplified K=32)
    rating_change := GREATEST(10, 32 - (winner_rating - loser_rating) / 25);

    new_winner_rating := winner_rating + rating_change;
    new_loser_rating := GREATEST(100, loser_rating - rating_change);

    -- Update winner
    UPDATE battle_rankings
    SET
        rating = new_winner_rating,
        wins = wins + 1,
        win_streak = win_streak + 1,
        best_win_streak = GREATEST(best_win_streak, win_streak + 1),
        rank_tier = calculate_rank_tier(new_winner_rating),
        updated_at = NOW()
    WHERE user_id = p_winner_id AND battle_type = p_battle_type;

    -- Update loser
    UPDATE battle_rankings
    SET
        rating = new_loser_rating,
        losses = losses + 1,
        win_streak = 0,
        rank_tier = calculate_rank_tier(new_loser_rating),
        updated_at = NOW()
    WHERE user_id = p_loser_id AND battle_type = p_battle_type;

    -- Award XP to winner
    PERFORM add_user_xp(p_winner_id, p_xp_awarded);

    -- Award consolation XP to loser
    PERFORM add_user_xp(p_loser_id, p_xp_awarded / 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate rank tier based on rating
CREATE OR REPLACE FUNCTION calculate_rank_tier(rating INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN rating >= 2000 THEN 'master'
        WHEN rating >= 1700 THEN 'diamond'
        WHEN rating >= 1400 THEN 'platinum'
        WHEN rating >= 1200 THEN 'gold'
        WHEN rating >= 1000 THEN 'silver'
        ELSE 'bronze'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to clean up stale waiting sessions (older than 10 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_battle_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM battle_sessions
        WHERE status = 'waiting'
        AND created_at < NOW() - INTERVAL '10 minutes'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rankings after battle result is submitted
CREATE OR REPLACE FUNCTION handle_battle_result_submitted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.winner_id IS NOT NULL AND NEW.loser_id IS NOT NULL THEN
        -- Get battle type from session
        PERFORM update_battle_rankings(
            NEW.winner_id,
            NEW.loser_id,
            (SELECT battle_type FROM battle_sessions WHERE id = NEW.session_id),
            NEW.xp_awarded
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER battle_result_submitted_trigger
    AFTER INSERT ON battle_results
    FOR EACH ROW EXECUTE FUNCTION handle_battle_result_submitted();

-- Enable realtime for battle tables
ALTER PUBLICATION supabase_realtime ADD TABLE battle_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_results;
