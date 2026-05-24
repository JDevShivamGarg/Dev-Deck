import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { executeSandboxCommand } from '../utils/sandboxEngine';

interface TerminalSandboxProps {
  cardAnswer: string;
  cardQuestion: string;
  onSuccess: () => void;
}

interface LogLine {
  text: string;
  type: 'input' | 'output' | 'success' | 'error' | 'system';
}

export function TerminalSandbox({ cardAnswer, cardQuestion, onSuccess }: TerminalSandboxProps) {
  const [input, setInput] = useState('');
  const [remoteIp, setRemoteIp] = useState('');
  const [history, setHistory] = useState<LogLine[]>([
    { text: 'DEVDECK INTERACTIVE TROUBLESHOOTING SANDBOX [v1.0.0]', type: 'system' },
    { text: 'Analyze the scenario below and run diagnostics or fix commands.', type: 'system' },
    { text: 'Type "help" to see available commands or "hint" if stuck.', type: 'system' },
  ]);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const handleCommandSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Append user input to history with active context prompt
    const userPrompt = remoteIp ? `dev@${remoteIp}:~$` : 'dev@local:~$';
    const userLog: LogLine = { text: `${userPrompt} ${trimmed}`, type: 'input' };
    const commandResult = executeSandboxCommand(trimmed, cardAnswer, cardQuestion, remoteIp);

    let nextHistory = [...history, userLog];

    if (trimmed.toLowerCase().startsWith('ssh ')) {
      const parts = trimmed.split(' ');
      if (parts[1]) {
        const host = parts[1].includes('@') ? parts[1].split('@')[1] : parts[1];
        setRemoteIp(host);
      }
    }

    if (commandResult.clearConsole) {
      nextHistory = [
        { text: 'Console cleared. Sandbox ready.', type: 'system' }
      ];
    } else if (commandResult.output) {
      const type = commandResult.isSuccess 
        ? 'success' 
        : commandResult.output.includes('command not found') || commandResult.output.includes('refused') || commandResult.output.includes('error')
        ? 'error'
        : 'output';
      
      nextHistory.push({ text: commandResult.output, type });
    }

    setHistory(nextHistory);
    setInput('');

    // Trigger auto-scroll
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // If successfully resolved, trigger callback to unlock scenario
    if (commandResult.isSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  const handleQuickCommand = (cmd: string) => {
    setInput(cmd);
  };

  return (
    <View style={styles.terminalBox}>
      {/* Header bar */}
      <View style={styles.terminalHeader}>
        <View style={styles.termDots}>
          <View style={[styles.dot, { backgroundColor: '#FF5F56' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
          <View style={[styles.dot, { backgroundColor: '#27C93F' }]} />
        </View>
        <Text style={styles.terminalTitle}>sh // developer-sandbox</Text>
        <TouchableOpacity onPress={() => {
          setHistory([{ text: 'Sandbox reset.', type: 'system' }]);
          setRemoteIp('');
        }}>
          <MaterialCommunityIcons name="refresh" size={14} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Remote IP input configuration banner */}
      <View style={styles.remoteIpBanner}>
        <Text style={styles.remoteIpLabel}>TARGET HOST IP:</Text>
        <TextInput
          style={styles.remoteIpInput}
          value={remoteIp}
          onChangeText={setRemoteIp}
          placeholder="e.g. 192.168.1.100 (optional)"
          placeholderTextColor="rgba(195,244,0,0.15)"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {remoteIp.length > 0 && (
          <TouchableOpacity onPress={() => setRemoteIp('')} style={styles.remoteIpClear}>
            <MaterialCommunityIcons name="close" size={12} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Screen area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.terminalScreen}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {history.map((line, idx) => {
          let lineStyle = styles.logOutput;
          if (line.type === 'input') lineStyle = styles.logInput;
          else if (line.type === 'system') lineStyle = styles.logSystem;
          else if (line.type === 'success') lineStyle = styles.logSuccess;
          else if (line.type === 'error') lineStyle = styles.logError;

          return (
            <Text key={idx} style={[styles.terminalText, lineStyle]}>
              {line.text}
            </Text>
          );
        })}
      </ScrollView>

      {/* Quick shortcuts */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity style={styles.shortcutBtn} onPress={() => handleQuickCommand('help')}>
          <Text style={styles.shortcutBtnText}>help</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcutBtn} onPress={() => handleQuickCommand('ls')}>
          <Text style={styles.shortcutBtnText}>ls</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcutBtn} onPress={() => handleQuickCommand('docker ps')}>
          <Text style={styles.shortcutBtnText}>docker ps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcutBtn} onPress={() => handleQuickCommand('git status')}>
          <Text style={styles.shortcutBtnText}>git status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcutBtn} onPress={() => handleQuickCommand('hint')}>
          <Text style={styles.shortcutBtnText}>hint</Text>
        </TouchableOpacity>
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <Text style={styles.promptSym}>
          {remoteIp ? `dev@${remoteIp}:~$ ` : 'dev@local:~$ '}
        </Text>
        <TextInput
          style={styles.terminalInput}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleCommandSubmit}
          placeholder="Type troubleshooting command..."
          placeholderTextColor="rgba(195,244,0,0.25)"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  terminalBox: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  termDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  terminalTitle: {
    color: colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  remoteIpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  remoteIpLabel: {
    color: colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 10,
    marginRight: 8,
  },
  remoteIpInput: {
    flex: 1,
    color: colors.neon,
    fontFamily: 'monospace',
    fontSize: 10,
    padding: 0,
  },
  remoteIpClear: {
    padding: 2,
  },
  terminalScreen: {
    height: 180,
    backgroundColor: '#000',
    padding: 12,
  },
  screenContent: {
    gap: 6,
    paddingBottom: 16,
  },
  terminalText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  logInput: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  logOutput: {
    color: '#C4C9AC',
  },
  logSystem: {
    color: colors.onSurfaceVariant,
    opacity: 0.8,
  },
  logSuccess: {
    color: colors.neon,
    fontWeight: 'bold',
  },
  logError: {
    color: colors.error,
  },
  shortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shortcutBtn: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shortcutBtnText: {
    color: colors.neon,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#000',
  },
  promptSym: {
    color: colors.neon,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
    marginRight: 4,
  },
  terminalInput: {
    flex: 1,
    color: colors.neon,
    fontFamily: 'monospace',
    fontSize: 12,
    padding: 0,
  },
});
