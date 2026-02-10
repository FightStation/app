// User roles
export type UserRole = 'fighter' | 'gym' | 'coach';

// Combat sports supported
export type CombatSport = 'boxing' | 'mma' | 'muay_thai' | 'kickboxing';

export const COMBAT_SPORT_LABELS: Record<CombatSport, string> = {
  boxing: 'Boxing',
  mma: 'MMA',
  muay_thai: 'Muay Thai',
  kickboxing: 'Kickboxing',
};

export const COMBAT_SPORT_SHORT: Record<CombatSport, string> = {
  boxing: 'BOX',
  mma: 'MMA',
  muay_thai: 'MT',
  kickboxing: 'KB',
};

export const COMBAT_SPORT_ICONS: Record<CombatSport, string> = {
  boxing: 'fitness',     // Glove icon
  mma: 'hand-left',      // Grappling
  muay_thai: 'flash',    // Speed/kicks
  kickboxing: 'flame',   // Power
};

// Fighter profile
export interface Fighter {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  weight_class: WeightClass;
  experience_level: ExperienceLevel;
  sports?: CombatSport[];       // Combat sports they train
  primary_sport?: CombatSport;  // Main discipline
  gym_id?: string;
  bio?: string;
  avatar_url?: string;
  country: string;
  city: string;
  age?: number;
  height_cm?: number;
  reach_cm?: number;
  stance?: 'orthodox' | 'southpaw' | 'switch';
  record?: string; // e.g., "5-2-0"
  fights_count: number;
  sparring_count: number;
  instagram?: string;
  created_at: string;
  updated_at: string;
}

// Gym profile
export interface Gym {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  logo_url?: string;
  photos: string[];
  facilities: string[];
  sports?: CombatSport[];  // Combat sports offered
  contact_email: string;
  contact_phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  created_at: string;
  updated_at: string;
}

// Coach profile
export interface Coach {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  gym_id: string;
  bio?: string;
  avatar_url?: string;
  specializations: string[];
  years_experience: number;
  created_at: string;
  updated_at: string;
}

// Event Types (defined early for use in SparringEvent)
export type EventType = 'sparring' | 'tryout' | 'fight' | 'training';
export type EventIntensity = 'technical' | 'moderate' | 'hard';

// Sparring Event
export interface SparringEvent {
  id: string;
  gym_id: string;
  event_type?: EventType;
  intensity?: EventIntensity;
  title: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  weight_classes: WeightClass[];
  max_participants: number;
  current_participants: number;
  experience_levels: ExperienceLevel[];
  status: EventStatus;
  photo_url?: string | string[];
  created_at: string;
  updated_at: string;
  // Joined data
  gym?: Gym;
}

// Event participation request
export interface EventRequest {
  id: string;
  event_id: string;
  fighter_id: string;
  status: RequestStatus;
  message?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  fighter?: Fighter;
  event?: SparringEvent;
}

// Event attendance (check-in/check-out)
export interface EventAttendance {
  id: string;
  event_id: string;
  fighter_id: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  no_show: boolean;
  no_show_reason?: string;
  created_at: string;
  fighter?: Fighter;
}

// Event review
export interface EventReview {
  id: string;
  event_id: string;
  fighter_id: string;
  rating: number;
  review_text?: string;
  organization_rating: number;
  facility_rating: number;
  coaching_rating: number;
  would_recommend: boolean;
  created_at: string;
  updated_at: string;
  fighter?: Fighter;
}

// Chat/Message
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message?: string;
  last_message_at?: string;
  created_at: string;
}

// Enums
export type WeightClass =
  | 'flyweight'      // up to 52kg
  | 'bantamweight'   // up to 54kg
  | 'featherweight'  // up to 57kg
  | 'lightweight'    // up to 60kg
  | 'light_welterweight' // up to 64kg
  | 'welterweight'   // up to 69kg
  | 'light_middleweight' // up to 75kg
  | 'middleweight'   // up to 81kg
  | 'light_heavyweight' // up to 91kg
  | 'heavyweight'    // up to 91kg+
  | 'super_heavyweight'; // unlimited

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export type EventStatus = 'draft' | 'published' | 'full' | 'cancelled' | 'completed';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Weight class labels for display
export const WEIGHT_CLASS_LABELS: Record<WeightClass, string> = {
  flyweight: 'Flyweight (≤52kg)',
  bantamweight: 'Bantamweight (≤54kg)',
  featherweight: 'Featherweight (≤57kg)',
  lightweight: 'Lightweight (≤60kg)',
  light_welterweight: 'Light Welterweight (≤64kg)',
  welterweight: 'Welterweight (≤69kg)',
  light_middleweight: 'Light Middleweight (≤75kg)',
  middleweight: 'Middleweight (≤81kg)',
  light_heavyweight: 'Light Heavyweight (≤91kg)',
  heavyweight: 'Heavyweight (91kg+)',
  super_heavyweight: 'Super Heavyweight (Unlimited)',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner (0-1 years)',
  intermediate: 'Intermediate (1-3 years)',
  advanced: 'Advanced (3-5 years)',
  pro: 'Professional (5+ years)',
};

// Countries for Eastern Europe focus
export const SUPPORTED_COUNTRIES = [
  'Poland',
  'Lithuania',
  'Latvia',
  'Estonia',
  'Finland',
  'Sweden',
  'Serbia',
  'Croatia',
  'Slovenia',
  'Bulgaria',
  'Romania',
  'Czech Republic',
  'Slovakia',
  'Hungary',
] as const;

// ============================================
// FEED/POSTS TYPES
// ============================================

export type AuthorType = 'fighter' | 'gym' | 'coach';
export type PostType = 'post' | 'reel' | 'event_share' | 'training_update';
export type MediaType = 'image' | 'video' | 'mixed' | null;
export type PostVisibility = 'public' | 'followers' | 'gym_only';
export type PostStatus = 'active' | 'hidden' | 'deleted';

export interface Post {
  id: string;
  user_id: string;
  author_type: AuthorType;
  author_id: string;
  content?: string;
  media_urls: string[];
  media_type: MediaType;
  post_type: PostType;
  event_id?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  visibility: PostVisibility;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  // Joined/computed data
  author?: Fighter | Gym | Coach;
  event?: SparringEvent;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  author_type: AuthorType;
  author_id: string;
  content: string;
  parent_id?: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: Fighter | Gym | Coach;
  replies?: PostComment[];
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_user_id: string;
  following_user_id: string;
  created_at: string;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

// Feed item with author info populated
export interface FeedItem extends Post {
  author_name: string;
  author_avatar?: string;
  author_location?: string;
}

// ============================================
// EVENT CONSTANTS
// ============================================

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  sparring: 'fitness',
  tryout: 'person-add',
  fight: 'trophy',
  training: 'barbell',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  sparring: 'Sparring',
  tryout: 'Try-Out',
  fight: 'Fight',
  training: 'Training',
};

export const INTENSITY_OPTIONS: EventIntensity[] = ['technical', 'moderate', 'hard'];

export const INTENSITY_LABELS: Record<EventIntensity, string> = {
  technical: 'Technical',
  moderate: 'Moderate',
  hard: 'Hard',
};

// Participation status for fighter's view of their events
export type ParticipationStatus = 'confirmed' | 'pending' | 'past';

// ============================================
// MULTI-TIER AFFILIATE SYSTEM TYPES
// ============================================

export type ReferrerType = 'gym' | 'fighter' | 'coach';
export type TransactionType = 'membership' | 'merchandise' | 'event_fee';
export type TransactionStatus = 'pending' | 'processed' | 'failed' | 'refunded';
export type EarningStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

// Commission rate configuration (admin-configurable)
export interface CommissionRate {
  id: string;
  rate_key: string;
  display_name: string;
  referrer_type: ReferrerType;
  tier_level: number;
  rate_percentage: number;
  transaction_type: TransactionType | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Chain entry in the referral hierarchy
export interface ChainEntry {
  user_id: string;
  user_type: ReferrerType;
}

// Full referral chain for a user
export interface ReferralChain {
  id: string;
  user_id: string;
  user_type: ReferrerType;
  direct_referrer_id: string | null;
  chain_depth: number;
  chain_path: ChainEntry[];
  created_at: string;
}

// Transaction that generates affiliate commissions
export interface AffiliateTransaction {
  id: string;
  transaction_type: TransactionType;
  payer_id: string;
  payer_type: ReferrerType;
  gross_amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  commission_pool: number;
  net_platform_amount: number | null;
  status: TransactionStatus;
  external_transaction_id: string | null;
  transaction_date: string;
  processed_at: string | null;
  created_at: string;
}

// Individual earning record for a beneficiary
export interface AffiliateEarning {
  id: string;
  transaction_id: string;
  beneficiary_id: string;
  beneficiary_type: ReferrerType;
  tier_level: number;
  rate_percentage: number;
  base_amount: number;
  earned_amount: number;
  status: EarningStatus;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  // Joined data
  transaction?: AffiliateTransaction;
}

// Summary of earnings by tier
export interface EarningsSummary {
  tier_level: number;
  total_earned: number;
  pending_amount: number;
  approved_amount: number;
  paid_amount: number;
  transaction_count: number;
}

// Referral network member (for tree visualization)
export interface ReferralNetworkMember {
  referred_user_id: string;
  referred_user_type: ReferrerType;
  referral_date: string;
  tier: number;
  sub_referral_count: number;
  // Joined data
  profile?: Fighter | Gym | Coach;
}

// Tier breakdown for dashboard display
export interface TierBreakdown {
  tier1: {
    total_referrals: number;
    total_earned: number;
    pending_earned: number;
    rate: number;
  };
  tier2: {
    total_referrals: number;
    total_earned: number;
    pending_earned: number;
    rate: number;
  };
  total_earned: number;
  total_pending: number;
}

// Admin view of all commission rates
export interface CommissionRateConfig {
  gym: {
    tier1: CommissionRate[];
    tier2: CommissionRate[];
  };
  fighter: {
    tier1: CommissionRate[];
    tier2: CommissionRate[];
  };
  coach: {
    tier1: CommissionRate[];
    tier2: CommissionRate[];
  };
}

// ============================================
// GYM DIRECTORY TYPES
// ============================================

// Country in the directory (for pre-populated gym database)
export interface DirectoryCountry {
  code: string;  // ISO 3166-1 alpha-2 (e.g., 'LT', 'PL')
  name: string;  // English name
  name_native: string;  // Native language name
  is_active: boolean;
  gym_count: number;
  last_updated: string | null;
}

// Gym in the pre-populated directory (may or may not be claimed)
export interface DirectoryGym {
  id: string;
  name: string;
  slug: string;

  // Location
  country_code: string;
  country_name: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  // Contact
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;

  // Sports offered
  sports: CombatSport[];

  // Claim status
  is_claimed: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
  gym_id: string | null;  // Links to real Gym after claim

  // Data source
  source: 'google_places' | 'manual' | 'user_submitted';
  source_id: string | null;
  verified: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Claim request verification methods
export type ClaimVerificationMethod = 'email' | 'phone' | 'manual';
export type ClaimStatus = 'pending' | 'verifying' | 'approved' | 'rejected';

// Gym claim request
export interface GymClaimRequest {
  id: string;
  gym_directory_id: string;
  claimant_id: string;

  // Verification
  verification_method: ClaimVerificationMethod;
  verification_code: string | null;
  verification_sent_at: string | null;
  verification_attempts: number;

  // For manual review
  proof_document_url: string | null;
  admin_notes: string | null;

  // Status
  status: ClaimStatus;
  rejected_reason: string | null;

  // Timestamps
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;

  // Joined data
  gym?: DirectoryGym;
}

// Search/filter parameters for gym directory
export interface DirectorySearchParams {
  country_code?: string;
  city?: string;
  sport?: CombatSport;
  search_term?: string;
  claimed_only?: boolean;
  limit?: number;
  offset?: number;
}

// Country with flag emoji for UI
export interface DirectoryCountryWithFlag extends DirectoryCountry {
  flag: string;  // Emoji flag
}

// Country code to flag emoji mapping
export const COUNTRY_FLAGS: Record<string, string> = {
  EE: '🇪🇪',
  LV: '🇱🇻',
  LT: '🇱🇹',
  PL: '🇵🇱',
  SK: '🇸🇰',
  HU: '🇭🇺',
  HR: '🇭🇷',
  RS: '🇷🇸',
  SI: '🇸🇮',
  BG: '🇧🇬',
  RO: '🇷🇴',
  FI: '🇫🇮',
  RU: '🇷🇺',
  GE: '🇬🇪',
};

// Helper to get flag for country code
export const getCountryFlag = (code: string): string => {
  return COUNTRY_FLAGS[code] || '🏳️';
};

// ============================================
// TRAINING SESSION TYPES (Coach Features)
// ============================================

export type TrainingFocusArea =
  | 'technique'
  | 'conditioning'
  | 'sparring'
  | 'drills'
  | 'pad_work'
  | 'bag_work'
  | 'strength'
  | 'cardio'
  | 'flexibility';

export interface TrainingSession {
  id: string;
  coach_id: string;
  fighter_id: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  focus_areas: TrainingFocusArea[];
  exercises?: TrainingExercise[];
  notes?: string;
  rating?: number; // 1-5 coach rating of session
  created_at: string;
  updated_at: string;
  // Joined data
  fighter?: Fighter;
  coach?: Coach;
}

export interface TrainingExercise {
  id: string;
  session_id: string;
  name: string;
  category: TrainingFocusArea;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  weight_kg?: number;
  notes?: string;
  order: number;
}

export interface CoachNote {
  id: string;
  coach_id: string;
  fighter_id: string;
  content: string;
  note_type: 'progress' | 'observation' | 'goal' | 'general';
  created_at: string;
  updated_at: string;
}

export interface StudentProgressMetrics {
  fighter_id: string;
  total_sessions: number;
  total_hours: number;
  improvement_score: number; // 0-100
  streak_days: number;
  last_session_date?: string;
  sessions_this_month: number;
  avg_session_rating?: number;
  // Trend data
  improving_areas: TrainingFocusArea[];
  needs_work_areas: TrainingFocusArea[];
}

// ============================================
// SPARRING INVITE TYPES (Fighter Features)
// ============================================

export type InviteFromType = 'gym' | 'fighter';
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
export type InviteType = 'event_invite' | 'direct_sparring';

export interface SparringInvite {
  id: string;
  invite_type: InviteType;
  from_type: InviteFromType;
  from_gym_id?: string;
  from_fighter_id?: string;
  to_fighter_id: string;

  // For event invites
  event_id?: string;

  // For direct sparring requests
  proposed_date?: string;
  proposed_time?: string;
  proposed_location?: string;
  proposed_weight_class?: WeightClass;
  proposed_intensity?: EventIntensity;

  message?: string;
  status: InviteStatus;
  created_at: string;
  responded_at?: string;
  expires_at?: string;

  // Joined data
  from_gym?: Gym;
  from_fighter?: Fighter;
  to_fighter?: Fighter;
  event?: SparringEvent;
}

// ============================================
// SMART MATCHING TYPES
// ============================================

export type MatchEntityType = 'fighter' | 'gym' | 'event';

export interface MatchScoreBreakdown {
  weight_class_score: number;    // 0-100
  experience_score: number;       // 0-100
  location_score: number;         // 0-100
  availability_score: number;     // 0-100
  sport_match_score?: number;     // 0-100
  event_frequency_score?: number; // 0-100 (for gyms)
  mutual_interest_score?: number; // 0-100 (for fighters)
}

export interface MatchScore {
  entity_id: string;
  entity_type: MatchEntityType;
  overall_score: number; // 0-100
  breakdown: MatchScoreBreakdown;
  reasons: string[]; // Human-readable match reasons
  // Joined entity data
  fighter?: Fighter;
  gym?: Gym;
  event?: SparringEvent;
}

export interface LocationCriteria {
  latitude: number;
  longitude: number;
  max_distance_km: number;
}

export interface AvailabilityCriteria {
  dates: string[];
  time_slots?: string[]; // e.g., ['morning', 'afternoon', 'evening']
}

export interface MatchingCriteria {
  weight_class?: WeightClass;
  experience_level?: ExperienceLevel;
  sports?: CombatSport[];
  location?: LocationCriteria;
  availability?: AvailabilityCriteria;
  exclude_ids?: string[]; // IDs to exclude from results
}

// Weight class order for compatibility scoring
export const WEIGHT_CLASS_ORDER: WeightClass[] = [
  'flyweight',
  'bantamweight',
  'featherweight',
  'lightweight',
  'light_welterweight',
  'welterweight',
  'light_middleweight',
  'middleweight',
  'light_heavyweight',
  'heavyweight',
  'super_heavyweight',
];

// Helper to get weight class index
export const getWeightClassIndex = (wc: WeightClass): number => {
  return WEIGHT_CLASS_ORDER.indexOf(wc);
};

// Experience level order for scoring
export const EXPERIENCE_ORDER: ExperienceLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'pro',
];

// Helper to get experience index
export const getExperienceIndex = (exp: ExperienceLevel): number => {
  return EXPERIENCE_ORDER.indexOf(exp);
};

// Training focus area labels
export const TRAINING_FOCUS_LABELS: Record<TrainingFocusArea, string> = {
  technique: 'Technique',
  conditioning: 'Conditioning',
  sparring: 'Sparring',
  drills: 'Drills',
  pad_work: 'Pad Work',
  bag_work: 'Bag Work',
  strength: 'Strength',
  cardio: 'Cardio',
  flexibility: 'Flexibility',
};
