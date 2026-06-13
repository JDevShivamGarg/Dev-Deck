import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import type { CardWithProgress } from '../../types';

interface MCQCardProps {
  card: CardWithProgress;
  onGrade: (correct: boolean, userChoice: string) => void;
  onNext: () => void;
}

export function MCQCard({ card, onGrade, onNext }: MCQCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const options: string[] = card.options ? JSON.parse(card.options) : [];
  const LETTERS = ['A', 'B', 'C', 'D'];

  const handleSelect = (option: string) => {
    if (hasAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption || hasAnswered) return;
    setHasAnswered(true);
    onGrade(selectedOption === card.answer, selectedOption);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setHasAnswered(false);
    onNext();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionWrap}>
          <Text style={styles.promptChar}>{'>_'}</Text>
          <Text style={styles.questionText}>{card.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsWrap}>
          {options.map((option, index) => {
            const isSelected = option === selectedOption;
            const isAnswer = option === card.answer;
            const showCorrect = hasAnswered && isAnswer;
            const showWrong = hasAnswered && isSelected && !isAnswer;

            return (
              <View key={index}>
                <TouchableOpacity
                  onPress={() => handleSelect(option)}
                  activeOpacity={hasAnswered ? 1 : 0.85}
                  style={[
                    styles.optionBtn,
                    isSelected && !hasAnswered && styles.optionSelected,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                  ]}
                >
                  {showCorrect && <View style={styles.optionActiveBar} />}
                  <View style={[
                    styles.optionLetter,
                    showCorrect && styles.optionLetterCorrect,
                  ]}>
                    <Text style={[
                      styles.optionLetterText,
                      showCorrect && styles.optionLetterTextCorrect,
                    ]}>
                      {LETTERS[index]}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    showCorrect && styles.optionTextCorrect,
                  ]}>
                    {option}
                  </Text>
                  {showCorrect && (
                    <MaterialIcons name="check-circle" size={20} color={colors.neon} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>

                {/* Explanation under correct answer */}
                {showCorrect && card.explanation && (
                  <View style={styles.explanationWrap}>
                    <MaterialIcons name="info-outline" size={16} color={colors.onSurfaceVariant} />
                    <Text style={styles.explanationText}>{card.explanation}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomAction}>
        {!hasAnswered ? (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedOption}
            style={[styles.actionBtn, !selectedOption && styles.actionBtnDisabled]}
            activeOpacity={0.9}
          >
            <Text style={[styles.actionBtnText, !selectedOption && styles.actionBtnTextDisabled]}>
              SUBMIT ANSWER
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNext} style={styles.actionBtn} activeOpacity={0.9}>
            <Text style={styles.actionBtnText}>NEXT QUESTION</Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.dark} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  questionWrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderLeftWidth: 2, borderLeftColor: colors.surfaceVariant,
    paddingLeft: 16, paddingVertical: 8, marginBottom: 32,
  },
  promptChar: { color: colors.neon, fontFamily: 'monospace', fontSize: 14, marginTop: 2 },
  questionText: {
    color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 20, lineHeight: 28, letterSpacing: 1, flex: 1,
  },
  optionsWrap: { gap: 8 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
    backgroundColor: colors.surfaceContainerLowest,
    position: 'relative', overflow: 'hidden',
  },
  optionSelected: { borderColor: colors.outline, backgroundColor: colors.surfaceContainerLow },
  optionCorrect: { borderColor: colors.neon, backgroundColor: colors.surfaceContainer },
  optionWrong: { borderColor: colors.error, backgroundColor: 'rgba(147,0,10,0.1)' },
  optionActiveBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.neon },
  optionLetter: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  optionLetterCorrect: { backgroundColor: colors.neon },
  optionLetterText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14 },
  optionLetterTextCorrect: { color: colors.dark, fontWeight: '700' },
  optionText: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 14, flex: 1 },
  optionTextCorrect: { color: colors.neon },
  explanationWrap: {
    marginLeft: 44, borderLeftWidth: 1, borderLeftColor: colors.neon,
    paddingLeft: 16, paddingVertical: 8, marginTop: 4,
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
  },
  explanationText: { color: colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 15, lineHeight: 24, flex: 1 },
  bottomAction: {
    borderTopWidth: 1, borderTopColor: colors.surfaceVariant,
    padding: 16, backgroundColor: colors.background,
  },
  actionBtn: {
    backgroundColor: colors.neon, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  actionBtnDisabled: { backgroundColor: colors.surfaceContainerHigh },
  actionBtnText: {
    color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
  },
  actionBtnTextDisabled: { color: colors.onSurfaceVariant },
});
