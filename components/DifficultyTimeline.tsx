import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSizes, Fonts, LetterSpacing } from '../constants/theme';
import type { DifficultyTimelineEntry } from '../types/game';

type DifficultyTimelineProps = {
  timeline: DifficultyTimelineEntry[];
};

export default function DifficultyTimeline({ timeline }: DifficultyTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No timeline data available</Text>
      </View>
    );
  }

  const maxDifficulty = 4;
  const chartHeight = 120;
  const dotSize = 6;

  // Calculate positions
  const points = timeline.map((entry, index) => ({
    x: timeline.length > 1 ? (index / (timeline.length - 1)) * 100 : 50,
    y: ((maxDifficulty - entry.difficulty) / (maxDifficulty - 1)) * (chartHeight - dotSize * 2) + dotSize,
    correct: entry.correct,
    difficulty: entry.difficulty,
  }));

  return (
    <View style={styles.container}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        {[4, 3, 2, 1].map((level) => (
          <Text key={level} style={styles.yLabel}>
            {level}
          </Text>
        ))}
      </View>

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Grid lines */}
        {[4, 3, 2, 1].map((level) => {
          const lineY = ((maxDifficulty - level) / (maxDifficulty - 1)) * (chartHeight - dotSize * 2) + dotSize;
          return (
            <View
              key={level}
              style={[styles.gridLine, { top: lineY }]}
            />
          );
        })}

        {/* Line segments connecting points */}
        {points.map((point, index) => {
          if (index === 0) return null;
          const prevPoint = points[index - 1];
          const dx = point.x - prevPoint.x;
          const dy = point.y - prevPoint.y;

          return (
            <View
              key={`line-${index}`}
              style={[
                styles.lineSegment,
                {
                  left: `${prevPoint.x}%`,
                  top: Math.min(prevPoint.y, point.y),
                  width: `${dx}%`,
                  height: Math.abs(dy) + 2,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(0, 245, 255, 0.4)', 'rgba(139, 92, 246, 0.4)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          );
        })}

        {/* Data points */}
        {points.map((point, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              {
                left: `${point.x}%`,
                top: point.y - dotSize / 2,
                backgroundColor: point.correct ? Colors.correct : Colors.incorrect,
                shadowColor: point.correct ? Colors.correct : Colors.incorrect,
              },
            ]}
          />
        ))}

        {/* Simplified line path using absolute positioned segments */}
        {points.length > 1 && (
          <View style={styles.lineContainer}>
            {points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = points[index - 1];
              return (
                <View
                  key={`seg-${index}`}
                  style={[
                    styles.simpleLine,
                    {
                      left: `${prevPoint.x}%`,
                      top: Math.min(prevPoint.y, point.y),
                      width: `${point.x - prevPoint.x}%`,
                      height: Math.max(Math.abs(point.y - prevPoint.y), 1),
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.correct }]} />
          <Text style={styles.legendText}>Correct</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.incorrect }]} />
          <Text style={styles.legendText}>Incorrect</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wide,
  },
  yAxis: {
    width: 24,
    height: 120,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: Spacing.xs,
  },
  yLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    fontFamily: Fonts.mono,
    fontWeight: '500',
  },
  chartArea: {
    flex: 1,
    height: 120,
    position: 'relative',
    marginLeft: Spacing.sm,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.1)',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 245, 255, 0.05)',
  },
  lineContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  simpleLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 245, 255, 0.2)',
    borderRadius: 1,
  },
  lineSegment: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 1,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  legend: {
    position: 'absolute',
    bottom: -24,
    left: 32,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wide,
  },
});
