// Mock data for Fight Station demo mode
// This data matches the design mockups

export interface MockGym {
  id: string;
  name: string;
  image: string;
  distance: string;
  sessionType: string;
  isVerified: boolean;
  intensityBadge?: 'high' | 'hard' | 'all_levels';
  weightClasses: { count: number; name: string }[];
  memberAvatars: string[];
  memberCount: number;
}

export interface MockFighter {
  id: string;
  name: string;
  nickname?: string;
  weightClass: string;
  record: string;
  avatar?: string;
  isSelected?: boolean;
}

export interface MockSparringInvite {
  id: string;
  gymName: string;
  gymLogo?: string;
  date: string;
  time: string;
  fighterCount: number;
  description: string;
  status: 'new' | 'pending' | 'sent' | 'confirmed';
}

export interface MockMatchAgreement {
  schedule: {
    date: string;
    time: string;
  };
  venue: {
    name: string;
    location: string;
  };
  roster: {
    fighterCount: number;
    weightRange: string;
  };
  rules: {
    rounds: string;
    gloves: string;
    headgear: boolean;
  };
}

// Sample gym images (using placeholder gradients for now)
const GYM_IMAGES = {
  berlin: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=200&fit=crop',
  ironFist: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=400&h=200&fit=crop',
  peak: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=200&fit=crop',
};

export const mockGyms: MockGym[] = [
  {
    id: 'gym-1',
    name: 'Berlin Boxing Academy',
    image: GYM_IMAGES.berlin,
    distance: '1.2 km away',
    sessionType: 'Technical Session',
    isVerified: true,
    intensityBadge: 'high',
    weightClasses: [
      { count: 3, name: 'Lightweight' },
      { count: 1, name: 'Cruiserweight' },
      { count: 2, name: 'Welterweight' },
    ],
    memberAvatars: ['A', 'B', 'C'],
    memberCount: 4,
  },
  {
    id: 'gym-2',
    name: 'Iron Fist Club',
    image: GYM_IMAGES.ironFist,
    distance: '4.8 km away',
    sessionType: 'Open Doors',
    isVerified: false,
    intensityBadge: 'hard',
    weightClasses: [
      { count: 2, name: 'Welterweight' },
      { count: 4, name: 'Middleweight' },
    ],
    memberAvatars: ['D', 'E', 'F'],
    memberCount: 6,
  },
  {
    id: 'gym-3',
    name: 'Peak Performance Gym',
    image: GYM_IMAGES.peak,
    distance: '7.5 km away',
    sessionType: 'Light Sparring',
    isVerified: false,
    intensityBadge: 'all_levels',
    weightClasses: [
      { count: 1, name: 'Heavyweight' },
      { count: 2, name: 'Featherweight' },
    ],
    memberAvatars: ['G', 'H'],
    memberCount: 3,
  },
];

export const mockFighters: MockFighter[] = [
  {
    id: 'fighter-1',
    name: 'Marco "The Tank" Rossi',
    weightClass: 'MIDDLEWEIGHT',
    record: '12-2-0',
    isSelected: true,
  },
  {
    id: 'fighter-2',
    name: 'Elena Petrova',
    weightClass: 'FLYWEIGHT',
    record: '8-1-0',
    isSelected: false,
  },
  {
    id: 'fighter-3',
    name: 'Javier Mendez',
    weightClass: 'HEAVYWEIGHT',
    record: '15-4-0',
    isSelected: true,
  },
  {
    id: 'fighter-4',
    name: 'Sarah Chen',
    weightClass: 'BANTAMWEIGHT',
    record: '6-0-0',
    isSelected: false,
  },
  {
    id: 'fighter-5',
    name: 'Dmitri Volkov',
    weightClass: 'LIGHT HEAVYWEIGHT',
    record: '10-3-1',
    isSelected: false,
  },
];

export const mockIncomingInvites: MockSparringInvite[] = [
  {
    id: 'invite-1',
    gymName: 'Iron Fist Gym',
    date: 'Oct 24',
    time: '6:00 PM',
    fighterCount: 12,
    description: 'Requesting Heavyweight Sparring',
    status: 'new',
  },
  {
    id: 'invite-2',
    gymName: 'Apex Boxing',
    date: 'Oct 26',
    time: '5:30 PM',
    fighterCount: 8,
    description: 'Inter-club friendly match',
    status: 'pending',
  },
];

export const mockSentInvites: MockSparringInvite[] = [
  {
    id: 'sent-1',
    gymName: 'Thunder Gym',
    date: 'Oct 28',
    time: '7:00 PM',
    fighterCount: 6,
    description: 'Technical sparring session',
    status: 'sent',
  },
];

export const mockMatchAgreement: MockMatchAgreement = {
  schedule: {
    date: 'Thursday, Oct 24',
    time: '06:00 PM',
  },
  venue: {
    name: 'Iron Fist HQ',
    location: 'Berlin, Germany',
  },
  roster: {
    fighterCount: 12,
    weightRange: 'Lightweight to Heavyweight',
  },
  rules: {
    rounds: '3x3 Rounds',
    gloves: '16oz Gloves',
    headgear: true,
  },
};

// Filter options matching the mockup
export const filterOptions = {
  locations: [
    { id: 'berlin', label: 'Berlin, DE' },
    { id: 'munich', label: 'Munich, DE' },
    { id: 'hamburg', label: 'Hamburg, DE' },
    { id: 'cologne', label: 'Cologne, DE' },
  ],
  intensity: [
    { id: 'all', label: 'All' },
    { id: 'light', label: 'Light' },
    { id: 'technical', label: 'Technical' },
    { id: 'hard', label: 'Hard' },
  ],
  weightClasses: [
    { id: 'flyweight', label: 'Flyweight' },
    { id: 'bantamweight', label: 'Bantamweight' },
    { id: 'featherweight', label: 'Featherweight' },
    { id: 'lightweight', label: 'Lightweight' },
    { id: 'welterweight', label: 'Welterweight' },
    { id: 'middleweight', label: 'Middleweight' },
    { id: 'light_heavyweight', label: 'Light Heavyweight' },
    { id: 'cruiserweight', label: 'Cruiserweight' },
    { id: 'heavyweight', label: 'Heavyweight' },
  ],
  sessionTypes: [
    { id: 'technical', label: 'Technical' },
    { id: 'hard_rounds', label: 'Hard Rounds' },
    { id: 'open_doors', label: 'Open Doors' },
    { id: 'light_sparring', label: 'Light Sparring' },
  ],
};

// Upcoming dates for the calendar
export const mockCalendarDates = {
  month: 'November 2024',
  selectedDay: 5,
  availableDays: [1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 22, 25, 28, 30],
};

// Demo user profile
export const mockUserProfile = {
  id: 'user-1',
  firstName: 'Mikk',
  lastName: 'Maal',
  email: 'mikk.maal@gmail.com',
  weightClass: 'welterweight',
  experienceLevel: 'intermediate',
  location: {
    city: 'Tallinn',
    country: 'Estonia',
  },
  stats: {
    sparringSessions: 24,
    fights: 3,
  },
  bio: 'Amateur boxer training for 2 years. Looking for sparring partners in the welterweight division.',
};
