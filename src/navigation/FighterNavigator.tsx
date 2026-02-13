import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModernTabBar, type TabConfig } from '../components/TabBar';
import {
  FighterProfileScreen,
  FindSparringScreen,
  GymEventsScreen,
  MyEventsScreen,
  SparringInvitesScreen,
  EventReviewScreen,
} from '../screens/fighter';
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
import { colors, spacing, typography } from '../lib/theme';

export type FighterStackParamList = {
  MainTabs: undefined;
  EventDetail: { eventId: string };
  FighterProfileView: { fighterId: string };
  GymProfileView: { gymId: string };
  GymEvents: { gymId: string };
  SparringInvites: undefined;
  EventReview: { eventId: string; eventTitle?: string };
  GymDirectory: undefined;
  DirectoryGymDetail: { gymId: string };
  EventsList: undefined;
  FindSparring: undefined;
  Chat: { conversationId: string; otherUserId?: string; name: string };
  MyEvents: undefined;
};

export type FighterTabParamList = {
  FeedTab: undefined;
  SearchTab: undefined;
  ProfileTab: undefined;
  MessagesTab: undefined;
};

const Stack = createNativeStackNavigator<FighterStackParamList>();
const Tab = createBottomTabNavigator<FighterTabParamList>();

// Tab configuration for fighter navigator
const fighterTabs: TabConfig[] = [
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

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar {...props} tabs={fighterTabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="FeedTab" component={FeedScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      <Tab.Screen name="ProfileTab" component={FighterProfileScreen} />
      <Tab.Screen name="MessagesTab" component={MessagesScreen} />
    </Tab.Navigator>
  );
}

export function FighterNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          headerShown: true,
          title: 'Event Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
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
        name="GymEvents"
        component={GymEventsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SparringInvites"
        component={SparringInvitesScreen}
        options={{
          headerShown: true,
          title: 'Sparring Invites',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="EventReview"
        component={EventReviewScreen}
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
        name="FindSparring"
        component={FindSparringScreen}
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
        name="MyEvents"
        component={MyEventsScreen}
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
    color: colors.textMuted,
    marginTop: spacing[1],
    fontWeight: typography.fontWeight.medium,
  },
  tabLabelFocused: {
    color: colors.primary[500],
  },
});
