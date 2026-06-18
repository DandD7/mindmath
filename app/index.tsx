import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import ModeCard from '../components/ModeCard';
import { Colors, Spacing, FontSizes, LetterSpacing } from '../constants/theme';
import { GAME_MODES } from '../types/game';

export default function HomeScreen() {
  const router = useRouter();

  const handleModeSelect = (modeId: string) => {
    router.push({ pathname: '/game', params: { mode: modeId } });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[Colors.background, '#0F1520', Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
            <Image
              source={require('../assets/images/splash-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Mindmath</Text>
            <Text style={styles.subtitle}>Choose your challenge</Text>
          </Animated.View>

          {/* Game Mode Grid */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.modeGrid}>
            {GAME_MODES.map((mode, index) => (
              <ModeCard
                key={mode.id}
                mode={mode}
                index={index}
                isFullWidth={index === GAME_MODES.length - 1 && GAME_MODES.length % 2 !== 0}
                onPress={() => handleModeSelect(mode.id)}
              />
            ))}
          </Animated.View>

          {/* Bottom Buttons */}
          <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.buttonContainer}>
            <AnimatedButton
              title="History"
              onPress={() => router.push('/history')}
              variant="secondary"
              style={styles.button}
            />

            <AnimatedButton
              title="About"
              onPress={() => router.push('/about')}
              variant="outline"
              style={styles.button}
            />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '300',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    textAlign: 'center',
    letterSpacing: LetterSpacing.wider,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});
