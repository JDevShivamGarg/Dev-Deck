import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import type { CardWithProgress } from '../../types';

interface FlashCardProps {
  card: CardWithProgress;
  onGrade: (correct: boolean) => void;
  onNext: () => void;
}

export function FlashCard({ card, onGrade, onNext }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const rotation = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(rotation.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const handleFlip = () => {
    if (isFlipped) return;
    setIsFlipped(true);
    rotation.value = withTiming(1, { duration: 500 });
  };

  const handleGrade = (correct: boolean) => {
    setHasAnswered(true);
    onGrade(correct);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setHasAnswered(false);
    rotation.value = withTiming(0, { duration: 300 });
    setTimeout(onNext, 300);
  };

  return (
    <View style={styles.container}>
      {/* Session status */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>SESSION ACTIVE</Text>
        </View>
      </View>

      {/* Card area */}
      <Pressable onPress={handleFlip} style={styles.cardArea}>
        {/* Front */}
        <Animated.View style={[styles.card, frontStyle]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>MODULE: {card.question.substring(0, 30).toUpperCase()}...</Text>
            <MaterialCommunityIcons name="memory" size={16} color={colors.outlineVariant} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardQuestion}>{card.question}</Text>
          </View>
          <View style={styles.cardFooter}>
            <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.neon} />
            <Text style={styles.flipHint}>TAP TO FLIP</Text>
          </View>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.neon }]}>
            <Text style={[styles.cardHeaderText, { color: colors.neon }]}>ANSWER</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardAnswer}>{card.answer}</Text>
            {card.explanation && (
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationText}>{card.explanation}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>

      {/* Terminal action footer */}
      {isFlipped && (
        <View style={styles.actionFooter}>
          <View style={styles.terminalBox}>
            <View style={styles.terminalPromptRow}>
              <Text style={styles.terminalPrompt}>root@techflash:~$</Text>
              <Text style={styles.terminalCmd}> await user.response()</Text>
            </View>

            {!hasAnswered ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleGrade(false)}
                  style={styles.reviewBtn}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="replay" size={18} color={colors.onSurfaceVariant} />
                  <Text style={styles.reviewBtnText}>[ Review Again ]</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleGrade(true)}
                  style={styles.gotItBtn}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.onPrimaryContainer} />
                  <Text style={styles.gotItBtnText}>[ Got It ]</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.9}>
                <Text style={styles.nextBtnText}>NEXT CARD</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.dark} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  statusRow: { width: '100%', maxWidth: 500, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 8, height: 8, backgroundColor: colors.neon, borderRadius: 4 },
  statusText: { color: colors.neon, fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
  cardArea: { width: '100%', maxWidth: 500, aspectRatio: 0.75 },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  cardBack: { borderColor: colors.neon },
  cardHeader: {
    borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
    padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  cardHeaderText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14 },
  cardBody: { flex: 1, justifyContent: 'center', padding: 32 },
  cardQuestion: {
    color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 20, lineHeight: 28, textAlign: 'center', letterSpacing: 1,
  },
  cardAnswer: {
    color: colors.neon, fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 18, lineHeight: 26, marginBottom: 16,
  },
  explanationBlock: {
    backgroundColor: colors.surfaceContainerHighest, padding: 12, marginTop: 8,
  },
  explanationText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  cardFooter: {
    padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderTopWidth: 1, borderTopColor: colors.outlineVariant, borderStyle: 'dashed',
  },
  flipHint: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2 },
  actionFooter: { width: '100%', maxWidth: 500, marginTop: 32 },
  terminalBox: { borderWidth: 1, borderColor: colors.outlineVariant, padding: 8, backgroundColor: colors.surfaceContainerLowest },
  terminalPromptRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginBottom: 8 },
  terminalPrompt: { color: colors.neon, fontFamily: 'monospace', fontSize: 14 },
  terminalCmd: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  reviewBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: 'transparent',
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  reviewBtnText: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 14 },
  gotItBtn: {
    flex: 1, backgroundColor: colors.neon,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  gotItBtnText: { color: colors.onPrimaryContainer, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  nextBtn: {
    backgroundColor: colors.neon, paddingVertical: 16, marginTop: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  nextBtnText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 2 },
});
