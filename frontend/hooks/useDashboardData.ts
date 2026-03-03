import { useState, useEffect, useCallback, useRef } from 'react';

export interface DashboardData {
  page1?: Record<string, unknown>;
  page2?: Record<string, unknown>;
  page3?: Record<string, unknown>;
  page4?: Record<string, unknown>;
  aiSummary?: string;
  logStatus?: {
    isLogging: boolean;
    lastUpdate?: string;
  };
  systemStatus?: {
    connected: boolean;
    mode: string;
    simulate_mode: boolean;
    status: string;
    port: string | null;
  };
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: (showLoading?: boolean) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

interface FetchFunctions {
  fetchPage1: () => Promise<Record<string, unknown>>;
  fetchPage2: () => Promise<Record<string, unknown>>;
  fetchPage3: () => Promise<Record<string, unknown>>;
  fetchPage4: () => Promise<Record<string, unknown>>;
  fetchAiSummary: () => Promise<string>;
  fetchLogStatus: () => Promise<{ isLogging: boolean; lastUpdate?: string }>;
  fetchSystemStatus: () => Promise<{ connected: boolean; mode: string; simulate_mode: boolean; status: string; port: string | null }>;
}

const POLLING_INTERVAL = 1000; // 1 second

export function useDashboardData(
  fetchFunctions?: Partial<FetchFunctions>,
  options: { autoStart?: boolean; initialFetch?: boolean } = {}
): UseDashboardDataReturn {
  const { autoStart = false, initialFetch = true } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(initialFetch);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(autoStart);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const fetchFunctionsRef = useRef<Partial<FetchFunctions>>(fetchFunctions || {});

  // Update fetch functions if they change
  useEffect(() => {
    if (fetchFunctions) {
      fetchFunctionsRef.current = fetchFunctions;
    }
  }, [fetchFunctions]);

  const fetchData = useCallback(async (): Promise<DashboardData> => {
    const functions = fetchFunctionsRef.current;
    const result: DashboardData = {};

    const fetchWithHandling = async <T,>(
      fetchFn: (() => Promise<T>) | undefined,
      key: string
    ): Promise<void> => {
      if (!fetchFn) return;

      try {
        const data = await fetchFn();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[key] = data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`Warning fetching ${key}:`, errorMessage);
        // Don't throw, just log and continue with other fetches
      }
    };

    await Promise.all([
      fetchWithHandling(functions.fetchPage1, 'page1'),
      fetchWithHandling(functions.fetchPage2, 'page2'),
      fetchWithHandling(functions.fetchPage3, 'page3'),
      fetchWithHandling(functions.fetchPage4, 'page4'),
      fetchWithHandling(functions.fetchAiSummary, 'aiSummary'),
      fetchWithHandling(functions.fetchLogStatus, 'logStatus'),
      fetchWithHandling(functions.fetchSystemStatus, 'systemStatus'),
    ]);

    return result;
  }, []);

  const refresh = useCallback(async (showLoading = true): Promise<void> => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const result = await fetchData();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [fetchData]);

  const startPolling = useCallback((): void => {
    if (pollingRef.current) {
      return; // Already polling
    }

    setIsPolling(true);

    // Immediate fetch on start
    refresh(true);

    pollingRef.current = setInterval(() => {
      refresh(false);
    }, POLLING_INTERVAL);
  }, [refresh]);

  const stopPolling = useCallback((): void => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (initialFetch) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFetch]);

  // Auto start polling
  useEffect(() => {
    if (autoStart) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling,
    isPolling,
  };
}

export default useDashboardData;
