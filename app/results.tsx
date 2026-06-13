import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { updateCardDifficulty } from '../src/db/queries/cards';
import { useSessionStore } from '../src/store/session';
import { colors } from '../src/theme/colors';
import type { AnswerRecord } from '../src/store/session';

export default function ResultsScreen() {
  const { topicName, mode, total, correct, elapsed: elapsedStr, answers: answersJson } = useLocalSearchParams<{
    topicName: string;
    mode: string;
    total: string;
    correct: string;
    elapsed: string;
    answers: string;
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

  const answers: AnswerRecord[] = (() => {
    try { return answersJson ? JSON.parse(answersJson) : []; }
    catch { return []; }
  })();

  const correctAnswers = answers.filter((a) => a.correct);
  const incorrectAnswers = answers.filter((a) => !a.correct);

  const [reviewTab, setReviewTab] = useState<'correct' | 'incorrect'>('incorrect');
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [localDiffs, setLocalDiffs] = useState<Record<number, number>>({});

  const toggleExpand = (cardId: number) =>
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));

  const handleDifficultyChange = async (cardId: number, currentDiff: number, change: number) => {
    const newDiff = Math.max(1, Math.min(5, currentDiff + change));
    if (newDiff === currentDiff) return;
    setLocalDiffs(prev => ({ ...prev, [cardId]: newDiff }));
    await updateCardDifficulty(cardId, newDiff);
  };

  const handleDone = () => {
    resetSession();
    router.replace('/(tabs)');
  };

  const handleRetry = () => {
    resetSession();
    router.back();
  };

  const reviewList = reviewTab === 'correct' ? correctAnswers : incorrectAnswers;

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

        {/* Review section */}
        {answers.length > 0 && (
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <View style={styles.neonDot} />
              <Text style={styles.reviewTitle}>REVIEW</Text>
            </View>

            {/* Tabs */}
            <View style={styles.reviewTabs}>
              <TouchableOpacity
                style={[styles.reviewTab, reviewTab === 'correct' && styles.reviewTabActive]}
                onPress={() => setReviewTab('correct')}
                activeOpacity={0.85}
              >
                {reviewTab === 'correct' && <View style={styles.reviewTabBar} />}
                <Text style={[styles.reviewTabText, reviewTab === 'correct' && styles.reviewTabTextActive]}>
                  CORRECT ({correctAnswers.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewTab, reviewTab === 'incorrect' && styles.reviewTabActive]}
                onPress={() => setReviewTab('incorrect')}
                activeOpacity={0.85}
              >
                {reviewTab === 'incorrect' && <View style={[styles.reviewTabBar, styles.reviewTabBarError]} />}
                <Text style={[styles.reviewTabText, reviewTab === 'incorrect' && styles.reviewTabTextError]}>
                  INCORRECT ({incorrectAnswers.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card list */}
            <View style={styles.reviewList}>
              {reviewList.length === 0 ? (
                <View style={styles.reviewEmpty}>
                  <Text style={styles.reviewEmptyText}>
                    {reviewTab === 'correct' ? 'No correct answers.' : 'No incorrect answers.'}
                  </Text>
                </View>
              ) : (
                reviewList.map((item, idx) => {
                  const isExpanded = expandedCards[item.cardId] ?? false;
                  const isCorrect = item.correct;
                  return (
                    <View key={`${item.cardId}-${idx}`} style={styles.reviewCard}>
                      <TouchableOpacity
                        style={styles.reviewCardHeader}
                        onPress={() => toggleExpand(item.cardId)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.reviewStatusDot, isCorrect ? styles.reviewDotCorrect : styles.reviewDotError]} />
                        <Text style={styles.reviewQuestionPreview} numberOfLines={isExpanded ? undefined : 2}>
                          {item.question}
                        </Text>
                        <MaterialIcons
                          name={isExpanded ? 'expand-less' : 'expand-more'}
                          size={20}
                          color={colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.reviewCardBody}>
                          {/* Correct answer */}
                          <View style={styles.reviewAnswerRow}>
                            <Text style={styles.reviewAnswerLabel}>CORRECT</Text>
                            <Text style={styles.reviewAnswerCorrect}>{item.answer}</Text>
                          </View>

                          {/* MCQ: user's choice (only if different from correct) */}
                          {item.mode === 'mcq' && item.userChoice && item.userChoice !== item.answer && (
                            <View style={styles.reviewAnswerRow}>
                              <Text style={styles.reviewAnswerLabel}>YOU PICKED</Text>
                              <Text style={styles.reviewAnswerWrong}>{item.userChoice}</Text>
                            </View>
                          )}

                          <View style={styles.reviewCardFooter}>
                            <View style={styles.reviewModeBadge}>
                              <Text style={styles.reviewModeBadgeText}>{item.mode.toUpperCase()}</Text>
                            </View>
                            <View style={styles.diffControls}>
                              <Text style={styles.diffLabel}>DIFF: {localDiffs[item.cardId] ?? item.difficulty}</Text>
                              <TouchableOpacity onPress={() => handleDifficultyChange(item.cardId, localDiffs[item.cardId] ?? item.difficulty, -1)} style={styles.diffBtn}>
                                <MaterialIcons name="arrow-drop-down" size={24} color={colors.onSurface} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDifficultyChange(item.cardId, localDiffs[item.cardId] ?? item.difficulty, 1)} style={styles.diffBtn}>
                                <MaterialIcons name="arrow-drop-up" size={24} color={colors.onSurface} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

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

  // Review
  reviewSection: { gap: 0 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  neonDot: { width: 8, height: 8, backgroundColor: colors.neon },
  reviewTitle: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  reviewTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant, marginBottom: 0 },
  reviewTab: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center',
    borderWidth: 1, borderBottomWidth: 0, borderColor: 'transparent', position: 'relative',
  },
  reviewTabActive: { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceVariant },
  reviewTabBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.neon },
  reviewTabBarError: { backgroundColor: colors.error },
  reviewTabText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  reviewTabTextActive: { color: colors.neon },
  reviewTabTextError: { color: colors.error },
  reviewList: {
    borderWidth: 1, borderTopWidth: 0, borderColor: colors.surfaceVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  reviewEmpty: { padding: 24, alignItems: 'center' },
  reviewEmptyText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 13 },
  reviewCard: { borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant },
  reviewCardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, paddingVertical: 12,
  },
  reviewStatusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  reviewDotCorrect: { backgroundColor: colors.neon },
  reviewDotError: { backgroundColor: colors.error },
  reviewQuestionPreview: {
    color: colors.onSurface, fontFamily: 'monospace', fontSize: 13,
    lineHeight: 20, flex: 1,
  },
  reviewCardBody: {
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 0,
    borderTopWidth: 1, borderTopColor: colors.surfaceVariant,
    backgroundColor: colors.surfaceContainerLow, gap: 10,
  },
  reviewAnswerRow: { gap: 4, paddingTop: 10 },
  reviewAnswerLabel: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  reviewAnswerCorrect: { color: colors.neon, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, lineHeight: 22 },
  reviewAnswerWrong: { color: colors.error, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, lineHeight: 22 },
  reviewModeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.surfaceContainerHigh },
  reviewModeBadgeText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.8 },
  reviewCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  diffControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerHigh, borderRadius: 4 },
  diffLabel: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.8, marginHorizontal: 8 },
  diffBtn: { paddingHorizontal: 4 },

  // Actions
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
