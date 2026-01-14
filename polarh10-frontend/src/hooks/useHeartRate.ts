'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getLatestReading,
  getHeartRateStats,
  getHeartRateReadings,
  HeartRateReading,
  HeartRateStats,
} from '@/lib/api';

interface UseHeartRateOptions {
  refreshInterval?: number; // in milliseconds
  historyMinutes?: number;
  enabled?: boolean;
}

interface UseHeartRateResult {
  latestReading: HeartRateReading | null;
  stats: HeartRateStats | null;
  history: HeartRateReading[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: () => Promise<void>;
}

export function useHeartRate(options: UseHeartRateOptions = {}): UseHeartRateResult {
  const { refreshInterval = 1000, historyMinutes = 5, enabled = true } = options;

  const [latestReading, setLatestReading] = useState<HeartRateReading | null>(null);
  const [stats, setStats] = useState<HeartRateStats | null>(null);
  const [history, setHistory] = useState<HeartRateReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Use ref to track last successful fetch without causing re-renders
  const lastSuccessfulFetchRef = useRef<number>(0);
  const historyMinutesRef = useRef(historyMinutes);
  
  // Update ref when historyMinutes changes
  useEffect(() => {
    historyMinutesRef.current = historyMinutes;
  }, [historyMinutes]);

  const fetchData = useCallback(async () => {
    try {
      const [latestData, statsData, historyData] = await Promise.all([
        getLatestReading().catch(() => null),
        getHeartRateStats(historyMinutesRef.current),
        getHeartRateReadings(historyMinutesRef.current),
      ]);

      if (latestData) {
        setLatestReading(latestData);
      }
      setStats(statsData);
      setHistory(historyData.results || []);
      setError(null);
      setIsConnected(true);
      lastSuccessfulFetchRef.current = Date.now();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      
      // Consider disconnected if we haven't had a successful fetch in 5 seconds
      if (Date.now() - lastSuccessfulFetchRef.current > 5000) {
        setIsConnected(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - uses refs

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  // Initial fetch and polling - single effect
  useEffect(() => {
    if (!enabled) {
      return;
    }
    
    // Initial fetch
    fetchData();
    
    // Set up polling
    const intervalId = setInterval(fetchData, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchData, refreshInterval, enabled]);

  // Re-fetch when historyMinutes changes
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [historyMinutes, fetchData, enabled]);

  return {
    latestReading,
    stats,
    history,
    isLoading,
    error,
    isConnected,
    refresh,
  };
}
