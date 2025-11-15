import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { getTestHistory, deleteTestSession } from '@/utils/storage';
import type { TestSession } from '@/types/game';
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 60,
  },
  listContent: {
    padding: Spacing.lg,
  },
  historyItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
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
    fontWeight: 'bold',
    color: Colors.primary,
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
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
