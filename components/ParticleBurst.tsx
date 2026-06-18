import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  color: string;
}

interface ParticleBurstProps {
  trigger: number; // Increment to trigger a burst
  originX?: number;
  originY?: number;
  particleCount?: number;
}

const PARTICLE_COLORS = [
  Colors.primary,
  '#00D4FF',
  '#00FFE0',
  '#8B5CF6',
  Colors.correct,
  '#00F5FF',
];

function SingleParticle({
  particle,
  onComplete,
}: {
  particle: Particle;
  onComplete: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const rad = (particle.angle * Math.PI) / 180;
    const targetX = Math.cos(rad) * particle.distance;
    const targetY = Math.sin(rad) * particle.distance;

    scale.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) })
    );

    translateX.value = withDelay(
      particle.delay,
      withTiming(targetX, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateY.value = withDelay(
      particle.delay,
      withTiming(targetY, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      })
    );

    opacity.value = withDelay(
      particle.delay + 150,
      withTiming(0, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
          shadowColor: particle.color,
          shadowOpacity: 0.8,
          shadowRadius: particle.size,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function ParticleBurst({
  trigger,
  originX,
  originY,
  particleCount = 8,
}: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const completedCountRef = React.useRef(0);
  const cleanupTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trigger <= 0) return;

    // Cap particle count for performance
    const count = Math.min(particleCount, 10);
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angleSpread = 360 / count;
      const randomOffset = (Math.random() - 0.5) * (angleSpread * 0.6);
      newParticles.push({
        id: Date.now() + i,
        angle: i * angleSpread + randomOffset,
        distance: 30 + Math.random() * 40,
        size: 3 + Math.random() * 4,
        delay: Math.random() * 50,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      });
    }
    setParticles(newParticles);
    completedCountRef.current = 0;

    // Safety cleanup - force remove particles after animation duration
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }
    cleanupTimerRef.current = setTimeout(() => setParticles([]), 700);

    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const handleParticleComplete = () => {
    completedCountRef.current += 1;
    if (completedCountRef.current >= particles.length) {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      setParticles([]);
    }
  };

  if (particles.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        originX !== undefined && originY !== undefined
          ? { left: originX, top: originY }
          : {},
      ]}
      pointerEvents="none"
    >
      {particles.map((particle) => (
        <SingleParticle
          key={particle.id}
          particle={particle}
          onComplete={handleParticleComplete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
