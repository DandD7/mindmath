import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import { Colors, Spacing, FontSizes } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mindmath</Text>
          <Text style={styles.subtitle}>Train your mental math skills</Text>
        </View>

        <View style={styles.buttonContainer}>
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textLight,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});
