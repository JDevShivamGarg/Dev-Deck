import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '../../src/hooks/useSession';
import { FlashCard } from '../../src/components/cards/FlashCard';
import { TimerBar } from '../../src/components/TimerBar';
import { insertSession } from '../../src/db/queries/sessions';
import { getUserConfig } from '../../src/db/queries/config';
import { useSessionStore } from '../../src/store/session';
import { colors } from '../../src/theme/colors';
import { useTimer } from '../../src/hooks/useTimer';
import type { Proficiency } from '../../src/types';

export default function FlashcardSession() {
  const { topicId, topicName, proficiency } = useLocalSearchParams<{
    topicId: string;
    topicName: string;
    proficiency: string;
  }>();
  const router = useRouter();

  const [timerMode, setTimerMode] = useState<'timer' | 'stopwatch'>('stopwatch');
  const [timeLimitSecs, setTimeLimitSecs] = useState(30);

  useEffect(() => {
    (async () => {
      const mode = await getUserConfig('timer_mode');
      if (mode === 'timer' || mode === 'stopwatch') setTimerMode(mode);
      const limit = await getUserConfig('question_time_limit');
      if (limit) setTimeLimitSecs(Number(limit));
    })();
  }, []);

  const {
    loading, error, currentCard, currentIndex, score, totalCards, isComplete, gradeCard, nextCard,
    sessionElapsed, cardElapsed,
  } = useSession(
    Number(topicId), topicName ?? '', 'flashcard', (proficiency as Proficiency) ?? 'intermediate', timeLimitSecs
  );

  const { remaining, isExpired } = useTimer(timerMode, timeLimitSecs, currentIndex);

  const store = useSessionStore();

  useEffect(() => {
    if (isComplete && totalCards > 0) {
      const elapsed = store.startedAt ? Math.round((Date.now() - store.startedAt) / 1000) : 0;
      const answersJson = JSON.stringify(store.answers);
      insertSession({
        topic_id: Number(topicId),
        mode: 'flashcard',
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
            mode: 'flashcard', 
            total: totalCards.toString(), 
            correct: score.toString(),
            elapsed: elapsed.toString(),
            answers: answersJson,
          },
        });
      });
    }
  }, [isComplete, totalCards, topicId, proficiency, score, store.startedAt, topicName, router, store]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.neon} />
        <Text style={styles.loadingText}>LOADING CARDS...</Text>
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
      {/* Timer bar */}
      <TimerBar
        sessionElapsed={sessionElapsed}
        cardElapsed={cardElapsed}
        cardRemaining={timerMode === 'timer' ? remaining : null}
        isExpired={isExpired}
        mode={timerMode}
        limitSecs={timeLimitSecs}
      />
      {/* Progress counter */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>[ {currentIndex + 1} / {totalCards} ]</Text>
      </View>
      <FlashCard card={currentCard} onGrade={gradeCard} onNext={nextCard} />
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
  counterRow: { paddingHorizontal: 16, paddingTop: 8, alignItems: 'flex-end' },
  counterText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14 },
});
