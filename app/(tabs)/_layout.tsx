import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { paddingBottom: insets.bottom + 4, height: 64 + insets.bottom }],
        tabBarActiveTintColor: colors.neon,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: '/',
          title: 'FEED',
          tabBarLabel: 'FEED',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="rss" color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          href: '/progress',
          title: 'TRENDS',
          tabBarLabel: 'TRENDS',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="lightning-bolt" color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: '/settings',
          title: 'PROFILE',
          tabBarLabel: 'PROFILE',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={20} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.dark,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tabItem: {
    paddingVertical: 4,
  },
});
