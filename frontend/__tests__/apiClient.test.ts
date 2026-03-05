/**
 * Integration tests for API client
 * These tests use mocking to simulate API responses
 */

import apiClient, {
  API_BASE_URL,
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
  type Page1Data,
  type Page2Data,
  type Page3Data,
  type Page4Data,
  type AiSummaryResponse,
  type LogStatusResponse,
} from '../utils/apiClient';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API_BASE_URL', () => {
    it('should have a valid base URL', () => {
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe('string');
    });
  });

  describe('fetchPage1', () => {
    it('should fetch Page 1 data successfully', async () => {
      const mockData: Page1Data = {
        voltage: {
          va: 230,
          vb: 230,
          vc: 230,
          vab: 400,
          vbc: 400,
          vca: 400,
          avg: 400,
        },
        current: {
          ia: 10,
          ib: 10,
          ic: 10,
          avg: 10,
        },
        power: {
          totalActivePower: 6900,
          totalReactivePower: 1000,
          totalApparentPower: 7000,
          powerFactor: 0.98,
        },
        frequency: 50,
        timestamp: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchPage1();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/page1`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });

      await expect(fetchPage1()).rejects.toThrow('Internal Server Error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchPage1()).rejects.toThrow('Network error');
    });
  });

  describe('fetchPage2', () => {
    it('should fetch Page 2 data successfully', async () => {
      const mockData: Page2Data = {
        activeEnergy: {
          import: 1000,
          export: 200,
          net: 800,
        },
        reactiveEnergy: {
          import: 100,
          export: 50,
        },
        apparentEnergy: 1500,
        timestamp: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchPage2();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/page2`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchPage3', () => {
    it('should fetch Page 3 data successfully', async () => {
      const mockData: Page3Data = {
        demand: {
          currentDemand: 500,
          peakDemand: 750,
          peakDemandTime: new Date().toISOString(),
          averageDemand: 450,
        },
        maxDemand: {
          value: 800,
          time: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchPage3();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/page3`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchPage4', () => {
    it('should fetch Page 4 data successfully', async () => {
      const mockData: Page4Data = {
        thd: {
          voltage: {
            tha: 2.5,
            thb: 2.3,
            thc: 2.7,
            avg: 2.5,
          },
          current: {
            tha: 3.5,
            thb: 3.3,
            thc: 3.7,
            avg: 3.5,
          },
        },
        unbalance: {
          voltage: 1.5,
          current: 2.0,
        },
        harmonics: {
          voltage: [[1, 2, 3], [1, 2, 3], [1, 2, 3]],
          current: [[1, 2, 3], [1, 2, 3], [1, 2, 3]],
        },
        timestamp: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchPage4();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/page4`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchAiSummary', () => {
    it('should fetch AI summary successfully', async () => {
      const mockData: AiSummaryResponse = {
        summary: 'System is operating normally.',
        timestamp: new Date().toISOString(),
        insights: ['Power factor is excellent', 'Voltage is balanced'],
        recommendations: ['Continue monitoring', 'Schedule preventive maintenance'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchAiSummary();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/ai/summary`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchLogStatus', () => {
    it('fetches log status successfully', async () => {
      const mockStatusData = { is_logging: true, file_size_kb: 10, fault_record_count: 5 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatusData,
      });

      const data = await fetchLogStatus();
      expect(data).toEqual(mockStatusData);
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/log/status`, expect.any(Object));
    });
  });

  describe('startLogging', () => {
    it('should start logging successfully', async () => {
      const mockData = { success: true, message: 'Logging started' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await startLogging();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/log/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('stopLogging', () => {
    it('should stop logging successfully', async () => {
      const mockData = { success: true, message: 'Logging stopped' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await stopLogging();

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/log/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('downloadLog', () => {
    it('should download log file as blob', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await downloadLog('csv');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/log/download?format=csv`,
        {
          method: 'GET',
        }
      );
      expect(result).toBeDefined();
    });

    it('should handle download errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Log file not found' }),
      });

      await expect(downloadLog('csv')).rejects.toThrow('Log file not found');
    });
  });

  describe('triggerLogDownload', () => {
    it('should create and click download link', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });
      const mockUrl = 'blob:test-url';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      // Mock URL.createObjectURL
      const createObjectURLSpy = jest
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue(mockUrl);
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');

      // Mock document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const createElementSpy = jest
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      await triggerLogDownload('csv', 'test-file.csv');

      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toBe('test-file.csv');
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);

      // Cleanup spies
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
    });
  });

  describe('apiClient object', () => {
    it('should have all required methods', () => {
      expect(apiClient.fetchPage1).toBeDefined();
      expect(apiClient.fetchPage2).toBeDefined();
      expect(apiClient.fetchPage3).toBeDefined();
      expect(apiClient.fetchPage4).toBeDefined();
      expect(apiClient.fetchAiSummary).toBeDefined();
      expect(apiClient.fetchLogStatus).toBeDefined();
      expect(apiClient.startLogging).toBeDefined();
      expect(apiClient.stopLogging).toBeDefined();
      expect(apiClient.downloadLog).toBeDefined();
      expect(apiClient.triggerLogDownload).toBeDefined();
    });
  });
});
