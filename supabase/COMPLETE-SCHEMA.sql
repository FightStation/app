-- ============================================================
-- FIGHT STATION - COMPLETE DATABASE SCHEMA
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP EXISTING TABLES (Clean slate)
-- ============================================================

DROP TABLE IF EXISTS gym_claim_requests CASCADE;
DROP TABLE IF EXISTS gym_directory CASCADE;
DROP TABLE IF EXISTS directory_countries CASCADE;
DROP TABLE IF EXISTS referral_clicks CASCADE;
DROP TABLE IF EXISTS affiliate_earnings CASCADE;
DROP TABLE IF EXISTS affiliate_transactions CASCADE;
DROP TABLE IF EXISTS referral_chains CASCADE;
DROP TABLE IF EXISTS commission_rates CASCADE;
DROP TABLE IF EXISTS referral_tier_config CASCADE;
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
    instagram TEXT,
    facebook TEXT,
    sports TEXT[] DEFAULT '{}',
    phone TEXT,
    email TEXT,
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
    country TEXT,
    city TEXT,
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
    referral_tier VARCHAR(20) DEFAULT 'member',
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

-- Commission Rates
CREATE TABLE commission_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rate_key VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    referrer_type VARCHAR(20) NOT NULL,
    tier_level INTEGER NOT NULL DEFAULT 1,
    rate_percentage DECIMAL(5, 2) NOT NULL,
    transaction_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Chains
CREATE TABLE referral_chains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    direct_referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    chain_depth INTEGER NOT NULL DEFAULT 1,
    chain_path JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Transactions
CREATE TABLE affiliate_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payer_type VARCHAR(20) NOT NULL,
    gross_amount DECIMAL(10, 2) NOT NULL,
    platform_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
    platform_fee_amount DECIMAL(10, 2) NOT NULL,
    commission_pool DECIMAL(10, 2) NOT NULL,
    net_platform_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'refunded')),
    external_transaction_id VARCHAR(100),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Earnings
CREATE TABLE affiliate_earnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES affiliate_transactions(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    beneficiary_type VARCHAR(20) NOT NULL,
    tier_level INTEGER NOT NULL,
    rate_percentage DECIMAL(5, 2) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL,
    earned_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Clicks
CREATE TABLE referral_clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referral_code TEXT NOT NULL,
    target_type TEXT CHECK (target_type IN ('join', 'event', 'fighter', 'gym', 'unknown')),
    target_id UUID,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    converted BOOLEAN DEFAULT FALSE,
    conversion_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Referral Tier Config
CREATE TABLE referral_tier_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier_level VARCHAR(20) UNIQUE NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    min_referrals INTEGER NOT NULL,
    max_referrals INTEGER,
    direct_rate DECIMAL(5, 2) NOT NULL,
    indirect_rate DECIMAL(5, 2) NOT NULL,
    badge_color VARCHAR(20) NOT NULL,
    priority_requests BOOLEAN DEFAULT FALSE,
    featured_leaderboard BOOLEAN DEFAULT FALSE,
    early_access BOOLEAN DEFAULT FALSE,
    verified_badge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GYM DIRECTORY SYSTEM
-- ============================================================

-- Directory Countries
CREATE TABLE directory_countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_native VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    gym_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ
);

-- Gym Directory
CREATE TABLE gym_directory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    country_code VARCHAR(2) NOT NULL REFERENCES directory_countries(code),
    country_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    instagram VARCHAR(100),
    facebook VARCHAR(255),
    sports TEXT[] DEFAULT '{}',
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
    source VARCHAR(50) DEFAULT 'manual',
    source_id VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym Claim Requests
CREATE TABLE gym_claim_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_directory_id UUID NOT NULL REFERENCES gym_directory(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_method VARCHAR(20) NOT NULL CHECK (verification_method IN ('email', 'phone', 'manual')),
    verification_code VARCHAR(10),
    verification_sent_at TIMESTAMPTZ,
    verification_attempts INTEGER DEFAULT 0,
    proof_document_url TEXT,
    admin_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'approved', 'rejected')),
    rejected_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(gym_directory_id, claimant_id)
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
CREATE INDEX idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_date ON referral_clicks(clicked_at);
CREATE INDEX idx_commission_rates_type ON commission_rates(referrer_type, tier_level);
CREATE INDEX idx_referral_chains_user ON referral_chains(user_id);
CREATE INDEX idx_referral_chains_referrer ON referral_chains(direct_referrer_id);
CREATE INDEX idx_affiliate_transactions_payer ON affiliate_transactions(payer_id);
CREATE INDEX idx_affiliate_transactions_date ON affiliate_transactions(transaction_date);
CREATE INDEX idx_affiliate_transactions_status ON affiliate_transactions(status);
CREATE INDEX idx_affiliate_earnings_beneficiary ON affiliate_earnings(beneficiary_id);
CREATE INDEX idx_affiliate_earnings_transaction ON affiliate_earnings(transaction_id);
CREATE INDEX idx_affiliate_earnings_status ON affiliate_earnings(status);
CREATE INDEX idx_gym_directory_country ON gym_directory(country_code);
CREATE INDEX idx_gym_directory_city ON gym_directory(city);
CREATE INDEX idx_gym_directory_claimed ON gym_directory(is_claimed);
CREATE INDEX idx_gym_directory_sports ON gym_directory USING GIN(sports);
CREATE INDEX idx_gym_directory_name ON gym_directory(name);
CREATE INDEX idx_gym_claim_requests_status ON gym_claim_requests(status);
CREATE INDEX idx_gym_claim_requests_gym ON gym_claim_requests(gym_directory_id);

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
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_claim_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================

-- User Roles
CREATE POLICY "Users can view own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own role" ON user_roles FOR UPDATE USING (auth.uid() = user_id);

-- Gyms
CREATE POLICY "Gyms are viewable by everyone" ON gyms FOR SELECT USING (true);
CREATE POLICY "Users can insert own gym" ON gyms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gym" ON gyms FOR UPDATE USING (auth.uid() = user_id);

-- Fighters
CREATE POLICY "Fighters are viewable by everyone" ON fighters FOR SELECT USING (true);
CREATE POLICY "Users can insert own fighter profile" ON fighters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fighter profile" ON fighters FOR UPDATE USING (auth.uid() = user_id);

-- Coaches
CREATE POLICY "Coaches are viewable by everyone" ON coaches FOR SELECT USING (true);
CREATE POLICY "Users can insert own coach profile" ON coaches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coach profile" ON coaches FOR UPDATE USING (auth.uid() = user_id);

-- Sparring Events
CREATE POLICY "Published events are viewable by everyone" ON sparring_events
    FOR SELECT USING (status = 'published' OR gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));
CREATE POLICY "Gym owners can insert events" ON sparring_events
    FOR INSERT WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));
CREATE POLICY "Gym owners can update their events" ON sparring_events
    FOR UPDATE USING (gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));
CREATE POLICY "Gym owners can delete their events" ON sparring_events
    FOR DELETE USING (gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));

-- Event Requests
CREATE POLICY "Users can view their own requests" ON event_requests FOR SELECT USING (
    fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()) OR
    event_id IN (SELECT se.id FROM sparring_events se JOIN gyms g ON se.gym_id = g.id WHERE g.user_id = auth.uid())
);
CREATE POLICY "Fighters can insert requests" ON event_requests
    FOR INSERT WITH CHECK (fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()));
CREATE POLICY "Fighters can update their own requests" ON event_requests FOR UPDATE USING (
    fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()) OR
    event_id IN (SELECT se.id FROM sparring_events se JOIN gyms g ON se.gym_id = g.id WHERE g.user_id = auth.uid())
);
CREATE POLICY "Fighters can delete their own requests" ON event_requests
    FOR DELETE USING (fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()));

-- Conversations & Messages
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids))
);
CREATE POLICY "Users can send messages to their conversations" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND conversation_id IN (SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids))
);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- Referral System
CREATE POLICY "Users can view own referral code" ON referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can verify referral codes" ON referral_codes FOR SELECT USING (true);
CREATE POLICY "Users can insert own referral code" ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own pending referral" ON pending_referrals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pending referral" ON pending_referrals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pending referral" ON pending_referrals FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view referrals they made or received" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "System can insert referrals" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own affiliate stats" ON affiliate_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own affiliate stats" ON affiliate_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate stats" ON affiliate_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own push tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert referral clicks" ON referral_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Referrers can view their click stats" ON referral_clicks FOR SELECT USING (
    referral_code IN (SELECT code FROM referral_codes WHERE user_id = auth.uid())
);
CREATE POLICY "Anyone can view active commission rates" ON commission_rates FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Users can view own referral chain" ON referral_chains FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view chains where they are referrer" ON referral_chains FOR SELECT USING (auth.uid() = direct_referrer_id);
CREATE POLICY "Users can view transactions they paid" ON affiliate_transactions FOR SELECT USING (auth.uid() = payer_id);
CREATE POLICY "Users can view transactions generating their earnings" ON affiliate_transactions FOR SELECT USING (
    id IN (SELECT transaction_id FROM affiliate_earnings WHERE beneficiary_id = auth.uid())
);
CREATE POLICY "Users can view own earnings" ON affiliate_earnings FOR SELECT USING (auth.uid() = beneficiary_id);
CREATE POLICY "Anyone can view tier config" ON referral_tier_config FOR SELECT USING (true);

-- Gym Directory
CREATE POLICY "Anyone can view countries" ON directory_countries FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Anyone can view gym directory" ON gym_directory FOR SELECT USING (TRUE);
CREATE POLICY "Users can view own claims" ON gym_claim_requests FOR SELECT USING (auth.uid() = claimant_id);
CREATE POLICY "Users can create claims" ON gym_claim_requests FOR INSERT WITH CHECK (auth.uid() = claimant_id);
CREATE POLICY "Users can update own pending claims" ON gym_claim_requests
    FOR UPDATE USING (auth.uid() = claimant_id AND status = 'pending');

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update participant count
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE sparring_events SET current_participants = current_participants + 1 WHERE id = NEW.event_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE sparring_events SET current_participants = GREATEST(0, current_participants - 1) WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate referral code
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
    INSERT INTO referral_codes (user_id, code) VALUES (auth.uid(), new_code);
    INSERT INTO affiliate_stats (user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;
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
    IF user1_id < user2_id THEN participant_array := ARRAY[user1_id, user2_id];
    ELSE participant_array := ARRAY[user2_id, user1_id];
    END IF;
    SELECT id INTO conv_id FROM conversations
    WHERE participant_ids @> participant_array AND participant_ids <@ participant_array;
    IF conv_id IS NULL THEN
        INSERT INTO conversations (participant_ids) VALUES (participant_array) RETURNING id INTO conv_id;
    END IF;
    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conv_id UUID, reader_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages SET read = TRUE
    WHERE conversation_id = conv_id AND sender_id != reader_id AND read = FALSE;
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
        SELECT user_id INTO referrer_user_id FROM referral_codes
        WHERE code = pending.referral_code AND is_active = TRUE;
        IF referrer_user_id IS NOT NULL THEN
            INSERT INTO referrals (referrer_id, referred_id, referral_code, status, completed_at)
            VALUES (referrer_user_id, NEW.user_id, pending.referral_code, 'completed', NOW());
            UPDATE affiliate_stats SET total_referrals = total_referrals + 1,
                successful_referrals = successful_referrals + 1, updated_at = NOW()
            WHERE user_id = referrer_user_id;
        END IF;
        DELETE FROM pending_referrals WHERE id = pending.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate gym slug
CREATE OR REPLACE FUNCTION generate_gym_slug(p_name TEXT, p_city TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    base_slug := LOWER(REGEXP_REPLACE(p_name || '-' || p_city, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM gym_directory WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate gym slug
CREATE OR REPLACE FUNCTION gym_directory_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug := generate_gym_slug(NEW.name, NEW.city);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update country gym count
CREATE OR REPLACE FUNCTION update_country_gym_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE directory_countries SET gym_count = (SELECT COUNT(*) FROM gym_directory WHERE country_code = NEW.country_code),
            last_updated = NOW() WHERE code = NEW.country_code;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE directory_countries SET gym_count = (SELECT COUNT(*) FROM gym_directory WHERE country_code = OLD.country_code),
            last_updated = NOW() WHERE code = OLD.country_code;
    ELSIF TG_OP = 'UPDATE' AND OLD.country_code != NEW.country_code THEN
        UPDATE directory_countries SET gym_count = (SELECT COUNT(*) FROM gym_directory WHERE country_code = OLD.country_code),
            last_updated = NOW() WHERE code = OLD.country_code;
        UPDATE directory_countries SET gym_count = (SELECT COUNT(*) FROM gym_directory WHERE country_code = NEW.country_code),
            last_updated = NOW() WHERE code = NEW.country_code;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Search gym directory
CREATE OR REPLACE FUNCTION search_gym_directory(
    p_country_code VARCHAR(2) DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL,
    p_sport TEXT DEFAULT NULL,
    p_search_term TEXT DEFAULT NULL,
    p_claimed_only BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID, name VARCHAR(200), slug VARCHAR(200), country_code VARCHAR(2),
    country_name VARCHAR(100), city VARCHAR(100), address TEXT,
    latitude DECIMAL(10, 8), longitude DECIMAL(11, 8), phone VARCHAR(50),
    website VARCHAR(500), instagram VARCHAR(100), sports TEXT[],
    is_claimed BOOLEAN, gym_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT gd.id, gd.name, gd.slug, gd.country_code, gd.country_name, gd.city, gd.address,
        gd.latitude, gd.longitude, gd.phone, gd.website, gd.instagram, gd.sports, gd.is_claimed, gd.gym_id
    FROM gym_directory gd
    WHERE (p_country_code IS NULL OR gd.country_code = p_country_code)
      AND (p_city IS NULL OR LOWER(gd.city) = LOWER(p_city))
      AND (p_sport IS NULL OR p_sport = ANY(gd.sports))
      AND (p_search_term IS NULL OR gd.name ILIKE '%' || p_search_term || '%')
      AND (p_claimed_only IS NULL OR gd.is_claimed = p_claimed_only)
    ORDER BY gd.name LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_fighters_updated_at BEFORE UPDATE ON fighters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sparring_events_updated_at BEFORE UPDATE ON sparring_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_event_requests_updated_at BEFORE UPDATE ON event_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_affiliate_stats_updated_at BEFORE UPDATE ON affiliate_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_event_participants AFTER INSERT OR UPDATE ON event_requests
    FOR EACH ROW EXECUTE FUNCTION update_participant_count();
CREATE TRIGGER process_fighter_referral AFTER INSERT ON fighters
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();
CREATE TRIGGER process_gym_referral AFTER INSERT ON gyms
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();
CREATE TRIGGER process_coach_referral AFTER INSERT ON coaches
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();
CREATE TRIGGER gym_directory_slug_trigger BEFORE INSERT ON gym_directory
    FOR EACH ROW EXECUTE FUNCTION gym_directory_before_insert();
CREATE TRIGGER gym_directory_count_trigger AFTER INSERT OR UPDATE OR DELETE ON gym_directory
    FOR EACH ROW EXECUTE FUNCTION update_country_gym_count();

-- ============================================================
-- SEED DATA - Directory Countries
-- ============================================================

INSERT INTO directory_countries (code, name, name_native) VALUES
    ('EE', 'Estonia', 'Eesti'),
    ('LV', 'Latvia', 'Latvija'),
    ('LT', 'Lithuania', 'Lietuva'),
    ('PL', 'Poland', 'Polska'),
    ('SK', 'Slovakia', 'Slovensko'),
    ('HU', 'Hungary', 'Magyarország'),
    ('HR', 'Croatia', 'Hrvatska'),
    ('RS', 'Serbia', 'Србија'),
    ('SI', 'Slovenia', 'Slovenija'),
    ('BG', 'Bulgaria', 'България'),
    ('RO', 'Romania', 'România'),
    ('FI', 'Finland', 'Suomi'),
    ('RU', 'Russia', 'Россия'),
    ('GE', 'Georgia', 'საქართველო')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, name_native = EXCLUDED.name_native;

-- ============================================================
-- SEED DATA - Referral Tier Config
-- ============================================================

INSERT INTO referral_tier_config (tier_level, tier_name, min_referrals, max_referrals, direct_rate, indirect_rate, badge_color, priority_requests, featured_leaderboard, early_access, verified_badge) VALUES
    ('member', 'Member', 0, 2, 10.00, 3.00, '#6B7280', FALSE, FALSE, FALSE, FALSE),
    ('bronze', 'Bronze', 3, 9, 12.00, 4.00, '#CD7F32', FALSE, FALSE, FALSE, FALSE),
    ('silver', 'Silver', 10, 24, 14.00, 5.00, '#C0C0C0', TRUE, FALSE, FALSE, FALSE),
    ('gold', 'Gold', 25, 49, 16.00, 6.00, '#FFD700', TRUE, TRUE, FALSE, FALSE),
    ('platinum', 'Platinum', 50, 99, 18.00, 7.00, '#E5E4E2', TRUE, TRUE, TRUE, FALSE),
    ('diamond', 'Diamond', 100, NULL, 20.00, 8.00, '#B9F2FF', TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (tier_level) DO UPDATE SET direct_rate = EXCLUDED.direct_rate, indirect_rate = EXCLUDED.indirect_rate;

-- ============================================================
-- DONE! Schema is ready to use
-- ============================================================