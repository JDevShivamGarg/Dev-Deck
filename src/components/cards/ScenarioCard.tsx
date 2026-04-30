import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import type { CardWithProgress } from '../../types';

interface ScenarioCardProps {
  card: CardWithProgress;
  onGrade: (correct: boolean) => void;
  onNext: () => void;
}

export function ScenarioCard({ card, onGrade, onNext }: ScenarioCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleGrade = (correct: boolean) => {
    setHasAnswered(true);
    onGrade(correct);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setHasAnswered(false);
    onNext();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Scenario header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>SCENARIO: {card.question.substring(0, 20).toUpperCase()}...</Text>
        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>DIFFICULTY: {card.difficulty >= 4 ? 'HARD' : card.difficulty >= 3 ? 'MED' : 'EASY'}</Text>
        </View>
      </View>

      {/* Code block */}
      {card.code_snippet && (
        <View style={styles.codeBlock}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeFilename}>snippet.code</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.codeText}>{card.code_snippet}</Text>
          </ScrollView>
        </View>
      )}

      {/* Question */}
      <View style={styles.questionBlock}>
        <Text style={styles.questionText}>{card.question}</Text>
      </View>

      {/* Reveal button */}
      {!showAnswer && (
        <TouchableOpacity onPress={() => setShowAnswer(true)} style={styles.revealBtn} activeOpacity={0.85}>
          <MaterialIcons name="visibility" size={18} color={colors.dark} />
          <Text style={styles.revealBtnText}>REVEAL ANALYSIS</Text>
        </TouchableOpacity>
      )}

      {/* Answer & analysis */}
      {showAnswer && (
        <View style={styles.analysisBlock}>
          <View style={styles.analysisBar} />
          <View style={styles.analysisInner}>
            <View style={styles.analysisHeaderRow}>
              <MaterialIcons name="analytics" size={20} color={colors.surfaceTint} />
              <Text style={styles.analysisTitle}>Analysis Breakdown</Text>
            </View>

            <Text style={styles.answerText}>{card.answer}</Text>

            {card.explanation && (
              <View style={styles.explanationRow}>
                <MaterialIcons name="check" size={18} color={colors.surfaceTint} style={{ marginTop: 2 }} />
                <Text style={styles.explanationText}>{card.explanation}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Grade buttons */}
      {showAnswer && !hasAnswered && (
        <View style={styles.gradeRow}>
          <TouchableOpacity onPress={() => handleGrade(false)} style={styles.wrongBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="replay" size={18} color={colors.onSurface} />
            <Text style={styles.wrongBtnText}>REVIEW AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleGrade(true)} style={styles.correctBtn} activeOpacity={0.85}>
            <MaterialIcons name="check-circle" size={18} color={colors.dark} />
            <Text style={styles.correctBtnText}>GOT IT</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasAnswered && (
        <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.9}>
          <Text style={styles.nextBtnText}>NEXT SCENARIO</Text>
          <MaterialIcons name="arrow-forward" size={18} color={colors.dark} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest, paddingBottom: 8, marginBottom: 24,
  },
  headerTitle: {
    color: colors.primary, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, flex: 1,
  },
  diffBadge: {
    backgroundColor: colors.surfaceContainerLow, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.surfaceContainerHighest,
  },
  diffText: { color: colors.surfaceTint, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2 },
  codeBlock: {
    backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.surfaceContainerHighest,
    padding: 16, marginBottom: 24, position: 'relative',
  },
  codeHeader: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 4, paddingVertical: 2,
    borderBottomWidth: 1, borderLeftWidth: 1, borderColor: colors.surfaceContainerHighest,
  },
  codeFilename: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10 },
  codeText: { color: colors.neon, fontFamily: 'monospace', fontSize: 14, lineHeight: 21 },
  questionBlock: { marginBottom: 24 },
  questionText: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 18, lineHeight: 28 },
  revealBtn: {
    backgroundColor: colors.neon, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 24,
  },
  revealBtnText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 2 },
  analysisBlock: {
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border,
    marginBottom: 24, position: 'relative', overflow: 'hidden',
  },
  analysisBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.surfaceTint },
  analysisInner: { padding: 16, paddingLeft: 20 },
  analysisHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  analysisTitle: { color: colors.primary, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, letterSpacing: 1 },
  answerText: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 16, lineHeight: 25, marginBottom: 16 },
  explanationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  explanationText: { color: colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 16, lineHeight: 25, flex: 1 },
  gradeRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  wrongBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.outlineVariant, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  wrongBtnText: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2 },
  correctBtn: {
    flex: 1, backgroundColor: colors.neon, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  correctBtnText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2 },
  nextBtn: {
    backgroundColor: colors.neon, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  nextBtnText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 2 },
});
