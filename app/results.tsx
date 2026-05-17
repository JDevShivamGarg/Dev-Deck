import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSessionStore } from '../src/store/session';
import { colors } from '../src/theme/colors';

export default function ResultsScreen() {
  const { topicName, mode, total, correct, elapsed: elapsedStr } = useLocalSearchParams<{
    topicName: string;
    mode: string;
    total: string;
    correct: string;
    elapsed: string;
  }>();
  const router = useRouter();
  const resetSession = useSessionStore((s) => s.resetSession);

  const totalNum = Number(total) || 0;
  const correctNum = Number(correct) || 0;
  const incorrect = totalNum - correctNum;
  const accuracy = totalNum > 0 ? Math.round((correctNum / totalNum) * 100) : 0;
  const elapsed = Number(elapsedStr) || 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const pace = totalNum > 0 ? Math.round(elapsed / totalNum) : 0;

  const handleDone = () => {
    resetSession();
    router.replace('/(tabs)');
  };

  const handleRetry = () => {
    resetSession();
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* App bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.appBarBtn}>
          <MaterialIcons name="code" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>DEVDECK</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero score */}
        <View style={styles.heroBox}>
          <View style={styles.heroStatusRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.heroStatusText}>SESSION TERMINATED</Text>
          </View>
          <Text style={styles.heroScore}>
            {correctNum}<Text style={styles.heroScoreSlash}>/{totalNum}</Text>
          </Text>
          <Text style={styles.heroLabel}>CARDS CONQUERED</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ACCURACY</Text>
            <Text style={styles.statValueNeon}>{accuracy}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={styles.statValue}>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PACE</Text>
            <Text style={styles.statValue}>{pace}s<Text style={styles.statUnit}>/card</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MODE</Text>
            <Text style={styles.statValueNeon}>{(mode ?? '').toUpperCase()}</Text>
          </View>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownRow}>
          {/* Correct */}
          <View style={styles.breakdownCol}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>RETIRED <Text style={styles.breakdownSub}>/ Mastered</Text></Text>
              <Text style={styles.breakdownCountNeon}>{correctNum} Cards</Text>
            </View>
            {correctNum > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemText}>&gt; {topicName} — Correct answers</Text>
                <MaterialIcons name="check-circle" size={16} color={colors.neon} />
              </View>
            )}
          </View>

          {/* Incorrect */}
          {incorrect > 0 && (
            <View style={styles.breakdownCol}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownTitle}>REVIEW <Text style={styles.breakdownSub}>/ Missed</Text></Text>
                <Text style={styles.breakdownCountError}>{incorrect} Cards</Text>
              </View>
              <View style={[styles.breakdownItem, styles.breakdownItemError]}>
                <Text style={styles.breakdownItemText}>&gt; {topicName} — Incorrect answers</Text>
                <MaterialIcons name="replay" size={16} color={colors.error} />
              </View>
              <View style={styles.infoBox}>
                <MaterialIcons name="info-outline" size={18} color={colors.surfaceVariant} />
                <Text style={styles.infoText}>
                  Review cards have been placed back into your active queue and will appear more frequently until mastered.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action footer */}
        <View style={styles.actionFooter}>
          <TouchableOpacity onPress={handleRetry} style={styles.goAgainBtn} activeOpacity={0.85}>
            <MaterialIcons name="refresh" size={20} color={colors.dark} />
            <Text style={styles.goAgainText}>GO AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDone} style={styles.homeBtn} activeOpacity={0.85}>
            <MaterialIcons name="home" size={20} color={colors.onSurface} />
            <Text style={styles.homeText}>BACK TO HOME</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: colors.dark,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appBarBtn: { padding: 8 },
  appBarTitle: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, letterSpacing: -1, textTransform: 'uppercase' },
  content: { padding: 16, paddingBottom: 48, gap: 32 },
  heroBox: {
    borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 48, alignItems: 'center',
  },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  pulseDot: { width: 8, height: 8, backgroundColor: colors.neon },
  heroStatusText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
  heroScore: {
    color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 72,
    letterSpacing: -2, textAlign: 'center',
  },
  heroScoreSlash: { color: colors.surfaceVariant },
  heroLabel: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, marginTop: 24, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCard: {
    flex: 1, minWidth: '40%', borderWidth: 1, borderColor: colors.surfaceVariant,
    backgroundColor: colors.surfaceContainerLow, padding: 16, gap: 8,
  },
  statLabel: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, textTransform: 'uppercase' },
  statValue: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28, lineHeight: 32 },
  statValueNeon: { color: colors.neon, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28, lineHeight: 32 },
  statUnit: { color: colors.surfaceVariant, fontFamily: 'monospace', fontSize: 14 },
  breakdownRow: { gap: 32 },
  breakdownCol: {},
  breakdownHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant, paddingBottom: 8, marginBottom: 16,
  },
  breakdownTitle: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, letterSpacing: 1, textTransform: 'uppercase' },
  breakdownSub: { color: colors.surfaceVariant },
  breakdownCountNeon: { color: colors.neon, fontFamily: 'monospace', fontSize: 14 },
  breakdownCountError: { color: colors.error, fontFamily: 'monospace', fontSize: 14 },
  breakdownItem: {
    borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLow,
    padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  breakdownItemError: { borderColor: 'rgba(255,180,171,0.5)', backgroundColor: 'rgba(147,0,10,0.1)' },
  breakdownItemText: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 14, flex: 1, marginRight: 8 },
  infoBox: {
    padding: 16, borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 8,
  },
  infoText: { color: colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 16, lineHeight: 25, flex: 1 },
  actionFooter: {
    borderTopWidth: 1, borderTopColor: colors.surfaceVariant, paddingTop: 32, gap: 16,
  },
  goAgainBtn: {
    backgroundColor: colors.neon, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.neon,
  },
  goAgainText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  homeBtn: {
    borderWidth: 1, borderColor: colors.surfaceVariant, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'transparent',
  },
  homeText: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
});
