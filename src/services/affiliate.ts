import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CommissionRate,
  ReferralChain,
  AffiliateTransaction,
  AffiliateEarning,
  EarningsSummary,
  ReferralNetworkMember,
  TierBreakdown,
  TransactionType,
  ReferrerType,
} from '../types';

/**
 * Get all active commission rates
 */
export async function getCommissionRates(): Promise<CommissionRate[]> {
  if (!isSupabaseConfigured) {
    return getMockCommissionRates();
  }

  const { data, error } = await supabase
    .from('commission_rates')
    .select('*')
    .eq('is_active', true)
    .order('referrer_type')
    .order('tier_level');

  if (error) throw error;
  return data || [];
}

/**
 * Get commission rate for a specific tier and type
 */
export async function getCommissionRate(
  referrerType: ReferrerType,
  tierLevel: number,
  transactionType?: TransactionType
): Promise<CommissionRate | null> {
  if (!isSupabaseConfigured) {
    const rates = getMockCommissionRates();
    return rates.find(r =>
      r.referrer_type === referrerType &&
      r.tier_level === tierLevel &&
      (r.transaction_type === transactionType || r.transaction_type === null)
    ) || null;
  }

  let query = supabase
    .from('commission_rates')
    .select('*')
    .eq('referrer_type', referrerType)
    .eq('tier_level', tierLevel)
    .eq('is_active', true);

  if (transactionType) {
    query = query.or(`transaction_type.eq.${transactionType},transaction_type.is.null`);
  }

  const { data, error } = await query
    .order('transaction_type', { nullsFirst: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Update commission rate (admin only - uses service role)
 */
export async function updateCommissionRate(
  rateKey: string,
  newPercentage: number
): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would update rate', rateKey, newPercentage);
    return;
  }

  const { error } = await supabase
    .from('commission_rates')
    .update({
      rate_percentage: newPercentage,
      updated_at: new Date().toISOString(),
    })
    .eq('rate_key', rateKey);

  if (error) throw error;
}

/**
 * Get user's referral chain
 */
export async function getReferralChain(userId: string): Promise<ReferralChain | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from('referral_chains')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get earnings summary by tier for a user
 */
export async function getEarningsSummary(userId: string): Promise<EarningsSummary[]> {
  if (!isSupabaseConfigured) {
    return getMockEarningsSummary();
  }

  const { data, error } = await supabase.rpc('get_earnings_summary', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Get user's earnings with transaction details
 */
export async function getEarningsHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AffiliateEarning[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('affiliate_earnings')
    .select(`
      *,
      transaction:affiliate_transactions (
        transaction_type,
        gross_amount,
        transaction_date
      )
    `)
    .eq('beneficiary_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

/**
 * Get user's referral network (people they referred and sub-referrals)
 */
export async function getReferralNetwork(userId: string): Promise<ReferralNetworkMember[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_referral_network', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Get tier breakdown for dashboard display
 */
export async function getTierBreakdown(userId: string, userType: ReferrerType): Promise<TierBreakdown> {
  if (!isSupabaseConfigured) {
    return getMockTierBreakdown();
  }

  // Get earnings summary
  const earningsSummary = await getEarningsSummary(userId);

  // Get commission rates for display
  const [tier1Rate, tier2Rate] = await Promise.all([
    getCommissionRate(userType, 1),
    getCommissionRate(userType, 2),
  ]);

  // Get referral counts
  const { data: tier1Referrals } = await supabase
    .from('referrals')
    .select('id', { count: 'exact' })
    .eq('referrer_id', userId)
    .eq('status', 'completed');

  const { data: tier2Referrals } = await supabase
    .from('referral_chains')
    .select('id', { count: 'exact' })
    .contains('chain_path', [{ user_id: userId }])
    .neq('direct_referrer_id', userId);

  const tier1Summary = earningsSummary.find(s => s.tier_level === 1);
  const tier2Summary = earningsSummary.find(s => s.tier_level === 2);

  return {
    tier1: {
      total_referrals: tier1Referrals?.length || 0,
      total_earned: tier1Summary?.total_earned || 0,
      pending_earned: tier1Summary?.pending_amount || 0,
      rate: tier1Rate?.rate_percentage || 0,
    },
    tier2: {
      total_referrals: tier2Referrals?.length || 0,
      total_earned: tier2Summary?.total_earned || 0,
      pending_earned: tier2Summary?.pending_amount || 0,
      rate: tier2Rate?.rate_percentage || 0,
    },
    total_earned: (tier1Summary?.total_earned || 0) + (tier2Summary?.total_earned || 0),
    total_pending: (tier1Summary?.pending_amount || 0) + (tier2Summary?.pending_amount || 0),
  };
}

/**
 * Create an affiliate transaction (called when payment is processed)
 * This triggers commission calculation via database function
 */
export async function createAffiliateTransaction(
  transactionType: TransactionType,
  payerId: string,
  payerType: ReferrerType,
  grossAmount: number,
  platformFeePercentage: number = 30,
  externalId?: string
): Promise<string> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would create transaction', {
      transactionType,
      payerId,
      grossAmount,
    });
    return 'mock-transaction-id';
  }

  const { data, error } = await supabase.rpc('create_affiliate_transaction', {
    p_transaction_type: transactionType,
    p_payer_id: payerId,
    p_payer_type: payerType,
    p_gross_amount: grossAmount,
    p_platform_fee_percentage: platformFeePercentage,
    p_external_id: externalId,
  });

  if (error) throw error;
  return data;
}

/**
 * Get transactions for a payer
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<AffiliateTransaction[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('affiliate_transactions')
    .select('*')
    .eq('payer_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================
// MOCK DATA FOR DEMO MODE
// ============================================

function getMockCommissionRates(): CommissionRate[] {
  return [
    {
      id: 'mock-1',
      rate_key: 'gym_tier1_membership',
      display_name: 'Gym Direct - Membership',
      referrer_type: 'gym',
      tier_level: 1,
      rate_percentage: 15,
      transaction_type: 'membership',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      rate_key: 'gym_tier2_all',
      display_name: 'Gym Tier 2',
      referrer_type: 'gym',
      tier_level: 2,
      rate_percentage: 5,
      transaction_type: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-3',
      rate_key: 'fighter_tier1_membership',
      display_name: 'Fighter Direct',
      referrer_type: 'fighter',
      tier_level: 1,
      rate_percentage: 10,
      transaction_type: 'membership',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-4',
      rate_key: 'fighter_tier2_all',
      display_name: 'Fighter Tier 2',
      referrer_type: 'fighter',
      tier_level: 2,
      rate_percentage: 3,
      transaction_type: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

function getMockEarningsSummary(): EarningsSummary[] {
  return [
    {
      tier_level: 1,
      total_earned: 150.00,
      pending_amount: 45.00,
      approved_amount: 55.00,
      paid_amount: 50.00,
      transaction_count: 10,
    },
    {
      tier_level: 2,
      total_earned: 25.00,
      pending_amount: 10.00,
      approved_amount: 10.00,
      paid_amount: 5.00,
      transaction_count: 5,
    },
  ];
}

function getMockTierBreakdown(): TierBreakdown {
  return {
    tier1: {
      total_referrals: 8,
      total_earned: 150.00,
      pending_earned: 45.00,
      rate: 15,
    },
    tier2: {
      total_referrals: 3,
      total_earned: 25.00,
      pending_earned: 10.00,
      rate: 5,
    },
    total_earned: 175.00,
    total_pending: 55.00,
  };
}