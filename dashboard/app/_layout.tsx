import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { colors } from './styles/theme';
import { router } from 'expo-router';

// Loading component
const LoadingScreen = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.background.light 
  }}>
    <ActivityIndicator size="large" color={colors.primary.purple} />
  </View>
);

// Main app navigation component
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  console.log('🎯 AppNavigator: isAuthenticated =', isAuthenticated, 'isLoading =', isLoading);

  useEffect(() => {
    if (!isLoading) {
      console.log('🚦 AppNavigator: Navegando...', isAuthenticated ? 'a tabs' : 'a login');
      
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        router.replace('/(tabs)/');
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    console.log('⏳ AppNavigator: Mostrando pantalla de carga...');
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
