-- ============================================================
-- FIGHT STATION - COMPLETE DATABASE SCHEMA
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP EXISTING TABLES (Clean slate)
-- ============================================================

DROP TABLE IF EXISTS training_exercises CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS sparring_invites CASCADE;
DROP TABLE IF EXISTS gym_admins CASCADE;
DROP TABLE IF EXISTS gym_reels CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS saved_posts CASCADE;
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
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
-- PROFILES TABLE (maps auth.users to roles)
-- ============================================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('fighter', 'gym', 'coach')),
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FEED/SOCIAL TABLES
-- ============================================================

-- Posts Table
CREATE TABLE posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('fighter', 'gym', 'coach')),
    author_id UUID NOT NULL,
    content TEXT,
    media_urls TEXT[] DEFAULT '{}',
    media_type TEXT CHECK (media_type IN ('image', 'video', 'mixed', NULL)),
    post_type TEXT NOT NULL DEFAULT 'post' CHECK (post_type IN ('post', 'reel', 'event_share', 'training_update')),
    event_id UUID REFERENCES sparring_events(id) ON DELETE SET NULL,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'gym_only')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes
CREATE TABLE post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post Comments
CREATE TABLE post_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('fighter', 'gym', 'coach')),
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment Likes
CREATE TABLE comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Follows
CREATE TABLE follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_user_id, following_user_id)
);

-- Saved Posts
CREATE TABLE saved_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- ============================================================
-- GYM REELS TABLE
-- ============================================================

CREATE TABLE gym_reels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GYM ADMINS TABLE
-- ============================================================

CREATE TABLE gym_admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SPARRING INVITES TABLE
-- ============================================================

CREATE TABLE sparring_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
    from_gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    to_fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES sparring_events(id) ON DELETE SET NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINING SESSIONS & EXERCISES TABLES
-- ============================================================

-- Training Sessions (gym schedule + coach 1:1 sessions)
CREATE TABLE training_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    fighter_id UUID REFERENCES fighters(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    -- Schedule fields (for recurring gym sessions)
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME,
    end_time TIME,
    -- Session fields (for individual sessions)
    session_date DATE,
    session_type TEXT DEFAULT 'training' CHECK (session_type IN ('training', 'sparring', 'conditioning', 'technique')),
    -- Coach/level
    coach_name TEXT,
    level TEXT DEFAULT 'all' CHECK (level IN ('all', 'beginner', 'intermediate', 'advanced', 'pro')),
    max_participants INTEGER,
    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Exercises (linked to sessions)
CREATE TABLE training_exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sets INTEGER,
    reps INTEGER,
    duration_seconds INTEGER,
    rest_seconds INTEGER,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Posts & Feed
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_author_type ON posts(author_type);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_post_type ON posts(post_type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_event_id ON posts(event_id);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_follows_follower ON follows(follower_user_id);
CREATE INDEX idx_follows_following ON follows(following_user_id);
CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);

-- Gym Reels
CREATE INDEX idx_gym_reels_gym_id ON gym_reels(gym_id);
CREATE INDEX idx_gym_reels_created_at ON gym_reels(created_at DESC);

-- Gym Admins
CREATE INDEX idx_gym_admins_gym_id ON gym_admins(gym_id);
CREATE INDEX idx_gym_admins_user_id ON gym_admins(user_id);

-- Sparring Invites
CREATE INDEX idx_sparring_invites_from_fighter ON sparring_invites(from_fighter_id);
CREATE INDEX idx_sparring_invites_to_fighter ON sparring_invites(to_fighter_id);
CREATE INDEX idx_sparring_invites_event ON sparring_invites(event_id);
CREATE INDEX idx_sparring_invites_status ON sparring_invites(status);

-- Training Sessions
CREATE INDEX idx_training_sessions_gym_id ON training_sessions(gym_id);
CREATE INDEX idx_training_sessions_coach_id ON training_sessions(coach_id);
CREATE INDEX idx_training_sessions_fighter_id ON training_sessions(fighter_id);
CREATE INDEX idx_training_exercises_session ON training_exercises(session_id);

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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparring_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;

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

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view profiles by id" ON profiles FOR SELECT USING (true);

-- Posts
CREATE POLICY "Public posts viewable by everyone" ON posts FOR SELECT USING (status = 'active' AND visibility = 'public');
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Post Likes
CREATE POLICY "Post likes viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post Comments
CREATE POLICY "Comments viewable by everyone" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment on posts" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Comment Likes
CREATE POLICY "Comment likes viewable by everyone" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "Follows viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_user_id);
CREATE POLICY "Users can unfollow others" ON follows FOR DELETE USING (auth.uid() = follower_user_id);

-- Saved Posts
CREATE POLICY "Users can view own saved posts" ON saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Gym Reels
CREATE POLICY "Gym reels viewable by everyone" ON gym_reels FOR SELECT USING (status = 'active');
CREATE POLICY "Gym owners can insert reels" ON gym_reels
    FOR INSERT WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));
CREATE POLICY "Gym owners can update their reels" ON gym_reels
    FOR UPDATE USING (gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));
CREATE POLICY "Gym owners can delete their reels" ON gym_reels
    FOR DELETE USING (gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));

-- Gym Admins
CREATE POLICY "Gym owners can view their admins" ON gym_admins
    FOR SELECT USING (gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));
CREATE POLICY "Gym owners can manage admins" ON gym_admins
    FOR ALL USING (gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()));

-- Sparring Invites
CREATE POLICY "Users can view invites they sent or received" ON sparring_invites FOR SELECT USING (
    from_fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()) OR
    to_fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()) OR
    from_gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create invites" ON sparring_invites FOR INSERT WITH CHECK (
    from_fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()) OR
    from_gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update invites they are involved in" ON sparring_invites FOR UPDATE USING (
    from_fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()) OR
    to_fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid())
);

-- Training Sessions
CREATE POLICY "Training sessions viewable by participants" ON training_sessions FOR SELECT USING (
    gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()) OR
    coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()) OR
    fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid()) OR
    gym_id IN (SELECT gym_id FROM coaches WHERE user_id = auth.uid())
);
CREATE POLICY "Gym owners and coaches can create sessions" ON training_sessions FOR INSERT WITH CHECK (
    gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()) OR
    coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
);
CREATE POLICY "Gym owners and coaches can update sessions" ON training_sessions FOR UPDATE USING (
    gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()) OR
    coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
);
CREATE POLICY "Gym owners can delete sessions" ON training_sessions FOR DELETE USING (
    gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid())
);

-- Training Exercises
CREATE POLICY "Exercises viewable with session" ON training_exercises FOR SELECT USING (
    session_id IN (SELECT id FROM training_sessions WHERE
        gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid()) OR
        coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()) OR
        fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid())
    )
);
CREATE POLICY "Coaches can manage exercises" ON training_exercises FOR ALL USING (
    session_id IN (SELECT id FROM training_sessions WHERE
        coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()) OR
        gym_id IN (SELECT id FROM gyms WHERE user_id = auth.uid())
    )
);

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
    ('SE', 'Sweden', 'Sverige'),
    ('CZ', 'Czech Republic', 'Česko'),
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
-- SEED DATA - Gym Directory (Real Fight Clubs)
-- ============================================================

-- Estonia
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Kevin Renno Combat Sports Academy', 'EE', 'Estonia', 'Tallinn', NULL, 59.4370, 24.7536, 'https://taipoks.ee', 'krva_tallinn', '{boxing,mma,muay_thai,kickboxing}', 'manual', true),
('Estonian Academy of Kickboxing', 'EE', 'Estonia', 'Tallinn', 'Mahtra 1, Tallinn', 59.4390, 24.7280, 'http://www.kickboxing.ee', NULL, '{kickboxing,mma,muay_thai}', 'manual', true),
('AK Gym', 'EE', 'Estonia', 'Tallinn', NULL, 59.4270, 24.7440, 'https://www.akgym.ee', NULL, '{muay_thai,kickboxing}', 'manual', true),
('Tokon Mixed Martial Arts', 'EE', 'Estonia', 'Tallinn', 'Punane 69, Tallinn', 59.4230, 24.7850, NULL, NULL, '{mma}', 'manual', true),
('Sparta Sports Club', 'EE', 'Estonia', 'Tallinn', NULL, 59.4350, 24.7500, NULL, NULL, '{mma,boxing}', 'manual', false),
('Fight Club Tallinn', 'EE', 'Estonia', 'Tallinn', NULL, 59.4370, 24.7450, 'https://www.fight.ee', NULL, '{mma,boxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Latvia
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Berserk MMA Team', 'LV', 'Latvia', 'Riga', 'Ganību dambis 22d-korpuss 2, Riga', 56.9620, 24.0980, 'https://www.berserk.lv', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Latvian Top Fighters', 'LV', 'Latvia', 'Riga', 'Liepājas iela 3b, Riga', 56.9480, 24.0870, 'https://www.mmalatvia.eu', 'latviatopteam', '{mma}', 'manual', true),
('TOP RING Latvia', 'LV', 'Latvia', 'Riga', NULL, 56.9500, 24.1050, NULL, 'top_ring_latvia', '{muay_thai,kickboxing,mma,boxing}', 'manual', true),
('Rīgas Rīngs / Gladiator', 'LV', 'Latvia', 'Riga', 'Katoļu iela 8, Riga', 56.9510, 24.1130, 'https://www.gladiator.lv', NULL, '{boxing,kickboxing}', 'manual', true),
('Profesionālis MMA BJJ', 'LV', 'Latvia', 'Riga', NULL, 56.9530, 24.1080, NULL, NULL, '{mma}', 'manual', true),
('Prime MMA Imanta', 'LV', 'Latvia', 'Riga', NULL, 56.9450, 24.0300, NULL, NULL, '{mma,boxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Lithuania
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Jasiūnas Team', 'LT', 'Lithuania', 'Vilnius', 'Žemynos g. 14, Vilnius', 54.6920, 25.2650, NULL, 'jasiunasteam', '{muay_thai,kickboxing}', 'manual', true),
('Fighters Gym', 'LT', 'Lithuania', 'Vilnius', NULL, 54.6870, 25.2800, 'https://fightersgym.lt', NULL, '{kickboxing,muay_thai}', 'manual', true),
('Daugirdas Gym', 'LT', 'Lithuania', 'Kaunas', 'Jonavos g. 68-1, Kaunas', 54.9120, 23.9450, 'https://www.daugirdasgym.lt', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Forum Palace Muay Thai', 'LT', 'Lithuania', 'Vilnius', 'Konstitucijos pr. 26, Vilnius', 54.6980, 25.2730, 'https://www.forumpalace.lt', NULL, '{muay_thai,boxing}', 'manual', true),
('Blade Fights Gym', 'LT', 'Lithuania', 'Vilnius', NULL, 54.6890, 25.2750, 'https://bladefights.com', NULL, '{mma,kickboxing}', 'manual', true),
('UTMA Lithuania', 'LT', 'Lithuania', 'Vilnius', NULL, 54.6860, 25.2790, 'https://uniquetma.com', NULL, '{muay_thai,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Finland
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Helsinki Thaiboxing Club', 'FI', 'Finland', 'Helsinki', 'Kallio, Helsinki', 60.1840, 24.9500, 'http://www.htbc.fi', 'helsinkithaiboxingclub', '{muay_thai,kickboxing,boxing}', 'manual', true),
('TK Sports MMA', 'FI', 'Finland', 'Helsinki', NULL, 60.1700, 24.9410, 'https://tksportsmma.net', NULL, '{mma,boxing,kickboxing,muay_thai}', 'manual', true),
('GB Gym', 'FI', 'Finland', 'Helsinki', NULL, 60.1720, 24.9380, 'https://www.gbgym.com', NULL, '{mma,kickboxing,muay_thai,boxing}', 'manual', true),
('Crest Helsinki', 'FI', 'Finland', 'Helsinki', NULL, 60.1690, 24.9350, NULL, NULL, '{muay_thai,mma,boxing}', 'manual', true),
('Muay Tribe', 'FI', 'Finland', 'Helsinki', 'Mäkelänkatu 54 A 501, Helsinki', 60.1980, 24.9470, 'https://muaytribe.fi', NULL, '{muay_thai}', 'manual', true),
('King of the Ring', 'FI', 'Finland', 'Helsinki', NULL, 60.1750, 24.9420, 'https://kingofthering.fi', NULL, '{muay_thai,kickboxing}', 'manual', true),
('Combat Gym', 'FI', 'Finland', 'Helsinki', NULL, 60.1710, 24.9390, 'https://www.combat.fi', NULL, '{muay_thai,boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Poland
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Palestra Warszawa', 'PL', 'Poland', 'Warsaw', NULL, 52.2300, 21.0120, NULL, NULL, '{mma,boxing,muay_thai}', 'manual', true),
('WCA Fight Team', 'PL', 'Poland', 'Warsaw', NULL, 52.2250, 21.0200, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Berkut WCA Fight Team', 'PL', 'Poland', 'Warsaw', NULL, 52.2200, 21.0700, NULL, 'berkutwca', '{mma,boxing,muay_thai,kickboxing}', 'manual', true),
('Academia Gorila Warsaw', 'PL', 'Poland', 'Warsaw', NULL, 52.2350, 21.0050, NULL, NULL, '{muay_thai,boxing}', 'manual', true),
('Bellator Warszawa', 'PL', 'Poland', 'Warsaw', NULL, 52.2290, 21.0150, NULL, NULL, '{mma,boxing}', 'manual', true),
('Sparta Gym Warsaw', 'PL', 'Poland', 'Warsaw', NULL, 52.2280, 21.0180, NULL, NULL, '{boxing,kickboxing}', 'manual', true),
('MMA Academy Kraków', 'PL', 'Poland', 'Krakow', NULL, 50.0614, 19.9372, NULL, NULL, '{mma,boxing}', 'manual', true),
('Power Fight House', 'PL', 'Poland', 'Krakow', NULL, 50.0650, 19.9400, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Puncher Wrocław', 'PL', 'Poland', 'Wroclaw', NULL, 51.1079, 17.0385, 'https://puncher.pl', NULL, '{mma,boxing,muay_thai}', 'manual', true),
('Arrachion', 'PL', 'Poland', 'Warsaw', NULL, 52.2297, 21.0122, 'https://www.arrachion.pl', NULL, '{mma,boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Czech Republic
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('MMA Gym Praha', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0755, 14.4378, NULL, NULL, '{mma,boxing}', 'manual', true),
('Gorila MMA', 'CZ', 'Czech Republic', 'Prague', 'K Žižkovu 282/9, Prague', 50.0900, 14.4550, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('MSM Fight Academy', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0780, 14.4400, 'https://msmsport.eu', NULL, '{mma,boxing,muay_thai}', 'manual', true),
('Penta Gym Prague', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0525, 14.4260, 'https://www.pentagym.cz', 'pentagymprague', '{mma,boxing,muay_thai,kickboxing}', 'manual', true),
('SBG Prague', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0800, 14.4500, NULL, 'sbgprague', '{mma,boxing}', 'manual', true),
('Shooters MMA Prague', 'CZ', 'Czech Republic', 'Prague', NULL, 50.0820, 14.4480, NULL, NULL, '{mma,boxing,muay_thai,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Hungary
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('FITE Club Budapest', 'HU', 'Hungary', 'Budapest', NULL, 47.4979, 19.0402, 'https://fiteclub.hu', NULL, '{mma,boxing,muay_thai,kickboxing}', 'manual', true),
('The Playground Budapest', 'HU', 'Hungary', 'Budapest', NULL, 47.5000, 19.0450, NULL, NULL, '{mma,boxing,muay_thai}', 'manual', true),
('Budapest Top Team', 'HU', 'Hungary', 'Budapest', NULL, 47.4950, 19.0380, NULL, NULL, '{mma,boxing}', 'manual', true),
('Flex Gym Budapest', 'HU', 'Hungary', 'Budapest', NULL, 47.5020, 19.0500, NULL, NULL, '{boxing,mma}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Slovakia
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('CHAOS Bratislava', 'SK', 'Slovakia', 'Bratislava', 'Májová 21, Bratislava', 48.1486, 17.1077, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Octagon Fighting Academy', 'SK', 'Slovakia', 'Bratislava', 'Ivanská Cesta 10, Bratislava', 48.1530, 17.1750, NULL, NULL, '{mma,kickboxing}', 'manual', true),
('Spartans Muay Thai Bratislava', 'SK', 'Slovakia', 'Bratislava', NULL, 48.1500, 17.1100, 'https://www.spartans.sk', NULL, '{muay_thai,boxing,kickboxing}', 'manual', true),
('Spartakus Fight Gym', 'SK', 'Slovakia', 'Trnava', NULL, 48.3774, 17.5878, 'https://sfg.sk', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('MMA Top Team Košice', 'SK', 'Slovakia', 'Košice', NULL, 48.7164, 21.2611, NULL, NULL, '{mma,boxing}', 'manual', true),
('Free Fight Academy Košice', 'SK', 'Slovakia', 'Košice', NULL, 48.7200, 21.2580, NULL, NULL, '{mma,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Serbia
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Kaizen MMA Belgrade', 'RS', 'Serbia', 'Belgrade', NULL, 44.8176, 20.4633, 'https://kaizenmma.com', NULL, '{mma,boxing}', 'manual', true),
('Secutor MMA Academy', 'RS', 'Serbia', 'Belgrade', 'Omladinskih brigada 31, Belgrade', 44.8100, 20.4200, NULL, NULL, '{mma}', 'manual', true),
('Fight Company MMA', 'RS', 'Serbia', 'Belgrade', 'Cvetanova Ćuprija 117, Belgrade', 44.8250, 20.4700, NULL, NULL, '{mma,boxing}', 'manual', true),
('Fight Skill Boxing', 'RS', 'Serbia', 'Belgrade', NULL, 44.8200, 20.4600, NULL, NULL, '{boxing,kickboxing}', 'manual', true),
('CDS Martial Arts Club', 'RS', 'Serbia', 'Novi Sad', 'Temerinska 95, Novi Sad', 45.2600, 19.8350, NULL, NULL, '{mma,kickboxing}', 'manual', true),
('Mega Gym Fighting', 'RS', 'Serbia', 'Belgrade', NULL, 44.8150, 20.4550, 'https://megagym.rs', NULL, '{mma,boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Croatia
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Mash Gym Zagreb', 'HR', 'Croatia', 'Zagreb', NULL, 45.8150, 15.9819, 'https://www.mashgym.com', NULL, '{mma,boxing,muay_thai}', 'manual', true),
('American Top Team Zagreb', 'HR', 'Croatia', 'Zagreb', 'Zagrebačka Avenija 108, Zagreb', 45.7950, 15.9200, 'https://www.americantopteam.eu', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Spartan Gym Zagreb', 'HR', 'Croatia', 'Zagreb', NULL, 45.8100, 15.9750, 'https://spartangym.hr', NULL, '{muay_thai,kickboxing}', 'manual', true),
('Orlando Fit Zagreb', 'HR', 'Croatia', 'Zagreb', 'Radnička cesta 52, Zagreb', 45.8000, 15.9900, NULL, NULL, '{kickboxing,muay_thai}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Slovenia
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Fight Club Ljubljana', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0569, 14.5058, 'https://www.fcl.si', 'fcl.ljubljana', '{boxing,kickboxing,mma}', 'manual', true),
('Klub Center Ljubljana', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0550, 14.5100, 'https://www.klubcenter.com', NULL, '{boxing,kickboxing,muay_thai,mma}', 'manual', true),
('T''n''T Gym Ljubljana', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0520, 14.5080, 'https://www.tnt-gym.si', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('BK Knockout Ljubljana', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0540, 14.5050, NULL, 'boksarskiklubknockout', '{boxing}', 'manual', true),
('Simba Fight Club', 'SI', 'Slovenia', 'Ljubljana', NULL, 46.0530, 14.5070, 'http://simbafightclub.com', NULL, '{boxing,muay_thai}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Bulgaria
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Bulgarian Top Team', 'BG', 'Bulgaria', 'Sofia', 'Shipchenska Epopeia 12, Sofia', 42.6977, 23.3219, NULL, NULL, '{mma,boxing}', 'manual', true),
('ABC Fight Club', 'BG', 'Bulgaria', 'Sofia', NULL, 42.6950, 23.3250, NULL, NULL, '{boxing,kickboxing}', 'manual', true),
('Sport Center Pulev', 'BG', 'Bulgaria', 'Sofia', NULL, 42.7000, 23.3200, NULL, NULL, '{boxing}', 'manual', true),
('Champions Academy Bulgaria', 'BG', 'Bulgaria', 'Sofia', NULL, 42.6930, 23.3280, NULL, NULL, '{boxing}', 'manual', true),
('STEEL STYLE Boxing Gym', 'BG', 'Bulgaria', 'Sofia', NULL, 42.6960, 23.3240, NULL, NULL, '{boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Romania
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Combatant MMA Club', 'RO', 'Romania', 'Bucharest', NULL, 44.4268, 26.1025, 'https://combatant.ro', NULL, '{mma,boxing}', 'manual', true),
('Absoluto Fighting Center', 'RO', 'Romania', 'Bucharest', 'Splaiul Unirii nr. 96, Bucharest', 44.4200, 26.1100, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Prince Gym K-1', 'RO', 'Romania', 'Bucharest', NULL, 44.4350, 26.0400, NULL, NULL, '{kickboxing,mma}', 'manual', true),
('Profesional Fight Gym', 'RO', 'Romania', 'Bistrița', 'Str. Cloșca nr. 1-3, Bistrița', 47.1350, 24.4900, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Russia
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Fight Nights Team', 'RU', 'Russia', 'Moscow', NULL, 55.7558, 37.6173, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Eagles MMA', 'RU', 'Russia', 'Moscow', NULL, 55.7600, 37.6200, NULL, NULL, '{mma,boxing}', 'manual', true),
('Fight Club No. 1', 'RU', 'Russia', 'Moscow', NULL, 55.7520, 37.6150, NULL, NULL, '{mma,boxing,kickboxing}', 'manual', true),
('RCC Boxing', 'RU', 'Russia', 'Yekaterinburg', NULL, 56.8389, 60.6057, NULL, NULL, '{boxing}', 'manual', true),
('Rati Gym Moscow', 'RU', 'Russia', 'Moscow', NULL, 55.7580, 37.6100, NULL, NULL, '{mma,boxing,muay_thai}', 'manual', true),
('Alexander Nevsky Fight Club', 'RU', 'Russia', 'Saint Petersburg', NULL, 59.9343, 30.3351, NULL, NULL, '{boxing,mma,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Georgia
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Gymnasia Sports', 'GE', 'Georgia', 'Tbilisi', NULL, 41.7151, 44.8271, 'https://gymnasia.ge', NULL, '{mma,boxing,kickboxing}', 'manual', true),
('Georgia Pro MMA', 'GE', 'Georgia', 'Tbilisi', NULL, 41.7180, 44.8300, 'https://www.gapromma.com', NULL, '{mma,muay_thai,boxing}', 'manual', true),
('Mix Fight Georgia', 'GE', 'Georgia', 'Tbilisi', NULL, 41.7200, 44.8250, NULL, NULL, '{mma,boxing}', 'manual', true),
('Fight Factory Tbilisi', 'GE', 'Georgia', 'Tbilisi', NULL, 41.7160, 44.8280, NULL, NULL, '{kickboxing,mma}', 'manual', true)
ON CONFLICT DO NOTHING;

-- Sweden
INSERT INTO gym_directory (name, country_code, country_name, city, address, latitude, longitude, website, instagram, sports, source, verified) VALUES
('Allstars Training Center', 'SE', 'Sweden', 'Stockholm', 'Svetsarvägen 22, Solna', 59.3626, 17.8725, 'https://www.allstarsgym.se', 'allstarstrainingcenter', '{mma,boxing,muay_thai,kickboxing}', 'manual', true),
('Pancrase Gym Stockholm', 'SE', 'Sweden', 'Stockholm', NULL, 59.3170, 18.0649, NULL, 'pancrasegym', '{mma,muay_thai,boxing}', 'manual', true),
('Nexus STHLM', 'SE', 'Sweden', 'Stockholm', NULL, 59.3300, 18.0700, NULL, NULL, '{mma,kickboxing}', 'manual', true),
('GBG MMA', 'SE', 'Sweden', 'Gothenburg', NULL, 57.7089, 11.9746, NULL, 'gbgmma', '{mma,boxing,muay_thai}', 'manual', true),
('Redline Training Center', 'SE', 'Sweden', 'Malmö', NULL, 55.6050, 13.0038, NULL, NULL, '{mma,muay_thai,kickboxing}', 'manual', true),
('Malmö Muay Thai', 'SE', 'Sweden', 'Malmö', NULL, 55.6070, 13.0050, NULL, 'malmomuaythai', '{muay_thai,kickboxing}', 'manual', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FEED FUNCTIONS
-- ============================================================

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE post_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get feed for a user (posts from people they follow + public posts)
CREATE OR REPLACE FUNCTION get_user_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    author_type TEXT,
    author_id UUID,
    content TEXT,
    media_urls TEXT[],
    media_type TEXT,
    post_type TEXT,
    event_id UUID,
    likes_count INTEGER,
    comments_count INTEGER,
    shares_count INTEGER,
    views_count INTEGER,
    visibility TEXT,
    created_at TIMESTAMPTZ,
    is_liked BOOLEAN,
    is_saved BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.user_id,
        p.author_type,
        p.author_id,
        p.content,
        p.media_urls,
        p.media_type,
        p.post_type,
        p.event_id,
        p.likes_count,
        p.comments_count,
        p.shares_count,
        p.views_count,
        p.visibility,
        p.created_at,
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = p_user_id) as is_liked,
        EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = p_user_id) as is_saved
    FROM posts p
    WHERE p.status = 'active'
    AND (
        p.visibility = 'public'
        OR p.user_id = p_user_id
        OR p.user_id IN (SELECT following_user_id FROM follows WHERE follower_user_id = p_user_id)
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get reels feed
CREATE OR REPLACE FUNCTION get_reels_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    author_type TEXT,
    author_id UUID,
    content TEXT,
    media_urls TEXT[],
    likes_count INTEGER,
    comments_count INTEGER,
    views_count INTEGER,
    created_at TIMESTAMPTZ,
    is_liked BOOLEAN,
    is_saved BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.user_id,
        p.author_type,
        p.author_id,
        p.content,
        p.media_urls,
        p.likes_count,
        p.comments_count,
        p.views_count,
        p.created_at,
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = p_user_id) as is_liked,
        EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = p_user_id) as is_saved
    FROM posts p
    WHERE p.status = 'active'
    AND p.post_type = 'reel'
    AND p.visibility = 'public'
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FEED TRIGGERS
-- ============================================================

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_post_comments_updated_at
    BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_post_likes_count_trigger
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER update_comment_likes_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('avatars', 'avatars', true),
    ('event-photos', 'event-photos', true),
    ('gym-photos', 'gym-photos', true),
    ('fighter-photos', 'fighter-photos', true),
    ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies: event-photos
CREATE POLICY "Event photos are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-photos');
CREATE POLICY "Authenticated users can upload event photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

-- Storage Policies: gym-photos
CREATE POLICY "Gym photos are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'gym-photos');
CREATE POLICY "Authenticated users can upload gym photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'gym-photos' AND auth.role() = 'authenticated');

-- Storage Policies: fighter-photos
CREATE POLICY "Fighter photos are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'fighter-photos');
CREATE POLICY "Authenticated users can upload fighter photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'fighter-photos' AND auth.role() = 'authenticated');

-- Storage Policies: media (posts, reels, etc.)
CREATE POLICY "Media files are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated users can upload media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own media" ON storage.objects
    FOR UPDATE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own media" ON storage.objects
    FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- DONE! Schema is ready to use
-- ============================================================