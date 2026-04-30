import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getActiveTopics } from '../db/queries/topics';
import { getCardsDueCount } from '../db/queries/cards';
import { TOPIC_ICON_MAP } from '../data/topics';
import { colors } from '../theme/colors';
import type { Topic } from '../types';

interface TopicWithDue extends Topic {
  dueCount: number;
}

export function TopicGrid() {
  const [topics, setTopics] = useState<TopicWithDue[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      const activeTopics = await getActiveTopics();
      const topicsWithDue = await Promise.all(
        activeTopics.map(async (topic) => ({
          ...topic,
          dueCount: await getCardsDueCount(topic.id),
        }))
      );
      setTopics(topicsWithDue);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const getIconName = (slug: string): string => {
    return TOPIC_ICON_MAP[slug] ?? 'folder-outline';
  };

  const renderTopic = ({ item }: { item: TopicWithDue }) => (
    <TouchableOpacity
      onPress={() => router.push(`/session/setup/${item.id}`)}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
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
      <View style={styles.cardFooter}>
        <Text style={styles.name}>{item.display_name}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '50%' }]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={topics}
      renderItem={renderTopic}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={{ padding: 4, paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14 },
  gridRow: { gap: 4, paddingHorizontal: 4 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardHeader: {
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
    backgroundColor: colors.card,
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
  cardFooter: { marginTop: 16 },
  name: {
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
