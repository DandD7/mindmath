import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts, LetterSpacing } from '../constants/theme';
import { getTestHistory, deleteTestSession } from '../utils/storage';
import { getOperationDisplayName } from '../utils/gameLogic';
import type { TestSession } from '../types/game';
import { GAME_MODES } from '../types/game';
import { useFocusEffect } from '@react-navigation/native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    setLoading(true);
    const loadedHistory = await getTestHistory();
    setHistory(loadedHistory);
    setLoading(false);
  };

  const handleDelete = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this test session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTestSession(sessionId);
            loadHistory();
          },
        },
      ]
    );
  };

  const renderRightActions = (sessionId: string) => {
    return (
      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDelete(sessionId)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    );
  };

  const renderItem = ({ item, index }: { item: TestSession; index: number }) => {
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isFullChallenge = item.duration === 300;
    const modeName = isFullChallenge ? 'Full Challenge' : (item.gameMode ? getOperationDisplayName(item.gameMode) : 'Mixed');
    const modeColor = isFullChallenge ? '#FFC837' : (GAME_MODES.find(m => m.operation === item.gameMode)?.color || Colors.primary);
    const timeLabel = isFullChallenge ? '5m' : '1m';

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <AnimatedPressable
          entering={FadeInRight.duration(300).delay(index * 50)}
          exiting={FadeOutLeft.duration(200)}
          style={styles.historyItem}
          onPress={() =>
            router.push({
              pathname: '/results',
              params: { sessionId: item.id },
            })
          }
        >
          <View style={styles.historyItemContent}>
            <View style={styles.historyItemLeft}>
              <Text style={styles.historyDate}>{formattedDate}</Text>
              <Text style={styles.historyTime}>{formattedTime}</Text>
              <View style={styles.historyModeRow}>
                <Text style={[styles.historyMode, { color: modeColor }]}>{modeName}</Text>
                <View style={styles.historyTimeBadge}>
                  <Text style={styles.historyTimeBadgeIcon}>⏱</Text>
                  <Text style={styles.historyTimeBadgeText}>{timeLabel}</Text>
                </View>
              </View>
            </View>
            <View style={styles.historyItemRight}>
              <Text style={styles.historyScoreLabel}>Score</Text>
              <Text style={styles.historyScore}>{item.totalWeightedScore}</Text>
            </View>
          </View>
        </AnimatedPressable>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>History</Text>
          <View style={styles.placeholder} />
        </View>

        {/* History List */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No test history yet</Text>
            <Text style={styles.emptySubtext}>Complete a test to see your results here</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  listContent: {
    padding: Spacing.lg,
  },
  historyItem: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  historyItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  historyTime: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
  },
  historyModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  historyMode: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    letterSpacing: LetterSpacing.wider,
  },
  historyTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.12)',
    gap: 2,
  },
  historyTimeBadgeIcon: {
    fontSize: 9,
  },
  historyTimeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyScoreLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  historyScore: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.primary,
    fontFamily: Fonts.mono,
  },
  deleteButton: {
    backgroundColor: Colors.incorrect,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
