import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCardsByTopic, deleteCard, bulkDeleteCards } from '../../src/db/queries/cards';
import { colors } from '../../src/theme/colors';
import type { CardWithProgress } from '../../src/types';

const MODE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  flashcard: 'FLASHCARD',
  scenario: 'SCENARIO',
};

const DIFF_LABEL: Record<number, string> = {
  1: 'EASY', 2: 'EASY', 3: 'MID', 4: 'HARD', 5: 'HARD',
};

const DIFF_COLOR: Record<number, string> = {
  1: colors.neon, 2: colors.neon, 3: '#FFA500', 4: colors.error, 5: colors.error,
};

export default function CardManagerScreen() {
  const { topicId, topicName } = useLocalSearchParams<{
    topicId: string;
    topicName: string;
  }>();
  const router = useRouter();

  const [cards, setCards] = useState<CardWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCardsByTopic(Number(topicId));
      setCards(result);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useFocusEffect(useCallback(() => { loadCards(); }, [loadCards]));

  const groupedCards = (['mcq', 'flashcard', 'scenario'] as const).map((mode) => ({
    mode,
    items: cards.filter((c) => c.mode === mode),
  }));

  const toggleSelect = (cardId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cardId) ? next.delete(cardId) : next.add(cardId);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(cards.map((c) => c.id)));
  const deselectAll = () => setSelected(new Set());

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleDeleteSingle = (card: CardWithProgress) => {
    Alert.alert(
      'Delete Card',
      `Permanently delete this card?\n\n"${card.question.substring(0, 120)}${card.question.length > 120 ? '...' : ''}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCard(card.id);
            loadCards();
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    const count = selected.size;
    if (count === 0) return;
    Alert.alert(
      'Bulk Delete',
      `Permanently delete ${count} card${count !== 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Delete ${count}`,
          style: 'destructive',
          onPress: async () => {
            await bulkDeleteCards(Array.from(selected));
            exitSelectMode();
            loadCards();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* App bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => {
          if (selectMode) exitSelectMode();
          else router.back();
        }}>
          <MaterialIcons name={selectMode ? 'close' : 'arrow-back'} size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle} numberOfLines={1}>
          {selectMode ? `${selected.size} SELECTED` : (topicName ?? '').toUpperCase()}
        </Text>
        <TouchableOpacity
          style={styles.appBarBtn}
          onPress={() => {
            if (selectMode) exitSelectMode();
            else setSelectMode(true);
          }}
        >
          <Text style={styles.appBarAction}>{selectMode ? 'CANCEL' : 'SELECT'}</Text>
        </TouchableOpacity>
      </View>

      {/* Select-all / Deselect-all bar */}
      {selectMode && (
        <View style={styles.selectBar}>
          <TouchableOpacity onPress={selectAll} style={styles.selectBarBtn}>
            <Text style={styles.selectBarBtnText}>SELECT ALL</Text>
          </TouchableOpacity>
          <View style={styles.selectBarDivider} />
          <TouchableOpacity onPress={deselectAll} style={styles.selectBarBtn}>
            <Text style={styles.selectBarBtnText}>DESELECT ALL</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.neon} />
          <Text style={styles.loadingText}>LOADING CARDS...</Text>
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="card-remove-outline" size={48} color={colors.surfaceVariant} />
          <Text style={styles.emptyTitle}>NO CARDS</Text>
          <Text style={styles.emptySub}>Generate cards for this topic first.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {groupedCards.map(({ mode, items }) => {
            if (items.length === 0) return null;
            return (
              <View key={mode} style={styles.section}>
                {/* Section header */}
                <View style={styles.sectionHeader}>
                  <View style={styles.neonDot} />
                  <Text style={styles.sectionLabel}>{MODE_LABELS[mode]}</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{items.length}</Text>
                  </View>
                </View>

                {/* Cards */}
                <View style={styles.cardList}>
                  {items.map((card, idx) => {
                    const isSelected = selected.has(card.id);
                    const diffColor = DIFF_COLOR[card.difficulty] ?? colors.onSurfaceVariant;
                    return (
                      <TouchableOpacity
                        key={card.id}
                        activeOpacity={0.85}
                        style={[
                          styles.cardRow,
                          idx < items.length - 1 && styles.cardRowBorder,
                          isSelected && styles.cardRowSelected,
                        ]}
                        onPress={() => selectMode && toggleSelect(card.id)}
                        onLongPress={() => {
                          if (!selectMode) {
                            setSelectMode(true);
                            toggleSelect(card.id);
                          }
                        }}
                      >
                        {/* Checkbox (select mode) */}
                        {selectMode && (
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <MaterialIcons name="check" size={14} color={colors.dark} />}
                          </View>
                        )}

                        {/* Content */}
                        <View style={styles.cardContent}>
                          <Text style={styles.cardQuestion} numberOfLines={2}>
                            {card.question}
                          </Text>
                          <View style={styles.cardMeta}>
                            <View style={[styles.badge, { borderColor: diffColor }]}>
                              <Text style={[styles.badgeText, { color: diffColor }]}>
                                {DIFF_LABEL[card.difficulty] ?? `D${card.difficulty}`}
                              </Text>
                            </View>
                            <View style={styles.sourceBadge}>
                              <Text style={styles.sourceBadgeText}>
                                {(card.source ?? 'static').toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.statText}>
                              {card.times_seen ?? 0} seen · {card.times_correct ?? 0} correct
                            </Text>
                          </View>
                        </View>

                        {/* Delete (normal mode) */}
                        {!selectMode && (
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteSingle(card)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Bulk delete footer */}
      {selectMode && selected.size > 0 && (
        <View style={styles.bulkFooter}>
          <TouchableOpacity style={styles.bulkDeleteBtn} onPress={handleBulkDelete} activeOpacity={0.85}>
            <MaterialIcons name="delete" size={20} color={colors.dark} />
            <Text style={styles.bulkDeleteText}>DELETE SELECTED ({selected.size})</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, height: 56, backgroundColor: colors.dark,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appBarBtn: { padding: 8, minWidth: 40, alignItems: 'center' },
  appBarTitle: {
    color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16,
    letterSpacing: -0.5, flex: 1, textAlign: 'center',
  },
  appBarAction: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },
  selectBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  selectBarBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  selectBarBtnText: { color: colors.neon, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },
  selectBarDivider: { width: 1, height: 20, backgroundColor: colors.border },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.neon, fontFamily: 'monospace', fontSize: 12, letterSpacing: 2 },
  emptyTitle: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, letterSpacing: 1 },
  emptySub: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 13 },
  content: { padding: 16, paddingBottom: 80, gap: 24 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  neonDot: { width: 8, height: 8, backgroundColor: colors.neon },
  sectionLabel: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2 },
  sectionBadge: {
    backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.surfaceVariant,
  },
  sectionBadgeText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11 },
  cardList: { borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLowest },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
  },
  cardRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant },
  cardRowSelected: { backgroundColor: 'rgba(195,244,0,0.06)' },
  checkbox: {
    width: 20, height: 20, borderWidth: 1, borderColor: colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxSelected: { backgroundColor: colors.neon, borderColor: colors.neon },
  cardContent: { flex: 1, gap: 6 },
  cardQuestion: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 13, lineHeight: 19 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  badgeText: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.8 },
  sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.surfaceContainerHigh },
  sourceBadgeText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10 },
  statText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10 },
  deleteBtn: { padding: 4 },
  bulkFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopColor: colors.error,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
  },
  bulkDeleteBtn: {
    backgroundColor: colors.error, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  bulkDeleteText: {
    color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase',
  },
});
