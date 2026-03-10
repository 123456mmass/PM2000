import useSWR from 'swr';

export interface DashboardData {
  timestamp?: string;
  page1?: Record<string, unknown>;
  page2?: Record<string, unknown>;
  page3?: Record<string, unknown>;
  page4?: Record<string, unknown>;
  alerts?: {
    status: string;
    alerts: { category: string; severity: string; message: string; detail?: string }[];
  } | null;
  systemStatus?: {
    connected: boolean;
    mode: string;
    simulate_mode: boolean;
    status: string;
    port: string | null;
  };
  logStatus?: {
    isLogging: boolean;
    logSizeKb?: number;
    faultRecordCount?: number;
  };
  simulatorStatus?: {
    is_simulating: boolean;
    state: Record<string, boolean>;
  };
}

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('API Error');
    return res.json();
  });

/**
 * Fetches all dashboard data in a single /snapshot request.
 *
 * Backend fast track:  V/I/P/PF/Freq updated every ~300ms (Block r1 only).
 * Backend slow track:  THD/Energy/Unbalance updated every ~1s (Blocks r2+r3).
 *
 * Frontend polls /snapshot at 300ms to catch fast-track updates as soon
 * as they land.  Total HTTP requests drop from 6→1 per poll cycle.
 */
export function useDashboardData(apiUrlBase: string) {
  const { data, error, mutate, isLoading } = useSWR<DashboardData>(
    `${apiUrlBase}/snapshot`,
    fetcher,
    {
      refreshInterval: 300,   // Match fast-track backend cadence (~300ms)
      dedupingInterval: 100,
      revalidateOnFocus: true,
    }
  );

  return {
    data,
    loading: isLoading,
    error: error ? error.message : null,
    refresh: async (_showLoading = true) => { await mutate(); },
    startPolling: () => { },  // Managed by SWR refreshInterval
    stopPolling: () => { },
    isPolling: true,
  };
}

export default useDashboardData;
