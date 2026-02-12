import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<any> = {
  prefixes: [prefix, 'fightstation://', 'https://fightstation.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Register: 'register',
          Login: 'login',
        },
      },
      // Fighter screens
      FighterTabs: {
        screens: {
          DiscoverTab: 'discover',
          MySessionsTab: 'my-sessions',
          ProfileTab: 'profile',
        },
      },
      // Gym screens
      GymTabs: {
        screens: {
          HomeTab: 'home',
          EventsTab: 'events',
          SettingsTab: 'settings',
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
    },
  },
};

// Helper to generate shareable links
export const generateEventLink = (eventId: string): string => {
  return `https://fightstation.app/events/${eventId}`;
};

export const generateFighterProfileLink = (fighterId: string): string => {
  return `https://fightstation.app/fighters/${fighterId}`;
};

export const generateGymProfileLink = (gymId: string): string => {
  return `https://fightstation.app/gyms/${gymId}`;
};
