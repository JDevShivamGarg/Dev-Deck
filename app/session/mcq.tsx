import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '../../src/hooks/useSession';
import { MCQCard } from '../../src/components/cards/MCQCard';
import { insertSession } from '../../src/db/queries/sessions';
import { useSessionStore } from '../../src/store/session';
import { colors } from '../../src/theme/colors';
import type { Proficiency } from '../../src/types';

export default function MCQSession() {
  const { topicId, topicName, proficiency } = useLocalSearchParams<{
    topicId: string;
    topicName: string;
    proficiency: string;
  }>();
  const router = useRouter();

  const {
    loading, error, currentCard, currentIndex, score, totalCards, isComplete, gradeCard, nextCard,
  } = useSession(
    Number(topicId), topicName ?? '', 'mcq', (proficiency as Proficiency) ?? 'intermediate'
  );

  const store = useSessionStore();

  useEffect(() => {
    if (isComplete && totalCards > 0) {
      insertSession({
        topic_id: Number(topicId),
        mode: 'mcq',
        proficiency: proficiency ?? 'intermediate',
        total_cards: totalCards,
        correct: score,
        started_at: store.startedAt ?? Date.now(),
        ended_at: Date.now(),
      }).then(() => {
        router.replace({
          pathname: '/results',
          params: { topicName: topicName ?? '', mode: 'mcq', total: totalCards.toString(), correct: score.toString() },
        });
      });
    }
  }, [isComplete]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.neon} />
        <Text style={styles.loadingText}>LOADING QUESTIONS...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (totalCards === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>NO CARDS DUE</Text>
        <Text style={styles.emptySub}>Return tomorrow or adjust proficiency level.</Text>
      </View>
    );
  }

  if (!currentCard) return null;

  return (
    <View style={styles.screen}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Q.{String(currentIndex + 1).padStart(2, '0')}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / totalCards) * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{totalCards}</Text>
      </View>
      <MCQCard card={currentCard} onGrade={gradeCard} onNext={nextCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: colors.neon, fontFamily: 'monospace', fontSize: 12, letterSpacing: 2, marginTop: 16 },
  errorText: { color: colors.error, fontFamily: 'monospace', fontSize: 14 },
  emptyTitle: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, letterSpacing: 1 },
  emptySub: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, marginTop: 8, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  progressLabel: { color: colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, width: 32, textAlign: 'center' },
  progressBarBg: { flex: 1, height: 2, backgroundColor: colors.surfaceContainerHigh },
  progressBarFill: { height: '100%', backgroundColor: colors.neon },
});
