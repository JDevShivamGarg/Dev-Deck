import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../src/theme/colors';
import { getTopicById } from '../../src/db/queries/topics';
import { getExistingQuestionsForTopic, insertCard } from '../../src/db/queries/cards';
import { getUserConfig } from '../../src/db/queries/config';
import { generateAdditionalCards, parseGeneratedCardsJSON } from '../../src/ai/generator';
import { buildExistingTopicPrompt } from '../../src/ai/prompts';
import Constants from 'expo-constants';
import type { Topic } from '../../src/types';

export default function AddCardsScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [existingQuestions, setExistingQuestions] = useState<string[]>([]);
  const [useNewMaterial, setUseNewMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [manualJson, setManualJson] = useState('');

  useEffect(() => {
    if (topicId) {
      getTopicById(Number(topicId)).then(t => setTopic(t));
      getExistingQuestionsForTopic(Number(topicId)).then(q => setExistingQuestions(q));
    }
  }, [topicId]);

  if (!topic) {
    return (
      <View style={styles.screen}>
        <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 100 }}>LOADING...</Text>
      </View>
    );
  }

  const saveToDb = async (cards: any[]) => {
    for (const card of cards) {
      await insertCard(topic.id, card._mappedMode as any, card, 'ai');
    }
  };

  const handleGenerateGroq = async () => {
    let apiKey = await getUserConfig('groq_api_key');
    if (!apiKey) {
      apiKey = Constants.expoConfig?.extra?.groqApiKey 
        ?? process.env.EXPO_PUBLIC_GROQ_API_KEY 
        ?? '';
    }

    if (!apiKey) {
      Alert.alert('Configuration Error', 'API key is missing.');
      return;
    }

    setIsGenerating(true);

    try {
      const materialToUse = useNewMaterial ? newMaterial : topic.material;
      // Note: generateAdditionalCards currently doesn't accept material. 
      // Wait, we just updated the prompt but didn't update generateAdditionalCards signature.
      // Let's call the logic manually or update the import if we updated it.
      // Since generateAdditionalCards signature wasn't updated in our previous change, we should do that,
      // But for now we can just build the prompt and call fetch, or we can use the prompt we build.
      
      const prompt = buildExistingTopicPrompt(topic.display_name, existingQuestions, materialToUse);
      
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            { role: 'system', content: 'Return only a valid JSON object. No markdown, no preamble.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
      
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      
      const result = parseGeneratedCardsJSON(content);

      if (result.cards.length === 0) {
        Alert.alert('Generation Failed', 'Could not generate cards.');
        setIsGenerating(false);
        return;
      }

      await saveToDb(result.cards);

      Alert.alert('Success', `Generated ${result.cards.length} cards automatically.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while generating.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    const materialToUse = useNewMaterial ? newMaterial : topic.material;
    const prompt = buildExistingTopicPrompt(topic.display_name, existingQuestions, materialToUse);
    await Clipboard.setStringAsync(prompt);
    Alert.alert('Copied!', 'Prompt copied to clipboard. Paste it into your LLM.');
  };

  const handleImportJson = async () => {
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

      await saveToDb(result.cards);

      Alert.alert('Success', `Imported ${result.cards.length} cards manually.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Invalid JSON', 'Could not parse the pasted JSON.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.appBarBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>ADD CARDS</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerBlock}>
            <Text style={styles.topicName}>{topic.display_name}</Text>
            <Text style={styles.subLabel}>{existingQuestions.length} existing questions will be skipped.</Text>
          </View>

          {/* Material Selection */}
          <View style={styles.toggleRow}>
            <Text style={styles.label}>PROVIDE NEW MATERIAL?</Text>
            <TouchableOpacity 
              style={[styles.toggleBtn, useNewMaterial && styles.toggleBtnActive]}
              onPress={() => setUseNewMaterial(!useNewMaterial)}
            >
              <View style={[styles.toggleNub, useNewMaterial && styles.toggleNubActive]} />
            </TouchableOpacity>
          </View>

          {useNewMaterial ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste new material here..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={newMaterial}
              onChangeText={setNewMaterial}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.subLabel}>Using existing source material for this topic.</Text>
          )}

          {/* Auto Flow */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>OPTION 1: AUTOMATIC</Text>
          <TouchableOpacity 
            style={[styles.generateBtn, isGenerating && styles.disabledBtn]} 
            onPress={handleGenerateGroq}
            disabled={isGenerating}
          >
            {isGenerating ? <ActivityIndicator color={colors.dark} /> : <Text style={styles.generateBtnText}>GENERATE VIA GROQ</Text>}
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
            placeholder={`{\n  "mcqs": [\n    {\n      "question": "...",\n      "options": ["A", "B", "C", "D"],\n      "answer": "A"\n    }\n  ],\n  "flashcards": [...],\n  "qa": [...]\n}`}
            placeholderTextColor={colors.onSurfaceVariant}
            value={manualJson}
            onChangeText={setManualJson}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.generateBtn} onPress={handleImportJson}>
            <Text style={styles.generateBtnText}>IMPORT CARDS</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
  headerBlock: { marginBottom: 8 },
  topicName: { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, textTransform: 'uppercase' },
  label: { color: colors.tertiary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14, textTransform: 'uppercase' },
  subLabel: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12 },
  sectionTitle: { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14, letterSpacing: 1 },
  sectionDivider: { height: 1, backgroundColor: colors.surfaceVariant, marginVertical: 8 },
  input: {
    backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.outlineVariant,
    color: colors.onSurface, fontFamily: 'monospace', fontSize: 14, padding: 16,
  },
  textArea: { height: 120 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleBtn: { width: 48, height: 24, borderRadius: 12, backgroundColor: colors.surfaceVariant, padding: 2, justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: 'rgba(195,244,0,0.3)' },
  toggleNub: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.onSurfaceVariant },
  toggleNubActive: { backgroundColor: colors.neon, alignSelf: 'flex-end' },
  generateBtn: { backgroundColor: colors.neon, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { borderWidth: 1, borderColor: colors.neon, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryBtnText: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14, letterSpacing: 1.2 },
  disabledBtn: { opacity: 0.5 },
  generateBtnText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16, letterSpacing: 1.2, textTransform: 'uppercase' },
});
