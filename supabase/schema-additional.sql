-- Fight Station Additional Schema
-- Run this AFTER the main schema.sql
-- This file adds: Referral system, Push notifications, and RPC functions

-- ============================================
-- REFERRAL SYSTEM TABLES
-- ============================================

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending Referrals (stored when user signs up with a code, processed after profile completion)
CREATE TABLE IF NOT EXISTS pending_referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    referral_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completed Referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(referred_id)
);

-- Affiliate Stats (for tracking earnings)
CREATE TABLE IF NOT EXISTS affiliate_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    pending_earnings DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MULTI-TIER AFFILIATE SYSTEM
-- ============================================

-- Commission Rates - Admin-configurable rates for each tier
CREATE TABLE IF NOT EXISTS commission_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rate_key VARCHAR(50) UNIQUE NOT NULL,          -- 'gym_tier1_membership', 'fighter_tier2_all'
    display_name VARCHAR(100) NOT NULL,
    referrer_type VARCHAR(20) NOT NULL,            -- 'gym', 'fighter', 'coach'
    tier_level INTEGER NOT NULL DEFAULT 1,
    rate_percentage DECIMAL(5, 2) NOT NULL,        -- e.g., 15.00 for 15%
    transaction_type VARCHAR(50),                   -- NULL = applies to all types
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Chains - Tracks full referral hierarchy for each user
CREATE TABLE IF NOT EXISTS referral_chains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL,                 -- 'gym', 'fighter', 'coach'
    direct_referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    chain_depth INTEGER NOT NULL DEFAULT 1,
    chain_path JSONB NOT NULL DEFAULT '[]',         -- Full hierarchy as array of {user_id, user_type}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Transactions - Source transactions that generate commissions
CREATE TABLE IF NOT EXISTS affiliate_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,          -- 'membership', 'merchandise', 'event_fee'
    payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payer_type VARCHAR(20) NOT NULL,                -- 'gym', 'fighter'
    gross_amount DECIMAL(10, 2) NOT NULL,
    platform_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
    platform_fee_amount DECIMAL(10, 2) NOT NULL,
    commission_pool DECIMAL(10, 2) NOT NULL,        -- Amount available for affiliate payouts
    net_platform_amount DECIMAL(10, 2),             -- What platform keeps after payouts
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'refunded')),
    external_transaction_id VARCHAR(100),           -- Stripe/payment provider ID
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Earnings - Individual commission records for each beneficiary
CREATE TABLE IF NOT EXISTS affiliate_earnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES affiliate_transactions(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    beneficiary_type VARCHAR(20) NOT NULL,          -- 'gym', 'fighter', 'coach'
    tier_level INTEGER NOT NULL,                     -- 1 = direct referrer, 2 = referrer's referrer
    rate_percentage DECIMAL(5, 2) NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL,            -- Amount the rate was applied to
    earned_amount DECIMAL(10, 2) NOT NULL,          -- Actual earnings
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Clicks (track deep link usage for analytics)
CREATE TABLE IF NOT EXISTS referral_clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referral_code TEXT NOT NULL,
    target_type TEXT CHECK (target_type IN ('join', 'event', 'fighter', 'gym', 'unknown')),
    target_id UUID,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    converted BOOLEAN DEFAULT FALSE,
    conversion_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- PUSH NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_referrals_code ON pending_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_date ON referral_clicks(clicked_at);

-- Multi-tier affiliate indexes
CREATE INDEX IF NOT EXISTS idx_commission_rates_type ON commission_rates(referrer_type, tier_level);
CREATE INDEX IF NOT EXISTS idx_referral_chains_user ON referral_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_chains_referrer ON referral_chains(direct_referrer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_payer ON affiliate_transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_date ON affiliate_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_status ON affiliate_transactions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_beneficiary ON affiliate_earnings(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_transaction ON affiliate_earnings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_status ON affiliate_earnings(status);

-- Index for conversations (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_participants') THEN
        CREATE INDEX idx_conversations_participants ON conversations USING GIN (participant_ids);
    END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Anyone can verify referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Users can insert own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can view own pending referral" ON pending_referrals;
DROP POLICY IF EXISTS "Users can insert own pending referral" ON pending_referrals;
DROP POLICY IF EXISTS "Users can delete own pending referral" ON pending_referrals;
DROP POLICY IF EXISTS "Users can view referrals they made or received" ON referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view own affiliate stats" ON affiliate_stats;
DROP POLICY IF EXISTS "Users can insert own affiliate stats" ON affiliate_stats;
DROP POLICY IF EXISTS "Users can update own affiliate stats" ON affiliate_stats;
DROP POLICY IF EXISTS "Users can manage own push tokens" ON push_tokens;

-- Referral Codes Policies
CREATE POLICY "Users can view own referral code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify referral codes" ON referral_codes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own referral code" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pending Referrals Policies
CREATE POLICY "Users can view own pending referral" ON pending_referrals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending referral" ON pending_referrals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending referral" ON pending_referrals
    FOR DELETE USING (auth.uid() = user_id);

-- Referrals Policies
CREATE POLICY "Users can view referrals they made or received" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" ON referrals
    FOR INSERT WITH CHECK (true);

-- Affiliate Stats Policies
CREATE POLICY "Users can view own affiliate stats" ON affiliate_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate stats" ON affiliate_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate stats" ON affiliate_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Push Tokens Policies
CREATE POLICY "Users can manage own push tokens" ON push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Referral Clicks Policies (anyone can insert for tracking, referrers can view their stats)
DROP POLICY IF EXISTS "Anyone can insert referral clicks" ON referral_clicks;
DROP POLICY IF EXISTS "Referrers can view their click stats" ON referral_clicks;

CREATE POLICY "Anyone can insert referral clicks" ON referral_clicks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Referrers can view their click stats" ON referral_clicks
    FOR SELECT USING (
        referral_code IN (
            SELECT code FROM referral_codes WHERE user_id = auth.uid()
        )
    );

-- Commission Rates Policies (read-only for users, admin manages via service role)
DROP POLICY IF EXISTS "Anyone can view active commission rates" ON commission_rates;
CREATE POLICY "Anyone can view active commission rates" ON commission_rates
    FOR SELECT USING (is_active = TRUE);

-- Referral Chains Policies
DROP POLICY IF EXISTS "Users can view own referral chain" ON referral_chains;
DROP POLICY IF EXISTS "Users can view chains where they are referrer" ON referral_chains;
CREATE POLICY "Users can view own referral chain" ON referral_chains
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view chains where they are referrer" ON referral_chains
    FOR SELECT USING (auth.uid() = direct_referrer_id);

-- Affiliate Transactions Policies
DROP POLICY IF EXISTS "Users can view transactions they paid" ON affiliate_transactions;
DROP POLICY IF EXISTS "Users can view transactions generating their earnings" ON affiliate_transactions;
CREATE POLICY "Users can view transactions they paid" ON affiliate_transactions
    FOR SELECT USING (auth.uid() = payer_id);
CREATE POLICY "Users can view transactions generating their earnings" ON affiliate_transactions
    FOR SELECT USING (
        id IN (SELECT transaction_id FROM affiliate_earnings WHERE beneficiary_id = auth.uid())
    );

-- Affiliate Earnings Policies
DROP POLICY IF EXISTS "Users can view own earnings" ON affiliate_earnings;
CREATE POLICY "Users can view own earnings" ON affiliate_earnings
    FOR SELECT USING (auth.uid() = beneficiary_id);

-- ============================================
-- CONVERSATIONS & MESSAGES POLICIES (if not already created)
-- ============================================

DO $$
BEGIN
    -- Conversations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their conversations' AND tablename = 'conversations') THEN
        CREATE POLICY "Users can view their conversations" ON conversations
            FOR SELECT USING (auth.uid() = ANY(participant_ids));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create conversations' AND tablename = 'conversations') THEN
        CREATE POLICY "Users can create conversations" ON conversations
            FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their conversations' AND tablename = 'conversations') THEN
        CREATE POLICY "Users can update their conversations" ON conversations
            FOR UPDATE USING (auth.uid() = ANY(participant_ids));
    END IF;

    -- Messages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view messages in their conversations' AND tablename = 'messages') THEN
        CREATE POLICY "Users can view messages in their conversations" ON messages
            FOR SELECT USING (
                conversation_id IN (
                    SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can send messages to their conversations' AND tablename = 'messages') THEN
        CREATE POLICY "Users can send messages to their conversations" ON messages
            FOR INSERT WITH CHECK (
                auth.uid() = sender_id AND
                conversation_id IN (
                    SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own messages' AND tablename = 'messages') THEN
        CREATE POLICY "Users can update their own messages" ON messages
            FOR UPDATE USING (auth.uid() = sender_id);
    END IF;
END $$;

-- ============================================
-- RPC FUNCTIONS
-- ============================================

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

-- Get or create conversation between two users
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

-- Mark conversation messages as read
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Drop existing triggers first (to avoid conflicts)
DROP TRIGGER IF EXISTS update_affiliate_stats_updated_at ON affiliate_stats;
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
DROP TRIGGER IF EXISTS process_fighter_referral ON fighters;
DROP TRIGGER IF EXISTS process_gym_referral ON gyms;
DROP TRIGGER IF EXISTS process_coach_referral ON coaches;

-- Update affiliate stats updated_at
CREATE TRIGGER update_affiliate_stats_updated_at
    BEFORE UPDATE ON affiliate_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update push tokens updated_at
CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to process pending referral after profile creation
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

-- Trigger on fighters table
CREATE TRIGGER process_fighter_referral
    AFTER INSERT ON fighters
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();

-- Trigger on gyms table
CREATE TRIGGER process_gym_referral
    AFTER INSERT ON gyms
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();

-- Trigger on coaches table
CREATE TRIGGER process_coach_referral
    AFTER INSERT ON coaches
    FOR EACH ROW EXECUTE FUNCTION process_pending_referral();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_requests;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- MULTI-TIER AFFILIATE FUNCTIONS
-- ============================================

-- Insert default commission rates (run once)
INSERT INTO commission_rates (rate_key, display_name, referrer_type, tier_level, rate_percentage, transaction_type)
VALUES
    -- Tier 1 (Direct referrer) - percentage of transaction amount
    ('gym_tier1_membership', 'Gym Direct - Membership', 'gym', 1, 15.00, 'membership'),
    ('gym_tier1_merchandise', 'Gym Direct - Merchandise', 'gym', 1, 10.00, 'merchandise'),
    ('gym_tier1_event_fee', 'Gym Direct - Event Fees', 'gym', 1, 10.00, 'event_fee'),
    ('fighter_tier1_membership', 'Fighter Direct - Membership', 'fighter', 1, 10.00, 'membership'),
    ('fighter_tier1_merchandise', 'Fighter Direct - Merchandise', 'fighter', 1, 8.00, 'merchandise'),
    ('coach_tier1_membership', 'Coach Direct - Membership', 'coach', 1, 10.00, 'membership'),

    -- Tier 2 (Referrer's referrer) - percentage of commission pool (platform fee)
    ('gym_tier2_all', 'Gym Tier 2 - All Transactions', 'gym', 2, 5.00, NULL),
    ('fighter_tier2_all', 'Fighter Tier 2 - All Transactions', 'fighter', 2, 3.00, NULL),
    ('coach_tier2_all', 'Coach Tier 2 - All Transactions', 'coach', 2, 3.00, NULL)
ON CONFLICT (rate_key) DO UPDATE SET
    rate_percentage = EXCLUDED.rate_percentage,
    updated_at = NOW();

-- Function to build/update referral chain when a referral is completed
CREATE OR REPLACE FUNCTION build_referral_chain()
RETURNS TRIGGER AS $$
DECLARE
    referrer_chain JSONB;
    referrer_type VARCHAR(20);
    referred_type VARCHAR(20);
    new_chain_path JSONB;
    chain_depth INTEGER;
BEGIN
    -- Only process completed referrals
    IF NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;

    -- Determine referred user type
    IF EXISTS (SELECT 1 FROM gyms WHERE user_id = NEW.referred_id) THEN
        referred_type := 'gym';
    ELSIF EXISTS (SELECT 1 FROM fighters WHERE user_id = NEW.referred_id) THEN
        referred_type := 'fighter';
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE user_id = NEW.referred_id) THEN
        referred_type := 'coach';
    ELSE
        referred_type := 'unknown';
    END IF;

    -- Determine referrer type
    IF EXISTS (SELECT 1 FROM gyms WHERE user_id = NEW.referrer_id) THEN
        referrer_type := 'gym';
    ELSIF EXISTS (SELECT 1 FROM fighters WHERE user_id = NEW.referrer_id) THEN
        referrer_type := 'fighter';
    ELSIF EXISTS (SELECT 1 FROM coaches WHERE user_id = NEW.referrer_id) THEN
        referrer_type := 'coach';
    ELSE
        referrer_type := 'unknown';
    END IF;

    -- Get referrer's existing chain (if any)
    SELECT chain_path INTO referrer_chain
    FROM referral_chains
    WHERE user_id = NEW.referrer_id;

    -- Build new chain path
    IF referrer_chain IS NULL THEN
        -- Referrer has no chain, create with just referrer
        new_chain_path := jsonb_build_array(
            jsonb_build_object('user_id', NEW.referrer_id, 'user_type', referrer_type)
        );
        chain_depth := 1;
    ELSE
        -- Append referrer to existing chain
        new_chain_path := referrer_chain || jsonb_build_array(
            jsonb_build_object('user_id', NEW.referrer_id, 'user_type', referrer_type)
        );
        chain_depth := jsonb_array_length(new_chain_path);
    END IF;

    -- Insert or update chain for referred user
    INSERT INTO referral_chains (user_id, user_type, direct_referrer_id, chain_depth, chain_path)
    VALUES (NEW.referred_id, referred_type, NEW.referrer_id, chain_depth, new_chain_path)
    ON CONFLICT (user_id) DO UPDATE SET
        direct_referrer_id = NEW.referrer_id,
        chain_depth = chain_depth,
        chain_path = new_chain_path;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to build chain on referral completion
DROP TRIGGER IF EXISTS build_referral_chain_trigger ON referrals;
CREATE TRIGGER build_referral_chain_trigger
    AFTER INSERT OR UPDATE OF status ON referrals
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION build_referral_chain();

-- Function to calculate affiliate commissions for a transaction
-- Called when a transaction is created (e.g., membership payment, merchandise purchase)
CREATE OR REPLACE FUNCTION calculate_affiliate_commissions(p_transaction_id UUID)
RETURNS VOID AS $$
DECLARE
    tx RECORD;
    payer_chain RECORD;
    tier1_referrer_id UUID;
    tier2_referrer_id UUID;
    tier1_type VARCHAR(20);
    tier2_type VARCHAR(20);
    tier1_rate DECIMAL(5,2);
    tier2_rate DECIMAL(5,2);
    tier1_earnings DECIMAL(10,2);
    tier2_earnings DECIMAL(10,2);
    total_paid DECIMAL(10,2) := 0;
    chain_entry JSONB;
BEGIN
    -- Get transaction details
    SELECT * INTO tx FROM affiliate_transactions WHERE id = p_transaction_id;
    IF tx IS NULL THEN
        RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
    END IF;

    -- Get payer's referral chain
    SELECT * INTO payer_chain FROM referral_chains WHERE user_id = tx.payer_id;

    -- No chain = no affiliate earnings
    IF payer_chain IS NULL OR payer_chain.chain_path IS NULL THEN
        UPDATE affiliate_transactions
        SET net_platform_amount = tx.commission_pool,
            status = 'processed',
            processed_at = NOW()
        WHERE id = p_transaction_id;
        RETURN;
    END IF;

    -- Get Tier 1 referrer (direct referrer - last in chain)
    IF jsonb_array_length(payer_chain.chain_path) >= 1 THEN
        chain_entry := payer_chain.chain_path -> (jsonb_array_length(payer_chain.chain_path) - 1);
        tier1_referrer_id := (chain_entry ->> 'user_id')::UUID;
        tier1_type := chain_entry ->> 'user_type';

        -- Get Tier 1 rate
        SELECT rate_percentage INTO tier1_rate
        FROM commission_rates
        WHERE referrer_type = tier1_type
          AND tier_level = 1
          AND (transaction_type = tx.transaction_type OR transaction_type IS NULL)
          AND is_active = TRUE
        ORDER BY transaction_type NULLS LAST
        LIMIT 1;

        IF tier1_rate IS NOT NULL THEN
            -- Tier 1 earns % of commission pool (platform fee), NOT gross amount
            tier1_earnings := ROUND(tx.commission_pool * (tier1_rate / 100), 2);

            INSERT INTO affiliate_earnings (
                transaction_id, beneficiary_id, beneficiary_type, tier_level,
                rate_percentage, base_amount, earned_amount, status
            ) VALUES (
                p_transaction_id, tier1_referrer_id, tier1_type, 1,
                tier1_rate, tx.commission_pool, tier1_earnings, 'pending'
            );

            total_paid := total_paid + tier1_earnings;

            -- Update affiliate_stats
            UPDATE affiliate_stats
            SET pending_earnings = pending_earnings + tier1_earnings,
                updated_at = NOW()
            WHERE user_id = tier1_referrer_id;
        END IF;
    END IF;

    -- Get Tier 2 referrer (referrer's referrer - second to last in chain)
    IF jsonb_array_length(payer_chain.chain_path) >= 2 THEN
        chain_entry := payer_chain.chain_path -> (jsonb_array_length(payer_chain.chain_path) - 2);
        tier2_referrer_id := (chain_entry ->> 'user_id')::UUID;
        tier2_type := chain_entry ->> 'user_type';

        -- Get Tier 2 rate
        SELECT rate_percentage INTO tier2_rate
        FROM commission_rates
        WHERE referrer_type = tier2_type
          AND tier_level = 2
          AND (transaction_type = tx.transaction_type OR transaction_type IS NULL)
          AND is_active = TRUE
        ORDER BY transaction_type NULLS LAST
        LIMIT 1;

        IF tier2_rate IS NOT NULL THEN
            -- Tier 2 earns % of commission pool (platform fee), NOT transaction amount
            tier2_earnings := ROUND(tx.commission_pool * (tier2_rate / 100), 2);

            INSERT INTO affiliate_earnings (
                transaction_id, beneficiary_id, beneficiary_type, tier_level,
                rate_percentage, base_amount, earned_amount, status
            ) VALUES (
                p_transaction_id, tier2_referrer_id, tier2_type, 2,
                tier2_rate, tx.commission_pool, tier2_earnings, 'pending'
            );

            total_paid := total_paid + tier2_earnings;

            -- Update affiliate_stats
            UPDATE affiliate_stats
            SET pending_earnings = pending_earnings + tier2_earnings,
                updated_at = NOW()
            WHERE user_id = tier2_referrer_id;
        END IF;
    END IF;

    -- Update transaction with net platform amount
    UPDATE affiliate_transactions
    SET net_platform_amount = tx.commission_pool - total_paid,
        status = 'processed',
        processed_at = NOW()
    WHERE id = p_transaction_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an affiliate transaction and calculate commissions
-- Use this when processing payments
CREATE OR REPLACE FUNCTION create_affiliate_transaction(
    p_transaction_type VARCHAR(50),
    p_payer_id UUID,
    p_payer_type VARCHAR(20),
    p_gross_amount DECIMAL(10,2),
    p_platform_fee_percentage DECIMAL(5,2) DEFAULT 30.00,
    p_external_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_transaction_id UUID;
    platform_fee DECIMAL(10,2);
BEGIN
    -- Calculate platform fee
    platform_fee := ROUND(p_gross_amount * (p_platform_fee_percentage / 100), 2);

    -- Create transaction
    INSERT INTO affiliate_transactions (
        transaction_type, payer_id, payer_type, gross_amount,
        platform_fee_percentage, platform_fee_amount, commission_pool,
        external_transaction_id, status
    ) VALUES (
        p_transaction_type, p_payer_id, p_payer_type, p_gross_amount,
        p_platform_fee_percentage, platform_fee, platform_fee,
        p_external_id, 'pending'
    )
    RETURNING id INTO new_transaction_id;

    -- Calculate and distribute commissions
    PERFORM calculate_affiliate_commissions(new_transaction_id);

    RETURN new_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's earnings summary by tier
CREATE OR REPLACE FUNCTION get_earnings_summary(p_user_id UUID)
RETURNS TABLE (
    tier_level INTEGER,
    total_earned DECIMAL(10,2),
    pending_amount DECIMAL(10,2),
    approved_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ae.tier_level,
        COALESCE(SUM(ae.earned_amount), 0) as total_earned,
        COALESCE(SUM(CASE WHEN ae.status = 'pending' THEN ae.earned_amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN ae.status = 'approved' THEN ae.earned_amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN ae.status = 'paid' THEN ae.earned_amount ELSE 0 END), 0) as paid_amount,
        COUNT(*) as transaction_count
    FROM affiliate_earnings ae
    WHERE ae.beneficiary_id = p_user_id
    GROUP BY ae.tier_level
    ORDER BY ae.tier_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's referral network (who they referred and who referred those users)
CREATE OR REPLACE FUNCTION get_referral_network(p_user_id UUID)
RETURNS TABLE (
    referred_user_id UUID,
    referred_user_type VARCHAR(20),
    referral_date TIMESTAMPTZ,
    tier INTEGER,
    sub_referral_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE network AS (
        -- Direct referrals (Tier 1)
        SELECT
            r.referred_id as user_id,
            rc.user_type,
            r.completed_at,
            1 as tier
        FROM referrals r
        JOIN referral_chains rc ON rc.user_id = r.referred_id
        WHERE r.referrer_id = p_user_id AND r.status = 'completed'

        UNION ALL

        -- Indirect referrals (Tier 2)
        SELECT
            r.referred_id,
            rc.user_type,
            r.completed_at,
            n.tier + 1
        FROM referrals r
        JOIN network n ON r.referrer_id = n.user_id
        JOIN referral_chains rc ON rc.user_id = r.referred_id
        WHERE r.status = 'completed' AND n.tier < 2
    )
    SELECT
        n.user_id as referred_user_id,
        n.user_type as referred_user_type,
        n.completed_at as referral_date,
        n.tier,
        (SELECT COUNT(*) FROM referrals r2 WHERE r2.referrer_id = n.user_id AND r2.status = 'completed') as sub_referral_count
    FROM network n
    ORDER BY n.tier, n.completed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REFERRAL TIER / BADGE SYSTEM
-- ============================================

-- Tier levels: member (0-2), bronze (3-9), silver (10-24), gold (25-49), platinum (50-99), diamond (100+)
-- Each tier has different affiliate rates and perks

-- Add referral_tier column to affiliate_stats if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'affiliate_stats' AND column_name = 'referral_tier'
    ) THEN
        ALTER TABLE affiliate_stats ADD COLUMN referral_tier VARCHAR(20) DEFAULT 'member';
    END IF;
END $$;

-- Create tier configuration table for dynamic rates
CREATE TABLE IF NOT EXISTS referral_tier_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier_level VARCHAR(20) UNIQUE NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    min_referrals INTEGER NOT NULL,
    max_referrals INTEGER, -- NULL for unlimited (diamond)
    direct_rate DECIMAL(5, 2) NOT NULL,     -- Tier 1 affiliate rate
    indirect_rate DECIMAL(5, 2) NOT NULL,   -- Tier 2 affiliate rate
    badge_color VARCHAR(20) NOT NULL,
    priority_requests BOOLEAN DEFAULT FALSE,
    featured_leaderboard BOOLEAN DEFAULT FALSE,
    early_access BOOLEAN DEFAULT FALSE,
    verified_badge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert tier configuration
INSERT INTO referral_tier_config (tier_level, tier_name, min_referrals, max_referrals, direct_rate, indirect_rate, badge_color, priority_requests, featured_leaderboard, early_access, verified_badge)
VALUES
    ('member', 'Member', 0, 2, 10.00, 3.00, '#6B7280', FALSE, FALSE, FALSE, FALSE),
    ('bronze', 'Bronze', 3, 9, 12.00, 4.00, '#CD7F32', FALSE, FALSE, FALSE, FALSE),
    ('silver', 'Silver', 10, 24, 14.00, 5.00, '#C0C0C0', TRUE, FALSE, FALSE, FALSE),
    ('gold', 'Gold', 25, 49, 16.00, 6.00, '#FFD700', TRUE, TRUE, FALSE, FALSE),
    ('platinum', 'Platinum', 50, 99, 18.00, 7.00, '#E5E4E2', TRUE, TRUE, TRUE, FALSE),
    ('diamond', 'Diamond', 100, NULL, 20.00, 8.00, '#B9F2FF', TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (tier_level) DO UPDATE SET
    direct_rate = EXCLUDED.direct_rate,
    indirect_rate = EXCLUDED.indirect_rate;

-- Function to calculate tier based on referral count
CREATE OR REPLACE FUNCTION get_referral_tier(p_referral_count INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF p_referral_count >= 100 THEN RETURN 'diamond';
    ELSIF p_referral_count >= 50 THEN RETURN 'platinum';
    ELSIF p_referral_count >= 25 THEN RETURN 'gold';
    ELSIF p_referral_count >= 10 THEN RETURN 'silver';
    ELSIF p_referral_count >= 3 THEN RETURN 'bronze';
    ELSE RETURN 'member';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user's tier when referral count changes
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier VARCHAR(20);
    old_tier VARCHAR(20);
BEGIN
    -- Calculate new tier based on successful referrals
    new_tier := get_referral_tier(NEW.successful_referrals);
    old_tier := OLD.referral_tier;

    -- Update tier if changed
    IF new_tier != COALESCE(old_tier, 'member') THEN
        NEW.referral_tier := new_tier;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update tier on affiliate_stats changes
DROP TRIGGER IF EXISTS update_tier_on_stats_change ON affiliate_stats;
CREATE TRIGGER update_tier_on_stats_change
    BEFORE UPDATE OF successful_referrals ON affiliate_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tier();

-- Function to get user's tier info with all details
CREATE OR REPLACE FUNCTION get_user_tier_info(p_user_id UUID)
RETURNS TABLE (
    tier_level VARCHAR(20),
    tier_name VARCHAR(50),
    referral_count INTEGER,
    direct_rate DECIMAL(5, 2),
    indirect_rate DECIMAL(5, 2),
    badge_color VARCHAR(20),
    priority_requests BOOLEAN,
    featured_leaderboard BOOLEAN,
    early_access BOOLEAN,
    verified_badge BOOLEAN,
    next_tier_level VARCHAR(20),
    next_tier_name VARCHAR(50),
    referrals_to_next INTEGER,
    progress_percent INTEGER
) AS $$
DECLARE
    v_referral_count INTEGER;
    v_current_tier VARCHAR(20);
    v_next_tier RECORD;
BEGIN
    -- Get user's referral count
    SELECT COALESCE(successful_referrals, 0) INTO v_referral_count
    FROM affiliate_stats
    WHERE user_id = p_user_id;

    IF v_referral_count IS NULL THEN
        v_referral_count := 0;
    END IF;

    -- Get current tier
    v_current_tier := get_referral_tier(v_referral_count);

    -- Get next tier info (if not at max)
    SELECT * INTO v_next_tier
    FROM referral_tier_config
    WHERE min_referrals > v_referral_count
    ORDER BY min_referrals
    LIMIT 1;

    RETURN QUERY
    SELECT
        rtc.tier_level,
        rtc.tier_name,
        v_referral_count,
        rtc.direct_rate,
        rtc.indirect_rate,
        rtc.badge_color,
        rtc.priority_requests,
        rtc.featured_leaderboard,
        rtc.early_access,
        rtc.verified_badge,
        v_next_tier.tier_level,
        v_next_tier.tier_name,
        CASE WHEN v_next_tier.min_referrals IS NOT NULL
             THEN v_next_tier.min_referrals - v_referral_count
             ELSE NULL
        END,
        CASE WHEN v_next_tier.min_referrals IS NOT NULL
             THEN LEAST(100, ROUND(((v_referral_count - rtc.min_referrals)::NUMERIC /
                   (v_next_tier.min_referrals - rtc.min_referrals)::NUMERIC) * 100))::INTEGER
             ELSE 100
        END
    FROM referral_tier_config rtc
    WHERE rtc.tier_level = v_current_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top referrers leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(
    p_limit INTEGER DEFAULT 10,
    p_country VARCHAR(100) DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    user_type VARCHAR(20),
    display_name TEXT,
    avatar_url TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    referral_count INTEGER,
    tier_level VARCHAR(20),
    badge_color VARCHAR(20),
    rank_position BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_info AS (
        -- Get info from fighters
        SELECT
            f.user_id,
            'fighter'::VARCHAR(20) as user_type,
            (f.first_name || ' ' || f.last_name) as display_name,
            f.avatar_url,
            f.country,
            f.city
        FROM fighters f
        UNION ALL
        -- Get info from gyms
        SELECT
            g.user_id,
            'gym'::VARCHAR(20),
            g.name,
            g.logo_url,
            g.country,
            g.city
        FROM gyms g
        UNION ALL
        -- Get info from coaches
        SELECT
            c.user_id,
            'coach'::VARCHAR(20),
            (c.first_name || ' ' || c.last_name),
            c.avatar_url,
            c.country,
            c.city
        FROM coaches c
    )
    SELECT
        afs.user_id,
        ui.user_type,
        ui.display_name,
        ui.avatar_url,
        ui.country,
        ui.city,
        afs.successful_referrals as referral_count,
        afs.referral_tier as tier_level,
        rtc.badge_color,
        ROW_NUMBER() OVER (ORDER BY afs.successful_referrals DESC) as rank_position
    FROM affiliate_stats afs
    JOIN user_info ui ON ui.user_id = afs.user_id
    JOIN referral_tier_config rtc ON rtc.tier_level = COALESCE(afs.referral_tier, 'member')
    WHERE afs.successful_referrals > 0
      AND (p_country IS NULL OR ui.country = p_country)
      AND (p_city IS NULL OR ui.city = p_city)
    ORDER BY afs.successful_referrals DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for tier config (read-only for users)
ALTER TABLE referral_tier_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view tier config" ON referral_tier_config;
CREATE POLICY "Anyone can view tier config" ON referral_tier_config
    FOR SELECT USING (true);

-- ============================================
-- GYM DIRECTORY SYSTEM
-- Pre-populated gym database for cold-start solution
-- ============================================

-- Target countries reference table
CREATE TABLE IF NOT EXISTS directory_countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_native VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    gym_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ
);

-- Insert target countries (14 countries)
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
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_native = EXCLUDED.name_native;

-- Gym directory table (pre-populated gyms that can be claimed)
CREATE TABLE IF NOT EXISTS gym_directory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Basic Info
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,

    -- Location
    country_code VARCHAR(2) NOT NULL REFERENCES directory_countries(code),
    country_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    instagram VARCHAR(100),
    facebook VARCHAR(255),

    -- Sports (stored as array)
    sports TEXT[] DEFAULT '{}',  -- ['boxing', 'mma', 'muay_thai', 'kickboxing']

    -- Claim Status
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,  -- Links to real gym after claim

    -- Data Source
    source VARCHAR(50) DEFAULT 'manual',  -- 'google_places', 'manual', 'user_submitted'
    source_id VARCHAR(255),  -- External ID from source
    verified BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym claim requests table (for verification flow)
CREATE TABLE IF NOT EXISTS gym_claim_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_directory_id UUID NOT NULL REFERENCES gym_directory(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Verification method
    verification_method VARCHAR(20) NOT NULL CHECK (verification_method IN ('email', 'phone', 'manual')),

    -- Verification details
    verification_code VARCHAR(10),
    verification_sent_at TIMESTAMPTZ,
    verification_attempts INTEGER DEFAULT 0,

    -- For manual review
    proof_document_url TEXT,
    admin_notes TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'approved', 'rejected')),
    rejected_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Prevent duplicate claims
    UNIQUE(gym_directory_id, claimant_id)
);

-- Indexes for gym directory
CREATE INDEX IF NOT EXISTS idx_gym_directory_country ON gym_directory(country_code);
CREATE INDEX IF NOT EXISTS idx_gym_directory_city ON gym_directory(city);
CREATE INDEX IF NOT EXISTS idx_gym_directory_claimed ON gym_directory(is_claimed);
CREATE INDEX IF NOT EXISTS idx_gym_directory_sports ON gym_directory USING GIN(sports);
CREATE INDEX IF NOT EXISTS idx_gym_directory_name ON gym_directory(name);
CREATE INDEX IF NOT EXISTS idx_gym_claim_requests_status ON gym_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_gym_claim_requests_gym ON gym_claim_requests(gym_directory_id);

-- Function to generate slug from gym name
CREATE OR REPLACE FUNCTION generate_gym_slug(p_name TEXT, p_city TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from name and city
    base_slug := LOWER(REGEXP_REPLACE(p_name || '-' || p_city, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);

    -- Check for uniqueness
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM gym_directory WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION gym_directory_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug := generate_gym_slug(NEW.name, NEW.city);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gym_directory_slug_trigger ON gym_directory;
CREATE TRIGGER gym_directory_slug_trigger
    BEFORE INSERT ON gym_directory
    FOR EACH ROW
    EXECUTE FUNCTION gym_directory_before_insert();

-- Function to update country gym counts
CREATE OR REPLACE FUNCTION update_country_gym_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the count for affected countries
    IF TG_OP = 'INSERT' THEN
        UPDATE directory_countries
        SET gym_count = (SELECT COUNT(*) FROM gym_directory WHERE country_code = NEW.country_code),
            last_updated = NOW()
        WHERE code = NEW.country_code;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE directory_countries
        SET gym_count = (SELECT COUNT(*) FROM gym_directory WHERE country_code = OLD.country_code),
            last_updated = NOW()
        WHERE code = OLD.country_code;
    ELSIF TG_OP = 'UPDATE' AND OLD.country_code != NEW.country_code THEN
        UPDATE directory_countries
        SET gym_count = (SELECT COUNT(*) FROM gym_directory WHERE country_code = OLD.country_code),
            last_updated = NOW()
        WHERE code = OLD.country_code;
        UPDATE directory_countries
        SET gym_count = (SELECT COUNT(*) FROM gym_directory WHERE country_code = NEW.country_code),
            last_updated = NOW()
        WHERE code = NEW.country_code;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gym_directory_count_trigger ON gym_directory;
CREATE TRIGGER gym_directory_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gym_directory
    FOR EACH ROW
    EXECUTE FUNCTION update_country_gym_count();

-- Function to process approved gym claim
CREATE OR REPLACE FUNCTION process_gym_claim_approval(p_claim_id UUID, p_admin_id UUID)
RETURNS UUID AS $$
DECLARE
    v_claim RECORD;
    v_directory_gym RECORD;
    v_new_gym_id UUID;
BEGIN
    -- Get claim details
    SELECT * INTO v_claim FROM gym_claim_requests WHERE id = p_claim_id;
    IF v_claim IS NULL THEN
        RAISE EXCEPTION 'Claim not found: %', p_claim_id;
    END IF;

    IF v_claim.status != 'pending' AND v_claim.status != 'verifying' THEN
        RAISE EXCEPTION 'Claim already processed';
    END IF;

    -- Get directory gym details
    SELECT * INTO v_directory_gym FROM gym_directory WHERE id = v_claim.gym_directory_id;

    -- Check if gym already claimed
    IF v_directory_gym.is_claimed THEN
        RAISE EXCEPTION 'Gym already claimed';
    END IF;

    -- Check if user already has a gym
    SELECT id INTO v_new_gym_id FROM gyms WHERE user_id = v_claim.claimant_id;

    IF v_new_gym_id IS NULL THEN
        -- Create new gym entry from directory data
        INSERT INTO gyms (
            user_id, name, country, city, address,
            latitude, longitude, phone, email, website,
            instagram, facebook, sports
        ) VALUES (
            v_claim.claimant_id, v_directory_gym.name, v_directory_gym.country_name, v_directory_gym.city, v_directory_gym.address,
            v_directory_gym.latitude, v_directory_gym.longitude, v_directory_gym.phone, v_directory_gym.email, v_directory_gym.website,
            v_directory_gym.instagram, v_directory_gym.facebook, v_directory_gym.sports
        )
        RETURNING id INTO v_new_gym_id;
    END IF;

    -- Update directory entry as claimed
    UPDATE gym_directory
    SET is_claimed = TRUE,
        claimed_by = v_claim.claimant_id,
        claimed_at = NOW(),
        gym_id = v_new_gym_id,
        updated_at = NOW()
    WHERE id = v_claim.gym_directory_id;

    -- Update claim status
    UPDATE gym_claim_requests
    SET status = 'approved',
        processed_at = NOW(),
        processed_by = p_admin_id
    WHERE id = p_claim_id;

    RETURN v_new_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search gyms in directory
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
    id UUID,
    name VARCHAR(200),
    slug VARCHAR(200),
    country_code VARCHAR(2),
    country_name VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    website VARCHAR(500),
    instagram VARCHAR(100),
    sports TEXT[],
    is_claimed BOOLEAN,
    gym_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gd.id,
        gd.name,
        gd.slug,
        gd.country_code,
        gd.country_name,
        gd.city,
        gd.address,
        gd.latitude,
        gd.longitude,
        gd.phone,
        gd.website,
        gd.instagram,
        gd.sports,
        gd.is_claimed,
        gd.gym_id
    FROM gym_directory gd
    WHERE (p_country_code IS NULL OR gd.country_code = p_country_code)
      AND (p_city IS NULL OR LOWER(gd.city) = LOWER(p_city))
      AND (p_sport IS NULL OR p_sport = ANY(gd.sports))
      AND (p_search_term IS NULL OR gd.name ILIKE '%' || p_search_term || '%')
      AND (p_claimed_only IS NULL OR gd.is_claimed = p_claimed_only)
    ORDER BY gd.name
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for gym directory
ALTER TABLE directory_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_claim_requests ENABLE ROW LEVEL SECURITY;

-- Directory countries - public read
DROP POLICY IF EXISTS "Anyone can view countries" ON directory_countries;
CREATE POLICY "Anyone can view countries" ON directory_countries
    FOR SELECT USING (is_active = TRUE);

-- Gym directory - public read
DROP POLICY IF EXISTS "Anyone can view gym directory" ON gym_directory;
CREATE POLICY "Anyone can view gym directory" ON gym_directory
    FOR SELECT USING (TRUE);

-- Gym claim requests - users can see their own
DROP POLICY IF EXISTS "Users can view own claims" ON gym_claim_requests;
CREATE POLICY "Users can view own claims" ON gym_claim_requests
    FOR SELECT USING (auth.uid() = claimant_id);

DROP POLICY IF EXISTS "Users can create claims" ON gym_claim_requests;
CREATE POLICY "Users can create claims" ON gym_claim_requests
    FOR INSERT WITH CHECK (auth.uid() = claimant_id);

DROP POLICY IF EXISTS "Users can update own pending claims" ON gym_claim_requests;
CREATE POLICY "Users can update own pending claims" ON gym_claim_requests
    FOR UPDATE USING (auth.uid() = claimant_id AND status = 'pending');
