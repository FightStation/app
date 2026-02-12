import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_900Black,
} from '@expo-google-fonts/barlow-condensed';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { colors, typography } from './src/lib/theme';
import { ToastProvider } from './src/context/ToastContext';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Fight Station] Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingLogo}>FIGHT</Text>
      <Text style={styles.loadingLogoAccent}>STATION</Text>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

function AppContent() {
  const [AuthProvider, setAuthProvider] = useState<React.ComponentType<{children: React.ReactNode}> | null>(null);
  const [RootNavigator, setRootNavigator] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadComponents() {
      try {
        console.log('[Fight Station] Loading AuthContext...');
        const authModule = await import('./src/context/AuthContext');
        setAuthProvider(() => authModule.AuthProvider);

        console.log('[Fight Station] Loading Navigation...');
        const navModule = await import('./src/navigation');
        setRootNavigator(() => navModule.RootNavigator);

        console.log('[Fight Station] All components loaded!');
      } catch (err) {
        console.error('[Fight Station] Failed to load:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    loadComponents();
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to load app</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  if (!AuthProvider || !RootNavigator) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </ToastProvider>
    </AuthProvider>
  );
}

export default function App() {
  console.log('[Fight Station] App rendering...');

  const [fontsLoaded] = useFonts({
    'BarlowCondensed-SemiBold': BarlowCondensed_600SemiBold,
    'BarlowCondensed-Bold': BarlowCondensed_700Bold,
    'BarlowCondensed-Black': BarlowCondensed_900Black,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.neutral[50],
    letterSpacing: 4,
  },
  loadingLogoAccent: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.primary[500],
    letterSpacing: 8,
    marginTop: -8,
  },
  loadingText: {
    marginTop: 24,
    color: colors.neutral[500],
    fontSize: typography.fontSize.base,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: 'center',
  },
});