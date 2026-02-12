import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TierBreakdown, ReferrerType } from '../types';
import { getTierBreakdown } from '../services/affiliate';

// Types
export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'cancelled';
  completedAt?: string;
  createdAt: string;
  referredUser?: {
    role: string;
    name: string;
    email: string;
  };
}

export interface AffiliateStats {
  id: string;
  userId: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarningsCents: number;
  pendingEarningsCents: number;
  paidEarningsCents: number;
  fighterReferrals: number;
  gymReferrals: number;
  coachReferrals: number;
  updatedAt: string;
  createdAt: string;
}

export interface AffiliateEarning {
  id: string;
  referrerId: string;
  referredId: string;
  amountCents: number;
  commissionRate: number;
  sourceType: 'subscription' | 'merchandise' | 'event_fee' | 'premium_feature' | 'one_time_bonus';
  sourceId?: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}

interface ReferralContextType {
  // User's referral code
  referralCode: ReferralCode | null;

  // Stats
  affiliateStats: AffiliateStats | null;

  // Referrals made by user
  referrals: Referral[];

  // Earnings (future)
  earnings: AffiliateEarning[];

  // Multi-tier breakdown
  tierBreakdown: TierBreakdown | null;
  tierLoading: boolean;

  // Loading states
  loading: boolean;

  // Actions
  generateReferralCode: () => Promise<string>;
  fetchReferralData: () => Promise<void>;
  fetchTierBreakdown: () => Promise<void>;
  shareReferralCode: () => Promise<void>;
  copyReferralCode: () => Promise<void>;
  generateEventShareUrl: (eventId: string) => string;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

// Mock data for demo mode
const MOCK_REFERRAL_CODE: ReferralCode = {
  id: 'ref-1',
  userId: 'user-1',
  code: 'FTR-JOHN-X7K9M2',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const MOCK_STATS: AffiliateStats = {
  id: 'stat-1',
  userId: 'user-1',
  totalReferrals: 8,
  completedReferrals: 6,
  pendingReferrals: 2,
  totalEarningsCents: 0, // Future
  pendingEarningsCents: 0,
  paidEarningsCents: 0,
  fighterReferrals: 5,
  gymReferrals: 3,
  coachReferrals: 0,
  updatedAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const MOCK_REFERRALS: Referral[] = [
  {
    id: 'ref-1',
    referrerId: 'user-1',
    referredId: 'user-2',
    referralCode: 'FTR-JOHN-X7K9M2',
    status: 'completed',
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    referredUser: {
      role: 'fighter',
      name: 'Marcus Petrov',
      email: 'marcus@email.com',
    },
  },
  {
    id: 'ref-2',
    referrerId: 'user-1',
    referredId: 'user-3',
    referralCode: 'FTR-JOHN-X7K9M2',
    status: 'completed',
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    referredUser: {
      role: 'fighter',
      name: 'Sarah Chen',
      email: 'sarah@email.com',
    },
  },
  {
    id: 'ref-3',
    referrerId: 'user-1',
    referredId: 'user-4',
    referralCode: 'FTR-JOHN-X7K9M2',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    referredUser: {
      role: 'fighter',
      name: 'Alex Rodriguez',
      email: 'alex@email.com',
    },
  },
  {
    id: 'ref-4',
    referrerId: 'user-1',
    referredId: 'user-5',
    referralCode: 'FTR-JOHN-X7K9M2',
    status: 'completed',
    completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    referredUser: {
      role: 'gym',
      name: 'Iron Fist Club',
      email: 'iron@fist.com',
    },
  },
  {
    id: 'ref-5',
    referrerId: 'user-1',
    referredId: 'user-6',
    referralCode: 'FTR-JOHN-X7K9M2',
    status: 'completed',
    completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    referredUser: {
      role: 'fighter',
      name: 'Javier Mendez',
      email: 'javier@email.com',
    },
  },
  {
    id: 'ref-6',
    referrerId: 'user-1',
    referredId: 'user-7',
    referralCode: 'FTR-JOHN-X7K9M2',
    status: 'pending',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    referredUser: {
      role: 'gym',
      name: 'Elite Boxing Academy',
      email: 'elite@boxing.com',
    },
  },
];

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const { profile, role } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierBreakdown, setTierBreakdown] = useState<TierBreakdown | null>(null);
  const [tierLoading, setTierLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchReferralData();
      fetchTierBreakdown();
    }
  }, [profile]);

  const fetchTierBreakdown = useCallback(async () => {
    if (!profile || !role) {
      return;
    }

    try {
      setTierLoading(true);
      const userType = role as ReferrerType;
      const breakdown = await getTierBreakdown(profile.id, userType);
      setTierBreakdown(breakdown);
    } catch (error) {
      console.error('[Referral] Error fetching tier breakdown:', error);
    } finally {
      setTierLoading(false);
    }
  }, [profile, role]);

  const generateEventShareUrl = (eventId: string): string => {
    const baseUrl = 'https://fightstation.app/events';
    if (referralCode) {
      return `${baseUrl}/${eventId}?ref=${referralCode.code}`;
    }
    return `${baseUrl}/${eventId}`;
  };

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured || !profile) {
        // Demo mode: Use mock data
        console.log('[Referral] Using mock data (Supabase not configured)');
        await new Promise(resolve => setTimeout(resolve, 500));
        setReferralCode(MOCK_REFERRAL_CODE);
        setAffiliateStats(MOCK_STATS);
        setReferrals(MOCK_REFERRALS);
        setEarnings([]);
        return;
      }

      console.log('[Referral] Fetching real data from Supabase for user:', profile.id);

      // Fetch referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (codeError && codeError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected if code hasn't been created yet
        console.error('[Referral] Error fetching code:', codeError);
      } else if (codeData) {
        setReferralCode({
          id: codeData.id,
          userId: codeData.user_id,
          code: codeData.code,
          isActive: codeData.is_active,
          createdAt: codeData.created_at,
        });
      }

      // Fetch affiliate stats
      const { data: statsData, error: statsError } = await supabase
        .from('affiliate_stats')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('[Referral] Error fetching stats:', statsError);
      } else if (statsData) {
        setAffiliateStats({
          id: statsData.id,
          userId: statsData.user_id,
          totalReferrals: statsData.total_referrals || 0,
          completedReferrals: statsData.completed_referrals || 0,
          pendingReferrals: statsData.pending_referrals || 0,
          totalEarningsCents: statsData.total_earnings_cents || 0,
          pendingEarningsCents: statsData.pending_earnings_cents || 0,
          paidEarningsCents: statsData.paid_earnings_cents || 0,
          fighterReferrals: statsData.fighter_referrals || 0,
          gymReferrals: statsData.gym_referrals || 0,
          coachReferrals: statsData.coach_referrals || 0,
          updatedAt: statsData.updated_at,
          createdAt: statsData.created_at,
        });
      } else {
        // Initialize empty stats if none exist
        setAffiliateStats({
          id: '',
          userId: profile.id,
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalEarningsCents: 0,
          pendingEarningsCents: 0,
          paidEarningsCents: 0,
          fighterReferrals: 0,
          gymReferrals: 0,
          coachReferrals: 0,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }

      // Fetch referrals list with referred user details
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_profile:profiles!referred_id (
            id,
            role,
            email
          )
        `)
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('[Referral] Error fetching referrals:', referralsError);
      } else if (referralsData) {
        // Fetch names from fighters/gyms/coaches tables
        const referralsWithNames = await Promise.all(
          referralsData.map(async (ref) => {
            let name = 'Unknown User';
            const referredProfile = ref.referred_profile;

            if (referredProfile) {
              // Fetch name based on role
              if (referredProfile.role === 'fighter') {
                const { data: fighter } = await supabase
                  .from('fighters')
                  .select('name')
                  .eq('user_id', referredProfile.id)
                  .single();
                if (fighter) name = fighter.name;
              } else if (referredProfile.role === 'gym') {
                const { data: gym } = await supabase
                  .from('gyms')
                  .select('name')
                  .eq('user_id', referredProfile.id)
                  .single();
                if (gym) name = gym.name;
              } else if (referredProfile.role === 'coach') {
                // Add coach table lookup when coach profiles are implemented
                name = 'Coach';
              }
            }

            return {
              id: ref.id,
              referrerId: ref.referrer_id,
              referredId: ref.referred_id,
              referralCode: ref.referral_code,
              status: ref.status as 'pending' | 'completed' | 'cancelled',
              completedAt: ref.completed_at || undefined,
              createdAt: ref.created_at,
              referredUser: referredProfile ? {
                role: referredProfile.role,
                name,
                email: referredProfile.email,
              } : undefined,
            };
          })
        );

        setReferrals(referralsWithNames);
      } else {
        setReferrals([]);
      }

      // Fetch earnings (future feature)
      setEarnings([]);

      console.log('[Referral] Successfully fetched referral data');
    } catch (error) {
      console.error('[Referral] Error fetching referral data:', error);
      // Fall back to empty data on error
      setReferralCode(null);
      setAffiliateStats(null);
      setReferrals([]);
      setEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async (): Promise<string> => {
    if (!isSupabaseConfigured || !profile) {
      console.log('[Referral] Demo mode: returning mock code');
      return MOCK_REFERRAL_CODE.code;
    }

    try {
      // Get user's role from AuthContext
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user) throw new Error('No authenticated user');

      // Get profile with role information
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.user.id)
        .single();

      if (!profileData) throw new Error('Profile not found');

      // Get name based on role
      let userName = 'User';
      if (profileData.role === 'fighter' || profileData.role === 'coach') {
        const roleProfile = profile as any;
        userName = roleProfile.first_name || roleProfile.last_name || 'User';
      } else if (profileData.role === 'gym') {
        userName = (profile as any).name || 'Gym';
      }

      // Call the database function to generate a unique code
      const { data, error } = await supabase.rpc('generate_referral_code', {
        user_role: profileData.role,
        user_name: userName,
      });

      if (error) {
        console.error('[Referral] Error generating code:', error);
        throw error;
      }

      const newCode = data as string;

      // Insert the code into referral_codes table
      const { error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: authUser.user.id,
          code: newCode,
          is_active: true,
        });

      if (insertError) {
        console.error('[Referral] Error inserting code:', insertError);
        throw insertError;
      }

      console.log('[Referral] Generated new code:', newCode);

      // Refresh data to show new code
      await fetchReferralData();

      return newCode;
    } catch (error) {
      console.error('[Referral] Failed to generate referral code:', error);
      return MOCK_REFERRAL_CODE.code;
    }
  };

  const shareReferralCode = async () => {
    if (!referralCode) return;

    const message = `Join Fight Station and connect with boxing gyms and fighters! Use my referral code: ${referralCode.code}\n\nDownload: https://fightstation.app/join/${referralCode.code}`;

    try {
      if (Platform.OS !== 'web') {
        // Native share on iOS/Android
        await Share.share({
          message,
          title: 'Join Fight Station',
        });
      } else {
        // Web share API
        if (navigator.share) {
          await navigator.share({
            text: message,
            title: 'Join Fight Station',
          });
        } else {
          // Fallback: copy to clipboard
          await copyReferralCode();
          alert('Referral code copied! Share it with your friends.');
        }
      }
      console.log('[Referral] Shared code:', referralCode.code);
    } catch (error) {
      console.error('[Referral] Error sharing:', error);
      // User cancelled or error occurred
    }
  };

  const copyReferralCode = async () => {
    if (!referralCode) return;

    try {
      if (Platform.OS !== 'web') {
        // Native clipboard on iOS/Android
        await Clipboard.setStringAsync(referralCode.code);
      } else {
        // Web clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(referralCode.code);
        }
      }
      alert('Referral code copied!');
      console.log('[Referral] Copied code:', referralCode.code);
    } catch (error) {
      console.error('[Referral] Error copying:', error);
      alert('Failed to copy code. Please try again.');
    }
  };

  return (
    <ReferralContext.Provider
      value={{
        referralCode,
        affiliateStats,
        referrals,
        earnings,
        tierBreakdown,
        tierLoading,
        loading,
        generateReferralCode,
        fetchReferralData,
        fetchTierBreakdown,
        shareReferralCode,
        copyReferralCode,
        generateEventShareUrl,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
}
