import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSession } from '../../src/hooks/useSession';
import { ScenarioCard } from '../../src/components/cards/ScenarioCard';
import { TimerBar } from '../../src/components/TimerBar';
import { insertSession } from '../../src/db/queries/sessions';
import { getUserConfig } from '../../src/db/queries/config';
import { useSessionStore } from '../../src/store/session';
import { colors } from '../../src/theme/colors';
import { useTimer } from '../../src/hooks/useTimer';
import { checkAndUpdateStreak } from '../../src/utils/streak';
import type { Proficiency } from '../../src/types';

export default function ScenarioSession() {
  const { topicId, topicName, proficiency, slug } = useLocalSearchParams<{
    topicId: string;
    topicName: string;
    proficiency: string;
    slug: string;
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
    loading, error, currentCard, score, totalCards, isComplete, gradeCard, nextCard,
    sessionElapsed, cardElapsed,
  } = useSession(
    Number(topicId), topicName ?? '', 'scenario', (proficiency as Proficiency) ?? 'intermediate', timeLimitSecs
  );

  const { remaining, isExpired } = useTimer(timerMode, timeLimitSecs, score + (isComplete ? 1 : 0));

  const store = useSessionStore();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isComplete) return;
      e.preventDefault();
      Alert.alert(
        'End Session?',
        'You will lose your progress for this session. Are you sure you want to leave?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, isComplete]);

  useEffect(() => {
    if (isComplete && totalCards > 0) {
      const elapsed = store.startedAt ? Math.round((Date.now() - store.startedAt) / 1000) : 0;
      const answersJson = JSON.stringify(store.answers);
      insertSession({
        topic_id: Number(topicId),
        mode: 'scenario',
        proficiency: proficiency ?? 'intermediate',
        total_cards: totalCards,
        correct: score,
        started_at: store.startedAt ?? Date.now(),
        ended_at: Date.now(),
      }).then(async () => {
        await checkAndUpdateStreak(totalCards);
        store.resetSession();
        router.replace({
          pathname: '/results',
          params: { 
            topicName: topicName ?? '', 
            mode: 'scenario', 
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
      {/* Timer bar */}
      <TimerBar
        sessionElapsed={sessionElapsed}
        cardElapsed={cardElapsed}
        cardRemaining={timerMode === 'timer' ? remaining : null}
        isExpired={isExpired}
        mode={timerMode}
        limitSecs={timeLimitSecs}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScenarioCard card={currentCard} onGrade={gradeCard} onNext={nextCard} topicSlug={slug} />
      </KeyboardAvoidingView>
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
