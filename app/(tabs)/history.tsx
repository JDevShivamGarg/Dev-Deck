import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getSessionHistory } from '../../src/db/queries/sessions';
import { colors } from '../../src/theme/colors';
import type { SessionRecord } from '../../src/types';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<(SessionRecord & { topic_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');

  useFocusEffect(useCallback(() => {
    async function load() {
      setLoading(true);
      const data = await getSessionHistory(500);
      setSessions(data);
      setLoading(false);
    }
    load();
  }, []));

  const getFilteredSessions = () => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgoMs = sevenDaysAgo.getTime();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const thirtyDaysAgoMs = thirtyDaysAgo.getTime();

    return sessions.filter((s) => {
      if (filter === 'today') return s.ended_at >= startOfTodayMs;
      if (filter === '7days') return s.ended_at >= sevenDaysAgoMs;
      if (filter === '30days') return s.ended_at >= thirtyDaysAgoMs;
      return true;
    });
  };

  const formatDuration = (start: number, end: number) => {
    const seconds = Math.floor((end - start) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.neon} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="history" size={24} color={colors.neon} />
        <Text style={styles.title}>SESSION HISTORY</Text>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {(['all', 'today', '7days', '30days'] as const).map((f) => {
          const isActive = filter === f;
          const label = f === 'all' ? 'ALL' : f === 'today' ? 'TODAY' : f === '7days' ? '7 DAYS' : '30 DAYS';
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={getFilteredSessions()}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const accuracy = item.total_cards > 0 ? Math.round((item.correct / item.total_cards) * 100) : 0;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.topicName} numberOfLines={2} ellipsizeMode="tail">
                  {item.topic_name?.toUpperCase() ?? 'UNKNOWN TOPIC'}
                </Text>
                <Text style={styles.date}>{formatDate(item.ended_at)}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>MODE</Text>
                  <Text style={styles.statValue}>{item.mode.toUpperCase()}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>CARDS</Text>
                  <Text style={styles.statValue}>{item.total_cards}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>ACCURACY</Text>
                  <Text style={[styles.statValue, { color: accuracy >= 80 ? colors.neon : accuracy >= 50 ? '#FFA500' : colors.error }]}>
                    {accuracy}%
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>DURATION</Text>
                  <Text style={styles.statValue}>{formatDuration(item.started_at, item.ended_at)}</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="inbox" size={48} color={colors.surfaceVariant} />
            <Text style={styles.emptyText}>No sessions recorded yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dark },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  topicName: {
    color: colors.primary,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLowest,
  },
  filterBtnActive: {
    borderColor: colors.neon,
    backgroundColor: 'rgba(195,244,0,0.08)',
  },
  filterBtnText: {
    color: colors.onSurfaceVariant,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  filterBtnTextActive: {
    color: colors.neon,
  },
  date: {
    color: colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'flex-start',
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: colors.onSurface,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  empty: {
    paddingTop: 64,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 14,
  },
});
