# Affiliate/Referral System Design

## Overview

A complete affiliate system that tracks user invitations and prepares for future monetization through:
- Paid subscriptions
- Merchandise sales
- Premium features
- Event fees

## Database Schema

### 1. Referral Codes Table

```sql
-- Unique referral codes for each user
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  code TEXT UNIQUE NOT NULL, -- e.g., "GYM-ELITE-X7K9"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Index for fast code lookups
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);

-- Generate unique codes automatically
CREATE OR REPLACE FUNCTION generate_referral_code(user_role TEXT, user_name TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  random_suffix TEXT;
  final_code TEXT;
BEGIN
  -- Set prefix based on role
  prefix := CASE
    WHEN user_role = 'gym' THEN 'GYM'
    WHEN user_role = 'fighter' THEN 'FTR'
    WHEN user_role = 'coach' THEN 'CCH'
    ELSE 'USR'
  END;

  -- Generate random suffix
  random_suffix := upper(substring(md5(random()::text) from 1 for 6));

  -- Clean user name (first 4 chars, uppercase, alphanumeric only)
  user_name := upper(regexp_replace(user_name, '[^A-Za-z0-9]', '', 'g'));
  user_name := substring(user_name from 1 for 4);

  -- Combine: GYM-ELIT-X7K9M2
  final_code := prefix || '-' || user_name || '-' || random_suffix;

  RETURN final_code;
END;
$$ LANGUAGE plpgsql;
```

### 2. Referrals Table

```sql
-- Track who invited whom
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who sent invite
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Who signed up
  referral_code TEXT REFERENCES referral_codes(code),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE, -- When referred user completed profile
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate referrals
  UNIQUE(referred_id)
);

-- Indexes for queries
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
```

### 3. Affiliate Stats Table (Aggregated)

```sql
-- Cached stats for performance
CREATE TABLE affiliate_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  completed_referrals INTEGER DEFAULT 0,
  pending_referrals INTEGER DEFAULT 0,

  -- Future revenue tracking (initially 0)
  total_earnings_cents INTEGER DEFAULT 0, -- In cents to avoid float issues
  pending_earnings_cents INTEGER DEFAULT 0,
  paid_earnings_cents INTEGER DEFAULT 0,

  -- Breakdown by type
  fighter_referrals INTEGER DEFAULT 0,
  gym_referrals INTEGER DEFAULT 0,
  coach_referrals INTEGER DEFAULT 0,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_affiliate_stats_user_id ON affiliate_stats(user_id);

-- Auto-update function
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats for referrer
  INSERT INTO affiliate_stats (user_id, total_referrals, completed_referrals, pending_referrals)
  VALUES (
    NEW.referrer_id,
    1,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_referrals = affiliate_stats.total_referrals + 1,
    completed_referrals = affiliate_stats.completed_referrals +
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    pending_referrals = affiliate_stats.pending_referrals +
      CASE WHEN NEW.status = 'pending' THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_affiliate_stats
AFTER INSERT OR UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_stats();
```

### 4. Affiliate Earnings Table (Future)

```sql
-- Track individual earning events (for future paid features)
CREATE TABLE affiliate_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Earning details
  amount_cents INTEGER NOT NULL, -- Amount in cents
  commission_rate DECIMAL(5,2), -- e.g., 10.50 for 10.5%

  -- Source of earning
  source_type TEXT CHECK (source_type IN (
    'subscription',
    'merchandise',
    'event_fee',
    'premium_feature',
    'one_time_bonus'
  )),
  source_id UUID, -- ID of subscription/order/etc

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),

  -- Payout tracking
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payout_id UUID, -- Link to payout batch

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata (JSON for flexibility)
  metadata JSONB
);

CREATE INDEX idx_earnings_referrer_id ON affiliate_earnings(referrer_id);
CREATE INDEX idx_earnings_status ON affiliate_earnings(status);
CREATE INDEX idx_earnings_source ON affiliate_earnings(source_type, source_id);
```

### 5. Payout Batches Table (Future)

```sql
-- Track payout batches
CREATE TABLE payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount_cents INTEGER NOT NULL,
  payment_method TEXT, -- 'stripe', 'paypal', 'bank_transfer'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Link earnings to payouts
CREATE TABLE payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_batch_id UUID REFERENCES payout_batches(id) ON DELETE CASCADE,
  earning_id UUID REFERENCES affiliate_earnings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Commission Structure (Future Implementation)

### Gym → Fighter Referral
- **Subscription**: 20% recurring commission for 12 months
- **Merchandise**: 15% commission per sale
- **Premium Features**: 25% one-time commission

### Fighter → Fighter Referral
- **Subscription**: 10% recurring commission for 6 months
- **Merchandise**: 10% commission per sale
- **Sign-up Bonus**: $5 when referred user completes profile

### Special Bonuses
- **Milestone Bonuses**:
  - 10 referrals: $50 bonus
  - 50 referrals: $250 bonus
  - 100 referrals: $500 bonus

## Row Level Security Policies

```sql
-- RLS for referral codes
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view their referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view if they were referred"
  ON referrals FOR SELECT
  USING (auth.uid() = referred_id);

-- RLS for affiliate stats
ALTER TABLE affiliate_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate stats"
  ON affiliate_stats FOR SELECT
  USING (auth.uid() = user_id);

-- RLS for affiliate earnings
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earnings"
  ON affiliate_earnings FOR SELECT
  USING (auth.uid() = referrer_id);
```

## Implementation Flow

### 1. User Sign Up with Referral Code

```typescript
// During sign up
const signUpWithReferral = async (
  email: string,
  password: string,
  role: UserRole,
  referralCode?: string
) => {
  // 1. Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } }
  });

  // 2. Create profile
  await supabase.from('profiles').insert({
    id: data.user!.id,
    role,
    email,
  });

  // 3. Generate referral code for new user
  const newCode = await generateReferralCode(role, email);
  await supabase.from('referral_codes').insert({
    user_id: data.user!.id,
    code: newCode,
  });

  // 4. If signed up with referral code, create referral
  if (referralCode) {
    await supabase.from('referrals').insert({
      referral_code: referralCode,
      referred_id: data.user!.id,
      status: 'pending', // Will be 'completed' after profile setup
    });
  }

  return data;
};
```

### 2. Complete Profile (Activate Referral)

```typescript
// After user completes profile setup
const completeProfile = async (profileData: any) => {
  const { data: user } = await supabase.auth.getUser();

  // 1. Update profile
  await supabase.from('fighters').insert({
    user_id: user.id,
    ...profileData,
  });

  // 2. Mark referral as completed
  await supabase
    .from('referrals')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('referred_id', user.id)
    .eq('status', 'pending');
};
```

### 3. Fetch Referral Stats

```typescript
const fetchAffiliateStats = async () => {
  const { data: user } = await supabase.auth.getUser();

  // Get aggregated stats
  const { data: stats } = await supabase
    .from('affiliate_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get detailed referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      *,
      referred:profiles!referred_id (
        role,
        fighters (*),
        gyms (*)
      )
    `)
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  return { stats, referrals };
};
```

## Mobile App Integration

### Features to Build:

1. **Referral Code Display**
   - Show user's unique code in profile
   - Copy to clipboard functionality
   - Share via native share sheet

2. **Invite Friends**
   - Pre-filled invite message
   - Deep links to app with referral code
   - Share to SMS, WhatsApp, Email

3. **Referral Dashboard**
   - Total invites (pending/completed)
   - List of referred users
   - Future earnings preview (when paid features launch)

4. **In-App Incentives**
   - "Invite friends" prompts
   - Progress toward milestone bonuses
   - Notifications when someone uses your code

## Benefits by User Type

### Gyms
- **Primary Goal**: Bring their fighters onto the platform
- **Incentives**:
  - Track which fighters they referred
  - Future: Earn from fighter subscriptions and merch
  - Build their community on the platform
- **Use Case**: "Sign up your gym and invite all your fighters. When they purchase premium features or merchandise, you earn a commission."

### Fighters
- **Primary Goal**: Invite training partners
- **Incentives**:
  - Future: Earn from friend subscriptions
  - Build network on platform
  - Unlock badges/achievements
- **Use Case**: "Invite your training partners and earn rewards when they join premium."

### Coaches
- **Primary Goal**: Bring students and connect with gyms
- **Incentives**: Same as fighters, potential for higher commissions

## Future Monetization Integration

### When Ready to Launch Paid Features:

1. **Enable Commission Tracking**
   ```typescript
   // On subscription purchase
   const recordAffiliateEarning = async (
     subscriberId: string,
     amount: number,
     commissionRate: number
   ) => {
     // Find referrer
     const { data: referral } = await supabase
       .from('referrals')
       .select('referrer_id')
       .eq('referred_id', subscriberId)
       .single();

     if (referral) {
       // Create earning record
       await supabase.from('affiliate_earnings').insert({
         referrer_id: referral.referrer_id,
         referred_id: subscriberId,
         amount_cents: Math.round(amount * commissionRate),
         commission_rate: commissionRate * 100,
         source_type: 'subscription',
         status: 'pending',
       });
     }
   };
   ```

2. **Earnings Dashboard**
   - Show pending/approved/paid earnings
   - Payout history
   - Payment method setup

3. **Payout System**
   - Stripe Connect integration
   - PayPal integration
   - Minimum payout threshold ($50)
   - Monthly payout schedule

## Analytics & Reporting

### Track:
- Conversion rate (invited → signed up)
- Completion rate (signed up → completed profile)
- Most successful referrers
- Referral source (gym vs fighter vs coach)
- Time to conversion
- Lifetime value of referred users

### Admin Dashboard (Future):
- Top referrers leaderboard
- Commission payout reports
- Referral fraud detection
- Commission adjustment tools

## Implementation Priority

### Phase 1 (Now): Core Infrastructure
- ✅ Database schema
- ✅ Referral code generation
- ✅ Referral tracking
- ✅ Basic stats display

### Phase 2: UI Integration
- Referral dashboard screens
- Invite functionality
- Share features
- Progress tracking

### Phase 3: Future Revenue
- Paid subscriptions integration
- Merchandise store integration
- Commission calculation
- Payout system

---

This system is designed to scale from a simple invite tracking system to a full revenue-sharing platform as you add monetization features.
