import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const splashOpacity = useSharedValue(1);

  useEffect(() => {
    async function prepare() {
      // Simulate minimal loading time for splash
      await new Promise(resolve => setTimeout(resolve, 100));
      setAppReady(true);
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();

      // Animate logo in
      logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });

      // Then fade out the splash
      splashOpacity.value = withDelay(
        1200,
        withTiming(0, { duration: 500 }, (finished) => {
          if (finished) {
            runOnJS(setSplashAnimationComplete)(true);
          }
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appReady]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const splashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="game" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ headerShown: false }} />
      </Stack>

      {/* Custom animated splash overlay */}
      {!splashAnimationComplete && (
        <Animated.View style={[styles.splashOverlay, splashAnimatedStyle]}>
          <Animated.Image
            source={require('../assets/images/splash-icon.png')}
            style={[styles.splashLogo, logoAnimatedStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  splashLogo: {
    width: 160,
    height: 160,
  },
});
