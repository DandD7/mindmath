import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export default function GlassCard({
  children,
  style,
  glowColor = Colors.primary,
  intensity = 'medium',
}: GlassCardProps) {
  const glowOpacity = intensity === 'high' ? 0.25 : intensity === 'medium' ? 0.12 : 0.06;
  const borderOpacity = intensity === 'high' ? 0.3 : intensity === 'medium' ? 0.15 : 0.08;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: glowColor + Math.round(borderOpacity * 255).toString(16).padStart(2, '0'),
          shadowColor: glowColor,
          shadowOpacity: glowOpacity,
        },
        style,
      ]}
    >
      {/* Inner frost layer */}
      <View style={[styles.frostLayer, { backgroundColor: `rgba(20, 27, 45, 0.85)` }]} />
      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
  },
  frostLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
  },
  content: {
    padding: Spacing.lg,
    position: 'relative',
    zIndex: 1,
  },
});
