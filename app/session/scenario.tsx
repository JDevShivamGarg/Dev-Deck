import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '../../src/hooks/useSession';
import { ScenarioCard } from '../../src/components/cards/ScenarioCard';
import { insertSession } from '../../src/db/queries/sessions';
import { useSessionStore } from '../../src/store/session';
import { colors } from '../../src/theme/colors';
import type { Proficiency } from '../../src/types';

export default function ScenarioSession() {
  const { topicId, topicName, proficiency } = useLocalSearchParams<{
    topicId: string;
    topicName: string;
    proficiency: string;
  }>();
  const router = useRouter();

  const {
    loading, error, currentCard, score, totalCards, isComplete, gradeCard, nextCard,
  } = useSession(
    Number(topicId), topicName ?? '', 'scenario', (proficiency as Proficiency) ?? 'intermediate'
  );

  const store = useSessionStore();

  useEffect(() => {
    if (isComplete && totalCards > 0) {
      const elapsed = store.startedAt ? Math.round((Date.now() - store.startedAt) / 1000) : 0;
      insertSession({
        topic_id: Number(topicId),
        mode: 'scenario',
        proficiency: proficiency ?? 'intermediate',
        total_cards: totalCards,
        correct: score,
        started_at: store.startedAt ?? Date.now(),
        ended_at: Date.now(),
      }).then(() => {
        store.resetSession();
        router.replace({
          pathname: '/results',
          params: { 
            topicName: topicName ?? '', 
            mode: 'scenario', 
            total: totalCards.toString(), 
            correct: score.toString(),
            elapsed: elapsed.toString()
          },
        });
      });
    }
  }, [isComplete, totalCards, topicId, proficiency, score, store.startedAt, topicName, router, store]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.neon} />
        <Text style={styles.loadingText}>LOADING SCENARIOS...</Text>
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
    <SafeAreaView style={styles.screen}>
      <ScenarioCard card={currentCard} onGrade={gradeCard} onNext={nextCard} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: colors.neon, fontFamily: 'monospace', fontSize: 12, letterSpacing: 2, marginTop: 16 },
  errorText: { color: colors.error, fontFamily: 'monospace', fontSize: 14 },
  emptyTitle: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, letterSpacing: 1 },
  emptySub: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, marginTop: 8, textAlign: 'center' },
});
