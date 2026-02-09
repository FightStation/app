import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  DirectoryCountry,
  DirectoryGym,
  GymClaimRequest,
  DirectorySearchParams,
  CombatSport,
  ClaimVerificationMethod,
} from '../types';

/**
 * Get all active countries in the directory
 */
export async function getDirectoryCountries(): Promise<DirectoryCountry[]> {
  if (!isSupabaseConfigured) {
    return getMockCountries();
  }

  const { data, error } = await supabase
    .from('directory_countries')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Get a single country by code
 */
export async function getDirectoryCountry(code: string): Promise<DirectoryCountry | null> {
  if (!isSupabaseConfigured) {
    return getMockCountries().find(c => c.code === code) || null;
  }

  const { data, error } = await supabase
    .from('directory_countries')
    .select('*')
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get unique cities for a country
 */
export async function getCitiesForCountry(countryCode: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return getMockCities(countryCode);
  }

  const { data, error } = await supabase
    .from('gym_directory')
    .select('city')
    .eq('country_code', countryCode)
    .order('city');

  if (error) throw error;

  // Get unique cities
  const cities = [...new Set(data?.map(d => d.city) || [])];
  return cities;
}

/**
 * Search gyms in the directory
 */
export async function searchGymDirectory(
  params: DirectorySearchParams
): Promise<DirectoryGym[]> {
  if (!isSupabaseConfigured) {
    return getMockGyms(params);
  }

  const { data, error } = await supabase.rpc('search_gym_directory', {
    p_country_code: params.country_code || null,
    p_city: params.city || null,
    p_sport: params.sport || null,
    p_search_term: params.search_term || null,
    p_claimed_only: params.claimed_only ?? null,
    p_limit: params.limit || 50,
    p_offset: params.offset || 0,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Get gyms by country
 */
export async function getGymsByCountry(
  countryCode: string,
  limit: number = 50,
  offset: number = 0
): Promise<DirectoryGym[]> {
  return searchGymDirectory({
    country_code: countryCode,
    limit,
    offset,
  });
}

/**
 * Get gyms by city
 */
export async function getGymsByCity(
  countryCode: string,
  city: string,
  limit: number = 50
): Promise<DirectoryGym[]> {
  return searchGymDirectory({
    country_code: countryCode,
    city,
    limit,
  });
}

/**
 * Get a single gym by ID
 */
export async function getDirectoryGym(gymId: string): Promise<DirectoryGym | null> {
  if (!isSupabaseConfigured) {
    const mockGyms = getMockGyms({});
    return mockGyms.find(g => g.id === gymId) || null;
  }

  const { data, error } = await supabase
    .from('gym_directory')
    .select('*')
    .eq('id', gymId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get a single gym by slug
 */
export async function getDirectoryGymBySlug(slug: string): Promise<DirectoryGym | null> {
  if (!isSupabaseConfigured) {
    const mockGyms = getMockGyms({});
    return mockGyms.find(g => g.slug === slug) || null;
  }

  const { data, error } = await supabase
    .from('gym_directory')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Create a gym claim request
 */
export async function createGymClaimRequest(
  gymDirectoryId: string,
  verificationMethod: ClaimVerificationMethod,
  proofDocumentUrl?: string
): Promise<GymClaimRequest> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would create claim request for', gymDirectoryId);
    return {
      id: 'mock-claim-id',
      gym_directory_id: gymDirectoryId,
      claimant_id: 'mock-user-id',
      verification_method: verificationMethod,
      verification_code: null,
      verification_sent_at: null,
      verification_attempts: 0,
      proof_document_url: proofDocumentUrl || null,
      admin_notes: null,
      status: 'pending',
      rejected_reason: null,
      created_at: new Date().toISOString(),
      processed_at: null,
      processed_by: null,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('gym_claim_requests')
    .insert({
      gym_directory_id: gymDirectoryId,
      claimant_id: user.id,
      verification_method: verificationMethod,
      proof_document_url: proofDocumentUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's claim requests
 */
export async function getUserClaimRequests(): Promise<GymClaimRequest[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('gym_claim_requests')
    .select(`
      *,
      gym:gym_directory (*)
    `)
    .eq('claimant_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get claim request for a specific gym
 */
export async function getClaimRequestForGym(gymDirectoryId: string): Promise<GymClaimRequest | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('gym_claim_requests')
    .select('*')
    .eq('gym_directory_id', gymDirectoryId)
    .eq('claimant_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Submit a new gym to the directory (user-submitted)
 */
export async function submitGymToDirectory(gym: {
  name: string;
  countryCode: string;
  countryName: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  sports: CombatSport[];
}): Promise<DirectoryGym> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would submit gym', gym);
    return {
      id: 'mock-submitted-gym',
      name: gym.name,
      slug: gym.name.toLowerCase().replace(/\s+/g, '-'),
      country_code: gym.countryCode,
      country_name: gym.countryName,
      city: gym.city,
      address: gym.address || null,
      latitude: null,
      longitude: null,
      phone: gym.phone || null,
      email: gym.email || null,
      website: gym.website || null,
      instagram: gym.instagram || null,
      facebook: null,
      sports: gym.sports,
      is_claimed: false,
      claimed_by: null,
      claimed_at: null,
      gym_id: null,
      source: 'user_submitted',
      source_id: null,
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('gym_directory')
    .insert({
      name: gym.name,
      country_code: gym.countryCode,
      country_name: gym.countryName,
      city: gym.city,
      address: gym.address,
      phone: gym.phone,
      email: gym.email,
      website: gym.website,
      instagram: gym.instagram,
      sports: gym.sports,
      source: 'user_submitted',
      verified: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// ADMIN FUNCTIONS - Claim Management
// ============================================

/**
 * Get all pending claim requests (admin only)
 */
export async function getAllPendingClaims(): Promise<(GymClaimRequest & { gym: DirectoryGym })[]> {
  if (!isSupabaseConfigured) {
    return getMockPendingClaims();
  }

  const { data, error } = await supabase
    .from('gym_claim_requests')
    .select(`
      *,
      gym:gym_directory (*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get all claim requests with any status (admin only)
 */
export async function getAllClaimRequests(
  status?: 'pending' | 'verifying' | 'approved' | 'rejected'
): Promise<(GymClaimRequest & { gym: DirectoryGym })[]> {
  if (!isSupabaseConfigured) {
    return getMockPendingClaims();
  }

  let query = supabase
    .from('gym_claim_requests')
    .select(`
      *,
      gym:gym_directory (*)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Approve a gym claim request (admin only)
 */
export async function approveGymClaim(claimId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would approve claim', claimId);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get the claim to find the gym
  const { data: claim, error: claimError } = await supabase
    .from('gym_claim_requests')
    .select('*, gym:gym_directory(*)')
    .eq('id', claimId)
    .single();

  if (claimError) throw claimError;
  if (!claim) throw new Error('Claim not found');

  // 1. Update the claim status
  const { error: updateError } = await supabase
    .from('gym_claim_requests')
    .update({
      status: 'approved',
      processed_at: new Date().toISOString(),
      processed_by: user.id,
    })
    .eq('id', claimId);

  if (updateError) throw updateError;

  // 2. Mark the directory gym as claimed
  const { error: gymError } = await supabase
    .from('gym_directory')
    .update({
      is_claimed: true,
      claimed_by: claim.claimant_id,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', claim.gym_directory_id);

  if (gymError) throw gymError;
}

/**
 * Reject a gym claim request (admin only)
 */
export async function rejectGymClaim(claimId: string, reason: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would reject claim', claimId, 'with reason:', reason);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('gym_claim_requests')
    .update({
      status: 'rejected',
      rejected_reason: reason,
      processed_at: new Date().toISOString(),
      processed_by: user.id,
    })
    .eq('id', claimId);

  if (error) throw error;
}

/**
 * Get claim statistics for admin dashboard
 */
export async function getClaimStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> {
  if (!isSupabaseConfigured) {
    return { pending: 3, approved: 12, rejected: 2, total: 17 };
  }

  const { data, error } = await supabase
    .from('gym_claim_requests')
    .select('status');

  if (error) throw error;

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: data?.length || 0,
  };

  data?.forEach((claim) => {
    if (claim.status === 'pending' || claim.status === 'verifying') {
      stats.pending++;
    } else if (claim.status === 'approved') {
      stats.approved++;
    } else if (claim.status === 'rejected') {
      stats.rejected++;
    }
  });

  return stats;
}

function getMockPendingClaims(): (GymClaimRequest & { gym: DirectoryGym })[] {
  return [
    {
      id: 'mock-claim-1',
      gym_directory_id: 'mock-gym-2',
      claimant_id: 'mock-user-1',
      verification_method: 'email',
      verification_code: null,
      verification_sent_at: null,
      verification_attempts: 0,
      proof_document_url: null,
      admin_notes: null,
      status: 'pending',
      rejected_reason: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      processed_at: null,
      processed_by: null,
      gym: {
        id: 'mock-gym-2',
        name: 'Fight Academy Vilnius',
        slug: 'fight-academy-vilnius',
        country_code: 'LT',
        country_name: 'Lithuania',
        city: 'Vilnius',
        address: 'Kalvarijų g. 125, Vilnius',
        latitude: 54.7023,
        longitude: 25.2798,
        phone: '+370 600 54321',
        email: 'info@fightacademy.lt',
        website: 'https://fightacademy.lt',
        instagram: 'fightacademyvilnius',
        facebook: null,
        sports: ['mma', 'muay_thai'] as CombatSport[],
        is_claimed: false,
        claimed_by: null,
        claimed_at: null,
        gym_id: null,
        source: 'manual',
        source_id: null,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'mock-claim-2',
      gym_directory_id: 'mock-gym-3',
      claimant_id: 'mock-user-2',
      verification_method: 'manual',
      verification_code: null,
      verification_sent_at: null,
      verification_attempts: 0,
      proof_document_url: 'uploaded://proof.jpg',
      admin_notes: null,
      status: 'pending',
      rejected_reason: null,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      processed_at: null,
      processed_by: null,
      gym: {
        id: 'mock-gym-3',
        name: 'Kaunas MMA Center',
        slug: 'kaunas-mma-center',
        country_code: 'LT',
        country_name: 'Lithuania',
        city: 'Kaunas',
        address: 'Savanorių pr. 200, Kaunas',
        latitude: 54.8985,
        longitude: 23.9036,
        phone: '+370 600 98765',
        email: 'info@kaunasmma.lt',
        website: null,
        instagram: 'kaunasmma',
        facebook: null,
        sports: ['mma', 'boxing'] as CombatSport[],
        is_claimed: false,
        claimed_by: null,
        claimed_at: null,
        gym_id: null,
        source: 'manual',
        source_id: null,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ];
}

/**
 * Get gym count by sport for a country
 */
export async function getGymCountBySport(countryCode: string): Promise<Record<CombatSport, number>> {
  if (!isSupabaseConfigured) {
    return {
      boxing: 15,
      mma: 12,
      muay_thai: 8,
      kickboxing: 10,
    };
  }

  const { data, error } = await supabase
    .from('gym_directory')
    .select('sports')
    .eq('country_code', countryCode);

  if (error) throw error;

  const counts: Record<string, number> = {
    boxing: 0,
    mma: 0,
    muay_thai: 0,
    kickboxing: 0,
  };

  data?.forEach(gym => {
    gym.sports?.forEach((sport: string) => {
      if (counts[sport] !== undefined) {
        counts[sport]++;
      }
    });
  });

  return counts as Record<CombatSport, number>;
}

// ============================================
// MOCK DATA FOR DEMO MODE
// ============================================

function getMockCountries(): DirectoryCountry[] {
  return [
    { code: 'LT', name: 'Lithuania', name_native: 'Lietuva', is_active: true, gym_count: 47, last_updated: null },
    { code: 'PL', name: 'Poland', name_native: 'Polska', is_active: true, gym_count: 156, last_updated: null },
    { code: 'HR', name: 'Croatia', name_native: 'Hrvatska', is_active: true, gym_count: 38, last_updated: null },
    { code: 'RS', name: 'Serbia', name_native: 'Србија', is_active: true, gym_count: 42, last_updated: null },
    { code: 'EE', name: 'Estonia', name_native: 'Eesti', is_active: true, gym_count: 23, last_updated: null },
    { code: 'LV', name: 'Latvia', name_native: 'Latvija', is_active: true, gym_count: 28, last_updated: null },
    { code: 'BG', name: 'Bulgaria', name_native: 'България', is_active: true, gym_count: 35, last_updated: null },
    { code: 'RO', name: 'Romania', name_native: 'România', is_active: true, gym_count: 52, last_updated: null },
    { code: 'HU', name: 'Hungary', name_native: 'Magyarország', is_active: true, gym_count: 44, last_updated: null },
    { code: 'SI', name: 'Slovenia', name_native: 'Slovenija', is_active: true, gym_count: 18, last_updated: null },
    { code: 'SK', name: 'Slovakia', name_native: 'Slovensko', is_active: true, gym_count: 31, last_updated: null },
    { code: 'FI', name: 'Finland', name_native: 'Suomi', is_active: true, gym_count: 67, last_updated: null },
    { code: 'RU', name: 'Russia', name_native: 'Россия', is_active: true, gym_count: 234, last_updated: null },
    { code: 'GE', name: 'Georgia', name_native: 'საქართველო', is_active: true, gym_count: 29, last_updated: null },
  ];
}

function getMockCities(countryCode: string): string[] {
  const cities: Record<string, string[]> = {
    LT: ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys'],
    PL: ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan', 'Lodz'],
    HR: ['Zagreb', 'Split', 'Rijeka', 'Osijek'],
    RS: ['Belgrade', 'Novi Sad', 'Niš'],
    EE: ['Tallinn', 'Tartu', 'Narva'],
    LV: ['Riga', 'Daugavpils', 'Liepāja'],
    BG: ['Sofia', 'Plovdiv', 'Varna', 'Burgas'],
    RO: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași'],
    HU: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc'],
    SI: ['Ljubljana', 'Maribor'],
    SK: ['Bratislava', 'Košice'],
    FI: ['Helsinki', 'Espoo', 'Tampere', 'Turku'],
    RU: ['Moscow', 'Saint Petersburg', 'Kazan', 'Yekaterinburg'],
    GE: ['Tbilisi', 'Batumi', 'Kutaisi'],
  };
  return cities[countryCode] || [];
}

function getMockGyms(params: DirectorySearchParams): DirectoryGym[] {
  const mockGyms: DirectoryGym[] = [
    {
      id: 'mock-gym-1',
      name: 'Elite Boxing Club',
      slug: 'elite-boxing-club-vilnius',
      country_code: 'LT',
      country_name: 'Lithuania',
      city: 'Vilnius',
      address: 'Gedimino pr. 50, Vilnius',
      latitude: 54.6872,
      longitude: 25.2797,
      phone: '+370 600 12345',
      email: 'info@eliteboxing.lt',
      website: 'https://eliteboxing.lt',
      instagram: 'eliteboxingvilnius',
      facebook: null,
      sports: ['boxing', 'kickboxing'] as CombatSport[],
      is_claimed: true,
      claimed_by: 'mock-user-1',
      claimed_at: new Date().toISOString(),
      gym_id: 'mock-real-gym-1',
      source: 'manual',
      source_id: null,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-gym-2',
      name: 'Fight Academy Vilnius',
      slug: 'fight-academy-vilnius',
      country_code: 'LT',
      country_name: 'Lithuania',
      city: 'Vilnius',
      address: 'Kalvarijų g. 125, Vilnius',
      latitude: 54.7023,
      longitude: 25.2798,
      phone: '+370 600 54321',
      email: null,
      website: 'https://fightacademy.lt',
      instagram: 'fightacademyvilnius',
      facebook: null,
      sports: ['mma', 'muay_thai'] as CombatSport[],
      is_claimed: false,
      claimed_by: null,
      claimed_at: null,
      gym_id: null,
      source: 'manual',
      source_id: null,
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-gym-3',
      name: 'Kaunas MMA Center',
      slug: 'kaunas-mma-center',
      country_code: 'LT',
      country_name: 'Lithuania',
      city: 'Kaunas',
      address: 'Savanorių pr. 200, Kaunas',
      latitude: 54.8985,
      longitude: 23.9036,
      phone: '+370 600 98765',
      email: 'info@kaunasmma.lt',
      website: null,
      instagram: 'kaunasmma',
      facebook: null,
      sports: ['mma', 'boxing'] as CombatSport[],
      is_claimed: false,
      claimed_by: null,
      claimed_at: null,
      gym_id: null,
      source: 'manual',
      source_id: null,
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Filter by params
  let filtered = mockGyms;

  if (params.country_code) {
    filtered = filtered.filter(g => g.country_code === params.country_code);
  }

  if (params.city) {
    filtered = filtered.filter(g => g.city.toLowerCase() === params.city?.toLowerCase());
  }

  if (params.sport) {
    filtered = filtered.filter(g => g.sports.includes(params.sport!));
  }

  if (params.search_term) {
    const term = params.search_term.toLowerCase();
    filtered = filtered.filter(g => g.name.toLowerCase().includes(term));
  }

  if (params.claimed_only !== undefined) {
    filtered = filtered.filter(g => g.is_claimed === params.claimed_only);
  }

  return filtered;
}