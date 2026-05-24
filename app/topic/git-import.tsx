import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../src/theme/colors';
import { insertCustomTopic } from '../../src/db/queries/topics';
import { insertCard } from '../../src/db/queries/cards';
import { getUserConfig } from '../../src/db/queries/config';
import { generateNewTopic, parseGeneratedCardsJSON } from '../../src/ai/generator';
import { buildNewTopicPrompt } from '../../src/ai/prompts';
import { parseGitHubUrl, fetchRawGitHubContent } from '../../src/utils/gitParser';
import Constants from 'expo-constants';

export default function GitImportScreen() {
  const router = useRouter();
  
  // Git configs
  const [gitUrl, setGitUrl] = useState('');
  const [filePath, setFilePath] = useState('README.md');
  const [topicName, setTopicName] = useState('');
  
  // States
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadedMaterial, setDownloadedMaterial] = useState('');
  
  // Manual flow state
  const [manualJson, setManualJson] = useState('');

  const handleFetchGit = async () => {
    if (!gitUrl.trim()) {
      Alert.alert('Missing Info', 'Please enter a GitHub repository URL.');
      return;
    }

    const repoDetails = parseGitHubUrl(gitUrl);
    if (!repoDetails) {
      Alert.alert('Invalid URL', 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo or owner/repo).');
      return;
    }

    setIsFetching(true);
    setDownloadedMaterial('');

    try {
      const content = await fetchRawGitHubContent(
        repoDetails.owner,
        repoDetails.repo,
        repoDetails.filePath || filePath,
        repoDetails.branch
      );

      setDownloadedMaterial(content);
      
      // Auto-populate topic name from repository name if empty
      if (!topicName.trim()) {
        const cleanName = repoDetails.repo
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
        setTopicName(cleanName);
      }

      Alert.alert('Success', `Successfully downloaded file contents from GitHub! Size: ${content.length} characters.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Fetch Failed', 'Failed to retrieve the file from GitHub. Check the URL/branch and make sure it is a public repository.');
    } finally {
      setIsFetching(false);
    }
  };

  const saveToDb = async (topicResult: string, cards: any[]) => {
    const slug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const topicId = await insertCustomTopic(slug, topicResult || topicName, '📂', downloadedMaterial);

    for (const card of cards) {
      await insertCard(topicId, card._mappedMode as any, card, 'ai');
    }
  };

  const handleGenerateGroq = async () => {
    if (!downloadedMaterial.trim()) {
      Alert.alert('No Source Material', 'Please fetch the repository source material first.');
      return;
    }

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
      const result = await generateNewTopic(topicName, downloadedMaterial, apiKey);

      if (result.cards.length === 0) {
        Alert.alert('Generation Failed', 'Could not generate cards from the downloaded source material.');
        setIsGenerating(false);
        return;
      }

      await saveToDb(result.topic || topicName, result.cards);

      Alert.alert('Success', `Generated ${result.cards.length} cards automatically from repository material!`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while generating targeted flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!downloadedMaterial.trim()) {
      Alert.alert('No Source Material', 'Please fetch the repository source material first.');
      return;
    }
    const prompt = buildNewTopicPrompt(topicName, downloadedMaterial);
    await Clipboard.setStringAsync(prompt);
    Alert.alert('Copied!', 'Remediation prompt copied to clipboard. Paste it into your LLM.');
  };

  const handleImportJson = async () => {
    if (!downloadedMaterial.trim()) {
      Alert.alert('No Source Material', 'Please fetch the repository source material first.');
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
          <Text style={styles.appBarTitle}>GIT IMPORT</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Core Inputs */}
          <Text style={styles.label}>GITHUB URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://github.com/owner/repo"
            placeholderTextColor={colors.onSurfaceVariant}
            value={gitUrl}
            onChangeText={setGitUrl}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isFetching && !isGenerating}
          />

          <Text style={styles.label}>TARGET FILE PATH</Text>
          <Text style={styles.subLabel}>Optionally specify a markdown file or documentation path.</Text>
          <TextInput
            style={styles.input}
            placeholder="README.md"
            placeholderTextColor={colors.onSurfaceVariant}
            value={filePath}
            onChangeText={setFilePath}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isFetching && !isGenerating}
          />

          <TouchableOpacity 
            style={[styles.fetchBtn, isFetching && styles.disabledBtn]} 
            onPress={handleFetchGit}
            disabled={isFetching || isGenerating}
            activeOpacity={0.8}
          >
            {isFetching ? (
              <ActivityIndicator color={colors.dark} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="download" size={20} color={colors.dark} />
                <Text style={styles.fetchBtnText}>DOWNLOAD FILE CONTENTS</Text>
              </View>
            )}
          </TouchableOpacity>

          {downloadedMaterial.length > 0 && (
            <View style={{ gap: 16 }}>
              <View style={styles.sectionDivider} />
              <Text style={styles.label}>TOPIC NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Topic display name"
                placeholderTextColor={colors.onSurfaceVariant}
                value={topicName}
                onChangeText={setTopicName}
                editable={!isGenerating}
              />

              <Text style={styles.label}>MATERIAL PREVIEW</Text>
              <View style={styles.previewBox}>
                <Text numberOfLines={5} style={styles.previewText}>
                  {downloadedMaterial}
                </Text>
              </View>

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
            </View>
          )}
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
  fetchBtn: {
    backgroundColor: colors.neon,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchBtnText: {
    color: colors.dark,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    letterSpacing: 1.2,
  },
  previewBox: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  previewText: {
    color: colors.secondary,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
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
