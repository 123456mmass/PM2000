// Get base URL from environment variables
const getApiBaseUrl = () => {
  // Always use relative path in production (works with any domain including tunnels)
  if (process.env.NODE_ENV === 'production') return '/api/v1';
  if (typeof window !== 'undefined') {
    // Match the main dashboard behavior: frontend dev server on 3000, backend on 8003.
    return `http://${window.location.hostname}:8003/api/v1`;
  }
  return 'http://localhost:8003/api/v1';
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || getApiBaseUrl();

/**
 * Generic fetch wrapper with error handling
 */
async function fetchWithHandling<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
}

/**
 * Interface for Page 1 data (Power Parameters)
 */
export interface Page1Data {
  voltage?: {
    va?: number;
    vb?: number;
    vc?: number;
    vab?: number;
    vbc?: number;
    vca?: number;
    avg?: number;
  };
  current?: {
    ia?: number;
    ib?: number;
    ic?: number;
    avg?: number;
  };
  power?: {
    totalActivePower?: number;
    totalReactivePower?: number;
    totalApparentPower?: number;
    powerFactor?: number;
  };
  frequency?: number;
  timestamp?: string;
}

/**
 * Interface for Page 2 data (Energy Parameters)
 */
export interface Page2Data {
  activeEnergy?: {
    import?: number;
    export?: number;
    net?: number;
  };
  reactiveEnergy?: {
    import?: number;
    export?: number;
  };
  apparentEnergy?: number;
  timestamp?: string;
}

/**
 * Interface for Page 3 data (Demand Parameters)
 */
export interface Page3Data {
  demand?: {
    currentDemand?: number;
    peakDemand?: number;
    peakDemandTime?: string;
    averageDemand?: number;
  };
  maxDemand?: {
    value?: number;
    time?: string;
  };
  timestamp?: string;
}

/**
 * Interface for Page 4 data (Power Quality Parameters)
 */
export interface Page4Data {
  thd?: {
    voltage?: {
      tha?: number;
      thb?: number;
      thc?: number;
      avg?: number;
    };
    current?: {
      tha?: number;
      thb?: number;
      thc?: number;
      avg?: number;
    };
  };
  unbalance?: {
    voltage?: number;
    current?: number;
  };
  harmonics?: {
    voltage?: number[][];
    current?: number[][];
  };
  timestamp?: string;
}

/**
 * Interface for AI Summary response
 */
export interface AiSummaryResponse {
  summary: string;
  timestamp: string;
  insights?: string[];
  recommendations?: string[];
}

/**
 * Interface for Log Status response
 */
export interface LogStatusResponse {
  is_logging: boolean;
  file_size_kb: number;
  fault_record_count?: number;
}

/**
 * Interface for Simulator Status response
 */
export interface SimulatorStatusResponse {
  is_simulating: boolean;
  state: {
    voltage_sag: boolean;
    voltage_swell: boolean;
    phase_loss: boolean;
    overload: boolean;
    unbalance_high: boolean;
    harmonics_high: boolean;
  };
}

/**
 * Fetch Page 1 data (Power Parameters)
 */
export async function fetchPage1(): Promise<Page1Data> {
  return fetchWithHandling<Page1Data>(`${API_BASE_URL}/page1`);
}

/**
 * Fetch Page 2 data (Energy Parameters)
 */
export async function fetchPage2(): Promise<Page2Data> {
  return fetchWithHandling<Page2Data>(`${API_BASE_URL}/page2`);
}

/**
 * Fetch Page 3 data (Demand Parameters)
 */
export async function fetchPage3(): Promise<Page3Data> {
  return fetchWithHandling<Page3Data>(`${API_BASE_URL}/page3`);
}

/**
 * Fetch Page 4 data (Power Quality Parameters)
 */
export async function fetchPage4(): Promise<Page4Data> {
  return fetchWithHandling<Page4Data>(`${API_BASE_URL}/page4`);
}

/**
 * Fetch AI Summary
 */
export async function fetchAiSummary(): Promise<AiSummaryResponse> {
  return fetchWithHandling<AiSummaryResponse>(`${API_BASE_URL}/ai-summary`, {
    method: 'POST',
  });
}

/**
 * Fetch AI Fault Summary
 */
export async function fetchAiFaultSummary(): Promise<AiSummaryResponse> {
  return fetchWithHandling<AiSummaryResponse>(`${API_BASE_URL}/ai-fault-summary`, {
    method: 'POST',
  });
}

/**
 * Fetch current logging status
 */
export async function fetchLogStatus(): Promise<LogStatusResponse> {
  return fetchWithHandling<LogStatusResponse>(`${API_BASE_URL}/datalog/status`);
}

/**
 * Start logging
 */
export async function startLogging(): Promise<{ success: boolean; message: string }> {
  return fetchWithHandling<{ success: boolean; message: string }>(
    `${API_BASE_URL}/datalog/start`,
    {
      method: 'POST',
    }
  );
}

/**
 * Stop logging
 */
export async function stopLogging(): Promise<{ success: boolean; message: string }> {
  return fetchWithHandling<{ success: boolean; message: string }>(
    `${API_BASE_URL}/datalog/stop`,
    {
      method: 'POST',
    }
  );
}

/**
 * Download log file
 * @param format - File format (csv, json, txt)
 * @param logType - Type of log (normal, fault)
 * @returns Blob URL for download
 */
export async function downloadLog(format: string = 'csv', logType: string = 'normal'): Promise<string> {
  const params = new URLSearchParams({ format });
  if (logType !== 'normal') {
    params.set('type', logType);
  }

  const response = await fetch(`${API_BASE_URL}/datalog/download?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Download log file and trigger browser download
 * @param format - File format (csv, json, txt)
 * @param logType - Type of log (normal, fault)
 * @param filename - Custom filename (optional)
 */
export async function triggerLogDownload(
  format: string = 'csv',
  logTypeOrFilename: string = 'normal',
  filename?: string
): Promise<void> {
  const looksLikeFilename = filename === undefined && logTypeOrFilename.includes('.');
  const resolvedLogType = looksLikeFilename ? 'normal' : logTypeOrFilename;
  const resolvedFilename = looksLikeFilename ? logTypeOrFilename : filename;
  const blobUrl = await downloadLog(format, resolvedLogType);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = resolvedFilename || `power-${resolvedLogType}-log-${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  // Clean up the blob URL
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 100);
}

/**
 * Send chat message to AI Advisor
 */
export async function postChat(messages: { role: string; content: string }[]): Promise<{ response: string }> {
  return fetchWithHandling<{ response: string }>(`${API_BASE_URL}/chat`, {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}

export async function postChatStream(
  messages: { role: string; content: string }[],
  handlers: {
    onChunk: (chunk: string) => void;
    onDone?: () => void;
  }
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  if (!response.body) {
    throw new Error('Streaming response body is unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    let delimiterIndex = buffer.indexOf('\n\n');
    while (delimiterIndex !== -1) {
      const rawEvent = buffer.slice(0, delimiterIndex).trim();
      buffer = buffer.slice(delimiterIndex + 2);

      if (rawEvent) {
        const dataLines = rawEvent
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim());

        if (dataLines.length > 0) {
          const payload = JSON.parse(dataLines.join('\n')) as {
            delta?: string;
            done?: boolean;
            error?: string;
          };

          if (payload.error) {
            throw new Error(payload.error);
          }

          if (payload.delta) {
            handlers.onChunk(payload.delta);
          }

          if (payload.done) {
            handlers.onDone?.();
            return;
          }
        }
      }

      delimiterIndex = buffer.indexOf('\n\n');
    }

    if (done) {
      break;
    }
  }

  handlers.onDone?.();
}

/**
 * Interface for Alerts response
 */
export interface AlertItem {
  category: string;
  severity: string;
  message: string;
}

export interface AlertsResponse {
  count: number;
  status: string;
  alerts: AlertItem[];
}

/**
 * Fetch current alerts
 */
export async function fetchAlerts(): Promise<AlertsResponse> {
  return fetchWithHandling<AlertsResponse>(`${API_BASE_URL}/alerts`);
}

/**
 * Fetch simulator status
 */
export async function fetchSimulatorStatus(): Promise<SimulatorStatusResponse> {
  return fetchWithHandling<SimulatorStatusResponse>(`${API_BASE_URL}/simulator/status`);
}

/**
 * Inject fault in simulator
 */
export async function injectFault(type: string, value?: boolean): Promise<{ status: string; state: any }> {
  return fetchWithHandling<{ status: string; state: any }>(`${API_BASE_URL}/simulator/inject`, {
    method: 'POST',
    body: JSON.stringify({ type, value }),
  });
}

/**
 * Reset simulator faults
 */
export async function resetSimulator(): Promise<{ status: string; state: any }> {
  return fetchWithHandling<{ status: string; state: any }>(`${API_BASE_URL}/simulator/reset`, {
    method: 'POST',
  });
}


/**
 * API client object with all methods
 */
const apiClient = {
  fetchPage1,
  fetchPage2,
  fetchPage3,
  fetchPage4,
  fetchAiSummary,
  fetchAiFaultSummary,
  postChat,
  postChatStream,
  fetchLogStatus,
  startLogging,
  stopLogging,
  downloadLog,
  triggerLogDownload,
  fetchAlerts,
  fetchSimulatorStatus,
  injectFault,
  resetSimulator,
};

export { API_BASE_URL };
export default apiClient;
