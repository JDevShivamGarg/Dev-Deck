import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { runMigrations } from '../src/db/migrations/001_initial';
import { seedAllCards } from '../src/data/seedLoader';
import { colors } from '../src/theme/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    async function init() {
      try {
        await runMigrations();
        await seedAllCards();
        setDbReady(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
    init();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && dbReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorLabel}>INIT_ERROR</Text>
        <Text style={styles.errorText}>{error}</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.neon} />
        <Text style={styles.loadingText}>BOOTING TECHFLASH...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.dark },
          headerTintColor: colors.neon,
          headerTitleStyle: {
            fontFamily: 'SpaceGrotesk_700Bold',
            fontWeight: '700',
            fontSize: 14,
          },
          contentStyle: { backgroundColor: colors.dark },
          animation: 'slide_from_right',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ headerShown: false }} />
        <Stack.Screen name="session/setup/[topicId]" options={{ headerShown: false }} />
        <Stack.Screen name="session/mcq" options={{ headerShown: false }} />
        <Stack.Screen name="session/flashcard" options={{ headerShown: false }} />
        <Stack.Screen name="session/scenario" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorLabel: {
    color: colors.error,
    fontFamily: 'monospace',
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 8,
  },
  errorText: {
    color: colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 13,
    textAlign: 'center',
  },
  loadingText: {
    color: colors.neon,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 16,
    textTransform: 'uppercase',
  },
});
