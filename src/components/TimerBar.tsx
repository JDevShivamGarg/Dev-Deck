import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TimerBarProps {
  sessionElapsed: number;
  /** Seconds elapsed on the current card */
  cardElapsed: number;
  /** Only defined in timer mode. null in stopwatch mode. */
  cardRemaining: number | null;
  isExpired: boolean;
  mode: 'timer' | 'stopwatch';
  /** Limit in seconds — used to compute fill % in timer mode */
  limitSecs?: number;
}

export function TimerBar({
  sessionElapsed,
  cardElapsed,
  cardRemaining,
  isExpired,
  mode,
  limitSecs = 30,
}: TimerBarProps) {
  const fillPct =
    mode === 'timer' && cardRemaining !== null
      ? Math.max(0, (cardRemaining / limitSecs) * 100)
      : null;

  const barColor = isExpired
    ? colors.error
    : fillPct !== null && fillPct < 25
    ? colors.error
    : fillPct !== null && fillPct < 50
    ? '#FFA500'
    : colors.neon;

  return (
    <View style={styles.container}>
      {/* Session elapsed */}
      <View style={styles.sessionBlock}>
        <Text style={styles.sessionLabel}>SESSION</Text>
        <Text style={styles.sessionTime}>{formatTime(sessionElapsed)}</Text>
      </View>

      {/* Question timer / stopwatch */}
      <View style={styles.questionBlock}>
        {mode === 'stopwatch' ? (
          <>
            <Text style={styles.questionLabel}>CARD</Text>
            <Text style={styles.questionTime}>{cardElapsed}s</Text>
          </>
        ) : isExpired ? (
          <>
            <Text style={[styles.questionLabel, styles.expiredLabel]}>EXPIRED</Text>
            <View style={[styles.progressBg]}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: colors.error }]} />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.questionLabel, { color: barColor }]}>
              {cardRemaining}s
            </Text>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${fillPct}%` as any, backgroundColor: barColor },
                ]}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceContainerLowest,
  },
  sessionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionLabel: {
    color: colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sessionTime: {
    color: colors.onSurface,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  questionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionLabel: {
    color: colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  questionTime: {
    color: colors.onSurface,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  expiredLabel: {
    color: colors.error,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  progressBg: {
    width: 80,
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
