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
} from '../screens/shared';
import { colors, spacing, typography } from '../lib/theme';

export type FighterStackParamList = {
  FighterTabs: undefined;
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
};

export type FighterTabParamList = {
  DiscoverTab: undefined;
  MySessionsTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<FighterStackParamList>();
const Tab = createBottomTabNavigator<FighterTabParamList>();

// Tab configuration for fighter navigator
const fighterTabs: TabConfig[] = [
  {
    name: 'DiscoverTab',
    label: 'Discover',
    iconDefault: 'compass-outline',
    iconFocused: 'compass',
  },
  {
    name: 'MySessionsTab',
    label: 'My Sessions',
    iconDefault: 'calendar-outline',
    iconFocused: 'calendar',
  },
  {
    name: 'ProfileTab',
    label: 'Profile',
    iconDefault: 'person-outline',
    iconFocused: 'person',
  },
];

type TabIconName = 'compass' | 'compass-outline' | 'calendar' | 'calendar-outline' | 'person' | 'person-outline';

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
        name="DiscoverTab"
        component={FindSparringScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="compass"
              iconDefault="compass-outline"
              label="Discover"
            />
          ),
        }}
      />
      <Tab.Screen
        name="MySessionsTab"
        component={MyEventsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="calendar"
              iconDefault="calendar-outline"
              label="My Sessions"
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
