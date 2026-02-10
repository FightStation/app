import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { GymDashboardScreen, CreateEventScreen, EditEventScreen, SparringInvitesScreen, GymReferralDashboardScreen, GymPhotoUploadScreen, AdminManagementScreen, TrainingScheduleScreen, GymReelsScreen, ManageFightersScreen, GymSettingsScreen, ClaimGymScreen, ClaimManagementScreen, EventCheckInScreen } from '../screens/gym';
import { EventDetailScreen, FighterProfileViewScreen, GymProfileViewScreen, CoachProfileViewScreen, FeedScreen, CreatePostScreen, ReelsScreen, MapViewScreen, ShareEventScreen, VideoShareScreen, GymDirectoryScreen, DirectoryGymDetailScreen } from '../screens/shared';
import { AdminDashboardScreen, CommissionRatesScreen, GymDirectoryAdminScreen } from '../screens/admin';
import { ModernTabBar, type TabConfig } from '../components/TabBar';
import { colors, typography, spacing } from '../lib/theme';

export type GymStackParamList = {
  GymTabs: undefined;
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  ManageRequests: { eventId?: string };
  GymProfile: undefined;
  GymReferralDashboard: undefined;
  GymPhotoUpload: undefined;
  AdminManagement: undefined;
  TrainingSchedule: undefined;
  GymReels: undefined;
  FighterProfileView: { fighterId: string };
  GymProfileView: { gymId: string };
  CoachProfileView: { coachId: string };
  CreatePost: { eventId?: string; postType?: string };
  Reels: undefined;
  MapView: undefined;
  ShareEvent: { eventId: string };
  VideoShare: undefined;
  GymDirectory: undefined;
  DirectoryGymDetail: { gymId: string };
  ClaimGym: { gymId: string; gymName: string };
  ClaimManagement: undefined;
  EventCheckIn: { eventId: string; eventTitle?: string };
  // Admin screens
  AdminDashboard: undefined;
  CommissionRates: undefined;
  GymDirectoryAdmin: undefined;
};

export type GymTabParamList = {
  HomeTab: undefined;
  FeedTab: undefined;
  FightersTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<GymStackParamList>();
const Tab = createBottomTabNavigator<GymTabParamList>();

// Tab configuration for gym navigator
const gymTabs: TabConfig[] = [
  {
    name: 'HomeTab',
    label: 'Home',
    iconDefault: 'home-outline',
    iconFocused: 'home',
  },
  {
    name: 'FeedTab',
    label: 'Feed',
    iconDefault: 'newspaper-outline',
    iconFocused: 'newspaper',
  },
  {
    name: 'FightersTab',
    label: 'Fighters',
    iconDefault: 'people-outline',
    iconFocused: 'people',
  },
  {
    name: 'ProfileTab',
    label: 'Settings',
    iconDefault: 'settings-outline',
    iconFocused: 'settings',
  },
];

// Tab icon component for individual tabs
function TabIcon({
  focused,
  iconFocused,
  iconDefault,
  label,
}: {
  focused: boolean;
  iconFocused: keyof typeof Ionicons.glyphMap;
  iconDefault: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
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

function GymTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar {...props} tabs={gymTabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={GymDashboardScreen}
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
        name="FeedTab"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="newspaper"
              iconDefault="newspaper-outline"
              label="Feed"
            />
          ),
        }}
      />
      <Tab.Screen
        name="FightersTab"
        component={ManageFightersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="people"
              iconDefault="people-outline"
              label="Fighters"
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={GymSettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="settings"
              iconDefault="settings-outline"
              label="Settings"
            />
          ),
        }}
      />
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
        name="GymReferralDashboard"
        component={GymReferralDashboardScreen}
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
        name="GymPhotoUpload"
        component={GymPhotoUploadScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AdminManagement"
        component={AdminManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TrainingSchedule"
        component={TrainingScheduleScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GymReels"
        component={GymReelsScreen}
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
          headerTintColor: colors.neutral[50],
        }}
      />
      <Stack.Screen
        name="VideoShare"
        component={VideoShareScreen}
        options={{
          headerShown: true,
          title: 'Share Video',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.neutral[50],
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
        name="ClaimGym"
        component={ClaimGymScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ClaimManagement"
        component={ClaimManagementScreen}
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
      {/* Admin Screens */}
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CommissionRates"
        component={CommissionRatesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GymDirectoryAdmin"
        component={GymDirectoryAdminScreen}
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