# Enhanced Sparring Sessions System - In Progress

## 🎯 Goal

Create a comprehensive sparring session discovery and booking system with:
- **Location-based search** - Find events near you
- **Advanced filters** - Filter by type, intensity, weight class, distance
- **Gym affiliation** - Fighters get notified about home gym events
- **Coach event creation** - Coaches can create events for their gym
- **Event reviews** - Fighters can review sessions after attending
- **Smart recommendations** - AI-powered event matching

---

## ✅ Completed So Far

### 1. **Event Discovery Service** ✅
File: [src/services/events.ts](src/services/events.ts)

**Features:**
- Location-based event search with distance calculation
- Advanced filtering (type, intensity, weight class, experience, distance)
- Recommended events based on fighter profile
- Nearby events within specified radius
- Request to join / cancel request functionality
- Get user's approved and pending events

**Key Functions:**
```typescript
searchEvents(filters, userLocation, fighterId) //

 Advanced search
getNearbyEvents(maxDistance, fighterId) // Find events near user
getRecommendedEvents(fighter) // Smart recommendations
requestToJoinEvent(eventId, fighterId) // Join an event
```

### 2. **Enhanced Event Browse Screen** ✅
File: [src/screens/fighter/EnhancedEventBrowseScreen.tsx](src/screens/fighter/EnhancedEventBrowseScreen.tsx)

**Features:**
- Three view modes: "For You", "Nearby", "All"
- Advanced filter modal (event type, intensity, distance)
- Distance badges showing km from user
- Event status badges (Full, Requested, Approved)
- Pull-to-refresh
- Empty states with helpful messages

### 3. **Database Schema** ✅
File: [SPARRING_SESSIONS_ENHANCED.sql](SPARRING_SESSIONS_ENHANCED.sql)

**Added:**
- Gym affiliation for fighters (`home_gym_id`)
- Location coordinates for gyms (`latitude`, `longitude`)
- Coach event creation support
- Event reviews table
- Event attendance tracking
- Notification triggers
- Helper functions and views

---

## 🚧 Still To Do

### 4. **Gym Affiliation UI** - NEXT
- Add gym selection to fighter profile screen
- Show affiliated gym in fighter dashboard
- "My Gym Events" section

### 5. **Coach Event Creation** - NEXT
- Create event form for coaches
- Coach permissions and validation
- Recurring event support

### 6. **Event Notifications**
- Push notifications for new events at home gym
- Notifications for nearby events matching profile
- Event reminder notifications

### 7. **Event Reviews System**
- Post-event review screen
- Rating categories (organization, facility, coaching)
- Review display on event detail screen
- Average ratings in event cards

---

## 📋 How It Works

### For Fighters:

1. **Discovery**
   - Open "Find Events" screen
   - Choose view: "For You" (recommended), "Nearby", or "All"
   - Apply filters: event type, intensity, distance

2. **Join Event**
   - Tap event card to view details
   - Tap "Request to Join"
   - Wait for gym approval
   - Get notified when approved

3. **After Event**
   - Attend the event
   - Leave a review
   - View stats and history

### For Gyms:

1. **Create Event**
   - Fill in event details
   - Set max participants, weight classes, experience levels
   - Publish event

2. **Manage Requests**
   - Review fighter requests
   - Approve/reject based on criteria
   - Event auto-fills with approved fighters

3. **Track Attendance**
   - Check fighters in/out
   - Mark no-shows
   - View attendance history

### For Coaches:

1. **Create Events for Gym**
   - Same as gym owners
   - Events created on behalf of gym

2. **Find Sparring Partners**
   - Browse fighters
   - Invite specific fighters to events

---

## 🗄️ Database Schema

### New/Updated Tables

**fighters** - Added columns:
```sql
home_gym_id UUID          -- Fighter's primary gym
affiliated_since DATE     -- When they joined the gym
```

**gyms** - Added columns:
```sql
latitude DECIMAL(10, 8)   -- For location-based search
longitude DECIMAL(11, 8)  -- For location-based search
```

**sparring_events** - Added columns:
```sql
created_by_coach_id UUID  -- Coach who created event
current_participants INT  -- Auto-updated count
is_recurring BOOLEAN      -- Repeating event
recurrence_pattern TEXT   -- weekly/biweekly/monthly
```

**event_reviews** - New table:
```sql
id, event_id, fighter_id
rating (1-5)
review_text
organization_rating (1-5)
facility_rating (1-5)
coaching_rating (1-5)
would_recommend BOOLEAN
```

**event_attendance** - New table:
```sql
id, event_id, fighter_id
checked_in_at
checked_out_at
no_show BOOLEAN
```

---

## 🔧 Setup Instructions

### 1. Run SQL Migration

```sql
-- In Supabase SQL Editor
-- Execute: SPARRING_SESSIONS_ENHANCED.sql
```

This creates:
- New tables (reviews, attendance)
- New columns (affiliation, location, coach events)
- Triggers for notifications and participant counts
- Helper functions
- RLS policies

### 2. Update Gym Locations

You'll need to geocode gym addresses to get latitude/longitude:

```typescript
// Example using a geocoding service
async function updateGymLocation(gymId: string, address: string) {
  const coords = await geocodeAddress(address);

  await supabase
    .from('gyms')
    .update({
      latitude: coords.lat,
      longitude: coords.lng
    })
    .eq('id', gymId);
}
```

### 3. Test Location Permissions

The app requests location permissions to show nearby events:

```typescript
import * as Location from 'expo-location';

// This happens automatically in events service
const { status } = await Location.requestForegroundPermissionsAsync();
```

---

## 📱 User Flow Examples

### Fighter Finding a Sparring Session

1. **Open "Find Events"**
   - Sees "For You" tab with recommended events
   - Events match their weight class and experience

2. **Browse Nearby**
   - Switches to "Nearby" tab
   - Events sorted by distance
   - Sees "2.5 km" badge on each event

3. **Apply Filters**
   - Taps filter icon
   - Selects "Sparring" type
   - Selects "Technical" intensity
   - Sets max distance to 25km
   - Applies filters

4. **Join Event**
   - Finds perfect match
   - Taps "Request to Join"
   - Gets confirmation

5. **Gets Approved**
   - Receives push notification
   - Event shows "APPROVED" badge
   - Added to "My Events"

6. **After Event**
   - Receives review prompt
   - Leaves 5-star review
   - Praises the coaching

### Gym Creating an Event

1. **Create New Event**
   - Taps "Create Event" on dashboard
   - Fills in details
   - Publishes

2. **Affiliated Fighters Notified**
   - All fighters with `home_gym_id` matching gym
   - Receive push notification
   - See event in "My Gym Events"

3. **Review Requests**
   - Fighters request to join
   - Gym reviews profiles
   - Approves qualified fighters

4. **Track Event**
   - View participant list
   - Check fighters in as they arrive
   - Mark attendance

---

## 🎨 UI Components

### Event Card

Shows:
- Event type badge (Sparring, Try-Out, etc.)
- Distance from user (if location available)
- Status badges (Full, Requested, Approved)
- Event title and description
- Gym name and location
- Date and time
- Intensity level
- Participant count
- "Request to Join" button

### Filter Modal

Filters:
- Event Type (multi-select)
- Intensity (multi-select)
- Max Distance (10/25/50/100 km)
- Weight Class (future)
- Experience Level (future)
- Date Range (future)

### View Tabs

- **For You**: Recommended based on profile
- **Nearby**: Sorted by distance
- **All**: All upcoming events

---

## 🚀 Next Steps to Complete

1. **Update FighterNavigator** to use EnhancedEventBrowseScreen
2. **Add gym affiliation UI** to fighter profile
3. **Create event creation flow** for gyms and coaches
4. **Implement event reviews** screen and display
5. **Add notification handlers** for event alerts
6. **Test location services** on physical device

---

## 💡 Future Enhancements

- **Calendar view** - Month/week grid of events
- **Event chat** - Group chat for event participants
- **Check-in QR codes** - Automatic attendance tracking
- **Event photos** - Photo gallery for each event
- **Fighter stats** - Track sparring sessions, opponents faced
- **Gym leaderboards** - Most active fighters, best reviewed gyms
- **Recurring events** - Weekly sparring sessions
- **Private events** - Invite-only sessions
- **Paid events** - Stripe integration for premium sessions

---

**Current Status: 40% Complete**

Core discovery and search functionality is built. Next priority is completing the booking flow, gym affiliation, and coach permissions.
