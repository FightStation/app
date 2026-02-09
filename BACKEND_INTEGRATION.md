# Backend Integration Tasks

This document lists all features currently using mock data that need Supabase integration.

## Current Status: 🟡 Demo Mode (Mock Data)

All features are built with UI and navigation, but use hardcoded mock data. This guide shows exactly what needs to be connected to Supabase.

---

## 1. Authentication & User Management

### Files to Update:
- `src/context/AuthContext.tsx`

### Current State:
```typescript
// DEMO MODE - Remove this in production
const DEMO_ROLE: UserRole = 'fighter';
const DEMO_USER = { /* mock user object */ };
```

### Integration Tasks:

#### Task 1.1: Replace Mock Auth with Supabase Auth
**Priority: 🔴 Critical**

Replace demo authentication with real Supabase auth:

```typescript
// src/context/AuthContext.tsx
import { supabase } from '../lib/supabase';

// Sign Up
const signUp = async (email: string, password: string, role: UserRole) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role } // Store role in user metadata
    }
  });

  if (error) throw error;

  // Create profile
  await supabase.from('profiles').insert({
    id: data.user!.id,
    role,
    email,
  });

  return data;
};

// Sign In
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Sign Out
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Listen to auth state changes
useEffect(() => {
  supabase.auth.onAuthStateChange(async (_event, session) => {
    setSession(session);

    if (session?.user) {
      // Fetch full profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(data);
    } else {
      setProfile(null);
    }
  });
}, []);
```

**Testing:**
- [ ] Sign up creates user in Supabase auth
- [ ] Profile record created in `profiles` table
- [ ] Sign in works with credentials
- [ ] Session persists across app restarts
- [ ] Sign out clears session

---

## 2. Fighter Profile Management

### Files to Update:
- `src/screens/fighter/FighterSetupScreen.tsx`
- `src/screens/fighter/FighterProfileScreen.tsx`

### Current State:
Mock data in components, no API calls

### Integration Tasks:

#### Task 2.1: Create Fighter Profile
**Priority: 🔴 Critical**

```typescript
// src/screens/fighter/FighterSetupScreen.tsx
const handleComplete = async () => {
  const { data: user } = await supabase.auth.getUser();

  const { error } = await supabase.from('fighters').insert({
    user_id: user.id,
    name: formData.name,
    nickname: formData.nickname,
    bio: formData.bio,
    age: parseInt(formData.age),
    weight_class: formData.weightClass,
    experience_level: formData.experienceLevel,
    location_city: formData.city,
    location_country: formData.country,
    height_cm: parseInt(formData.height),
    reach_cm: parseInt(formData.reach),
    stance: formData.stance,
  });

  if (error) throw error;

  // Navigate to main app
  navigation.replace('FighterTabs');
};
```

#### Task 2.2: Fetch and Display Fighter Profile
**Priority: 🟡 High**

```typescript
// src/screens/fighter/FighterProfileScreen.tsx
useEffect(() => {
  const fetchProfile = async () => {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('fighters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) setFighterData(data);
  };

  fetchProfile();
}, []);
```

#### Task 2.3: Update Fighter Profile
**Priority: 🟡 High**

```typescript
const handleSaveProfile = async (updates: Partial<Fighter>) => {
  const { data: user } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('fighters')
    .update(updates)
    .eq('user_id', user.id);

  if (error) throw error;
};
```

**Testing:**
- [ ] Profile creation on signup
- [ ] Profile data displays correctly
- [ ] Profile updates save to database
- [ ] Form validation works
- [ ] Avatar upload to Supabase Storage

---

## 3. Gym Profile Management

### Files to Update:
- `src/screens/gym/GymSetupScreen.tsx`
- `src/screens/gym/GymDashboardScreen.tsx`

### Current State:
Mock gym data, no API integration

### Integration Tasks:

#### Task 3.1: Create Gym Profile
**Priority: 🔴 Critical**

```typescript
// src/screens/gym/GymSetupScreen.tsx
const handleComplete = async () => {
  const { data: user } = await supabase.auth.getUser();

  const { error } = await supabase.from('gyms').insert({
    user_id: user.id,
    name: formData.name,
    description: formData.description,
    address: formData.address,
    city: formData.city,
    country: formData.country,
    phone: formData.phone,
    email: formData.email,
    website: formData.website,
    amenities: formData.amenities, // Array
  });

  if (error) throw error;

  navigation.replace('GymTabs');
};
```

#### Task 3.2: Fetch Gym Profile
**Priority: 🟡 High**

```typescript
// src/screens/gym/GymDashboardScreen.tsx
const [gymData, setGymData] = useState<Gym | null>(null);

useEffect(() => {
  const fetchGym = async () => {
    const { data: user } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('gyms')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setGymData(data);
  };

  fetchGym();
}, []);
```

**Testing:**
- [ ] Gym profile creation
- [ ] Gym data fetches correctly
- [ ] Amenities array saves properly
- [ ] Gym images upload to storage

---

## 4. Events/Sparring Sessions

### Files to Update:
- `src/screens/gym/CreateEventScreen.tsx`
- `src/screens/fighter/FindSparringScreen.tsx`
- `src/screens/fighter/MyEventsScreen.tsx`
- `src/screens/fighter/GymEventsScreen.tsx`
- `src/screens/shared/EventDetailScreen.tsx`

### Current State:
Mock events in `src/lib/mockData.ts`

### Integration Tasks:

#### Task 4.1: Create Sparring Event (Gym)
**Priority: 🔴 Critical**

```typescript
// src/screens/gym/CreateEventScreen.tsx
const handleCreateEvent = async () => {
  const { data: user } = await supabase.auth.getUser();

  // Get gym ID for this user
  const { data: gym } = await supabase
    .from('gyms')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { error } = await supabase.from('events').insert({
    gym_id: gym.id,
    title: formData.title,
    description: formData.description,
    event_date: formData.date,
    start_time: formData.startTime,
    end_time: formData.endTime,
    intensity: formData.intensity,
    weight_classes: formData.weightClasses,
    experience_levels: formData.experienceLevels,
    max_participants: parseInt(formData.maxParticipants),
    status: 'open',
  });

  if (error) throw error;

  // Navigate back
  navigation.goBack();
};
```

#### Task 4.2: Browse Sparring Sessions (Fighter)
**Priority: 🔴 Critical**

```typescript
// src/screens/fighter/FindSparringScreen.tsx
const [gyms, setGyms] = useState<Gym[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchGyms = async () => {
    // Fetch gyms with their upcoming events
    const { data, error } = await supabase
      .from('gyms')
      .select(`
        *,
        events (
          *
        )
      `)
      .eq('events.status', 'open')
      .gte('events.event_date', new Date().toISOString().split('T')[0])
      .order('events.event_date', { ascending: true });

    if (data) setGyms(data);
    setLoading(false);
  };

  fetchGyms();
}, []);

// Apply filters
const filteredGyms = gyms.filter(gym => {
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    if (!gym.name.toLowerCase().includes(query)) return false;
  }

  if (selectedIntensity !== 'all') {
    const hasMatchingEvent = gym.events?.some(
      event => event.intensity === selectedIntensity
    );
    if (!hasMatchingEvent) return false;
  }

  return true;
});
```

#### Task 4.3: Request to Join Event
**Priority: 🟡 High**

```typescript
// src/screens/fighter/GymEventsScreen.tsx
const handleRequestSparring = async (eventId: string) => {
  const { data: user } = await supabase.auth.getUser();

  // Get fighter ID
  const { data: fighter } = await supabase
    .from('fighters')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      fighter_id: fighter.id,
      status: 'pending',
    });

  if (error) {
    if (error.code === '23505') {
      // Already requested
      alert('You have already requested to join this event');
    } else {
      throw error;
    }
  } else {
    alert('Request sent! The gym will review your request.');
  }
};
```

#### Task 4.4: View My Events (Fighter)
**Priority: 🟡 High**

```typescript
// src/screens/fighter/MyEventsScreen.tsx
const [events, setEvents] = useState<Event[]>([]);

useEffect(() => {
  const fetchMyEvents = async () => {
    const { data: user } = await supabase.auth.getUser();

    const { data: fighter } = await supabase
      .from('fighters')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Get events where fighter is approved
    const { data } = await supabase
      .from('event_participants')
      .select(`
        *,
        events (
          *,
          gyms (*)
        )
      `)
      .eq('fighter_id', fighter.id)
      .eq('status', 'approved')
      .gte('events.event_date', new Date().toISOString().split('T')[0]);

    setEvents(data?.map(p => p.events) || []);
  };

  fetchMyEvents();
}, []);
```

#### Task 4.5: Manage Event Requests (Gym)
**Priority: 🟡 High**

```typescript
// src/screens/gym/ManageRequestsScreen.tsx (NEW SCREEN NEEDED)
const [requests, setRequests] = useState<EventParticipant[]>([]);

useEffect(() => {
  const fetchRequests = async () => {
    const { data: user } = await supabase.auth.getUser();

    const { data: gym } = await supabase
      .from('gyms')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data } = await supabase
      .from('event_participants')
      .select(`
        *,
        fighters (*),
        events (*)
      `)
      .eq('events.gym_id', gym.id)
      .eq('status', 'pending');

    setRequests(data || []);
  };

  fetchRequests();
}, []);

const handleApprove = async (requestId: string) => {
  await supabase
    .from('event_participants')
    .update({ status: 'approved' })
    .eq('id', requestId);

  // Refresh requests
  fetchRequests();
};

const handleReject = async (requestId: string) => {
  await supabase
    .from('event_participants')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  fetchRequests();
};
```

**Testing:**
- [ ] Gym can create events
- [ ] Fighters can browse events
- [ ] Filters work (location, intensity, weight)
- [ ] Request to join event
- [ ] Gym sees pending requests
- [ ] Gym can approve/reject
- [ ] Fighter sees approved events in "My Events"
- [ ] Event capacity limits work

---

## 5. Messaging System

### Files to Update:
- `src/screens/fighter/MessagesScreen.tsx`
- `src/screens/fighter/ChatScreen.tsx`

### Current State:
Mock conversations and messages

### Integration Tasks:

#### Task 5.1: Fetch Conversations
**Priority: 🟡 High**

```typescript
// src/screens/fighter/MessagesScreen.tsx
const [conversations, setConversations] = useState<Conversation[]>([]);

useEffect(() => {
  const fetchConversations = async () => {
    const { data: user } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations (
          id,
          updated_at,
          messages (
            content,
            created_at,
            sender_id
          )
        )
      `)
      .eq('user_id', user.id)
      .order('conversations.updated_at', { ascending: false });

    // Transform to conversation list with last message
    setConversations(data || []);
  };

  fetchConversations();

  // Subscribe to new messages
  const subscription = supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, fetchConversations)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

#### Task 5.2: Load Chat Messages
**Priority: 🟡 High**

```typescript
// src/screens/fighter/ChatScreen.tsx
const [messages, setMessages] = useState<Message[]>([]);

useEffect(() => {
  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  fetchMessages();

  // Real-time subscription
  const subscription = supabase
    .channel(`chat:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => {
      setMessages(prev => [...prev, payload.new as Message]);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [conversationId]);
```

#### Task 5.3: Send Message
**Priority: 🟡 High**

```typescript
// src/screens/fighter/ChatScreen.tsx
const handleSend = async () => {
  if (!messageText.trim()) return;

  const { data: user } = await supabase.auth.getUser();

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: messageText.trim(),
    status: 'sent',
  });

  if (error) throw error;

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  setMessageText('');
};
```

#### Task 5.4: Create New Conversation
**Priority: 🟢 Medium**

```typescript
// src/screens/fighter/FindSparringScreen.tsx or GymEventsScreen.tsx
const startConversation = async (otherUserId: string) => {
  const { data: user } = await supabase.auth.getUser();

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)
    .eq('conversation_id', /* subquery for other user */);

  if (existing?.length > 0) {
    // Navigate to existing conversation
    navigation.navigate('Chat', {
      conversationId: existing[0].conversation_id,
    });
  } else {
    // Create new conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    // Add participants
    await supabase.from('conversation_participants').insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: otherUserId },
    ]);

    navigation.navigate('Chat', {
      conversationId: conversation.id,
    });
  }
};
```

**Testing:**
- [ ] Conversations list loads
- [ ] Last message displays correctly
- [ ] Unread count shows
- [ ] Chat screen loads messages
- [ ] Send message works
- [ ] Real-time messages update
- [ ] New conversation creation
- [ ] Message status updates

---

## 6. Explore/Discovery

### Files to Update:
- `src/screens/fighter/ExploreScreen.tsx`

### Current State:
Mock trending gyms and featured fighters

### Integration Tasks:

#### Task 6.1: Trending Gyms
**Priority: 🟢 Medium**

```typescript
// src/screens/fighter/ExploreScreen.tsx
const [trendingGyms, setTrendingGyms] = useState<Gym[]>([]);

useEffect(() => {
  const fetchTrendingGyms = async () => {
    const { data } = await supabase
      .from('gyms')
      .select(`
        *,
        events (count)
      `)
      .order('events(count)', { ascending: false })
      .limit(5);

    setTrendingGyms(data || []);
  };

  fetchTrendingGyms();
}, []);
```

#### Task 6.2: Featured Fighters
**Priority: 🟢 Medium**

```typescript
const [featuredFighters, setFeaturedFighters] = useState<Fighter[]>([]);

useEffect(() => {
  const fetchFeaturedFighters = async () => {
    const { data } = await supabase
      .from('fighters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    setFeaturedFighters(data || []);
  };

  fetchFeaturedFighters();
}, []);
```

**Testing:**
- [ ] Trending gyms display
- [ ] Featured fighters display
- [ ] Navigation to gym/fighter profiles

---

## 7. Image Uploads

### Files to Update:
- All profile screens (Fighter, Gym, Coach)

### Integration Tasks:

#### Task 7.1: Avatar Upload
**Priority: 🟢 Medium**

```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    await uploadAvatar(result.assets[0].uri);
  }
};

const uploadAvatar = async (uri: string) => {
  const { data: user } = await supabase.auth.getUser();

  // Convert to blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const fileExt = uri.split('.').pop();
  const fileName = `${user.id}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, { upsert: true });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update profile with avatar URL
  await supabase
    .from('fighters')
    .update({ avatar_url: data.publicUrl })
    .eq('user_id', user.id);
};
```

**Testing:**
- [ ] Image picker opens
- [ ] Image uploads to Supabase Storage
- [ ] Avatar URL saves to profile
- [ ] Avatar displays in UI

---

## 8. Search & Filtering

### Files to Update:
- `src/screens/fighter/FindSparringScreen.tsx`

### Integration Tasks:

#### Task 8.1: Advanced Search
**Priority: 🟢 Medium**

```typescript
const searchGyms = async (filters: {
  query?: string;
  location?: string;
  intensity?: string;
  weightClass?: string;
}) => {
  let query = supabase
    .from('gyms')
    .select(`
      *,
      events (*)
    `);

  if (filters.query) {
    query = query.ilike('name', `%${filters.query}%`);
  }

  if (filters.location) {
    query = query.eq('city', filters.location);
  }

  if (filters.intensity) {
    query = query.eq('events.intensity', filters.intensity);
  }

  if (filters.weightClass) {
    query = query.contains('events.weight_classes', [filters.weightClass]);
  }

  const { data } = await query;
  return data;
};
```

**Testing:**
- [ ] Text search works
- [ ] Location filter works
- [ ] Intensity filter works
- [ ] Weight class filter works
- [ ] Multiple filters combine correctly

---

## 9. Affiliate/Referral System

### Files to Update:
- `src/context/ReferralContext.tsx`
- `src/screens/fighter/ReferralDashboardScreen.tsx`
- `src/screens/gym/GymReferralDashboardScreen.tsx`

### Current State:
Mock referral codes and stats

### Integration Tasks:

#### Task 9.1: Generate Referral Codes on Signup
**Priority: 🔴 Critical**

```typescript
// During profile setup (FighterSetupScreen, GymSetupScreen)
const completeProfileWithReferral = async (profileData: any, signupReferralCode?: string) => {
  const { data: user } = await supabase.auth.getUser();

  // 1. Create profile
  await supabase.from('fighters').insert({
    user_id: user.id,
    ...profileData,
  });

  // 2. Generate referral code for new user
  const { data: newCode } = await supabase.rpc('generate_referral_code', {
    user_role: 'fighter',
    user_name: profileData.name
  });

  await supabase.from('referral_codes').insert({
    user_id: user.id,
    code: newCode,
    is_active: true,
  });

  // 3. If user signed up with a referral code, create referral
  if (signupReferralCode) {
    // Find referrer
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', signupReferralCode)
      .single();

    if (referralCode) {
      await supabase.from('referrals').insert({
        referrer_id: referralCode.user_id,
        referred_id: user.id,
        referral_code: signupReferralCode,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    }
  }
};
```

#### Task 9.2: Fetch Referral Dashboard Data
**Priority: 🟡 High**

```typescript
// src/context/ReferralContext.tsx
const fetchReferralData = async () => {
  const { data: user } = await supabase.auth.getUser();

  // Get user's referral code
  const { data: code } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', user.id)
    .single();

  setReferralCode(code);

  // Get affiliate stats
  const { data: stats } = await supabase
    .from('affiliate_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  setAffiliateStats(stats);

  // Get referral list with details
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      *,
      referred_profile:profiles!referred_id (
        role,
        fighters (name),
        gyms (name)
      )
    `)
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  setReferrals(referrals);
};
```

#### Task 9.3: Share Referral Code
**Priority: 🟡 High**

```typescript
// Use React Native Share API
import { Share } from 'react-native';

const shareReferralCode = async () => {
  if (!referralCode) return;

  const message = `Join Fight Station and connect with boxing gyms and fighters!\n\nUse my referral code: ${referralCode.code}\n\nDownload: https://fightstation.app/join/${referralCode.code}`;

  try {
    await Share.share({
      message,
      title: 'Join Fight Station',
      url: `https://fightstation.app/join/${referralCode.code}`,
    });
  } catch (error) {
    console.error('Share failed:', error);
  }
};

// Use Clipboard for copy
import * as Clipboard from 'expo-clipboard';

const copyReferralCode = async () => {
  if (!referralCode) return;

  await Clipboard.setStringAsync(referralCode.code);
  alert('Referral code copied!');
};
```

#### Task 9.4: Deep Linking for Referral Codes
**Priority: 🟢 Medium**

```typescript
// app.json - Add deep link configuration
{
  "expo": {
    "scheme": "fightstation",
    "web": {
      "bundler": "metro"
    }
  }
}

// Handle deep links in App.tsx or Navigation
import * as Linking from 'expo-linking';

useEffect(() => {
  const handleDeepLink = async (event: { url: string }) => {
    const { path, queryParams } = Linking.parse(event.url);

    if (path === 'join' && queryParams?.code) {
      // Store referral code in AsyncStorage
      await AsyncStorage.setItem('signup_referral_code', queryParams.code);

      // Navigate to sign up
      navigation.navigate('SignUp', { referralCode: queryParams.code });
    }
  };

  const subscription = Linking.addEventListener('url', handleDeepLink);

  // Check if app was opened with a deep link
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink({ url });
  });

  return () => subscription.remove();
}, []);
```

#### Task 9.5: Track Revenue (Future - When Paid Features Launch)
**Priority: 🟢 Low (Future)**

```typescript
// When a subscription is purchased
const recordSubscriptionEarning = async (
  subscriberId: string,
  subscriptionAmount: number
) => {
  // Find if this user was referred
  const { data: referral } = await supabase
    .from('referrals')
    .select('referrer_id')
    .eq('referred_id', subscriberId)
    .eq('status', 'completed')
    .single();

  if (!referral) return;

  // Calculate commission (20% for gyms, 10% for fighters)
  const { data: referrer } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', referral.referrer_id)
    .single();

  const commissionRate = referrer.role === 'gym' ? 0.20 : 0.10;
  const commissionCents = Math.round(subscriptionAmount * 100 * commissionRate);

  // Create earning record
  await supabase.from('affiliate_earnings').insert({
    referrer_id: referral.referrer_id,
    referred_id: subscriberId,
    amount_cents: commissionCents,
    commission_rate: commissionRate * 100,
    source_type: 'subscription',
    status: 'pending',
  });
};

// Similar functions for merchandise, event fees, etc.
```

**Testing:**
- [ ] Referral code generated on signup
- [ ] Referral code displays in dashboard
- [ ] Copy to clipboard works
- [ ] Share functionality opens native share
- [ ] Referral list shows correctly
- [ ] Stats update when referrals complete profiles
- [ ] Deep links work (fightstation://join/CODE)

---

## Priority Summary

### 🔴 Critical (Week 1)
1. Authentication (sign up, sign in, sign out)
2. Fighter profile creation
3. Gym profile creation
4. **Referral code generation on signup**
5. Create sparring events
6. Browse sparring sessions

### 🟡 High (Week 2)
7. Request to join events
8. Approve/reject requests
9. View my events
10. Messaging system
11. Profile updates
12. **Referral dashboard data**
13. **Share/copy referral codes**

### 🟢 Medium (Week 3)
14. Explore/discovery features
15. Image uploads
16. Advanced search
17. **Referral deep linking**
18. Real-time notifications
19. Analytics

### 🔵 Future (Post-Launch)
20. **Affiliate earnings tracking**
21. **Commission calculations**
22. **Payout system**

---

## Integration Checklist

### Setup
- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Create `src/lib/supabase.ts` with client config
- [ ] Add environment variables to `.env`
- [ ] Update `app.json` with Supabase config

### Remove Mock Data
- [ ] Delete or comment out `DEMO_ROLE` in AuthContext
- [ ] Remove mock data from `src/lib/mockData.ts`
- [ ] Update all screens to use Supabase queries

### Add Error Handling
- [ ] Wrap API calls in try/catch
- [ ] Display user-friendly error messages
- [ ] Add loading states to all screens
- [ ] Handle network errors gracefully

### Add Real-time Features
- [ ] Message notifications
- [ ] Event updates
- [ ] Request notifications
- [ ] Online status

### Testing
- [ ] Test all CRUD operations
- [ ] Test real-time subscriptions
- [ ] Test with poor network
- [ ] Test concurrent users
- [ ] Load testing with many events

---

## Estimated Integration Time

- **Setup & Configuration**: 2-4 hours
- **Authentication**: 4-6 hours
- **Profile Management**: 6-8 hours
- **Events System**: 8-12 hours
- **Messaging**: 6-8 hours
- **Explore Features**: 4-6 hours
- **Image Uploads**: 3-4 hours
- **Testing & Bug Fixes**: 8-12 hours

**Total**: 40-60 hours (1-1.5 weeks full-time)

---

## Next Steps

1. **Week 1**: Set up Supabase, implement authentication and profiles
2. **Week 2**: Implement events system and messaging
3. **Week 3**: Add explore features, polish, and test
4. **Week 4**: Deploy and launch

Good luck with the integration! 🚀
