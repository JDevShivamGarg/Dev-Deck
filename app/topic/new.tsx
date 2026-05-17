import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../src/theme/colors';
import { insertCustomTopic } from '../../src/db/queries/topics';
import { insertCard } from '../../src/db/queries/cards';
import { generateNewTopic, parseGeneratedCardsJSON } from '../../src/ai/generator';
import { buildNewTopicPrompt } from '../../src/ai/prompts';
import Constants from 'expo-constants';

export default function NewTopicScreen() {
  const router = useRouter();
  const [topicName, setTopicName] = useState('');
  const [material, setMaterial] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Manual flow state
  const [manualJson, setManualJson] = useState('');

  const saveToDb = async (topicResult: string, cards: any[]) => {
    const slug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const topicId = await insertCustomTopic(slug, topicResult || topicName, '📌', material);

    for (const card of cards) {
      await insertCard(topicId, card._mappedMode as any, card, 'ai');
    }
  };

  const handleGenerateGroq = async () => {
    if (!topicName.trim()) {
      Alert.alert('Missing Info', 'Please provide a topic name.');
      return;
    }

    const apiKey = Constants.expoConfig?.extra?.groqApiKey 
      ?? process.env.EXPO_PUBLIC_GROQ_API_KEY 
      ?? '';

    if (!apiKey) {
      Alert.alert('Configuration Error', 'API key is missing.');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateNewTopic(topicName, material, apiKey);

      if (result.cards.length === 0) {
        Alert.alert('Generation Failed', 'Could not generate cards from the provided material.');
        setIsGenerating(false);
        return;
      }

      await saveToDb(result.topic || topicName, result.cards);

      Alert.alert('Success', `Generated ${result.cards.length} cards automatically.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while generating the topic.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!topicName.trim()) {
      Alert.alert('Missing Info', 'Please provide a topic name.');
      return;
    }
    const prompt = buildNewTopicPrompt(topicName, material);
    await Clipboard.setStringAsync(prompt);
    Alert.alert('Copied!', 'Prompt copied to clipboard. Paste it into your LLM.');
  };

  const handleImportJson = async () => {
    if (!topicName.trim()) {
      Alert.alert('Missing Info', 'Please provide a topic name.');
      return;
    }
    if (!manualJson.trim()) {
      Alert.alert('Missing Info', 'Please paste the JSON response from your LLM.');
      return;
    }

    try {
      const result = parseGeneratedCardsJSON(manualJson);
      
      if (result.cards.length === 0) {
        Alert.alert('Import Failed', 'No valid cards found in the provided JSON.');
        return;
      }

      await saveToDb(result.topic || topicName, result.cards);

      Alert.alert('Success', `Imported ${result.cards.length} cards manually.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Invalid JSON', 'Could not parse the pasted JSON. Ensure it matches the requested format.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.appBarBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>NEW TOPIC</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Core Inputs */}
        <Text style={styles.label}>TOPIC NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. React Hooks"
          placeholderTextColor={colors.onSurfaceVariant}
          value={topicName}
          onChangeText={setTopicName}
          editable={!isGenerating}
        />

        <Text style={styles.label}>SOURCE MATERIAL</Text>
        <Text style={styles.subLabel}>Paste documentation or notes to serve as context.</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Paste material here..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={material}
          onChangeText={setMaterial}
          multiline
          textAlignVertical="top"
          editable={!isGenerating}
        />

        {/* Auto Flow */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>OPTION 1: AUTOMATIC</Text>
        <TouchableOpacity 
          style={[styles.generateBtn, isGenerating && styles.disabledBtn]} 
          onPress={handleGenerateGroq}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.dark} />
          ) : (
            <Text style={styles.generateBtnText}>GENERATE VIA GROQ</Text>
          )}
        </TouchableOpacity>

        {/* Manual Flow */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>OPTION 2: MANUAL (BYO LLM)</Text>
        <Text style={styles.subLabel}>1. Copy the generated prompt and paste it into ChatGPT/Claude.</Text>
        
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopyPrompt}>
          <MaterialCommunityIcons name="content-copy" size={20} color={colors.neon} />
          <Text style={styles.secondaryBtnText}>COPY PROMPT TO CLIPBOARD</Text>
        </TouchableOpacity>

        <Text style={[styles.subLabel, { marginTop: 8 }]}>2. Paste the raw JSON response below.</Text>
        <TextInput
          style={[styles.input, styles.textArea, { height: 120 }]}
          placeholder={`{\n  "topic": "...",\n  "mcqs": [\n    {\n      "question": "...",\n      "options": ["A", "B", "C", "D"],\n      "answer": "A"\n    }\n  ],\n  "flashcards": [...],\n  "qa": [...]\n}`}
          placeholderTextColor={colors.onSurfaceVariant}
          value={manualJson}
          onChangeText={setManualJson}
          multiline
          textAlignVertical="top"
          editable={!isGenerating}
        />

        <TouchableOpacity 
          style={styles.generateBtn} 
          onPress={handleImportJson}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          <Text style={styles.generateBtnText}>IMPORT CARDS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dark },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: colors.dark,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appBarBtn: { padding: 8 },
  appBarTitle: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, letterSpacing: -1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  label: { color: colors.tertiary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16, textTransform: 'uppercase' },
  subLabel: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, marginTop: -8 },
  sectionTitle: { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14, letterSpacing: 1 },
  sectionDivider: { height: 1, backgroundColor: colors.surfaceVariant, marginVertical: 8 },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    color: colors.onSurface,
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 16,
  },
  textArea: { height: 120 },
  generateBtn: {
    backgroundColor: colors.neon,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.neon,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    letterSpacing: 1.2,
  },
  disabledBtn: { opacity: 0.5 },
  generateBtnText: {
    color: colors.dark,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
