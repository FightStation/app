import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { FighterNavigator } from './FighterNavigator';
import { GymNavigator } from './GymNavigator';
import { CoachNavigator } from './CoachNavigator';
import { colors, typography } from '../lib/theme';
import { linking } from './LinkingConfiguration';
import { parseDeepLink, trackReferralClick } from '../services/deepLinkHandler';

export function RootNavigator() {
  const { user, role, profile, loading, initialized } = useAuth();
  const url = Linking.useURL();

  // Track referral clicks when app is opened via deep link
  useEffect(() => {
    if (url) {
      const linkData = parseDeepLink(url);
      if (linkData.referralCode) {
        trackReferralClick(linkData.referralCode, linkData.type, linkData.id);
      }
    }
  }, [url]);

  if (!initialized || loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const navProps = {
    linking,
    ...(Platform.OS === 'web' ? { documentTitle: { formatter: () => 'Fight Station' } } : {}),
  };

  // Not logged in
  if (!user) {
    return (
      <NavigationContainer {...navProps}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Logged in but no role selected
  if (!role) {
    return (
      <NavigationContainer {...navProps}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Logged in but no profile created
  if (!profile) {
    return (
      <NavigationContainer {...navProps}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Navigate based on role
  return (
    <NavigationContainer {...navProps}>
      {role === 'fighter' && <FighterNavigator />}
      {role === 'gym' && <GymNavigator />}
      {role === 'coach' && <CoachNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.neutral[400],
    fontSize: typography.fontSize.base,
  },
});
