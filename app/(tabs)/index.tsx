import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getActiveTopics } from '../../src/db/queries/topics';
import { getCardsDueCount, getAllCardsDueCount } from '../../src/db/queries/cards';
import { TOPIC_ICON_MAP } from '../../src/data/topics';
import { colors } from '../../src/theme/colors';
import type { Topic } from '../../src/types';

interface TopicWithDue extends Topic {
  dueCount: number;
  progress: number; // 0-1
}

export default function HomeScreen() {
  const [topics, setTopics] = useState<TopicWithDue[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const router = useRouter();

  const handleStartSession = () => {
    if (topics.length === 0) {
      Alert.alert('No Topics Active', 'Please subscribe to or create a topic in Settings first.');
      return;
    }
    const topicWithDue = topics.find((t) => t.dueCount > 0);
    const targetTopic = topicWithDue ?? topics[0];
    router.push(`/session/setup/${targetTopic.id}`);
  };

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const active = await getActiveTopics();
        const due = await getAllCardsDueCount();
        setTotalDue(due);

        const withDue = await Promise.all(
          active.map(async (t) => ({
            ...t,
            dueCount: await getCardsDueCount(t.id),
            progress: 0.5, // placeholder — will compute real progress
          }))
        );
        setTopics(withDue);
      }
      load();
    }, [])
  );

  const getIconName = (slug: string): string => {
    return TOPIC_ICON_MAP[slug] ?? 'folder-outline';
  };

  const renderTopic = ({ item }: { item: TopicWithDue }) => (
    <TouchableOpacity
      onPress={() => router.push(`/session/setup/${item.id}`)}
      style={styles.topicCard}
      activeOpacity={0.85}
    >
      <View style={styles.topicHeader}>
        <MaterialCommunityIcons
          name={getIconName(item.slug) as any}
          size={32}
          color={colors.surfaceVariant}
        />
        {item.dueCount > 0 ? (
          <View style={styles.dueBadgeActive}>
            <Text style={styles.dueBadgeTextActive}>{item.dueCount} DUE</Text>
          </View>
        ) : (
          <View style={styles.dueBadgeInactive}>
            <Text style={styles.dueBadgeTextInactive}>0 DUE</Text>
          </View>
        )}
      </View>
      <View style={styles.topicFooter}>
        <Text style={styles.topicName} numberOfLines={2} ellipsizeMode="tail">
          {item.display_name}
        </Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${item.progress * 100}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header bar */}
      <View style={styles.appBar}>
        <MaterialCommunityIcons name="console-line" size={22} color={colors.neon} />
        <Text style={styles.appBarTitle}>DEVDECK</Text>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/topic/git-import')}>
            <MaterialCommunityIcons name="git" size={24} color={colors.neon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/topic/new')}>
            <MaterialCommunityIcons name="plus" size={24} color={colors.neon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary section */}
      <View style={styles.summarySection}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={styles.dailyDeckTitle}>DAILY DECK</Text>
          <Text style={styles.dailyDeckSub}>{totalDue} Cards due for review today.</Text>
        </View>
        <TouchableOpacity 
          style={styles.startBtn} 
          onPress={handleStartSession} 
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>START SESSION</Text>
        </TouchableOpacity>
      </View>

      {/* Topic grid */}
      <FlatList
        data={topics}
        renderItem={renderTopic}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  appBarTitle: {
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dailyDeckTitle: {
    color: colors.primary,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  dailyDeckSub: {
    color: colors.secondary,
    fontFamily: 'monospace',
    fontSize: 14,
    marginTop: 4,
  },
  startBtn: {
    backgroundColor: colors.neon,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.neon,
  },
  startBtnText: {
    color: colors.dark,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  gridContent: {
    padding: 8,
    paddingBottom: 80,
  },
  gridRow: {
    gap: 8,
    paddingHorizontal: 8,
  },
  topicCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dueBadgeActive: {
    backgroundColor: colors.neon,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.neon,
  },
  dueBadgeTextActive: {
    color: colors.dark,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  dueBadgeInactive: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dueBadgeTextInactive: {
    color: colors.secondary,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  topicFooter: {
    marginTop: 16,
  },
  topicName: {
    color: colors.primary,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.secondaryContainer,
  },
});
