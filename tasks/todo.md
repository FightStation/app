# Fight Station MVP Simplification Plan

## Goal
Strip Fight Station down to its core: **fighters finding sparring sessions, training opportunities, and competitions at gyms across Europe.** Remove everything else.

---

## What Stays (MVP Core)
- Auth (fighter + gym roles only)
- Fighter profiles (name, weight class, level, bio, video links)
- Gym profiles (name, location, disciplines, contact, photos)
- Gym directory (91 pre-seeded gyms, searchable)
- Event creation & browsing (sparring, training, competitions)
- Event registration/apply flow (fighter requests → gym approves)
- Event check-in & reviews

## What Gets Cut
- Coach role (all screens, navigator, setup)
- Referral/affiliate system (context, services, dashboards)
- Social feed (posts, likes, comments, reels)
- Messaging (chat, conversations)
- Admin screens (commission rates, directory admin)
- Gym claim flow (gyms contact directly for now)
- Smart matching algorithm
- Fighter search / gym search (redundant screens)
- Training schedule management
- Advanced event browse

## Navigation After Simplification

**Fighter (3 tabs):**
1. **Discover** — one scrollable screen: upcoming events feed at top, gym directory below. Filterable by location, discipline, event type
2. **My Sessions** — events the fighter has registered for (pending, approved, past)
3. **Profile** — fighter profile with edit capability

**Gym (3 tabs):**
1. **Home** — dashboard with pending requests + "Create Event" CTA
2. **Events** — gym's events list with request management
3. **Settings** — gym profile editing

---

## Implementation Phases

### Phase 1: Remove Non-MVP Code
> Move deprecated files to `src/_deprecated/` (nothing permanently deleted)

- [ ] **1.1** Remove Coach role
  - Modify `RootNavigator.tsx` — remove coach conditional
  - Modify `AuthContext.tsx` — remove coach profile loading, demo coach
  - Modify `RoleSelectionScreen.tsx` — remove coach option
  - Modify `AuthNavigator.tsx` — remove CoachSetup screen
  - Move `CoachNavigator.tsx` → `_deprecated/navigation/`
  - Move `screens/coach/` → `_deprecated/screens/coach/`

- [ ] **1.2** Remove Referral/Affiliate system
  - Move `ReferralContext.tsx` → `_deprecated/context/`
  - Modify `App.tsx` — remove ReferralProvider wrapper
  - Remove referral handling from `AuthContext.tsx` signup
  - Remove deep link referral tracking from `RootNavigator.tsx`
  - Move `services/affiliate.ts` → `_deprecated/services/`
  - Move `services/deepLinkHandler.ts` → `_deprecated/services/`
  - Move referral dashboard screens → `_deprecated/screens/`

- [ ] **1.3** Remove Social/Feed features
  - Move `FeedScreen.tsx`, `CreatePostScreen.tsx`, `ReelsScreen.tsx`, `VideoShareScreen.tsx` → `_deprecated/screens/shared/`
  - Move `GymReelsScreen.tsx` → `_deprecated/screens/gym/`
  - Move `services/matching.ts` → `_deprecated/services/`

- [ ] **1.4** Remove Messaging
  - Move `MessagesScreen.tsx`, `ChatScreen.tsx` → `_deprecated/screens/fighter/`
  - Move `services/messaging.ts` → `_deprecated/services/`

- [ ] **1.5** Remove Admin features
  - Move `screens/admin/` → `_deprecated/screens/admin/`

- [ ] **1.6** Remove redundant/advanced screens
  - Move: `FighterSearchScreen`, `SparringScheduleScreen`, `EnhancedEventBrowseScreen`, `GymSearchScreen`, `ClaimGymScreen`, `ClaimManagementScreen`, `TrainingScheduleScreen`, `GymPhotoUploadScreen`, `AdminManagementScreen`, `ManageFightersScreen` → `_deprecated/`

- [ ] **1.7** Build check — verify app compiles with no missing import errors

### Phase 2: Simplify Navigation

- [ ] **2.1** Fighter Navigator — reduce to 3 tabs
  - Update `FighterNavigator.tsx`:
    - Tabs: Discover, My Sessions, Profile
    - Keep stack screens: EventDetail, GymProfileView, EventReview, SparringInvites
    - Remove all deprecated stack screen entries
    - Update `FighterTabParamList` and `FighterStackParamList` types

- [ ] **2.2** Gym Navigator — reduce to 3 tabs
  - Update `GymNavigator.tsx`:
    - Tabs: Home, Events, Settings
    - Keep stack screens: CreateEvent, EditEvent, EventDetail, EventCheckIn, SparringInvites
    - Remove all deprecated stack screen entries
    - Update `GymTabParamList` and `GymStackParamList` types

- [ ] **2.3** Clean up screen index exports
  - Update `screens/fighter/index.ts` — remove deprecated exports
  - Update `screens/gym/index.ts` — remove deprecated exports
  - Update `screens/shared/index.ts` — remove deprecated exports

- [ ] **2.4** Build check — verify navigation works end-to-end

### Phase 3: Fix Core UX

- [ ] **3.1** Simplify Fighter Dashboard → becomes Discover screen
  - One scrollable screen with:
    - Search bar (location/keyword)
    - Filter chips: All, Sparring, Training, Competition
    - Upcoming events feed (cards: title, gym, date, weight classes, intensity)
    - Gym directory section below
  - Remove: smart matching, referral section, profile completeness card

- [ ] **3.2** Simplify Gym Dashboard
  - Show: pending fighter requests (count + list), "Create Event" button, upcoming events
  - Remove: referral section, complex analytics, nearby fighters matching

- [ ] **3.3** Simplify Event Creation
  - Convert to 3-step wizard:
    - Step 1: Type (Sparring / Training / Competition) + Title + Date/Time
    - Step 2: Weight classes + Experience levels + Max participants + Intensity
    - Step 3: Description (optional) + Review & Create
  - Use native date/time pickers
  - Add presets for weight classes ("All Classes", "Lightweight Division", etc.)

- [ ] **3.4** Simplify Event Cards
  - Show only: title, gym name, date/time, weight classes (compact), intensity badge, participant count
  - One clear CTA: "Apply" or "View Details"
  - Move all secondary info to detail screen

- [ ] **3.5** Simplify Profile Completeness
  - Replace weighted scoring with simple percentage
  - Show as dismissible banner, not persistent card
  - List missing fields plainly
  - Required fields only: name, weight class, experience level, country, city

- [ ] **3.6** Clean up Event Types
  - Keep: Sparring, Training, Competition
  - Remove: Try-Out type, complex conditional form fields
  - Competition type: add venue, date, optional opponent info

### Phase 4: Polish & Verify

- [ ] **4.1** Full build verification — no errors, no warnings
- [ ] **4.2** Test fighter flow end-to-end:
  - Register → Complete profile → Browse events → Apply → View in My Sessions
- [ ] **4.3** Test gym flow end-to-end:
  - Register → Complete profile → Create event → Manage requests → Check in fighters
- [ ] **4.4** Test event review flow (post-event)
- [ ] **4.5** Verify gym directory loads (91 gyms, search/filter works)
- [ ] **4.6** Check no references to removed features remain in UI (no dead buttons, no broken links)
- [ ] **4.7** Mobile + web layout check

---

## Files Being Deprecated (moved to `src/_deprecated/`)

### Navigation
- `CoachNavigator.tsx`

### Screens (~30 screens removed)
- `screens/coach/*` (8 screens)
- `screens/admin/*` (3 screens)
- `screens/fighter/`: MessagesScreen, ChatScreen, FighterSearchScreen, ReferralDashboardScreen, SparringScheduleScreen, EnhancedEventBrowseScreen, GymSearchScreen
- `screens/gym/`: ClaimGymScreen, ClaimManagementScreen, TrainingScheduleScreen, GymPhotoUploadScreen, AdminManagementScreen, ManageFightersScreen, GymReelsScreen, GymReferralDashboardScreen
- `screens/shared/`: FeedScreen, CreatePostScreen, ReelsScreen, VideoShareScreen

### Services
- `affiliate.ts`, `deepLinkHandler.ts`, `messaging.ts`, `matching.ts`

### Context
- `ReferralContext.tsx`

## Files Being Modified

### Critical (modify carefully)
- `App.tsx` — remove ReferralProvider
- `RootNavigator.tsx` — remove coach role, referral tracking
- `AuthContext.tsx` — remove coach profile, referral signup logic
- `FighterNavigator.tsx` — reduce to 3 tabs, clean routes
- `GymNavigator.tsx` — reduce to 3 tabs, clean routes
- `RoleSelectionScreen.tsx` — remove coach option

### UX Changes
- `FighterDashboardScreen.tsx` → becomes Discover screen
- `GymDashboardScreen.tsx` → simplify to requests + CTA
- `CreateEventScreen.tsx` → 3-step wizard
- `ProfileCompletenessCard.tsx` → simple banner
- `profileCompleteness.ts` → simple percentage
- `GymCard.tsx` → reduce displayed info
- Screen index files — clean up exports

## Result
- **Before:** 60+ screens, 5 fighter tabs, 4 gym tabs, 31 DB tables referenced
- **After:** ~20 screens, 3 fighter tabs, 3 gym tabs, ~10 DB tables actively used
- **UX:** Clear purpose per screen, one primary action per view, minimal decisions required
