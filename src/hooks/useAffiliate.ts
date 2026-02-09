import { useState, useEffect, useCallback } from 'react';
import {
  TierBreakdown,
  EarningsSummary,
  AffiliateEarning,
  ReferralNetworkMember,
  CommissionRate,
  ReferralChain,
  ReferrerType,
} from '../types';
import {
  getTierBreakdown,
  getEarningsSummary,
  getEarningsHistory,
  getReferralNetwork,
  getCommissionRates,
  getReferralChain,
} from '../services/affiliate';

/**
 * Hook to get tier breakdown for dashboard
 */
export function useTierBreakdown(userId: string | null, userType: ReferrerType) {
  const [breakdown, setBreakdown] = useState<TierBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBreakdown = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getTierBreakdown(userId, userType);
      setBreakdown(data);
    } catch (err) {
      console.error('Error fetching tier breakdown:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tier breakdown'));
    } finally {
      setLoading(false);
    }
  }, [userId, userType]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  return {
    breakdown,
    loading,
    error,
    refetch: fetchBreakdown,
  };
}

/**
 * Hook to get earnings summary by tier
 */
export function useEarningsSummary(userId: string | null) {
  const [summary, setSummary] = useState<EarningsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getEarningsSummary(userId);
      setSummary(data);
    } catch (err) {
      console.error('Error fetching earnings summary:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch earnings summary'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}

/**
 * Hook to get earnings history with pagination
 */
export function useEarningsHistory(userId: string | null, pageSize: number = 20) {
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEarnings = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await getEarningsHistory(userId, pageSize, offset);

      if (append) {
        setEarnings(prev => [...prev, ...data]);
      } else {
        setEarnings(data);
      }

      setHasMore(data.length === pageSize);
    } catch (err) {
      console.error('Error fetching earnings history:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch earnings'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, pageSize]);

  useEffect(() => {
    fetchEarnings(0, false);
  }, [fetchEarnings]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchEarnings(earnings.length, true);
    }
  }, [fetchEarnings, earnings.length, loadingMore, hasMore]);

  return {
    earnings,
    loading,
    loadingMore,
    hasMore,
    error,
    refetch: () => fetchEarnings(0, false),
    loadMore,
  };
}

/**
 * Hook to get referral network (direct and indirect referrals)
 */
export function useReferralNetwork(userId: string | null) {
  const [network, setNetwork] = useState<ReferralNetworkMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNetwork = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getReferralNetwork(userId);
      setNetwork(data);
    } catch (err) {
      console.error('Error fetching referral network:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch referral network'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  // Separate network by tier
  const tier1Referrals = network.filter(m => m.tier === 1);
  const tier2Referrals = network.filter(m => m.tier === 2);

  return {
    network,
    tier1Referrals,
    tier2Referrals,
    loading,
    error,
    refetch: fetchNetwork,
  };
}

/**
 * Hook to get user's referral chain (who referred them)
 */
export function useReferralChain(userId: string | null) {
  const [chain, setChain] = useState<ReferralChain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChain = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getReferralChain(userId);
      setChain(data);
    } catch (err) {
      console.error('Error fetching referral chain:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch referral chain'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchChain();
  }, [fetchChain]);

  return {
    chain,
    loading,
    error,
    refetch: fetchChain,
  };
}

/**
 * Hook to get commission rates (for display or admin management)
 */
export function useCommissionRates() {
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCommissionRates();
      setRates(data);
    } catch (err) {
      console.error('Error fetching commission rates:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch commission rates'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Group rates by type and tier for easy access
  const ratesByType = {
    gym: {
      tier1: rates.filter(r => r.referrer_type === 'gym' && r.tier_level === 1),
      tier2: rates.filter(r => r.referrer_type === 'gym' && r.tier_level === 2),
    },
    fighter: {
      tier1: rates.filter(r => r.referrer_type === 'fighter' && r.tier_level === 1),
      tier2: rates.filter(r => r.referrer_type === 'fighter' && r.tier_level === 2),
    },
    coach: {
      tier1: rates.filter(r => r.referrer_type === 'coach' && r.tier_level === 1),
      tier2: rates.filter(r => r.referrer_type === 'coach' && r.tier_level === 2),
    },
  };

  return {
    rates,
    ratesByType,
    loading,
    error,
    refetch: fetchRates,
  };
}