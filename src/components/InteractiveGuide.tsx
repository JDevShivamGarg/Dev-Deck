import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { HELP_GUIDE_STEPS, HelpStep } from '../data/helpGuideSteps';

interface InteractiveGuideProps {
  visible: boolean;
  onClose: () => void;
}

export function InteractiveGuide({ visible, onClose }: InteractiveGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const totalSteps = HELP_GUIDE_STEPS.length;
  const currentStep: HelpStep = HELP_GUIDE_STEPS[currentStepIndex] || HELP_GUIDE_STEPS[0];

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setCurrentStepIndex(0);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={styles.screen}>
        {/* App Header */}
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <MaterialCommunityIcons name="compass-outline" size={22} color={colors.neon} />
            <Text style={styles.appBarTitle}>DEVDECK GUIDE</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.85}>
            <MaterialIcons name="close" size={22} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Step Progress Tracker */}
        <View style={styles.progressTracker}>
          <Text style={styles.stepCountText}>
            STEP {String(currentStep.stepNumber).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(currentStep.stepNumber / totalSteps) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Step Main Content */}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>
          </View>

          <Text style={styles.description}>{currentStep.description}</Text>

          {/* Snippet / Format Preview */}
          {currentStep.codeOrFormat && (
            <View style={styles.codeBox}>
              <View style={styles.codeBoxHeader}>
                <View style={styles.neonDot} />
                <Text style={styles.codeBoxTitle}>SYSTEM FORMAT / PREVIEW</Text>
              </View>
              <Text style={styles.codeText}>{currentStep.codeOrFormat}</Text>
            </View>
          )}

          {/* Key Tips */}
          <View style={styles.tipsBlock}>
            <Text style={styles.tipsTitle}>KEY HIGHLIGHTS & TIPS</Text>
            {currentStep.tips.map((tip, idx) => (
              <View key={idx} style={styles.tipRow}>
                <Text style={styles.tipBullet}>▸</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Step Navigation Bar */}
        <View style={styles.navigationBar}>
          <TouchableOpacity
            style={[styles.navBtn, currentStepIndex === 0 && styles.navBtnDisabled]}
            onPress={handleBack}
            disabled={currentStepIndex === 0}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name="arrow-back"
              size={18}
              color={currentStepIndex === 0 ? colors.onSurfaceVariant : colors.onSurface}
            />
            <Text style={[styles.navBtnText, currentStepIndex === 0 && styles.navBtnTextDisabled]}>
              PREVIOUS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextNavBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextNavBtnText}>
              {currentStepIndex === totalSteps - 1 ? 'FINISH GUIDE' : 'NEXT STEP'}
            </Text>
            <MaterialIcons
              name={currentStepIndex === totalSteps - 1 ? 'check-circle' : 'arrow-forward'}
              size={18}
              color={colors.dark}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: colors.dark,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appBarTitle: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16, letterSpacing: 1 },
  closeBtn: { padding: 6 },
  progressTracker: {
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 6,
  },
  stepCountText: { color: colors.neon, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1.5 },
  progressBarBg: { height: 3, backgroundColor: colors.surfaceContainerHigh, width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: colors.neon },
  content: { padding: 20, paddingBottom: 100, gap: 20 },
  stepHeader: { gap: 4 },
  stepTitle: { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, letterSpacing: -0.5 },
  stepSubtitle: { color: colors.neon, fontFamily: 'monospace', fontSize: 13, textTransform: 'uppercase' },
  description: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 16, lineHeight: 24 },
  codeBox: {
    borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLowest,
    padding: 14, gap: 10,
  },
  codeBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  neonDot: { width: 6, height: 6, backgroundColor: colors.neon },
  codeBoxTitle: { color: colors.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  codeText: { color: colors.neon, fontFamily: 'monospace', fontSize: 13, lineHeight: 19 },
  tipsBlock: {
    borderWidth: 1, borderColor: colors.surfaceVariant, backgroundColor: colors.surfaceContainerLow,
    padding: 16, gap: 12, marginTop: 4,
  },
  tipsTitle: { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipBullet: { color: colors.neon, fontFamily: 'monospace', fontSize: 14 },
  tipText: { color: colors.onSurface, fontFamily: 'monospace', fontSize: 13, lineHeight: 19, flex: 1 },
  navigationBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, gap: 12,
    backgroundColor: colors.dark, borderTopWidth: 1, borderTopColor: colors.border,
  },
  navBtn: {
    flex: 1, height: 50, borderWidth: 1, borderColor: colors.surfaceVariant,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surfaceContainerLow,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1 },
  navBtnTextDisabled: { color: colors.onSurfaceVariant },
  nextNavBtn: {
    flex: 1.5, height: 50, backgroundColor: colors.neon,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  nextNavBtnText: { color: colors.dark, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
});
