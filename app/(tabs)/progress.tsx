import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getRecentSessions } from '../../src/db/queries/sessions';
import { getActiveTopics } from '../../src/db/queries/topics';
import { getTopicAccuracy, getStreakDays } from '../../src/db/queries/progress';
import { colors } from '../../src/theme/colors';

interface TopicAccuracy {
  name: string;
  accuracy: number;
}

interface SessionLog {
  date: string;
  topicName: string;
  correct: number;
  total: number;
}

export default function ProgressScreen() {
  const [streak, setStreak] = useState(0);
  const [topicAccuracies, setTopicAccuracies] = useState<TopicAccuracy[]>([]);
  const [sessions, setSessions] = useState<SessionLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const s = await getStreakDays();
        setStreak(s);

        const topics = await getActiveTopics();
        const accuracies: TopicAccuracy[] = [];
        for (const t of topics) {
          const acc = await getTopicAccuracy(t.id);
          if (acc >= 0) {
            accuracies.push({ name: t.slug.toUpperCase().replace(/-/g, '_'), accuracy: Math.round(acc * 100) });
          }
        }
        setTopicAccuracies(accuracies);

        const recent = await getRecentSessions(4);
        setSessions(
          recent.map((r) => ({
            date: new Date(r.ended_at).toISOString().split('T')[0],
            topicName: r.topic_name?.toUpperCase().replace(/-/g, '_') ?? 'UNKNOWN',
            correct: r.correct,
            total: r.total_cards,
          }))
        );
      }
      load();
    }, [])
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* App bar */}
      <View style={styles.appBar}>
        <MaterialCommunityIcons name="console-line" size={22} color={colors.neon} />
        <Text style={styles.appBarTitle}>DEVDECK</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>SYSTEM.PROGRESS</Text>
          <Text style={styles.pageSub}>Last synchronization: {new Date().toLocaleTimeString()}</Text>
        </View>

        {/* Streak */}
        <View style={styles.streakCard}>
          <View style={styles.streakBgIcon}>
            <MaterialIcons name="local-fire-department" size={64} color={colors.neon} />
          </View>
          <Text style={styles.streakLabel}>ACTIVE STREAK</Text>
          <Text style={styles.streakValue}>{streak} DAYS</Text>
          <View style={styles.streakMsgRow}>
            <Text style={styles.streakPrompt}>&gt;&gt;</Text>
            <Text style={styles.streakMsg}> Maintaining velocity.</Text>
          </View>
        </View>

        {/* Accuracy */}
        <View style={styles.moduleCard}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleHeaderText}>MODULE_ACCURACY</Text>
          </View>
          <View style={styles.moduleBody}>
            {topicAccuracies.length === 0 && (
              <Text style={styles.emptyText}>No data yet. Complete a session to see accuracy.</Text>
            )}
            {topicAccuracies.map((ta) => (
              <View key={ta.name} style={styles.accuracyRow}>
                <View style={styles.accuracyLabelRow}>
                  <Text style={styles.accuracyLabel}>{ta.name}</Text>
                  <Text style={styles.accuracyValue}>{ta.accuracy}%</Text>
                </View>
                <View style={styles.accuracyBarBg}>
                  <View style={[styles.accuracyBarFill, { width: `${ta.accuracy}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Session History */}
        <View style={styles.moduleCard}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleHeaderText}>SESSION LOG</Text>
          </View>
          {sessions.length === 0 && (
            <View style={styles.moduleBody}>
              <Text style={styles.emptyText}>No sessions recorded yet.</Text>
            </View>
          )}
          {sessions.map((s, i) => (
            <View
              key={i}
              style={[styles.logRow, i < sessions.length - 1 && styles.logRowBorder]}
            >
              <View style={styles.logLeft}>
                <Text style={styles.logDate}>{s.date}</Text>
                <Text style={styles.logTopic}>{s.topicName}</Text>
              </View>
              <Text style={[
                styles.logScore,
                s.correct / s.total >= 0.7 ? styles.logScoreGood : styles.logScoreBad,
              ]}>
                {s.correct}/{s.total}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dark },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: colors.dark,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appBarTitle: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, letterSpacing: -1, textTransform: 'uppercase' },
  content: { padding: 16, paddingBottom: 80, gap: 16 },
  pageHeader: {
    borderWidth: 1, borderColor: colors.surfaceContainerHighest, padding: 16,
    backgroundColor: colors.surfaceContainerLowest,
  },
  pageTitle: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, letterSpacing: 1, textTransform: 'uppercase' },
  pageSub: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, marginTop: 4 },
  streakCard: {
    borderWidth: 1, borderColor: colors.surfaceContainerHighest,
    backgroundColor: colors.surfaceContainer, padding: 24, position: 'relative', overflow: 'hidden',
  },
  streakBgIcon: { position: 'absolute', top: 8, right: 8, opacity: 0.2 },
  streakLabel: { color: colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  streakValue: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 48, letterSpacing: -2 },
  streakMsgRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  streakPrompt: { color: colors.neon, fontFamily: 'monospace', fontSize: 14 },
  streakMsg: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 14 },
  moduleCard: {
    borderWidth: 1, borderColor: colors.surfaceContainerHighest,
    backgroundColor: colors.surfaceContainer, overflow: 'hidden',
  },
  moduleHeader: {
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest,
    padding: 8, paddingHorizontal: 16, backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  moduleHeaderText: { color: colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  moduleHeaderSub: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, opacity: 0.5 },
  moduleBody: { padding: 16, gap: 16 },
  emptyText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14 },
  accuracyRow: { gap: 4 },
  accuracyLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  accuracyLabel: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  accuracyValue: { color: colors.neon, fontFamily: 'monospace', fontSize: 14 },
  accuracyBarBg: { width: '100%', height: 4, backgroundColor: colors.surfaceContainerHighest },
  accuracyBarFill: { height: '100%', backgroundColor: colors.neon },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 8, paddingHorizontal: 16,
  },
  logRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
  logLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logDate: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, width: 90 },
  logTopic: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  logScore: { fontFamily: 'monospace', fontSize: 14 },
  logScoreGood: { color: colors.neon },
  logScoreBad: { color: colors.error },
});
