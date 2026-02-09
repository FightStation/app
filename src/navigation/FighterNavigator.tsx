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
  ExploreScreen,
  MessagesScreen,
  ChatScreen,
  ReferralDashboardScreen,
  EnhancedEventBrowseScreen,
  GymSearchScreen,
  FighterSearchScreen,
  SparringInvitesScreen,
} from '../screens/fighter';
import { EventDetailScreen, FighterProfileViewScreen, GymProfileViewScreen, CoachProfileViewScreen, FeedScreen, CreatePostScreen, ReelsScreen, MapViewScreen, ShareEventScreen, VideoShareScreen, GymDirectoryScreen, DirectoryGymDetailScreen } from '../screens/shared';
import { colors, spacing, typography } from '../lib/theme';

export type FighterStackParamList = {
  FighterTabs: undefined;
  EventDetail: { eventId: string };
  FighterProfile: undefined;
  FighterProfileView: { fighterId: string };
  GymProfileView: { gymId: string };
  CoachProfileView: { coachId: string };
  ProposeSession: { gymId: string };
  SparringInvites: undefined;
  Chat: { conversationId: string; name: string };
  ReferralDashboard: undefined;
  EventBrowse: undefined;
  GymSearch: undefined;
  FighterSearch: undefined;
  FindSparring: undefined;
  GymEvents: { gymId: string };
  Feed: undefined;
  CreatePost: { eventId?: string; postType?: string };
  Reels: undefined;
  MapView: undefined;
  ShareEvent: { eventId: string };
  VideoShare: undefined;
  GymDirectory: undefined;
  DirectoryGymDetail: { gymId: string };
};

export type FighterTabParamList = {
  HomeTab: undefined;
  MatchesTab: undefined;
  ExploreTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<FighterStackParamList>();
const Tab = createBottomTabNavigator<FighterTabParamList>();

// Tab configuration for fighter navigator
const fighterTabs: TabConfig[] = [
  {
    name: 'HomeTab',
    label: 'Home',
    iconDefault: 'home-outline',
    iconFocused: 'home',
  },
  {
    name: 'MatchesTab',
    label: 'My Events',
    iconDefault: 'calendar-outline',
    iconFocused: 'calendar',
  },
  {
    name: 'ExploreTab',
    label: 'Explore',
    iconDefault: 'compass-outline',
    iconFocused: 'compass',
  },
  {
    name: 'MessagesTab',
    label: 'Messages',
    iconDefault: 'chatbubble-outline',
    iconFocused: 'chatbubble',
  },
  {
    name: 'ProfileTab',
    label: 'Profile',
    iconDefault: 'person-outline',
    iconFocused: 'person',
  },
];

type TabIconName = 'home' | 'home-outline' | 'people' | 'people-outline' |
  'compass' | 'compass-outline' | 'chatbubble' | 'chatbubble-outline' |
  'person' | 'person-outline' | 'calendar' | 'calendar-outline';

interface TabIconProps {
  focused: boolean;
  iconFocused: TabIconName;
  iconDefault: TabIconName;
  label: string;
}

function TabIcon({ focused, iconFocused, iconDefault, label }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name={focused ? iconFocused : iconDefault}
        size={24}
        color={focused ? colors.primary[500] : colors.neutral[500]}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}


function FighterTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar {...props} tabs={fighterTabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={FindSparringScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="home"
              iconDefault="home-outline"
              label="Home"
            />
          ),
        }}
      />
      <Tab.Screen
        name="MatchesTab"
        component={MyEventsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="calendar"
              iconDefault="calendar-outline"
              label="My Events"
            />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="compass"
              iconDefault="compass-outline"
              label="Explore"
            />
          ),
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="chatbubble"
              iconDefault="chatbubble-outline"
              label="Messages"
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={FighterProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="person"
              iconDefault="person-outline"
              label="Profile"
            />
          ),
        }}
      />
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
      <Stack.Screen name="FighterTabs" component={FighterTabs} />
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
        name="FighterProfile"
        component={FighterProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="ProposeSession"
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
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ReferralDashboard"
        component={ReferralDashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EventBrowse"
        component={EnhancedEventBrowseScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GymSearch"
        component={GymSearchScreen}
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
        name="GymEvents"
        component={GymEventsScreen}
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
        name="CoachProfileView"
        component={CoachProfileViewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FighterSearch"
        component={FighterSearchScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Reels"
        component={ReelsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MapView"
        component={MapViewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ShareEvent"
        component={ShareEventScreen}
        options={{
          headerShown: true,
          title: 'Share Event',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="VideoShare"
        component={VideoShareScreen}
        options={{
          headerShown: true,
          title: 'Share Video',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
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
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 75,
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
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
