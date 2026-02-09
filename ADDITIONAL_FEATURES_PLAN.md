# Additional Features Implementation Plan

This document outlines the implementation plan for 7 major feature sets to make Fight Station a complete platform.

---

## 1. Coach Role 👨‍🏫

### Overview
Coaches can manage students, schedule sessions, track progress, and offer paid training.

### Database Schema

```sql
-- Coach profiles (extends coaches table)
ALTER TABLE coaches ADD COLUMN hourly_rate_cents INTEGER;
ALTER TABLE coaches ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE coaches ADD COLUMN availability JSONB; -- Schedule
ALTER TABLE coaches ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE coaches ADD COLUMN total_reviews INTEGER DEFAULT 0;

-- Coach-Student relationships
CREATE TABLE coach_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  student_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(coach_id, student_id)
);

-- Training sessions
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  student_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  session_type TEXT, -- 'one-on-one', 'group', 'clinic'
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  price_cents INTEGER,
  notes TEXT, -- Coach's notes after session
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session ratings
CREATE TABLE session_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);
```

### Screens to Build

1. **CoachDashboardScreen.tsx** ✅ (Already created)
   - Stats: Students, Sessions, Rating
   - Upcoming sessions
   - Student list
   - Quick actions

2. **ScheduleSessionScreen.tsx**
   - Select student(s)
   - Choose date/time
   - Set duration
   - Add notes/goals
   - Set price (if private)

3. **StudentProgressScreen.tsx**
   - Individual student details
   - Session history
   - Progress notes
   - Skill assessments
   - Training plan

4. **AllStudentsScreen.tsx**
   - List of all students
   - Filter by level, active/inactive
   - Search functionality
   - Add new student

5. **CoachProfileScreen.tsx**
   - Bio, specializations
   - Certifications
   - Hourly rate
   - Availability calendar
   - Reviews/ratings

### Key Features
- Schedule one-on-one and group sessions
- Track student progress over time
- Collect reviews and build reputation
- Set pricing for private coaching
- Manage availability calendar

---

## 2. Event Check-In System ✅

### Overview
Verify attendance at sparring events, track who actually showed up.

### Database Schema

```sql
-- Event check-ins
CREATE TABLE event_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id), -- Gym staff who checked them in
  notes TEXT, -- e.g., "Arrived late", "Left early"
  UNIQUE(event_id, fighter_id)
);

-- Add check-in fields to events
ALTER TABLE events ADD COLUMN check_in_opens_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN check_in_closes_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN require_check_in BOOLEAN DEFAULT false;

-- Event attendance stats
CREATE TABLE event_attendance_stats (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  expected_participants INTEGER DEFAULT 0,
  actual_participants INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Screens to Build

1. **EventCheckInScreen.tsx**
   - QR code scanner (for fighter QR codes)
   - Manual name search
   - List of expected participants
   - Check-in button for each
   - Real-time attendance count

2. **MyEventCheckInScreen.tsx** (Fighter view)
   - Generate personal QR code
   - "Check In Now" button
   - Check-in confirmation
   - Event details

3. **AttendanceHistoryScreen.tsx**
   - Fighter's attendance record
   - No-show count
   - Reliability score
   - Event history

### Implementation

```typescript
// Gym checks in a fighter
const checkInFighter = async (eventId: string, fighterId: string) => {
  const { data: user } = await supabase.auth.getUser();

  await supabase.from('event_checkins').insert({
    event_id: eventId,
    fighter_id: fighterId,
    checked_in_by: user.id,
  });

  // Update stats
  await supabase.rpc('increment_event_attendance', { event_id: eventId });
};

// Generate QR code for fighter
import QRCode from 'react-native-qrcode-svg';

const FighterQRCode = ({ eventId, fighterId }: Props) => {
  const qrData = JSON.stringify({ eventId, fighterId, timestamp: Date.now() });

  return <QRCode value={qrData} size={200} />;
};

// Scan QR code
import { BarCodeScanner } from 'expo-barcode-scanner';

const scanQRCode = async () => {
  const { status } = await BarCodeScanner.requestPermissionsAsync();
  if (status !== 'granted') return;

  // Scanner implementation...
};
```

### Key Features
- QR code generation for fighters
- QR scanner for gyms
- Manual check-in option
- Real-time attendance tracking
- No-show tracking
- Attendance history and reliability scores

---

## 3. Fighter Stats Tracking 📊

### Overview
Comprehensive training metrics, progress tracking, and performance analytics.

### Database Schema

```sql
-- Training logs
CREATE TABLE training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  training_type TEXT, -- 'sparring', 'bag', 'pad', 'conditioning', 'technique'
  intensity TEXT CHECK (intensity IN ('light', 'moderate', 'hard')),
  notes TEXT,
  calories_burned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills assessment
CREATE TABLE fighter_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL, -- 'Jab', 'Footwork', 'Defense', etc.
  skill_level INTEGER CHECK (skill_level BETWEEN 1 AND 10),
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessed_by UUID REFERENCES profiles(id), -- Coach who assessed
  notes TEXT
);

-- Performance metrics
CREATE TABLE fighter_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  resting_heart_rate INTEGER,
  vo2_max DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements/Badges
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT, -- 'sessions_count', 'sparring_hours', 'streak_days'
  requirement_value INTEGER
);

CREATE TABLE fighter_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fighter_id, achievement_id)
);
```

### Screens to Build

1. **StatsTrackerDashboardScreen.tsx**
   - Weekly training hours
   - Training type breakdown (pie chart)
   - Streak counter
   - Recent achievements
   - Progress graphs

2. **LogTrainingScreen.tsx**
   - Quick log buttons (Sparring, Bag Work, etc.)
   - Duration input
   - Intensity slider
   - Notes field
   - Auto-log from checked-in events

3. **SkillsAssessmentScreen.tsx**
   - Radar chart of skills
   - Skill history over time
   - Coach assessments
   - Self-assessments

4. **MetricsScreen.tsx**
   - Weight tracking graph
   - Body composition
   - Performance metrics
   - Goal setting

5. **AchievementsScreen.tsx**
   - Earned badges
   - Progress toward next badges
   - Leaderboard (optional)

### Key Features
- Automatic logging from check-ins
- Manual training log entry
- Skills radar chart
- Progress graphs and analytics
- Achievement system
- Training streaks
- Performance metrics tracking
- Goal setting and tracking

---

## 4. Push Notifications 🔔

### Overview
Real-time notifications for messages, event updates, and social interactions.

### Setup

```bash
# Install Expo Notifications
npx expo install expo-notifications expo-device expo-constants
```

### Database Schema

```sql
-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  messages_enabled BOOLEAN DEFAULT true,
  event_updates_enabled BOOLEAN DEFAULT true,
  social_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT false,
  push_token TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification history
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'message', 'event_approved', 'event_reminder', 'social_like', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional payload
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

### Implementation

```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save to Supabase
    const { data: user } = await supabase.auth.getUser();
    await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, push_token: token });
  }

  return token;
}

// Send notification (backend function)
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  // Get user's push token
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('push_token')
    .eq('user_id', userId)
    .single();

  if (!prefs?.push_token) return;

  // Send via Expo Push API
  const message = {
    to: prefs.push_token,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  // Log to database
  await supabase.from('notifications').insert({
    user_id: userId,
    type: data?.type || 'general',
    title,
    body,
    data,
  });
}
```

### Notification Types

1. **Messages**
   - New message received
   - New conversation started

2. **Events**
   - Event request approved/rejected
   - Event reminder (24h before)
   - Event cancelled
   - Event updated

3. **Social**
   - New follower
   - Someone liked your post
   - Comment on your post
   - Tagged in a post

4. **Referrals**
   - Someone used your code
   - Referral completed profile
   - Earnings milestone reached

5. **Training**
   - Session scheduled
   - Session reminder (1h before)
   - New skill assessment from coach

### Screens to Build

1. **NotificationsScreen.tsx**
   - List of all notifications
   - Unread count badge
   - Mark as read
   - Clear all
   - Filter by type

2. **NotificationSettingsScreen.tsx**
   - Toggle each notification type
   - Quiet hours
   - Notification sound

---

## 5. Admin Dashboard 👑

### Overview
Platform moderation, analytics, and management tools.

### Database Schema

```sql
-- Admin roles
CREATE TABLE admin_roles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'moderator' CHECK (role IN ('super_admin', 'moderator', 'support')),
  permissions JSONB, -- Specific permissions
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id)
);

-- Moderation actions
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  target_user_id UUID REFERENCES profiles(id),
  action TEXT, -- 'warn', 'suspend', 'ban', 'delete_content'
  reason TEXT NOT NULL,
  duration_hours INTEGER, -- For temporary suspensions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reported content
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  content_type TEXT, -- 'profile', 'message', 'post', 'comment'
  content_id UUID,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Screens to Build

1. **AdminDashboardScreen.tsx**
   - Platform stats (users, events, messages)
   - Growth charts
   - Active users today
   - Pending reports count
   - Recent signups

2. **ReportsScreen.tsx**
   - List of pending reports
   - Review report details
   - Take action (warn, suspend, ban)
   - Dismiss report

3. **UsersManagementScreen.tsx**
   - Search users
   - View user details
   - Suspend/ban users
   - View user activity
   - Send direct message

4. **AnalyticsScreen.tsx**
   - User growth chart
   - Engagement metrics
   - Top gyms by referrals
   - Top fighters by activity
   - Event participation rates

5. **ContentModerationScreen.tsx**
   - Flagged content
   - Recent posts/comments
   - Delete content
   - Warn users

### Key Features
- User management (suspend, ban, warn)
- Content moderation
- Report review system
- Platform analytics
- Revenue tracking (future)
- User search and filtering

---

## 6. Social Features 🤝

### Overview
Follow system, likes, comments, activity feed, and social engagement.

### Database Schema

```sql
-- Follow relationships
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Activity posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of image/video URLs
  post_type TEXT DEFAULT 'status', -- 'status', 'achievement', 'training', 'media'
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id), -- For replies
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment likes
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Activity feed (computed view)
CREATE VIEW activity_feed AS
SELECT
  p.id,
  p.user_id,
  p.content,
  p.created_at,
  u.name as user_name,
  p.likes_count,
  p.comments_count
FROM posts p
JOIN profiles u ON p.user_id = u.id
WHERE p.visibility = 'public'
ORDER BY p.created_at DESC;
```

### Screens to Build

1. **SocialFeedScreen.tsx**
   - Activity feed from followed users
   - Like/comment buttons
   - Infinite scroll
   - Pull to refresh
   - "Following" and "Discover" tabs

2. **CreatePostScreen.tsx**
   - Text input
   - Add photos/videos
   - Tag location
   - Tag users
   - Set visibility
   - Post types (achievement, training log, etc.)

3. **PostDetailScreen.tsx**
   - Full post view
   - Comments list
   - Reply to comments
   - Like button
   - Share button

4. **UserProfilePublicScreen.tsx**
   - User's posts
   - Follow/Unfollow button
   - Follower/Following counts
   - Stats preview
   - Message button

5. **FollowersScreen.tsx**
   - List of followers
   - List of following
   - Mutual followers
   - Follow/unfollow actions

6. **DiscoverScreen.tsx** (Enhanced existing Explore)
   - Suggested users to follow
   - Trending posts
   - Popular gyms
   - Featured fighters

### Key Features
- Follow/unfollow users
- Activity feed (Following + Discover)
- Create posts with text and media
- Like posts and comments
- Comment and reply
- Tag users in posts
- Share posts
- Privacy controls (public/followers/private)
- Suggested users algorithm

---

## 7. Media Sharing (Photos/Videos) 📸

### Overview
Upload training videos, fight footage, and photos with advanced features.

### Setup

```bash
# Install dependencies
npx expo install expo-image-picker expo-av expo-media-library
```

### Database Schema

```sql
-- Media files
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_type TEXT CHECK (file_type IN ('image', 'video')),
  file_size_bytes BIGINT,
  duration_seconds INTEGER, -- For videos
  width INTEGER,
  height INTEGER,
  caption TEXT,
  tags TEXT[], -- Searchable tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media in posts
ALTER TABLE posts ADD COLUMN media_ids UUID[];

-- Video processing status
CREATE TABLE video_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  thumbnail_generated BOOLEAN DEFAULT false,
  compressed_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### Implementation

```typescript
// Pick image or video
import * as ImagePicker from 'expo-image-picker';

const pickMedia = async (type: 'image' | 'video') => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions!');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: type === 'image'
      ? ImagePicker.MediaTypeOptions.Images
      : ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    aspect: type === 'image' ? [4, 3] : undefined,
    quality: 0.8,
    videoMaxDuration: 60, // 60 seconds max
  });

  if (!result.canceled) {
    await uploadMedia(result.assets[0]);
  }
};

// Upload to Supabase Storage
const uploadMedia = async (asset: ImagePicker.ImagePickerAsset) => {
  const { data: user } = await supabase.auth.getUser();

  // Convert to blob
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  // Generate unique filename
  const fileExt = asset.uri.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  const filePath = `media/${fileName}`;

  // Upload
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, blob, {
      contentType: asset.type === 'image' ? 'image/jpeg' : 'video/mp4',
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  // Create media record
  await supabase.from('media').insert({
    user_id: user.id,
    file_url: data.publicUrl,
    file_type: asset.type,
    width: asset.width,
    height: asset.height,
  });

  return data.publicUrl;
};

// Video player component
import { Video } from 'expo-av';

const VideoPlayer = ({ uri }: { uri: string }) => {
  const videoRef = React.useRef<Video>(null);

  return (
    <Video
      ref={videoRef}
      source={{ uri }}
      style={styles.video}
      useNativeControls
      resizeMode="contain"
      isLooping
    />
  );
};
```

### Screens to Build

1. **MediaGalleryScreen.tsx**
   - Grid of user's photos/videos
   - Filter by type
   - Select multiple
   - Delete media
   - Share options

2. **UploadMediaScreen.tsx**
   - Camera button
   - Gallery picker
   - Multiple selection
   - Add caption
   - Add tags
   - Upload progress

3. **VideoEditorScreen.tsx**
   - Trim video
   - Add text overlay
   - Apply filters
   - Adjust speed
   - Add music (optional)

4. **MediaViewerScreen.tsx**
   - Full-screen image viewer
   - Video player with controls
   - Swipe between media
   - Like/comment
   - Share options

### Key Features
- Upload photos and videos
- Camera integration
- Video trimming and editing
- Thumbnail generation
- Progress indicators
- Gallery view
- Full-screen viewer
- Video compression
- Multiple file uploads
- Media tagging

---

## Implementation Priority

### Phase 1: Core Extensions (Week 4-5)
1. ✅ **Coach Role** - Dashboard done, add remaining screens
2. ✅ **Event Check-In** - Essential for verifying attendance
3. ✅ **Push Notifications** - Critical for engagement

### Phase 2: Engagement (Week 6-7)
4. **Social Features** - Drives platform stickiness
5. **Media Sharing** - User-generated content

### Phase 3: Advanced (Week 8-9)
6. **Fighter Stats Tracking** - Power users feature
7. **Admin Dashboard** - Platform management

---

## Estimated Implementation Time

| Feature | Time Estimate | Priority |
|---------|---------------|----------|
| Coach Role (complete) | 20-25 hours | High |
| Event Check-In | 8-12 hours | High |
| Fighter Stats Tracking | 15-20 hours | Medium |
| Push Notifications | 8-10 hours | High |
| Admin Dashboard | 12-16 hours | Medium |
| Social Features | 25-30 hours | High |
| Media Sharing | 15-20 hours | Medium |

**Total**: 103-133 hours (3-4 weeks full-time)

---

## Next Steps

1. Review this plan
2. Prioritize features based on your launch strategy
3. I can implement any of these features in detail
4. Or focus on backend integration for existing features first

Let me know which features you'd like me to build out next!
