import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSizes, Fonts, LetterSpacing } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type NumericKeypadProps = {
  onNumberPress: (number: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onDecimalPress?: () => void;
  submitDisabled?: boolean;
  highlightDecimal?: boolean;
  hideDecimal?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function KeypadButton({
  value,
  onPress,
  variant = 'default',
  disabled = false,
  dimmed = false,
  highlighted = false,
  hidden = false,
  icon,
}: {
  value: string;
  onPress: () => void;
  variant?: 'default' | 'action' | 'submit' | 'decimal';
  disabled?: boolean;
  dimmed?: boolean;
  highlighted?: boolean;
  hidden?: boolean;
  icon?: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !dimmed && !hidden) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // If hidden, render an empty space that preserves layout
  if (hidden) {
    return <View style={styles.key} />;
  }

  if (variant === 'submit') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[animatedStyle, styles.keyWrapper, disabled && styles.keyDisabled]}
      >
        <LinearGradient
          colors={disabled ? ['#1a2233', '#1a2233'] : ['#00F5FF', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.keySubmitGradient}
        >
          <Text style={[styles.keyTextSubmit, disabled && styles.keyTextDisabled]}>
            {value}
          </Text>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  const getButtonStyle = () => {
    switch (variant) {
      case 'action':
        return [styles.key, styles.keyAction];
      case 'decimal':
        if (highlighted) {
          return [styles.key, styles.keyDecimalHighlighted];
        }
        return [styles.key, styles.keyDecimalDimmed];
      default:
        return [styles.key];
    }
  };

  const isInteractive = variant === 'decimal' ? !dimmed : !disabled;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isInteractive}
      style={[animatedStyle, ...getButtonStyle(), dimmed && styles.keyDimmedOpacity]}
    >
      {icon || (
        <Text
          style={[
            styles.keyText,
            variant === 'action' && styles.keyTextAction,
            variant === 'decimal' && highlighted && styles.keyTextDecimalHighlighted,
            variant === 'decimal' && !highlighted && styles.keyTextDimmed,
          ]}
        >
          {value}
        </Text>
      )}
    </AnimatedPressable>
  );
}

export default function NumericKeypad({
  onNumberPress,
  onBackspace,
  onSubmit,
  onDecimalPress,
  submitDisabled = false,
  highlightDecimal = false,
  hideDecimal = false,
}: NumericKeypadProps) {
  const handleNumberPress = (num: string) => {
    onNumberPress(num);
  };

  return (
    <View style={styles.container}>
      <View style={styles.keypadGrid}>
        {/* Row 1: 1, 2, 3 */}
        <View style={styles.row}>
          <KeypadButton value="1" onPress={() => handleNumberPress('1')} />
          <KeypadButton value="2" onPress={() => handleNumberPress('2')} />
          <KeypadButton value="3" onPress={() => handleNumberPress('3')} />
        </View>

        {/* Row 2: 4, 5, 6 */}
        <View style={styles.row}>
          <KeypadButton value="4" onPress={() => handleNumberPress('4')} />
          <KeypadButton value="5" onPress={() => handleNumberPress('5')} />
          <KeypadButton value="6" onPress={() => handleNumberPress('6')} />
        </View>

        {/* Row 3: 7, 8, 9 */}
        <View style={styles.row}>
          <KeypadButton value="7" onPress={() => handleNumberPress('7')} />
          <KeypadButton value="8" onPress={() => handleNumberPress('8')} />
          <KeypadButton value="9" onPress={() => handleNumberPress('9')} />
        </View>

        {/* Row 4: Decimal, 0, Backspace */}
        <View style={styles.row}>
          <KeypadButton
            value="."
            onPress={() => onDecimalPress?.()}
            variant="decimal"
            highlighted={highlightDecimal}
            dimmed={!highlightDecimal}
            hidden={hideDecimal}
          />
          <KeypadButton value="0" onPress={() => handleNumberPress('0')} />
          <KeypadButton
            value="⌫"
            onPress={onBackspace}
            variant="action"
            icon={<Ionicons name="backspace-outline" size={22} color={Colors.primary} />}
          />
        </View>

        {/* Row 5: Submit (full width) */}
        <View style={styles.row}>
          <KeypadButton
            value="Submit"
            onPress={onSubmit}
            variant="submit"
            disabled={submitDisabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glass,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.glassBorder,
  },
  keypadGrid: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  key: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(20, 27, 45, 0.8)',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.08)',
  },
  keyAction: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  keyDecimalHighlighted: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  keyDecimalDimmed: {
    backgroundColor: 'rgba(20, 27, 45, 0.4)',
    borderColor: 'rgba(0, 245, 255, 0.04)',
  },
  keyDimmedOpacity: {
    opacity: 0.35,
  },
  keyWrapper: {
    flex: 1,
    height: 52,
  },
  keySubmitGradient: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyText: {
    fontSize: FontSizes.xl,
    fontWeight: '400',
    color: Colors.text,
    fontFamily: Fonts.mono,
    letterSpacing: LetterSpacing.wide,
  },
  keyTextAction: {
    color: Colors.primary,
  },
  keyTextDecimalHighlighted: {
    color: Colors.primary,
    fontWeight: '600',
  },
  keyTextDimmed: {
    color: Colors.textLight,
  },
  keyTextSubmit: {
    color: Colors.background,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
  keyTextDisabled: {
    color: Colors.textLight,
  },
});
