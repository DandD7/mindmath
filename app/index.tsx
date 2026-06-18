import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { Colors, Spacing, FontSizes } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[Colors.background, '#0F1520', Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
            <Image
              source={require('../assets/images/splash-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Mindmath</Text>
            <Text style={styles.subtitle}>Train your mental math skills</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.buttonContainer}>
            <AnimatedButton
              title="Start 5-Minute Test"
              onPress={() => router.push('/game')}
              style={styles.button}
            />

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
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl * 2,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});
