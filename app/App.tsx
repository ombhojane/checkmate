import React, { useEffect, useState, type ReactNode } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AccessibilitySettingsScreen from './src/screens/AccessibilitySettingsScreen';
import { colors } from './src/theme';

const ONBOARDING_KEY = '@checkmate_onboarding_complete';

const Stack = createNativeStackNavigator();

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: colors.black }}>
            Error Loading App
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray600, textAlign: 'center' }}>
            {this.state.error?.message || 'An error occurred'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function AppNavigator() {
  // Auth disabled - go directly to main app
  // const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      setShowOnboarding(!hasSeenOnboarding);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Show loading while checking onboarding
  if (isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.black} />
        <Text style={{ marginTop: 10, fontSize: 16, color: colors.black }}>Loading CheckMate...</Text>
      </View>
    );
  }

  // Show onboarding if first time user
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Always show main app (auth disabled)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={BottomTabNavigator} />
      <Stack.Screen 
        name="AccessibilitySettings" 
        component={AccessibilitySettingsScreen}
        options={{
          headerShown: true,
          title: 'Accessibility Settings',
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTintColor: colors.black,
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Suppress TurboModule initialization warnings
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('TurboModuleRegistry') ||
         args[0].includes('PlatformConstants') ||
         args[0].includes('Invariant Violation'))
      ) {
        return;
      }
      originalWarn(...args);
    };

    // Initialize app
    setIsReady(true);

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.black} />
        <Text style={{ marginTop: 10, fontSize: 16, color: colors.black }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}
