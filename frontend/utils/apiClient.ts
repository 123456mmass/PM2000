// Get base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

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
        errorData.message || `HTTP error! status: ${response.status}`
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
  isLogging: boolean;
  lastUpdate?: string;
  logSize?: number;
  recordCount?: number;
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
  return fetchWithHandling<AiSummaryResponse>(`${API_BASE_URL}/ai/summary`);
}

/**
 * Fetch current logging status
 */
export async function fetchLogStatus(): Promise<LogStatusResponse> {
  return fetchWithHandling<LogStatusResponse>(`${API_BASE_URL}/log/status`);
}

/**
 * Start logging
 */
export async function startLogging(): Promise<{ success: boolean; message: string }> {
  return fetchWithHandling<{ success: boolean; message: string }>(
    `${API_BASE_URL}/log/start`,
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
    `${API_BASE_URL}/log/stop`,
    {
      method: 'POST',
    }
  );
}

/**
 * Download log file
 * @param format - File format (csv, json, txt)
 * @returns Blob URL for download
 */
export async function downloadLog(format: string = 'csv'): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/log/download?format=${format}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Download log file and trigger browser download
 * @param format - File format (csv, json, txt)
 * @param filename - Custom filename (optional)
 */
export async function triggerLogDownload(
  format: string = 'csv',
  filename?: string
): Promise<void> {
  const blobUrl = await downloadLog(format);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename || `power-log-${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 100);
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
  fetchLogStatus,
  startLogging,
  stopLogging,
  downloadLog,
  triggerLogDownload,
};

export { API_BASE_URL };
export default apiClient;
