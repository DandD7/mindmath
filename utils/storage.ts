import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestSession } from '@/types/game';

const HISTORY_KEY = '@mindmath_history';

export const saveTestSession = async (session: TestSession): Promise<void> => {
  try {
    const history = await getTestHistory();
    history.unshift(session); // Add to beginning
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    if (__DEV__) {
      console.error('Error saving test session:', error);
    }
    throw error;
  }
};

export const getTestHistory = async (): Promise<TestSession[]> => {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
    if (!historyJson) {
      return [];
    }
    return JSON.parse(historyJson);
  } catch (error) {
    if (__DEV__) {
      console.error('Error getting test history:', error);
    }
    return [];
  }
};

export const deleteTestSession = async (sessionId: string): Promise<void> => {
  try {
    const history = await getTestHistory();
    const filteredHistory = history.filter(session => session.id !== sessionId);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    if (__DEV__) {
      console.error('Error deleting test session:', error);
    }
    throw error;
  }
};

export const getTestSessionById = async (sessionId: string): Promise<TestSession | null> => {
  try {
    const history = await getTestHistory();
    return history.find(session => session.id === sessionId) || null;
  } catch (error) {
    if (__DEV__) {
      console.error('Error getting test session by id:', error);
    }
    return null;
  }
};
