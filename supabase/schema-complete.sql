-- ============================================================
-- FIGHT STATION - COMPLETE DATABASE SCHEMA
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS event_requests CASCADE;
DROP TABLE IF EXISTS sparring_events CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS fighters CASCADE;
DROP TABLE IF EXISTS gyms CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP TABLE IF EXISTS pending_referrals CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS affiliate_stats CASCADE;
DROP TABLE IF EXISTS push_tokens CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_participant_count CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code CASCADE;
DROP FUNCTION IF EXISTS get_or_create_conversation CASCADE;
DROP FUNCTION IF EXISTS mark_conversation_as_read CASCADE;
DROP FUNCTION IF EXISTS process_pending_referral CASCADE;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- User Roles Table
CREATE TABLE user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('fighter', 'gym', 'coach')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gyms Table
CREATE TABLE gyms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo_url TEXT,
    photos TEXT[] DEFAULT '{}',
    facilities TEXT[] DEFAULT '{}',
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fighters Table
CREATE TABLE fighters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    weight_class TEXT NOT NULL,
    experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
    gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
    bio TEXT,
    avatar_url TEXT,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    fights_count INTEGER DEFAULT 0,
    sparring_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches Table
CREATE TABLE coaches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    specializations TEXT[] DEFAULT '{}',
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sparring Events Table
CREATE TABLE sparring_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    weight_classes TEXT[] NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    experience_levels TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'full', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Requests Table
CREATE TABLE event_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES sparring_events(id) ON DELETE CASCADE NOT NULL,
    fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, fighter_id)
);

-- Conversations Table
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant_ids UUID[] NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFERRAL SYSTEM TABLES
-- ============================================================

-- Referral Codes Table
CREATE TABLE referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending Referrals
CREATE TABLE pending_referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    referral_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completed Referrals
CREATE TABLE referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(referred_id)
);

-- Affiliate Stats
CREATE TABLE affiliate_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    pending_earnings DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Tokens
CREATE TABLE push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_fighters_gym_id ON fighters(gym_id);
CREATE INDEX idx_fighters_weight_class ON fighters(weight_class);
CREATE INDEX idx_fighters_country ON fighters(country);
CREATE INDEX idx_coaches_gym_id ON coaches(gym_id);
CREATE INDEX idx_sparring_events_gym_id ON sparring_events(gym_id);
CREATE INDEX idx_sparring_events_event_date ON sparring_events(event_date);
CREATE INDEX idx_sparring_events_status ON sparring_events(status);
CREATE INDEX idx_event_requests_event_id ON event_requests(event_id);
CREATE INDEX idx_event_requests_fighter_id ON event_requests(fighter_id);
CREATE INDEX idx_event_requests_status ON event_requests(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_gyms_country ON gyms(country);
CREATE INDEX idx_gyms_city ON gyms(city);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_pending_referrals_code ON pending_referrals(referral_code);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_conversations_participants ON conversations USING GIN (participant_ids);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES - User Roles
-- ============================================================

CREATE POLICY "Users can view own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role" ON user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role" ON user_roles
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES - Gyms
-- ============================================================

CREATE POLICY "Gyms are viewable by everyone" ON gyms
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own gym" ON gyms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gym" ON gyms
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES - Fighters
-- ============================================================

CREATE POLICY "Fighters are viewable by everyone" ON fighters
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own fighter profile" ON fighters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fighter profile" ON fighters
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES - Coaches
-- ============================================================

CREATE POLICY "Coaches are viewable by everyone" ON coaches
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own coach profile" ON coaches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach profile" ON coaches
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES - Sparring Events
-- ============================================================

CREATE POLICY "Published events are viewable by everyone" ON sparring_events
    FOR SELECT USING (status = 'published' OR gym_id IN (
        SELECT id FROM gyms WHERE user_id = auth.uid()
    ));

CREATE POLICY "Gym owners can insert events" ON sparring_events
    FOR INSERT WITH CHECK (gym_id IN (
        SELECT id FROM gyms WHERE user_id = auth.uid()
    ));

CREATE POLICY "Gym owners can update their events" ON sparring_events
    FOR UPDATE USING (gym_id IN (
        SELECT id FROM gyms WHERE user_id = auth.uid()
    ));

CREATE POLICY "Gym owners can delete their events" ON sparring_events
    FOR DELETE USING (gym_id IN (
        SELECT id FROM gyms WHERE user_id = auth.uid()
    ));

-- ============================================================
-- POLICIES - Event Requests
-- ============================================================

CREATE POLICY "Users can view their own requests" ON event_requests
    FOR SELECT USING (
        fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid())
        OR event_id IN (
            SELECT se.id FROM sparring_events se
            JOIN gyms g ON se.gym_id = g.id
            WHERE g.user_id = auth.uid()
        )
    );

CREATE POLICY "Fighters can insert requests" ON event_requests
    FOR INSERT WITH CHECK (fighter_id IN (
        SELECT id FROM fighters WHERE user_id = auth.uid()
    ));

CREATE POLICY "Fighters can update their own requests" ON event_requests
    FOR UPDATE USING (
        fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid())
        OR event_id IN (
            SELECT se.id FROM sparring_events se
            JOIN gyms g ON se.gym_id = g.id
            WHERE g.user_id = auth.uid()
        )
    );

CREATE POLICY "Fighters can delete their own requests" ON event_requests
    FOR DELETE USING (fighter_id IN (
        SELECT id FROM fighters WHERE user_id = auth.uid()
    ));

-- ============================================================
-- POLICIES - Conversations
-- ============================================================

CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (auth.uid() = ANY(participant_ids));

-- ============================================================
-- POLICIES - Messages
-- ============================================================

CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        conversation_id IN (
            SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- ============================================================
-- POLICIES - Referral Codes
-- ============================================================

CREATE POLICY "Users can view own referral code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify referral codes" ON referral_codes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own referral code" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLICIES - Pending Referrals
-- ============================================================

CREATE POLICY "Users can view own pending referral" ON pending_referrals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending referral" ON pending_referrals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending referral" ON pending_referrals
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES - Referrals
-- ============================================================

CREATE POLICY "Users can view referrals they made or received" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" ON referrals
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- POLICIES - Affiliate Stats
-- ============================================================

CREATE POLICY "Users can view own affiliate stats" ON affiliate_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate stats" ON affiliate_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate stats" ON affiliate_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES - Push Tokens
-- ============================================================

CREATE POLICY "Users can manage own push tokens" ON push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE sparring_events
        SET current_participants = current_participants + 1
        WHERE id = NEW.event_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE sparring_events
        SET current_participants = GREATEST(0, current_participants - 1)
        WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_role TEXT, user_name TEXT)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := UPPER(LEFT(REGEXP_REPLACE(user_name, '[^a-zA-Z]', '', 'g'), 3)) ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

        IF LENGTH(new_code) < 6 THEN
            new_code := 'REF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
        END IF;

        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;

        EXIT WHEN NOT code_exists;
    END LOOP;

    INSERT INTO referral_codes (user_id, code)
    VALUES (auth.uid(), new_code);

    INSERT INTO affiliate_stats (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
    participant_array UUID[];
BEGIN
    IF user1_id < user2_id THEN
        participant_array := ARRAY[user1_id, user2_id];
    ELSE
        participant_array := ARRAY[user2_id, user1_id];
    END IF;

    SELECT id INTO conv_id
    FROM conversations
    WHERE participant_ids @> participant_array
      AND participant_ids <@ participant_array;

    IF conv_id IS NULL THEN
        INSERT INTO conversations (participant_ids)
        VALUES (participant_array)
        RETURNING id INTO conv_id;
    END IF;

    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conv_id UUID, reader_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET read = TRUE
    WHERE conversation_id = conv_id
      AND sender_id != reader_id
      AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process pending referral
CREATE OR REPLACE FUNCTION process_pending_referral()
RETURNS TRIGGER AS $$
DECLARE
    pending RECORD;
    referrer_user_id UUID;
BEGIN
    SELECT * INTO pending FROM pending_referrals WHERE user_id = NEW.user_id;

    IF pending IS NOT NULL THEN
        SELECT user_id INTO referrer_user_id
        FROM referral_codes
        WHERE code = pending.referral_code AND is_active = TRUE;

        IF referrer_user_id IS NOT NULL THEN
            INSERT INTO referrals (referrer_id, referred_id, referral_code, status, completed_at)
            VALUES (referrer_user_id, NEW.user_id, pending.referral_code, 'completed', NOW());

            UPDATE affiliate_stats
            SET total_referrals = total_referrals + 1,
                successful_referrals = successful_referrals + 1,
                updated_at = NOW()
            WHERE user_id = referrer_user_id;
        END IF;

        DELETE FROM pending_referrals WHERE id = pending.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_gyms_updated_at
    BEFORE UPDATE ON gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_fighters_updated_at
    BEFORE UPDATE ON fighters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sparring_events_updated_at
    BEFORE UPDATE ON sparring_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_requests_updated_at
    BEFORE UPDATE ON event_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_affiliate_stats_updated_at
    BEFORE UPDATE ON affiliate_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_participants
    AFTER INSERT OR UPDATE ON event_requests
    FOR EACH ROW EXECUTE FUNCTION update_participant_count();

CREATE TRIGGER process_fighter_referral
    AFTER INSERT ON fighters
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();

CREATE TRIGGER process_gym_referral
    AFTER INSERT ON gyms
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();

CREATE TRIGGER process_coach_referral
    AFTER INSERT ON coaches
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();

-- ============================================================
-- REALTIME (run separately if this fails)
-- ============================================================

-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE event_requests;
