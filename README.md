# Fight Station

A mobile-first platform connecting boxing gyms, fighters, and coaches across Europe. Organize sparring events, find training partners, and build your boxing network.

## Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Navigation**: React Navigation
- **Styling**: Custom design system (theme.ts)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)
- Supabase account (free tier works)

### 1. Clone and Install

```bash
cd fight-station
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the contents of `supabase/schema.sql` and run it
4. Go to **Settings > API** to get your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the App

```bash
# Start development server
npm start

# Or run on specific platform
npm run ios
npm run android
npm run web
```

Scan the QR code with Expo Go app to test on your phone.

## Project Structure

```
fight-station/
├── App.tsx                 # Root component
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── context/
│   │   └── AuthContext.tsx # Authentication state
│   ├── hooks/              # Custom React hooks
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   └── theme.ts        # Design system
│   ├── navigation/         # React Navigation setup
│   │   ├── AuthNavigator.tsx
│   │   ├── FighterNavigator.tsx
│   │   ├── GymNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── screens/
│   │   ├── auth/           # Login, Register, Role Selection
│   │   ├── fighter/        # Fighter dashboard, setup
│   │   ├── gym/            # Gym dashboard, event creation
│   │   ├── coach/          # Coach setup
│   │   └── shared/         # Events list, event detail
│   └── types/              # TypeScript types
└── supabase/
    └── schema.sql          # Database schema
```

## Features

### MVP (Current)

**Fighter Features:**
- Profile creation (weight, experience, location)
- Browse sparring events by weight class
- Request to join events
- View event details and gym info

**Gym Features:**
- Gym profile (location, facilities, contact)
- Create sparring events
- Set weight classes and experience levels
- Manage participant requests

**Coach Features:**
- Coach profile linked to gym
- View gym events

### Coming Soon
- Real-time messaging
- Push notifications
- Google Maps integration
- Profile photos
- Event ratings/reviews

## Design System

The app uses a boxing-inspired dark theme:

- **Primary**: Boxing Red (#DC2626)
- **Secondary**: Champion Gold (#D4A417)
- **Background**: Dark gym aesthetic (#0A0A0A)

See `src/lib/theme.ts` for full design tokens.

## Deployment

### Expo Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Supabase Production

1. Create a production Supabase project
2. Run `schema.sql` in the new project
3. Update `.env` with production credentials
4. Enable email verification in Auth settings

## License

MIT
