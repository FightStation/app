import * as Linking from 'expo-linking';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type DeepLinkType = 'join' | 'event' | 'fighter' | 'gym' | 'unknown';

export interface ParsedDeepLink {
  type: DeepLinkType;
  id?: string;
  referralCode?: string;
  rawUrl: string;
}

/**
 * Parse a deep link URL into structured data
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  const parsed = Linking.parse(url);
  const path = parsed.path || '';
  const queryParams = parsed.queryParams || {};

  // fightstation://join/REFCODE or https://fightstation.app/join/REFCODE
  if (path.startsWith('join')) {
    const parts = path.split('/');
    return {
      type: 'join',
      referralCode: parts[1] || (queryParams.ref as string),
      rawUrl: url,
    };
  }

  // fightstation://events/{eventId} or https://fightstation.app/events/{eventId}
  if (path.startsWith('events')) {
    const parts = path.split('/');
    return {
      type: 'event',
      id: parts[1],
      referralCode: queryParams.ref as string,
      rawUrl: url,
    };
  }

  // fightstation://fighters/{fighterId}
  if (path.startsWith('fighters')) {
    const parts = path.split('/');
    return {
      type: 'fighter',
      id: parts[1],
      referralCode: queryParams.ref as string,
      rawUrl: url,
    };
  }

  // fightstation://gyms/{gymId}
  if (path.startsWith('gyms')) {
    const parts = path.split('/');
    return {
      type: 'gym',
      id: parts[1],
      referralCode: queryParams.ref as string,
      rawUrl: url,
    };
  }

  return {
    type: 'unknown',
    rawUrl: url,
  };
}

/**
 * Track a referral link click in the database
 */
export async function trackReferralClick(
  referralCode: string,
  targetType: DeepLinkType,
  targetId?: string
): Promise<void> {
  if (!isSupabaseConfigured || !referralCode) {
    console.log('Demo mode: Would track referral click:', { referralCode, targetType, targetId });
    return;
  }

  try {
    const { error } = await supabase.from('referral_clicks').insert({
      referral_code: referralCode.toUpperCase(),
      target_type: targetType,
      target_id: targetId || null,
    });

    if (error) {
      console.error('Error tracking referral click:', error);
    } else {
      console.log('Referral click tracked:', { referralCode, targetType, targetId });
    }
  } catch (error) {
    console.error('Error tracking referral click:', error);
  }
}

/**
 * Mark a referral click as converted (user completed signup)
 */
export async function markReferralConverted(
  referralCode: string,
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured || !referralCode) return;

  try {
    // Find the most recent untracked click for this referral code
    const { data, error: selectError } = await supabase
      .from('referral_clicks')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .eq('converted', false)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .single();

    if (selectError || !data) return;

    // Mark it as converted
    const { error } = await supabase
      .from('referral_clicks')
      .update({
        converted: true,
        conversion_user_id: userId,
      })
      .eq('id', data.id);

    if (error) {
      console.error('Error marking referral converted:', error);
    }
  } catch (error) {
    console.error('Error marking referral converted:', error);
  }
}

/**
 * Generate a shareable URL with optional referral tracking
 */
export function generateShareableEventUrl(eventId: string, referralCode?: string): string {
  const base = `https://fightstation.app/events/${eventId}`;
  return referralCode ? `${base}?ref=${referralCode}` : base;
}

export function generateShareableProfileUrl(
  type: 'fighter' | 'gym',
  id: string,
  referralCode?: string
): string {
  const base = `https://fightstation.app/${type}s/${id}`;
  return referralCode ? `${base}?ref=${referralCode}` : base;
}

export function generateShareableReferralUrl(referralCode: string): string {
  return `https://fightstation.app/join/${referralCode}`;
}
