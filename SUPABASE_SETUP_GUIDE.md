# Supabase Setup Guide - Quick Start

This guide will get your Fight Station app connected to Supabase in **under 1 hour**.

## Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Organization**: Create new or select existing
   - **Name**: `fight-station`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
4. Click **"Create new project"**
5. Wait 2 minutes for project to spin up

## Step 2: Run Database Schema (10 minutes)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and run each SQL block below **in order**:

### 2.1 Core Tables

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('fighter', 'gym', 'coach')),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 2.2 Referral System (CRITICAL - DO THIS FIRST!)

```sql
-- Referral codes
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);

-- Referrals tracking
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT REFERENCES referral_codes(code),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);

-- Affiliate stats (aggregated)
CREATE TABLE affiliate_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  completed_referrals INTEGER DEFAULT 0,
  pending_referrals INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  pending_earnings_cents INTEGER DEFAULT 0,
  paid_earnings_cents INTEGER DEFAULT 0,
  fighter_referrals INTEGER DEFAULT 0,
  gym_referrals INTEGER DEFAULT 0,
  coach_referrals INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_affiliate_stats_user_id ON affiliate_stats(user_id);

-- RLS for referral tables
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Referrers can view their referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view if they were referred"
  ON referrals FOR SELECT
  USING (auth.uid() = referred_id);

CREATE POLICY "Users can view their own affiliate stats"
  ON affiliate_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_role TEXT, user_name TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  random_suffix TEXT;
  clean_name TEXT;
  final_code TEXT;
BEGIN
  prefix := CASE
    WHEN user_role = 'gym' THEN 'GYM'
    WHEN user_role = 'fighter' THEN 'FTR'
    WHEN user_role = 'coach' THEN 'CCH'
    ELSE 'USR'
  END;

  random_suffix := upper(substring(md5(random()::text) from 1 for 6));
  clean_name := upper(regexp_replace(user_name, '[^A-Za-z0-9]', '', 'g'));
  clean_name := substring(clean_name from 1 for 4);

  final_code := prefix || '-' || clean_name || '-' || random_suffix;

  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update affiliate stats
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
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

### 2.3 Additional Tables (Run after referral system)

```sql
-- Fighter profiles
CREATE TABLE fighters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  bio TEXT,
  age INTEGER,
  weight_class TEXT,
  experience_level TEXT,
  record TEXT,
  location_city TEXT,
  location_country TEXT,
  avatar_url TEXT,
  height_cm INTEGER,
  reach_cm INTEGER,
  stance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gym profiles
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  avatar_url TEXT,
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  intensity TEXT NOT NULL CHECK (intensity IN ('technical', 'moderate', 'hard')),
  weight_classes TEXT[],
  experience_levels TEXT[],
  max_participants INTEGER,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Basic policies (add more as needed)
CREATE POLICY "Fighters are viewable by everyone"
  ON fighters FOR SELECT USING (true);

CREATE POLICY "Gyms are viewable by everyone"
  ON gyms FOR SELECT USING (true);

CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT USING (true);
```

## Step 3: Configure Storage (5 minutes)

1. Go to **Storage** in Supabase dashboard
2. Click **"New Bucket"**
3. Create bucket: `avatars`
   - Name: `avatars`
   - **Make it public** ✓
   - Click Create
4. Click on `avatars` bucket, go to **Policies** tab
5. Click **"New Policy"** → **"For full customization"**
6. Add policy:
   ```sql
   -- Allow public read
   CREATE POLICY "Avatar images are publicly accessible"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'avatars');

   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload own avatar"
     ON storage.objects FOR INSERT
     WITH CHECK (
       bucket_id = 'avatars' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );
   ```

## Step 4: Get API Keys (2 minutes)

1. Go to **Settings** → **API** in Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long JWT token starting with `eyJ...`

## Step 5: Update Your App (5 minutes)

1. **Update `.env` file** in your project root:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Install Supabase client** (if not already installed):
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Restart your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npx expo start --clear
   ```

## Step 6: Test the Connection (5 minutes)

1. Open your app
2. Try to sign up with a new account
3. Check Supabase dashboard → **Authentication** → **Users**
4. You should see your new user!
5. Check **Table Editor** → **referral_codes** table
6. You should see a referral code generated for your user!

## Step 7: Enable Email Auth (Optional)

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Configure email settings:
   - **Enable email confirmations** (recommended)
   - **Secure email change** (recommended)
4. Customize email templates in **Email Templates** tab

## Verification Checklist

✅ **Project created** - Supabase dashboard accessible
✅ **Database schema** - All tables created (profiles, referral_codes, referrals, affiliate_stats, fighters, gyms, events)
✅ **RLS enabled** - Row Level Security policies applied
✅ **Storage bucket** - `avatars` bucket created and public
✅ **API keys** - Added to `.env` file
✅ **App restarted** - Server restarted with new environment variables
✅ **Test signup** - New user created successfully
✅ **Referral code generated** - Code appears in `referral_codes` table

## Troubleshooting

### "Supabase is not defined"
- Make sure you restarted the dev server after adding `.env` variables
- Check that `.env` file is in the project root (not in src/)
- Try `npx expo start --clear` to clear cache

### "No referral code generated"
- Check that the `generate_referral_code` function was created
- Try manually calling: `SELECT generate_referral_code('fighter', 'TestUser');` in SQL Editor
- Check for errors in the Supabase logs

### "Permission denied" errors
- Verify RLS policies are enabled
- Check that policies match your auth logic
- Temporarily disable RLS for testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;` (DON'T do this in production!)

## What's Next?

Now that Supabase is connected, the app will:
1. ✅ Use real authentication instead of demo mode
2. ✅ Generate referral codes on signup
3. ✅ Track who invites whom
4. ✅ Save profiles to database
5. ✅ Enable real-time features (once you add more integration)

**Next Steps:**
1. Test signup and referral code generation
2. Test referral dashboard (should show real data)
3. Complete other integrations (events, messaging) following [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)

Need help? Check the full integration guide in [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) or [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

---

## Quick Reference

```bash
# Install dependencies
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# Start dev server
npx expo start --clear

# Check if Supabase is configured
# Look for this log: "[Supabase] Connected to: https://..."
```

**Your Setup Status:**
- ✅ Supabase client code ready (`src/lib/supabase.ts`)
- ✅ Mock mode fallback implemented
- ✅ Referral context ready
- ⏳ Waiting for your Supabase credentials

**Time to full integration:** ~1 hour for referral system + 3-5 hours for complete backend

You're ready to launch! 🚀
