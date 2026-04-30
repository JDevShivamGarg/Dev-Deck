import { StyleSheet } from 'react-native';
import { colors } from './colors';

// Reusable typography presets matching the design system
export const typography = StyleSheet.create({
  headlineLg: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 48,
    lineHeight: 48 * 1.1,
    letterSpacing: -0.02 * 48,
    fontWeight: '700',
  },
  headlineMd: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 32,
    lineHeight: 32 * 1.2,
    fontWeight: '600',
  },
  headlineSm: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 20,
    lineHeight: 20 * 1.4,
    letterSpacing: 0.05 * 20,
    fontWeight: '600',
  },
  bodyLg: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 18,
    lineHeight: 18 * 1.6,
    fontWeight: '400',
  },
  bodyMd: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 16,
    lineHeight: 16 * 1.6,
    fontWeight: '400',
  },
  codeMd: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 14 * 1.5,
    fontWeight: '400',
  },
  labelSm: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0.1 * 12,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
  },
});

// Common layout patterns
export const layout = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentPadding: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.neon,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  neonDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.neon,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
