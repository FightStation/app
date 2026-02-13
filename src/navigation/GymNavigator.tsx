import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import {
  GymDashboardScreen,
  CreateEventScreen,
  EditEventScreen,
  SparringInvitesScreen,
  GymSettingsScreen,
  EventCheckInScreen,
} from '../screens/gym';
import {
  EventDetailScreen,
  FighterProfileViewScreen,
  GymProfileViewScreen,
  GymDirectoryScreen,
  DirectoryGymDetailScreen,
  EventsListScreen,
  FeedScreen,
  SearchScreen,
  MessagesScreen,
  ChatScreen,
} from '../screens/shared';
import { ModernTabBar, type TabConfig } from '../components/TabBar';
import { colors, typography, spacing } from '../lib/theme';

export type GymStackParamList = {
  GymTabs: undefined;
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  ManageRequests: { eventId?: string };
  GymProfile: undefined;
  EventCheckIn: { eventId: string; eventTitle?: string };
  FighterProfileView: { fighterId: string };
  GymProfileView: { gymId: string };
  GymDirectory: undefined;
  DirectoryGymDetail: { gymId: string };
  EventsList: undefined;
  Chat: { conversationId: string; otherUserId?: string; name: string };
  GymDashboard: undefined;
};

export type GymTabParamList = {
  FeedTab: undefined;
  SearchTab: undefined;
  ProfileTab: undefined;
  MessagesTab: undefined;
};

const Stack = createNativeStackNavigator<GymStackParamList>();
const Tab = createBottomTabNavigator<GymTabParamList>();

// Tab configuration for gym navigator - same 4 tabs as fighter
const gymTabs: TabConfig[] = [
  {
    name: 'FeedTab',
    label: 'Feed',
    iconDefault: 'home-outline',
    iconFocused: 'home',
  },
  {
    name: 'SearchTab',
    label: 'Search',
    iconDefault: 'search-outline',
    iconFocused: 'search',
  },
  {
    name: 'ProfileTab',
    label: 'Profile',
    iconDefault: 'person-outline',
    iconFocused: 'person',
  },
  {
    name: 'MessagesTab',
    label: 'Messages',
    iconDefault: 'chatbubble-outline',
    iconFocused: 'chatbubble',
  },
];

function GymTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar {...props} tabs={gymTabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="FeedTab" component={FeedScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      <Tab.Screen name="ProfileTab" component={GymSettingsScreen} />
      <Tab.Screen name="MessagesTab" component={MessagesScreen} />
    </Tab.Navigator>
  );
}

export function GymNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="GymTabs" component={GymTabs} />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{
          headerShown: true,
          title: 'Create Event',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.neutral[50],
        }}
      />
      <Stack.Screen
        name="EditEvent"
        component={EditEventScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          headerShown: true,
          title: 'Event Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.neutral[50],
        }}
      />
      <Stack.Screen
        name="ManageRequests"
        component={SparringInvitesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GymProfile"
        component={GymSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EventCheckIn"
        component={EventCheckInScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FighterProfileView"
        component={FighterProfileViewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GymProfileView"
        component={GymProfileViewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GymDirectory"
        component={GymDirectoryScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DirectoryGymDetail"
        component={DirectoryGymDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EventsList"
        component={EventsListScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GymDashboard"
        component={GymDashboardScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[1],
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  tabLabelFocused: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
});
