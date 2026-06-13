import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getAllTopics, insertCustomTopic, toggleTopicActive } from '../../src/db/queries/topics';
import { getUserConfig, setUserConfig } from '../../src/db/queries/config';
import { DEFAULT_NEW_TOPIC_PROMPT, DEFAULT_EXISTING_TOPIC_PROMPT, DEFAULT_SELF_GEN_PROMPT } from '../../src/ai/prompts';
import { colors } from '../../src/theme/colors';
import type { Topic, Proficiency } from '../../src/types';

const PROFICIENCY_LEVELS: Proficiency[] = ['beginner', 'intermediate', 'advanced'];

export default function SettingsScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [defaultProficiency, setDefaultProficiency] = useState<Proficiency>('intermediate');
  const [customTopicInput, setCustomTopicInput] = useState('');

  // Timer state
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [questionTimeLimit, setQuestionTimeLimit] = useState('30');

  // Prompt editor state
  const [promptNewTopic, setPromptNewTopic] = useState('');
  const [promptExistingTopic, setPromptExistingTopic] = useState('');
  const [promptSelfGen, setPromptSelfGen] = useState('');
  const [promptNewExpanded, setPromptNewExpanded] = useState(false);
  const [promptExistingExpanded, setPromptExistingExpanded] = useState(false);
  const [selfGenExpanded, setSelfGenExpanded] = useState(false);

  const loadData = useCallback(async () => {
    const all = await getAllTopics();
    setTopics(all);

    const key = await getUserConfig('groq_api_key');
    if (key) setApiKey(key);

    const prof = await getUserConfig('default_proficiency');
    if (prof) setDefaultProficiency(prof as Proficiency);

    const tm = await getUserConfig('timer_mode');
    if (tm === 'timer' || tm === 'stopwatch') setTimerMode(tm);

    const tl = await getUserConfig('question_time_limit');
    if (tl) setQuestionTimeLimit(tl);

    const pnt = await getUserConfig('prompt_new_topic');
    setPromptNewTopic(pnt ?? DEFAULT_NEW_TOPIC_PROMPT);

    const pet = await getUserConfig('prompt_existing_topic');
    setPromptExistingTopic(pet ?? DEFAULT_EXISTING_TOPIC_PROMPT);

    const psg = await getUserConfig('prompt_self_gen');
    setPromptSelfGen(psg ?? DEFAULT_SELF_GEN_PROMPT);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSaveKey = async () => {
    await setUserConfig('groq_api_key', apiKey);
    setIsEditingKey(false);
    Alert.alert('Saved', 'API key has been stored securely.');
  };

  const getDisplayKey = () => {
    if (isEditingKey) return apiKey;
    if (apiKey) {
      return apiKey.length > 8
        ? `${apiKey.substring(0, 4)}••••••••••••${apiKey.substring(apiKey.length - 4)}`
        : '••••••••••••';
    }
    return '';
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

  const handleToggleTopic = async (topicId: number, currentActive: number) => {
    await toggleTopicActive(topicId, currentActive === 1 ? 0 : 1);
    loadData();
  };

  // Timer
  const handleTimerModeChange = async (mode: 'stopwatch' | 'timer') => {
    setTimerMode(mode);
    await setUserConfig('timer_mode', mode);
  };

  const handleSaveTimeLimit = async () => {
    const val = parseInt(questionTimeLimit, 10);
    if (isNaN(val) || val < 5) {
      Alert.alert('Invalid', 'Enter a number ≥ 5 seconds.');
      return;
    }
    await setUserConfig('question_time_limit', String(val));
    Alert.alert('Saved', `Question time limit set to ${val}s.`);
  };

  // Prompts
  const handleSavePromptNew = async () => {
    await setUserConfig('prompt_new_topic', promptNewTopic);
    Alert.alert('Saved', 'New-topic prompt saved.');
  };

  const handleResetPromptNew = () => {
    setPromptNewTopic(DEFAULT_NEW_TOPIC_PROMPT);
    setUserConfig('prompt_new_topic', DEFAULT_NEW_TOPIC_PROMPT);
    Alert.alert('Reset', 'New-topic prompt reset to default.');
  };

  const handleSavePromptExisting = async () => {
    await setUserConfig('prompt_existing_topic', promptExistingTopic);
    Alert.alert('Saved', 'Existing-topic prompt saved.');
  };

  const handleResetPromptExisting = () => {
    setPromptExistingTopic(DEFAULT_EXISTING_TOPIC_PROMPT);
    setUserConfig('prompt_existing_topic', DEFAULT_EXISTING_TOPIC_PROMPT);
    Alert.alert('Reset', 'Existing-topic prompt reset to default.');
  };

  const validateSelfGenStructure = (template: string): string | null => {
    const required = ['"mcqs"', '"flashcards"', '"qa"'];
    const missing = required.filter((key) => !template.includes(key));
    if (missing.length > 0) {
      return `Template is missing required JSON keys: ${missing.join(', ')}. The parser expects an object with these keys to create cards.`;
    }
    return null;
  };

  const handleSavePromptSelfGen = async () => {
    const error = validateSelfGenStructure(promptSelfGen);
    if (error) {
      Alert.alert('Invalid Structure', error);
      return;
    }
    await setUserConfig('prompt_self_gen', promptSelfGen);
    Alert.alert('Saved', 'Self-generation prompt saved.');
  };

  const handleResetPromptSelfGen = () => {
    setPromptSelfGen(DEFAULT_SELF_GEN_PROMPT);
    setUserConfig('prompt_self_gen', DEFAULT_SELF_GEN_PROMPT);
    Alert.alert('Reset', 'Self-generation prompt reset to default.');
  };

  const handleCopySelfGen = async () => {
    const error = validateSelfGenStructure(promptSelfGen);
    if (error) {
      Alert.alert(
        'Invalid Structure',
        `${error}\n\nFix the template before copying to avoid generating incomplete cards.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy Anyway',
            onPress: async () => {
              await Clipboard.setStringAsync(promptSelfGen);
              Alert.alert('Copied', 'Prompt copied (with warnings).');
            },
          },
        ]
      );
      return;
    }
    await Clipboard.setStringAsync(promptSelfGen);
    Alert.alert('Copied', 'Prompt copied to clipboard. Paste it into an AI assistant, then import the JSON output using Add Cards.');
  };

  const builtinTopics = topics.filter((t) => t.is_builtin === 1);
  const customTopics = topics.filter((t) => t.is_builtin === 0);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* App bar */}
        <View style={styles.appBar}>
          <MaterialCommunityIcons name="console-line" size={22} color={colors.neon} />
          <Text style={styles.appBarTitle}>DEVDECK</Text>
          <View style={{ width: 22 }} />
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

          {/* Timer Config */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.neonDot} />
              <Text style={styles.sectionLabel}>TIMER CONFIG</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardSubLabel}>MODE</Text>
              <View style={styles.profTabs}>
                {(['stopwatch', 'timer'] as const).map((m) => {
                  const isActive = timerMode === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.profTab, isActive && styles.profTabActive]}
                      onPress={() => handleTimerModeChange(m)}
                      activeOpacity={0.85}
                    >
                      {isActive && <View style={styles.profTabBar} />}
                      <Text style={[styles.profTabText, isActive && styles.profTabTextActive]}>
                        {m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {timerMode === 'timer' && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <Text style={styles.cardSubLabel}>QUESTION TIME LIMIT (SECONDS)</Text>
                  <View style={styles.apiKeyRow}>
                    <View style={[styles.apiKeyInputWrap, { flex: 1 }]}>
                      <TextInput
                        style={styles.apiKeyInput}
                        value={questionTimeLimit}
                        onChangeText={setQuestionTimeLimit}
                        keyboardType="numeric"
                        placeholder="30"
                        placeholderTextColor={colors.onSurfaceVariant}
                      />
                    </View>
                    <TouchableOpacity style={styles.verifyBtn} onPress={handleSaveTimeLimit} activeOpacity={0.85}>
                      <Text style={styles.verifyBtnText}>SAVE</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hintText}>
                    ▸ Card shows EXPIRED in red when time runs out. Card will not auto-skip.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Built-in topics */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.neonDot} />
              <Text style={styles.sectionLabel}>CORE TOPIC SUBSCRIPTIONS</Text>
            </View>
            <View style={styles.topicList}>
              {builtinTopics.map((t, i) => {
                const isActive = t.active === 1;
                return (
                  <View key={t.id} style={[styles.topicRow, i < builtinTopics.length - 1 && styles.topicRowBorder]}>
                    <View style={styles.topicRowLeft}>
                      <MaterialCommunityIcons name="folder-outline" size={18} color={colors.onSurfaceVariant} />
                      <Text style={[styles.topicRowName, !isActive && { color: colors.onSurfaceVariant }]}>
                        {t.display_name.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.topicRowActions}>
                      <TouchableOpacity
                        style={styles.manageLink}
                        onPress={() => router.push({ pathname: '/topic/manage', params: { topicId: t.id.toString(), topicName: t.display_name } })}
                      >
                        <Text style={styles.manageLinkText}>MANAGE</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleTrack, isActive && styles.toggleTrackActive]}
                        onPress={() => handleToggleTopic(t.id, t.active)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Custom topics */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.neonDot} />
              <Text style={styles.sectionLabel}>CUSTOM TOPICS</Text>
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
                {customTopics.map((t, i) => {
                  const isActive = t.active === 1;
                  return (
                    <View key={t.id} style={[styles.customRow, i < customTopics.length - 1 && styles.topicRowBorder]}>
                      <Text style={[styles.customRowText, !isActive && { color: colors.onSurfaceVariant }]}>
                        {t.display_name.toUpperCase()}
                      </Text>
                      <View style={styles.topicRowActions}>
                        <TouchableOpacity
                          style={styles.manageLink}
                          onPress={() => router.push({ pathname: '/topic/manage', params: { topicId: t.id.toString(), topicName: t.display_name } })}
                        >
                          <Text style={styles.manageLinkText}>MANAGE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.toggleTrack, isActive && styles.toggleTrackActive]}
                          onPress={() => handleToggleTopic(t.id, t.active)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
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
                    value={getDisplayKey()}
                    onFocus={() => setIsEditingKey(true)}
                    onBlur={() => setIsEditingKey(false)}
                    onChangeText={setApiKey}
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

          {/* Prompt Editor */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.neonDot} />
              <Text style={styles.sectionLabel}>PROMPT EDITOR</Text>
            </View>

            <View style={styles.hintBox}>
              <MaterialIcons name="info-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.hintText}>
                Placeholders: <Text style={styles.hintCode}>{'{{topic}}'}</Text> · <Text style={styles.hintCode}>{'{{material}}'}</Text> · <Text style={styles.hintCode}>{'{{existingQuestions}}'}</Text>
              </Text>
            </View>

            {/* New Topic prompt */}
            <View style={styles.promptEditorBlock}>
              <TouchableOpacity
                style={styles.promptEditorHeader}
                onPress={() => setPromptNewExpanded((v) => !v)}
                activeOpacity={0.85}
              >
                <Text style={styles.promptEditorTitle}>GROQ — NEW TOPIC</Text>
                <MaterialIcons
                  name={promptNewExpanded ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              {promptNewExpanded && (
                <View style={styles.promptEditorBody}>
                  <TextInput
                    style={styles.promptTextInput}
                    value={promptNewTopic}
                    onChangeText={setPromptNewTopic}
                    multiline
                    textAlignVertical="top"
                    placeholderTextColor={colors.onSurfaceVariant}
                  />
                  <View style={styles.promptEditorActions}>
                    <TouchableOpacity style={styles.promptResetBtn} onPress={handleResetPromptNew} activeOpacity={0.85}>
                      <Text style={styles.promptResetText}>RESET</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.promptSaveBtn} onPress={handleSavePromptNew} activeOpacity={0.85}>
                      <Text style={styles.promptSaveText}>SAVE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Existing Topic prompt */}
            <View style={styles.promptEditorBlock}>
              <TouchableOpacity
                style={styles.promptEditorHeader}
                onPress={() => setPromptExistingExpanded((v) => !v)}
                activeOpacity={0.85}
              >
                <Text style={styles.promptEditorTitle}>GROQ — EXISTING TOPIC</Text>
                <MaterialIcons
                  name={promptExistingExpanded ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              {promptExistingExpanded && (
                <View style={styles.promptEditorBody}>
                  <TextInput
                    style={styles.promptTextInput}
                    value={promptExistingTopic}
                    onChangeText={setPromptExistingTopic}
                    multiline
                    textAlignVertical="top"
                    placeholderTextColor={colors.onSurfaceVariant}
                  />
                  <View style={styles.promptEditorActions}>
                    <TouchableOpacity style={styles.promptResetBtn} onPress={handleResetPromptExisting} activeOpacity={0.85}>
                      <Text style={styles.promptResetText}>RESET</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.promptSaveBtn} onPress={handleSavePromptExisting} activeOpacity={0.85}>
                      <Text style={styles.promptSaveText}>SAVE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Self-generation prompt */}
            <View style={styles.promptEditorBlock}>
              <TouchableOpacity
                style={styles.promptEditorHeader}
                onPress={() => setSelfGenExpanded((v) => !v)}
                activeOpacity={0.85}
              >
                <Text style={styles.promptEditorTitle}>SELF-GENERATION PROMPT</Text>
                <MaterialIcons
                  name={selfGenExpanded ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              {selfGenExpanded && (
                <View style={styles.promptEditorBody}>
                  <Text style={styles.selfGenNote}>
                    Edit this prompt, then copy it into an AI assistant. Fill in the topic and material, then paste the JSON output back into the app via Add Cards.
                  </Text>
                  <View style={styles.selfGenValidNote}>
                    <MaterialIcons name="info-outline" size={13} color={colors.onSurfaceVariant} />
                    <Text style={styles.selfGenValidText}>
                      Must contain{' '}
                      <Text style={styles.hintCode}>{'"mcqs"'}</Text>,{' '}
                      <Text style={styles.hintCode}>{'"flashcards"'}</Text>, and{' '}
                      <Text style={styles.hintCode}>{'"qa"'}</Text>{' '}
                      keys for cards to be parsed correctly.
                    </Text>
                  </View>
                  <TextInput
                    style={styles.promptTextInput}
                    value={promptSelfGen}
                    onChangeText={setPromptSelfGen}
                    multiline
                    textAlignVertical="top"
                    placeholderTextColor={colors.onSurfaceVariant}
                  />
                  <View style={styles.promptEditorActions}>
                    <TouchableOpacity style={styles.promptResetBtn} onPress={handleResetPromptSelfGen} activeOpacity={0.85}>
                      <Text style={styles.promptResetText}>RESET</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.promptSaveBtn} onPress={handleSavePromptSelfGen} activeOpacity={0.85}>
                      <Text style={styles.promptSaveText}>SAVE</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopySelfGen} activeOpacity={0.85}>
                    <MaterialIcons name="content-copy" size={16} color={colors.dark} />
                    <Text style={styles.copyBtnText}>COPY TO CLIPBOARD</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLowest,
    padding: 12, gap: 0,
  },
  cardSubLabel: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  hintText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, lineHeight: 16, flex: 1 },
  hintCode: { color: colors.neon },
  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    padding: 10, borderWidth: 1, borderColor: colors.surfaceVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
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
  topicRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
  topicRowActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicRowName: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 14, textTransform: 'uppercase', flex: 1 },
  manageLink: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.surfaceVariant },
  manageLinkText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
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
  customRowText: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 14, textTransform: 'uppercase', paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: 'transparent', flex: 1, marginRight: 12 },
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

  // Prompt editor
  promptEditorBlock: { borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLowest },
  promptEditorHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, paddingHorizontal: 14,
  },
  promptEditorTitle: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  promptEditorBody: { borderTopWidth: 1, borderTopColor: colors.surfaceVariant, padding: 12, gap: 10 },
  promptTextInput: {
    color: colors.onSurface, fontFamily: 'monospace', fontSize: 12,
    borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLow,
    padding: 10, minHeight: 200, lineHeight: 18,
  },
  promptEditorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  promptResetBtn: { borderWidth: 1, borderColor: colors.surfaceVariant, paddingHorizontal: 12, paddingVertical: 7 },
  promptResetText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  promptSaveBtn: { backgroundColor: colors.neon, paddingHorizontal: 16, paddingVertical: 7 },
  promptSaveText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  selfGenNote: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  selfGenValidNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    padding: 8, borderWidth: 1, borderColor: colors.surfaceVariant,
    backgroundColor: 'rgba(195,244,0,0.04)',
  },
  selfGenValidText: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, lineHeight: 16, flex: 1 },
  copyBtn: {
    backgroundColor: colors.neon, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 10,
  },
  copyBtnText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
});
