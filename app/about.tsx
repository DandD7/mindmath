import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts, LetterSpacing } from '../constants/theme';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>About</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.card}>
            <Text style={styles.appTitle}>Mindmath</Text>
            <Text style={styles.version}>Version 1.2.0</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About the App</Text>
              <Text style={styles.sectionText}>
                Mindmath is a mental math training application designed to help you improve your
                calculation speed and accuracy. Challenge yourself with a 5-minute test covering
                addition, subtraction, multiplication, percentages, and mixed operations.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <Text style={styles.sectionText}>
                • Complete five 1-minute rounds of mental math{'\n'}
                • Questions adapt to your skill level{'\n'}
                • Earn weighted scores based on difficulty{'\n'}
                • Track your progress over time{'\n'}
                • All data is stored locally on your device
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Difficulty Levels</Text>
              <Text style={styles.sectionText}>
                <Text style={styles.bold}>Level 1:</Text> Basic problems with small numbers{'\n'}
                <Text style={styles.bold}>Level 2:</Text> Intermediate problems{'\n'}
                <Text style={styles.bold}>Level 3:</Text> Advanced problems with larger numbers{'\n'}
                <Text style={styles.bold}>Level 4:</Text> Expert-level multi-digit operations
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Scoring System</Text>
              <Text style={styles.sectionText}>
                Your weighted score is calculated based on both the number of correct answers and
                their difficulty levels. Higher difficulty problems earn more points, encouraging
                you to challenge yourself and improve your skills.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy</Text>
              <Text style={styles.sectionText}>
                Mindmath works completely offline. All your test results and history are stored
                locally on your device and are never shared or uploaded anywhere.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
    letterSpacing: LetterSpacing.wide,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  appTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '300',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase',
  },
  version: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontFamily: Fonts.mono,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: Spacing.sm,
    letterSpacing: LetterSpacing.wide,
  },
  sectionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: FontSizes.md * 1.7,
  },
  bold: {
    fontWeight: '700',
    color: Colors.text,
  },
});
