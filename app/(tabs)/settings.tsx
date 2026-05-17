import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getActiveTopics, insertCustomTopic } from '../../src/db/queries/topics';
import { getUserConfig, setUserConfig } from '../../src/db/queries/config';
import { colors } from '../../src/theme/colors';
import type { Topic, Proficiency } from '../../src/types';

const PROFICIENCY_LEVELS: Proficiency[] = ['beginner', 'intermediate', 'advanced'];

export default function SettingsScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [defaultProficiency, setDefaultProficiency] = useState<Proficiency>('intermediate');
  const [customTopicInput, setCustomTopicInput] = useState('');

  const loadData = useCallback(async () => {
    const active = await getActiveTopics();
    setTopics(active);

    const key = await getUserConfig('groq_api_key');
    if (key) setApiKey(key);

    const prof = await getUserConfig('default_proficiency');
    if (prof) setDefaultProficiency(prof as Proficiency);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSaveKey = async () => {
    await setUserConfig('groq_api_key', apiKey);
    Alert.alert('Saved', 'API key has been stored.');
  };

  const handleProficiencyChange = async (prof: Proficiency) => {
    setDefaultProficiency(prof);
    await setUserConfig('default_proficiency', prof);
  };

  const handleAddCustomTopic = async () => {
    const trimmed = customTopicInput.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/\s+/g, '-');
    await insertCustomTopic(slug, trimmed, '📂');
    setCustomTopicInput('');
    loadData();
  };

  const builtinTopics = topics.filter((t) => t.is_builtin === 1);
  const customTopics = topics.filter((t) => t.is_builtin === 0);

  return (
    <SafeAreaView style={styles.screen}>
      {/* App bar */}
      <View style={styles.appBar}>
        <MaterialCommunityIcons name="console-line" size={22} color={colors.neon} />
        <Text style={styles.appBarTitle}>DEVDECK</Text>
        <MaterialIcons name="settings" size={22} color={colors.neon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.headerTitle}>SYSTEM CONFIG</Text>
          <Text style={styles.headerSub}>Manage content streams and integration parameters.</Text>
        </View>

        {/* Proficiency */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.neonDot} />
            <Text style={styles.sectionLabel}>BASE PROFICIENCY LEVEL</Text>
          </View>
          <View style={styles.profTabs}>
            {PROFICIENCY_LEVELS.map((p) => {
              const isActive = defaultProficiency === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.profTab, isActive && styles.profTabActive]}
                  onPress={() => handleProficiencyChange(p)}
                  activeOpacity={0.85}
                >
                  {isActive && <View style={styles.profTabBar} />}
                  <Text style={[styles.profTabText, isActive && styles.profTabTextActive]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Built-in topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.neonDot} />
            <Text style={styles.sectionLabel}>CORE TOPIC SUBSCRIPTIONS</Text>
          </View>
          <View style={styles.topicList}>
            {builtinTopics.map((t, i) => (
              <View key={t.id} style={[styles.topicRow, i < builtinTopics.length - 1 && styles.topicRowBorder]}>
                <View style={styles.topicRowLeft}>
                  <MaterialCommunityIcons name="folder-outline" size={18} color={colors.onSurfaceVariant} />
                  <Text style={styles.topicRowName}>{t.display_name.toUpperCase()}</Text>
                </View>
                <View style={[styles.toggleTrack, styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, styles.toggleThumbActive]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Custom topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.neonDot} />
            <Text style={styles.sectionLabel}>CUSTOM TRACKING VECTORS</Text>
          </View>
          <View style={styles.customInputRow}>
            <View style={styles.customInputWrap}>
              <Text style={styles.customPrompt}>&gt;</Text>
              <TextInput
                style={styles.customInput}
                value={customTopicInput}
                onChangeText={setCustomTopicInput}
                placeholder="ENTER CUSTOM KEYWORD OR DOMAIN"
                placeholderTextColor="rgba(196,201,172,0.4)"
                autoCapitalize="characters"
                onSubmitEditing={handleAddCustomTopic}
              />
            </View>
            <TouchableOpacity style={styles.appendBtn} onPress={handleAddCustomTopic} activeOpacity={0.85}>
              <Text style={styles.appendBtnText}>APPEND</Text>
            </TouchableOpacity>
          </View>

          {customTopics.length > 0 && (
            <View style={styles.topicList}>
              {customTopics.map((t, i) => (
                <View key={t.id} style={[styles.customRow, i < customTopics.length - 1 && styles.topicRowBorder]}>
                  <Text style={styles.customRowText}>{t.display_name.toUpperCase()}</Text>
                  <TouchableOpacity>
                    <MaterialIcons name="close" size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* API key */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.neonDot} />
            <Text style={styles.sectionLabel}>EXTERNAL MODEL AUTHENTICATION</Text>
          </View>
          <View style={styles.apiKeyCard}>
            <Text style={styles.apiKeyLabel}>GROQ API KEY [Required for AI synthesis]</Text>
            <View style={styles.apiKeyRow}>
              <View style={styles.apiKeyInputWrap}>
                <MaterialCommunityIcons name="key-variant" size={16} color={colors.onSurfaceVariant} style={styles.apiKeyIcon} />
                <TextInput
                  style={styles.apiKeyInput}
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry
                  placeholder="gsk_..."
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>
              <TouchableOpacity style={styles.verifyBtn} onPress={handleSaveKey} activeOpacity={0.85}>
                <Text style={styles.verifyBtnText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: colors.dark,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appBarTitle: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, letterSpacing: -1, textTransform: 'uppercase' },
  content: { padding: 16, paddingBottom: 80, gap: 24 },
  headerBlock: { marginBottom: 8 },
  headerTitle: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28, letterSpacing: -0.5, textTransform: 'uppercase' },
  headerSub: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, marginTop: 4 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  neonDot: { width: 8, height: 8, backgroundColor: colors.neon },
  sectionLabel: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  profTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant, marginTop: 4 },
  profTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderBottomWidth: 0, borderColor: 'transparent' },
  profTabActive: { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceVariant, position: 'relative' },
  profTabBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.neon },
  profTabText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 14, textTransform: 'uppercase' },
  profTabTextActive: { color: colors.neon },
  topicList: { borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLowest },
  topicRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 8, paddingHorizontal: 16,
  },
  topicRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant },
  topicRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicRowName: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 14, textTransform: 'uppercase' },
  toggleTrack: { width: 32, height: 16, borderWidth: 1, borderColor: colors.surfaceVariant, flexDirection: 'row', alignItems: 'center' },
  toggleTrackActive: { borderColor: colors.neon, backgroundColor: 'rgba(195,244,0,0.1)' },
  toggleThumb: { width: 12, height: 12, backgroundColor: colors.surfaceVariant, position: 'absolute', left: 2 },
  toggleThumbActive: { backgroundColor: colors.neon, left: undefined, right: 2 },
  customInputRow: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', marginTop: 4 },
  customInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant },
  customPrompt: { color: colors.neon, fontFamily: 'monospace', fontSize: 14, marginRight: 4 },
  customInput: { flex: 1, color: colors.onSurface, fontFamily: 'monospace', fontSize: 14, paddingVertical: 8, textTransform: 'uppercase' },
  appendBtn: {
    backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  appendBtnText: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  customRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 8, paddingHorizontal: 16,
  },
  customRowText: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 14, textTransform: 'uppercase', paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  apiKeyCard: {
    borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLowest,
    padding: 16, gap: 16, marginTop: 4,
  },
  apiKeyLabel: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase' },
  apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  apiKeyInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLow },
  apiKeyIcon: { paddingLeft: 8 },
  apiKeyInput: { flex: 1, color: colors.neon, fontFamily: 'monospace', fontSize: 14, paddingVertical: 8, paddingHorizontal: 8, letterSpacing: 2 },
  verifyBtn: { borderWidth: 1, borderColor: colors.surfaceVariant, paddingHorizontal: 16, paddingVertical: 8 },
  verifyBtnText: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
});
