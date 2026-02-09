import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModernTabBar, type TabConfig } from '../components/TabBar';
import {
  CoachDashboardScreen,
  ManageStudentsScreen,
  ScheduleSessionScreen,
  CoachProfileScreen,
  StudentProgressScreen,
  CoachReferralDashboardScreen,
  SessionDetailScreen,
} from '../screens/coach';
import {
  MessagesScreen,
  ChatScreen,
} from '../screens/fighter';
import {
  FighterProfileViewScreen,
  GymProfileViewScreen,
  CoachProfileViewScreen,
  FeedScreen,
  CreatePostScreen,
  MapViewScreen,
} from '../screens/shared';
import { colors, spacing, typography } from '../lib/theme';

export type CoachStackParamList = {
  CoachTabs: undefined;
  ScheduleSession: undefined;
  StudentProgress: { studentId?: string };
  AllStudents: undefined;
  CoachReferralDashboard: undefined;
  FighterProfileView: { fighterId: string };
  GymProfileView: { gymId: string };
  CoachProfileView: { coachId: string };
  Chat: { conversationId: string; name: string };
  CreatePost: { eventId?: string; postType?: string };
  SessionDetail: { sessionId: string };
  MapView: undefined;
};

export type CoachTabParamList = {
  HomeTab: undefined;
  StudentsTab: undefined;
  FeedTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<CoachStackParamList>();
const Tab = createBottomTabNavigator<CoachTabParamList>();

// Tab configuration for coach navigator
const coachTabs: TabConfig[] = [
  {
    name: 'HomeTab',
    label: 'Home',
    iconDefault: 'home-outline',
    iconFocused: 'home',
  },
  {
    name: 'StudentsTab',
    label: 'Students',
    iconDefault: 'people-outline',
    iconFocused: 'people',
  },
  {
    name: 'FeedTab',
    label: 'Feed',
    iconDefault: 'newspaper-outline',
    iconFocused: 'newspaper',
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
  'newspaper' | 'newspaper-outline' | 'chatbubble' | 'chatbubble-outline' |
  'person' | 'person-outline';

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


function CoachTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ModernTabBar {...props} tabs={coachTabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={CoachDashboardScreen}
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
        name="StudentsTab"
        component={ManageStudentsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconFocused="people"
              iconDefault="people-outline"
              label="Students"
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
        component={CoachProfileScreen}
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

export function CoachNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="CoachTabs" component={CoachTabs} />
      <Stack.Screen
        name="ScheduleSession"
        component={ScheduleSessionScreen}
        options={{
          headerShown: true,
          title: 'Schedule Session',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="StudentProgress"
        component={StudentProgressScreen}
        options={{
          headerShown: true,
          title: 'Student Progress',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="AllStudents"
        component={ManageStudentsScreen}
        options={{
          headerShown: true,
          title: 'All Students',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="CoachReferralDashboard"
        component={CoachReferralDashboardScreen}
        options={{
          headerShown: true,
          title: 'Refer & Earn',
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
        name="CoachProfileView"
        component={CoachProfileViewScreen}
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
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{
          headerShown: true,
          title: 'Session Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="MapView"
        component={MapViewScreen}
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
