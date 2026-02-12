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
};

export type GymTabParamList = {
  HomeTab: undefined;
  EventsTab: undefined;
  SettingsTab: undefined;
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
    name: 'EventsTab',
    label: 'Events',
    iconDefault: 'calendar-outline',
    iconFocused: 'calendar',
  },
  {
    name: 'SettingsTab',
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
        name="EventsTab"
        component={SparringInvitesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="calendar"
              iconDefault="calendar-outline"
              label="Events"
            />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
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
