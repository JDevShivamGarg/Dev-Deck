import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getTopicById } from '../../../src/db/queries/topics';
import { getCardsDueCount } from '../../../src/db/queries/cards';
import { colors } from '../../../src/theme/colors';
import type { Topic, CardMode, Proficiency } from '../../../src/types';

const MODES: { key: CardMode; label: string; icon: string; desc: string }[] = [
  { key: 'mcq', label: 'MCQ', icon: 'help-circle-outline', desc: 'Multiple Choice Evaluation' },
  { key: 'flashcard', label: 'Flashcard', icon: 'cards-outline', desc: 'Spaced Repetition' },
  { key: 'scenario', label: 'Scenario', icon: 'console-line', desc: 'Real-world Debugging' },
];

const PROFICIENCIES: { key: Proficiency; label: string; level: string }[] = [
  { key: 'beginner', label: 'Beginner', level: 'L1' },
  { key: 'intermediate', label: 'Intermediate', level: 'L2' },
  { key: 'advanced', label: 'Advanced', level: 'L3' },
];

export default function SessionSetup() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [selectedMode, setSelectedMode] = useState<CardMode>('mcq');
  const [selectedProficiency, setSelectedProficiency] = useState<Proficiency>('intermediate');

  useEffect(() => {
    if (topicId) {
      getTopicById(Number(topicId)).then(setTopic);
      getCardsDueCount(Number(topicId)).then(setDueCount);
    }
  }, [topicId]);

  const handleStart = () => {
    if (!topic) return;
    router.push({
      pathname: `/session/${selectedMode}`,
      params: {
        topicId: topic.id.toString(),
        topicName: topic.display_name,
        proficiency: selectedProficiency,
      },
    });
  };

  if (!topic) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.appBarBtn}>
          <MaterialCommunityIcons name="console-line" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>TECHFLASH</Text>
        <TouchableOpacity style={styles.appBarBtn}>
          <MaterialIcons name="settings" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {/* Topic header */}
        <View style={styles.topicHeader}>
          <View style={styles.topicHeaderRow}>
            <View style={styles.topicTag}>
              <Text style={styles.topicTagText}>SYS.TOPIC.{topic.slug.toUpperCase()}</Text>
            </View>
            <View style={styles.dueBadge}>
              <MaterialIcons name="inbox" size={14} color={colors.onPrimaryContainer} />
              <Text style={styles.dueBadgeText}>{dueCount} cards due</Text>
            </View>
          </View>
          <Text style={styles.topicTitle}>{topic.display_name}</Text>
          <Text style={styles.topicSub}>Container Orchestration Engine // Active Session Setup</Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.neonDot} />
            <Text style={styles.sectionLabel}>SELECT MODE</Text>
          </View>
          <View style={styles.modeGrid}>
            {MODES.map((mode) => {
              const isActive = selectedMode === mode.key;
              return (
                <TouchableOpacity
                  key={mode.key}
                  style={[styles.modeCard, isActive && styles.modeCardActive]}
                  onPress={() => setSelectedMode(mode.key)}
                  activeOpacity={0.85}
                >
                  {isActive && <View style={styles.modeActiveBar} />}
                  <MaterialCommunityIcons
                    name={mode.icon as any}
                    size={28}
                    color={isActive ? colors.neon : colors.onSurfaceVariant}
                  />
                  <View style={styles.modeTextWrap}>
                    <Text style={[styles.modeName, isActive && styles.modeNameActive]}>
                      {mode.label}
                    </Text>
                    <Text style={styles.modeDesc}>{mode.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Proficiency Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.neonDot, { backgroundColor: colors.outlineVariant }]} />
            <Text style={styles.sectionLabel}>PROFICIENCY LEVEL</Text>
          </View>
          <View style={styles.profList}>
            {PROFICIENCIES.map((prof) => {
              const isActive = selectedProficiency === prof.key;
              return (
                <TouchableOpacity
                  key={prof.key}
                  style={[styles.profRow, isActive && styles.profRowActive]}
                  onPress={() => setSelectedProficiency(prof.key)}
                  activeOpacity={0.85}
                >
                  <View style={styles.profLeft}>
                    <Text style={[styles.profLevel, isActive && styles.profLevelActive]}>
                      {prof.level}
                    </Text>
                    <Text style={[styles.profLabel, isActive && styles.profLabelActive]}>
                      {prof.label}
                    </Text>
                  </View>
                  <View style={[styles.profCheck, isActive && styles.profCheckActive]}>
                    {isActive && (
                      <MaterialIcons name="check" size={14} color={colors.onPrimaryContainer} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Start Button */}
        <View style={styles.startSection}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.9}>
            <Text style={styles.startButtonText}>START SESSION</Text>
            <MaterialIcons name="arrow-forward" size={24} color={colors.onPrimaryContainer} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loadingText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, textAlign: 'center', marginTop: 100 },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: colors.dark,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appBarBtn: { padding: 8 },
  appBarTitle: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, letterSpacing: -1, textTransform: 'uppercase' },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 48, gap: 48 },
  topicHeader: { borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant, paddingBottom: 16, marginTop: 16 },
  topicHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  topicTag: { backgroundColor: 'rgba(195,244,0,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(195,244,0,0.3)' },
  topicTagText: { color: colors.neon, fontFamily: 'monospace', fontSize: 14 },
  dueBadge: {
    backgroundColor: colors.neon, flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  dueBadgeText: { color: colors.onPrimaryContainer, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  topicTitle: { color: colors.tertiary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 40, letterSpacing: -1, textTransform: 'uppercase' },
  topicSub: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, marginTop: 4 },
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  neonDot: { width: 4, height: 4, backgroundColor: colors.neon },
  sectionLabel: { color: colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  modeGrid: { gap: 8 },
  modeCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceVariant,
    padding: 16, flexDirection: 'column', gap: 16,
  },
  modeCardActive: {
    backgroundColor: colors.surfaceContainerLow, borderColor: colors.neon,
    position: 'relative', overflow: 'hidden',
  },
  modeActiveBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.neon },
  modeTextWrap: {},
  modeName: { color: colors.tertiary, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 },
  modeNameActive: { color: colors.neon, opacity: 1 },
  modeDesc: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, marginTop: 4 },
  profList: { borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surface },
  profRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant,
  },
  profRowActive: { backgroundColor: colors.surfaceContainerLow },
  profLeft: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  profLevel: { fontFamily: 'monospace', fontSize: 14, color: colors.onSurfaceVariant, width: 32, opacity: 0.5 },
  profLevelActive: { color: colors.neon, opacity: 1 },
  profLabel: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: 18, color: colors.tertiary },
  profLabelActive: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontWeight: '700' },
  profCheck: { width: 20, height: 20, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  profCheckActive: { borderColor: colors.neon, backgroundColor: colors.neon },
  startSection: { borderTopWidth: 1, borderTopColor: colors.surfaceVariant, paddingTop: 24 },
  startButton: {
    backgroundColor: colors.neon, paddingVertical: 24, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  startButtonText: {
    color: colors.onPrimaryContainer, fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 28, letterSpacing: -0.5, textTransform: 'uppercase',
  },
});
