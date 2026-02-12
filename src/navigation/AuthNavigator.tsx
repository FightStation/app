import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { LoginScreen, RegisterScreen, RoleSelectionScreen } from '../screens/auth';
import { FighterSetupScreen } from '../screens/fighter';
import { GymSetupScreen } from '../screens/gym';
import { WelcomeScreen } from '../screens/shared';
import { useAuth } from '../context/AuthContext';
import { colors } from '../lib/theme';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
  FighterSetup: undefined;
  GymSetup: undefined;
  Welcome: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthRouteManager() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { user, role, profile, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Don't redirect while loading or if we've already redirected
    if (loading || hasRedirected.current) return;

    // Determine where the user should be based on their auth state
    let targetRoute: keyof AuthStackParamList | null = null;

    if (user) {
      if (!role) {
        // Logged in but no role - go to role selection
        targetRoute = 'RoleSelection';
      } else if (!profile) {
        // Has role but no profile - go to setup screen
        if (role === 'fighter') targetRoute = 'FighterSetup';
        else if (role === 'gym') targetRoute = 'GymSetup';
      }
      // If user has profile, RootNavigator will handle switching to main app
    }

    if (targetRoute) {
      hasRedirected.current = true;
      // Reset the navigation stack to the target route
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: targetRoute }],
        })
      );
    }
  }, [user, role, profile, loading, navigation]);

  return null;
}

export function AuthNavigator() {
  const { user, role } = useAuth();

  // Determine the initial route based on current auth state
  // This handles the case when the navigator first mounts
  const getInitialRoute = (): keyof AuthStackParamList => {
    if (user) {
      if (!role) {
        return 'RoleSelection';
      }
      // If they have a role but are in AuthNavigator, they need to complete setup
      if (role === 'fighter') return 'FighterSetup';
      if (role === 'gym') return 'GymSetup';
    }
    return 'Login';
  };

  return (
    <>
      <AuthRouteManager />
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="FighterSetup" component={FighterSetupScreen} />
        <Stack.Screen name="GymSetup" component={GymSetupScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      </Stack.Navigator>
    </>
  );
}
