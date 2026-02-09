import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<any> = {
  prefixes: [prefix, 'fightstation://', 'https://fightstation.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Register: {
            path: 'join/:referralCode?',
            parse: {
              referralCode: (code: string) => code?.toUpperCase(),
            },
          },
          Login: 'login',
        },
      },
      // Fighter screens (default routes)
      FighterTabs: {
        screens: {
          HomeTab: 'home',
          ExploreTab: 'explore',
          MessagesTab: 'messages',
          ProfileTab: 'profile',
        },
      },
      EventDetail: {
        path: 'events/:eventId',
        parse: {
          eventId: (id: string) => id,
        },
      },
      FighterProfileView: {
        path: 'fighters/:fighterId',
        parse: {
          fighterId: (id: string) => id,
        },
      },
      GymProfileView: {
        path: 'gyms/:gymId',
        parse: {
          gymId: (id: string) => id,
        },
      },
      EventBrowse: 'browse',
      GymSearch: 'gym-search',
      FighterSearch: 'fighter-search',
      Chat: 'chat/:conversationId',
      ReferralDashboard: 'referrals',
    },
  },
};

// Helper to generate shareable links
export const generateReferralLink = (referralCode: string): string => {
  return `https://fightstation.app/join/${referralCode}`;
};

export const generateEventLink = (eventId: string): string => {
  return `https://fightstation.app/events/${eventId}`;
};

export const generateFighterProfileLink = (fighterId: string): string => {
  return `https://fightstation.app/fighters/${fighterId}`;
};

export const generateGymProfileLink = (gymId: string): string => {
  return `https://fightstation.app/gyms/${gymId}`;
};
