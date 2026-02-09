# Fight Station - Deployment & Testing Guide

This guide covers everything needed to deploy and test the Fight Station app in production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup (Supabase)](#backend-setup-supabase)
3. [Environment Configuration](#environment-configuration)
4. [Testing Guide](#testing-guide)
5. [Deployment Options](#deployment-options)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### Required Accounts
- **Supabase Account**: [supabase.com](https://supabase.com) - For backend database and auth
- **Expo Account**: [expo.dev](https://expo.dev) - For building and deploying
- **Apple Developer** ($99/year): For iOS App Store deployment
- **Google Play Console** ($25 one-time): For Android Play Store deployment

### Development Tools
- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

---

## Backend Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: fight-station
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### 2. Database Schema

Create the following tables in Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('fighter', 'gym', 'coach')),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  record TEXT, -- Format: "W-L-D"
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
  amenities TEXT[], -- Array of amenities
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coach profiles
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  specializations TEXT[],
  years_experience INTEGER,
  certifications TEXT[],
  gym_id UUID REFERENCES gyms(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sparring events
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

-- Event participants
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, fighter_id)
);

-- Messages/Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fighters_user_id ON fighters(user_id);
CREATE INDEX idx_gyms_user_id ON gyms(user_id);
CREATE INDEX idx_coaches_user_id ON coaches(user_id);
CREATE INDEX idx_events_gym_id ON events(gym_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_fighter_id ON event_participants(fighter_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Fighters: Public read, owner write
CREATE POLICY "Fighters are viewable by everyone"
  ON fighters FOR SELECT
  USING (true);

CREATE POLICY "Users can update own fighter profile"
  ON fighters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fighter profile"
  ON fighters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Gyms: Public read, owner write
CREATE POLICY "Gyms are viewable by everyone"
  ON gyms FOR SELECT
  USING (true);

CREATE POLICY "Users can update own gym profile"
  ON gyms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gym profile"
  ON gyms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Events: Public read, gym owner write
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Gym owners can manage their events"
  ON events FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM gyms WHERE id = gym_id
    )
  );

-- Event participants: Public read for event participants, fighters can manage their own
CREATE POLICY "Event participants viewable by event members"
  ON event_participants FOR SELECT
  USING (true);

CREATE POLICY "Fighters can register for events"
  ON event_participants FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM fighters WHERE id = fighter_id
    )
  );

CREATE POLICY "Gym owners can manage event participants"
  ON event_participants FOR ALL
  USING (
    auth.uid() IN (
      SELECT g.user_id FROM gyms g
      JOIN events e ON e.gym_id = g.id
      WHERE e.id = event_id
    )
  );

-- Messages: Users can only see messages in their conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = id
    )
  );

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
    )
  );
```

### 3. Storage Buckets

Create storage buckets for user uploads:

1. Go to **Storage** in Supabase dashboard
2. Create bucket: `avatars` (public)
3. Create bucket: `gym-images` (public)

Set bucket policies:

```sql
-- Allow public read access
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Similar policies for gym-images bucket
CREATE POLICY "Gym images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gym-images');

CREATE POLICY "Gym owners can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gym-images');
```

### 4. Authentication Setup

1. Go to **Authentication > Providers** in Supabase
2. Enable **Email** provider
3. Optional: Enable **Google**, **Apple** social logins

Configure email templates:
- Go to **Authentication > Email Templates**
- Customize confirmation and password reset emails

---

## Environment Configuration

### 1. Get Supabase Credentials

From your Supabase project dashboard:
1. Go to **Settings > API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 2. Create Environment File

Create `.env` in project root:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# App Config
EXPO_PUBLIC_APP_ENV=production
```

### 3. Update Code to Use Supabase

Replace mock data with Supabase client calls. Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Install dependencies:
```bash
npm install @supabase/supabase-js
```

---

## Testing Guide

### Local Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npx expo start
   ```

3. **Test on devices:**
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w`

### Testing Checklist

#### Authentication Flow
- [ ] Sign up with email/password
- [ ] Email verification works
- [ ] Login with existing account
- [ ] Password reset flow
- [ ] Sign out functionality

#### Fighter Features
- [ ] Complete fighter profile setup
- [ ] Browse gyms and sparring sessions
- [ ] Filter by location, intensity, weight
- [ ] Request to join sparring session
- [ ] View "My Events" with upcoming sessions
- [ ] Explore gyms and fighters
- [ ] Send/receive messages
- [ ] View fighter profile

#### Gym Features
- [ ] Complete gym profile setup
- [ ] Create sparring event with all details
- [ ] View pending fighter requests
- [ ] Approve/reject fighter requests
- [ ] View and manage all events
- [ ] Message fighters

#### General
- [ ] Navigation works smoothly
- [ ] Images load properly
- [ ] Forms validate correctly
- [ ] Error messages are clear
- [ ] Loading states display
- [ ] Responsive on different screen sizes
- [ ] Dark theme displays correctly
- [ ] Network errors handled gracefully

---

## Deployment Options

### Option 1: Expo Application Services (EAS) - Recommended

EAS Build handles the entire build and submission process.

#### Setup EAS

1. **Login to Expo:**
   ```bash
   eas login
   ```

2. **Configure project:**
   ```bash
   eas build:configure
   ```

3. **Create `eas.json`** (generated automatically, customize if needed):
   ```json
   {
     "cli": {
       "version": ">= 7.0.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "ios": {
           "simulator": true
         }
       },
       "production": {
         "env": {
           "EXPO_PUBLIC_APP_ENV": "production"
         }
       }
     },
     "submit": {
       "production": {
         "ios": {
           "appleId": "your-apple-id@email.com",
           "ascAppId": "1234567890",
           "appleTeamId": "ABCD123456"
         },
         "android": {
           "serviceAccountKeyPath": "./google-service-account.json",
           "track": "production"
         }
       }
     }
   }
   ```

#### Build for iOS

1. **Enroll in Apple Developer Program** ($99/year)
2. **Create App Store Connect app**
3. **Build:**
   ```bash
   eas build --platform ios --profile production
   ```
4. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

#### Build for Android

1. **Create Google Play Console account** ($25 one-time)
2. **Create app in Play Console**
3. **Build:**
   ```bash
   eas build --platform android --profile production
   ```
4. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

### Option 2: Classic Build (Deprecated, Not Recommended)

```bash
expo build:ios
expo build:android
```

### Option 3: Web Deployment

1. **Build web version:**
   ```bash
   npx expo export:web
   ```

2. **Deploy to hosting:**
   - **Vercel**: `vercel deploy web-build`
   - **Netlify**: Drag `web-build` folder to Netlify
   - **Firebase Hosting**: `firebase deploy`

---

## Post-Deployment Checklist

### App Store Submission (iOS)

- [ ] App icon (1024x1024px)
- [ ] Screenshots for all device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating questionnaire
- [ ] App review information

### Play Store Submission (Android)

- [ ] Feature graphic (1024x500px)
- [ ] Icon (512x512px)
- [ ] Screenshots for phone and tablet
- [ ] App description (short and long)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target age group

### Backend Configuration

- [ ] Supabase project running
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Storage buckets configured
- [ ] Email templates customized
- [ ] Environment variables set
- [ ] Test user accounts created

### Monitoring & Analytics

Consider adding:
- **Sentry**: Error tracking and monitoring
- **PostHog** or **Mixpanel**: User analytics
- **Firebase Analytics**: Mobile app analytics

```bash
npm install @sentry/react-native
npx @sentry/wizard -s -i reactNative
```

### Security Checklist

- [ ] API keys stored in environment variables
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] HTTPS only for all API calls
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Supabase handles this)
- [ ] XSS prevention (React Native handles this)
- [ ] Authentication tokens secured
- [ ] Password requirements enforced

---

## Maintenance & Updates

### Over-the-Air (OTA) Updates

Expo supports OTA updates for JavaScript changes:

```bash
eas update --branch production --message "Bug fixes"
```

### App Updates

For native changes (dependencies, app.json):
1. Increment version in `app.json`
2. Build new version: `eas build`
3. Submit to stores: `eas submit`

### Database Migrations

Use Supabase migrations for schema changes:
1. Create migration in Supabase dashboard
2. Test in staging environment
3. Apply to production
4. Update app code if needed

---

## Troubleshooting

### Common Issues

**Build fails:**
- Check `eas.json` configuration
- Verify all dependencies are compatible
- Clear cache: `eas build --clear-cache`

**Supabase connection fails:**
- Verify environment variables are set
- Check Supabase project is active
- Confirm API keys are correct

**App crashes on startup:**
- Check logs: `npx react-native log-ios` or `npx react-native log-android`
- Verify all native dependencies are linked
- Clear app data and reinstall

**Images not loading:**
- Check Supabase storage bucket policies
- Verify image URLs are correct
- Confirm CORS is configured in Supabase

---

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev
- **Supabase Documentation**: https://supabase.com/docs
- **React Native Documentation**: https://reactnavigation.org
- **Fight Station Support**: [Your support email/URL]

---

## Next Steps

1. Complete backend setup in Supabase
2. Replace mock data with API calls
3. Test all features end-to-end
4. Submit to app stores
5. Monitor user feedback
6. Iterate and improve

Good luck with your launch! 🥊
