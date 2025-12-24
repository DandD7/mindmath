import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type NumericKeypadProps = {
  onNumberPress: (number: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function KeypadButton({
  value,
  onPress,
  variant = 'default',
  disabled = false,
  icon,
}: {
  value: string;
  onPress: () => void;
  variant?: 'default' | 'action' | 'submit';
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const getButtonStyle = () => {
    if (disabled) {
      return [styles.key, styles.keyDisabled];
    }
    switch (variant) {
      case 'action':
        return [styles.key, styles.keyAction];
      case 'submit':
        return [styles.key, styles.keySubmit];
      default:
        return [styles.key];
    }
  };

  const getTextStyle = () => {
    if (disabled) {
      return [styles.keyText, styles.keyTextDisabled];
    }
    switch (variant) {
      case 'submit':
        return [styles.keyText, styles.keyTextSubmit];
      default:
        return [styles.keyText];
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, getButtonStyle()]}
    >
      {icon || <Text style={getTextStyle()}>{value}</Text>}
    </AnimatedPressable>
  );
}

export default function NumericKeypad({
  onNumberPress,
  onBackspace,
  onSubmit,
  submitDisabled = false,
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

        {/* Row 4: Backspace, 0, Submit */}
        <View style={styles.row}>
          <KeypadButton
            value="⌫"
            onPress={onBackspace}
            variant="action"
            icon={<Ionicons name="backspace-outline" size={22} color={Colors.text} />}
          />
          <KeypadButton value="0" onPress={() => handleNumberPress('0')} />
          <KeypadButton
            value="Next"
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
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.large,
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
    height: 50,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  keyAction: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keySubmit: {
    backgroundColor: Colors.primary,
  },
  keyDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  keyText: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  keyTextSubmit: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
  },
  keyTextDisabled: {
    color: Colors.textLight,
  },
});
