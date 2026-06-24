import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';

interface LinearGradientProps {
  colors: readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

let gradientCounter = 0;

/**
 * A drop-in replacement for expo-linear-gradient's LinearGradient
 * that uses react-native-svg under the hood.
 * This avoids the "Unimplemented component: ViewManagerAdapter_ExpoLinearGradient"
 * error that occurs with Expo Go + New Architecture.
 */
export function LinearGradient({
  colors,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  locations,
  style,
  children,
}: LinearGradientProps) {
  const uniqueId = React.useRef(`grad_${++gradientCounter}`).current;

  // Compute stop offsets
  const stops = colors.map((color, index) => {
    const offset = locations
      ? locations[index]
      : colors.length > 1
      ? index / (colors.length - 1)
      : 0;
    return { color, offset };
  });

  return (
    <View style={[styles.container, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgLinearGradient
              id={uniqueId}
              x1={`${start.x * 100}%`}
              y1={`${start.y * 100}%`}
              x2={`${end.x * 100}%`}
              y2={`${end.y * 100}%`}
            >
              {stops.map((stop, i) => (
                <Stop
                  key={i}
                  offset={`${stop.offset * 100}%`}
                  stopColor={stop.color}
                  stopOpacity="1"
                />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${uniqueId})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default LinearGradient;
