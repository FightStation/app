import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole, Fighter, Gym, Coach } from '../types';
import { registerForPushNotifications, savePushToken, removePushToken } from '../services/notifications';
import * as Notifications from 'expo-notifications';

// Demo mode flag - set to false to use real Supabase authentication
const DEMO_MODE = false;
// Change this to 'gym' to test gym features
const DEMO_ROLE: UserRole = 'fighter'; // 'fighter' | 'gym' | 'coach'

// Mock demo user data
const DEMO_FIGHTER: Fighter = {
  id: 'demo-fighter-001',
  user_id: 'demo-user-001',
  first_name: 'Mikk',
  last_name: 'Maal',
  weight_class: 'welterweight',
  experience_level: 'intermediate',
  bio: 'Amateur boxer training for 2 years. Looking for sparring partners in the welterweight division.',
  country: 'Estonia',
  city: 'Tallinn',
  fights_count: 3,
  sparring_count: 24,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_GYM: Gym = {
  id: 'demo-gym-001',
  user_id: 'demo-user-002',
  name: 'Elite Boxing Academy',
  description: 'Premier boxing facility in Berlin offering technical and competitive sparring sessions.',
  country: 'Germany',
  city: 'Berlin',
  address: 'Friedrichstraße 123, 10117 Berlin',
  photos: [],
  facilities: ['Boxing Ring', 'Heavy Bags', 'Speed Bags', 'Weights', 'Locker Rooms'],
  contact_email: 'info@eliteboxing.de',
  contact_phone: '+49 30 1234567',
  website: 'https://eliteboxing.de',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: Fighter | Gym | Coach | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    profile: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    // Demo mode - auto login with mock data
    if (DEMO_MODE) {
      console.log(`[Fight Station] Running in DEMO MODE as ${DEMO_ROLE}`);
      const demoProfile = DEMO_ROLE === 'fighter' ? DEMO_FIGHTER : DEMO_GYM;
      const demoUserId = DEMO_ROLE === 'fighter' ? 'demo-user-001' : 'demo-user-002';

      setState({
        user: { id: demoUserId, email: 'demo@fightstation.com' } as User,
        session: null,
        role: DEMO_ROLE,
        profile: demoProfile,
        loading: false,
        initialized: true,
      });
      return;
    }

    // If Supabase isn't configured, just show the UI without auth
    if (!isSupabaseConfigured) {
      console.log('[Fight Station] Supabase not configured - running in demo mode');
      setState(prev => ({
        ...prev,
        loading: false,
        initialized: true,
      }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      }));
    }).catch((error) => {
      console.error('[Fight Station] Auth error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        initialized: true,
      }));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setState(prev => ({
            ...prev,
            role: null,
            profile: null,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    if (DEMO_MODE || !isSupabaseConfigured) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Check user_roles table first
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!roleData?.role) {
        setState(prev => ({ ...prev, loading: false, role: null, profile: null }));
        return;
      }

      const role = roleData.role as UserRole;
      let profile = null;

      // Fetch profile based on role
      if (role === 'fighter') {
        const { data } = await supabase
          .from('fighters')
          .select('*')
          .eq('user_id', userId)
          .single();
        profile = data;
      } else if (role === 'gym') {
        const { data } = await supabase
          .from('gyms')
          .select('*')
          .eq('user_id', userId)
          .single();
        profile = data;
      } else if (role === 'coach') {
        const { data } = await supabase
          .from('coaches')
          .select('*')
          .eq('user_id', userId)
          .single();
        profile = data;
      }

      setState(prev => ({
        ...prev,
        role,
        profile,
        loading: false,
      }));

      // Register for push notifications after successful profile load
      try {
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          await savePushToken(userId, pushToken);
        }
      } catch (error) {
        console.error('[Fight Station] Push notification registration error:', error);
      }
    } catch (error) {
      console.error('[Fight Station] Profile load error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signUp = async (email: string, password: string, referralCode?: string) => {
    if (DEMO_MODE) {
      // In demo mode, just "sign in" the demo user
      setState({
        user: { id: 'demo-user-001', email } as User,
        session: null,
        role: 'fighter',
        profile: DEMO_FIGHTER,
        loading: false,
        initialized: true,
      });
      return { error: null };
    }
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured. Add credentials to .env') };
    }

    // Validate referral code if provided
    if (referralCode) {
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('user_id, is_active')
        .eq('code', referralCode.toUpperCase())
        .single();

      if (codeError || !codeData || !codeData.is_active) {
        return { error: new Error('Invalid referral code') };
      }
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    // Store referral code temporarily for later processing
    if (!error && referralCode && data.user) {
      try {
        await supabase.from('pending_referrals').insert({
          user_id: data.user.id,
          referral_code: referralCode.toUpperCase(),
        });
      } catch (err) {
        console.error('Failed to store pending referral:', err);
      }
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) {
      // In demo mode, accept any credentials
      setState({
        user: { id: 'demo-user-001', email } as User,
        session: null,
        role: 'fighter',
        profile: DEMO_FIGHTER,
        loading: false,
        initialized: true,
      });
      return { error: null };
    }
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured. Add credentials to .env') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (DEMO_MODE) {
      // In demo mode, just reset to demo state
      setState({
        user: { id: 'demo-user-001', email: 'demo@fightstation.com' } as User,
        session: null,
        role: 'fighter',
        profile: DEMO_FIGHTER,
        loading: false,
        initialized: true,
      });
      return;
    }

    // Remove push token before signing out
    if (state.user && isSupabaseConfigured) {
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'fight-station',
        });
        await removePushToken(state.user.id, token.data);
      } catch (error) {
        console.error('[Fight Station] Error removing push token:', error);
      }
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setState(prev => ({
      ...prev,
      user: null,
      session: null,
      role: null,
      profile: null,
    }));
  };

  const setUserRole = async (role: UserRole) => {
    if (DEMO_MODE) {
      setState(prev => ({ ...prev, role }));
      return;
    }
    if (!state.user || !isSupabaseConfigured) return;

    await supabase.from('user_roles').upsert({
      user_id: state.user.id,
      role,
    });

    setState(prev => ({ ...prev, role }));
  };

  const refreshProfile = async () => {
    if (DEMO_MODE) return;
    if (state.user) {
      await loadUserProfile(state.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        setUserRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
