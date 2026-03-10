'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AlertToaster } from '@/components/common/AlertToaster';
import { FaultDetailsModal } from '@/components/common/FaultDetailsModal';
import { FaultAlert } from '@/components/common/types';
import { Page1 } from '@/components/pages/Page1';
import { Page2 } from '@/components/pages/Page2';
import { Page3 } from '@/components/pages/Page3';
import { Page4 } from '@/components/pages/Page4';
import { OnePageReport } from '@/components/report/OnePageReport';
import { ReportTemplate } from '@/components/ReportTemplate';
import useDashboardData from '@/hooks/useDashboardData';
import { createRoot } from 'react-dom/client';
import apiClient from '@/utils/apiClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChatPanel } from '@/components/common/ChatPanel';
import { SimulatorControl } from '@/components/common/SimulatorControl';
import { useAiAdvisor } from '@/hooks/useAiAdvisor';
import { AiInsightsPanel } from '@/components/report/AiInsightsPanel';

interface Page1Data {
  timestamp: string;
  status: string;
  V_LN1: number;
  V_LN2: number;
  V_LN3: number;
  V_LN_avg: number;
  V_LL12: number;
  V_LL23: number;
  V_LL31: number;
  V_LL_avg: number;
  I_L1: number;
  I_L2: number;
  I_L3: number;
  I_N: number;
  I_avg: number;
  Freq: number;
}

interface Page2Data {
  timestamp: string;
  status: string;
  P_L1: number;
  P_L2: number;
  P_L3: number;
  P_Total: number;
  S_L1: number;
  S_L2: number;
  S_L3: number;
  S_Total: number;
  Q_L1: number;
  Q_L2: number;
  Q_L3: number;
  Q_Total: number;
}

interface Page3Data {
  timestamp: string;
  status: string;
  THDv_L1: number;
  THDv_L2: number;
  THDv_L3: number;
  THDi_L1: number;
  THDi_L2: number;
  THDi_L3: number;
  V_unb: number;
  U_unb: number;
  I_unb: number;
  PF_L1: number;
  PF_L2: number;
  PF_L3: number;
  PF_Total: number;
}

interface Page4Data {
  timestamp: string;
  status: string;
  kWh_Total: number;
  kVAh_Total: number;
  kvarh_Total: number;
  PF_Total: number;
}

interface HistoryPoint {
  timestamp: string;
  voltageAvg: number;
  V_LN1: number;
  V_LN2: number;
  V_LN3: number;
  currentAvg: number;
  I_L1: number;
  I_L2: number;
  I_L3: number;
  powerTotal: number;
  P_Total: number;
  S_Total: number;
  Q_Total: number;
  pfTotal: number;
  PF_Total: number;
  thdvAvg: number;
  THDv_L1: number;
  THDv_L2: number;
  THDv_L3: number;
  thdiAvg: number;
  THDi_L1: number;
  THDi_L2: number;
  THDi_L3: number;
  frequency: number;
  kWh_Total: number;
  kVAh_Total: number;
  kvarh_Total: number;
}

const HISTORY_SIZE = 60;

const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);

export default function Home() {
  const [activeTab, setActiveTab] = useState(1);
  const headerRef = useRef<HTMLElement>(null);
  const [headerOffset, setHeaderOffset] = useState(0);

  // Natural top-anchored header scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return;
      const headerHeight = headerRef.current.offsetHeight;
      const currentScrollY = window.scrollY;

      // Calculate offset: push header up as we scroll down
      // Stay hidden once scrolled past header height
      const newOffset = -Math.min(currentScrollY, headerHeight);
      setHeaderOffset(newOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initially to set correct state if page is already scrolled
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [viewMode1, setViewMode1] = useState<'cards' | 'charts'>('cards');
  const [viewMode2, setViewMode2] = useState<'cards' | 'charts'>('cards');
  const [viewMode3, setViewMode3] = useState<'cards' | 'charts'>('cards');
  const [viewMode4, setViewMode4] = useState<'cards' | 'charts'>('cards');

  const [isSimulateMode, setIsSimulateMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activePort, setActivePort] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [isLogging, setIsLogging] = useState(false);
  const [logSizeKb, setLogSizeKb] = useState(0);
  const [faultRecordCount, setFaultRecordCount] = useState(0);
  const [isClearMenuOpen, setIsClearMenuOpen] = useState(false);
  const [persistentAlerts, setPersistentAlerts] = useState<FaultAlert[]>([]);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [isFaultDetailsOpen, setIsFaultDetailsOpen] = useState(false);
  const [acknowledgedAlertCategories, setAcknowledgedAlertCategories] = useState<Set<string>>(new Set());


  // Automatic API Base URL:
  // - In development (npm run dev): Use absolute URL to the host (supports mobile on same Wi-Fi)
  // - In production (build/exe): Use relative path /api/v1 for portability
  const isDev = process.env.NODE_ENV === 'development';
  const API_BASE_URL = isDev
    ? (process.env.NEXT_PUBLIC_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8003/api/v1`)
    : '/api/v1';

  const aiAdvisor = useAiAdvisor(API_BASE_URL);
  const [pdfLoading, setPdfLoading] = useState(false);

  const {
    data,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling,
    isPolling,
  } = useDashboardData(API_BASE_URL);

  useEffect(() => {
    if (data?.alerts && Array.isArray((data.alerts as any).alerts)) {
      const currentActive = (data.alerts as any).alerts as FaultAlert[];

      // If no active system faults, clear our acknowledgment cache so future faults can trigger
      if (currentActive.length === 0) {
        if (acknowledgedAlertCategories.size > 0) {
          setAcknowledgedAlertCategories(new Set());
        }
        if (persistentAlerts.length > 0) {
          setPersistentAlerts([]);
        }
        return;
      }

      // Check if there are any totally NEW fault categories that we haven't acknowledged
      const unacknowledged = currentActive.filter(a => !acknowledgedAlertCategories.has(a.category));

      if (unacknowledged.length > 0 && isAlertDismissed) {
        // A new fault occurred that wasn't acknowledged yet. Show the banner again.
        setPersistentAlerts(currentActive);
        setIsAlertDismissed(false);
      } else if (!isAlertDismissed) {
        // Keep the UI sync'd with the active ones
        setPersistentAlerts(currentActive);
      }
    }
  }, [data?.alerts, acknowledgedAlertCategories, isAlertDismissed, persistentAlerts.length]);

  // Update history when data changes
  useEffect(() => {
    if (!data?.page1 || !data?.page2 || !data?.page3 || !data?.page4) return;

    const page1 = data.page1 as unknown as Page1Data;
    const page2 = data.page2 as unknown as Page2Data;
    const page3 = data.page3 as unknown as Page3Data;
    const page4 = data.page4 as unknown as Page4Data;

    const voltageAvg = page1.V_LN_avg || avg([page1.V_LN1, page1.V_LN2, page1.V_LN3]);
    const currentAvg = page1.I_avg || avg([page1.I_L1, page1.I_L2, page1.I_L3]);
    const thdvAvg = avg([page3.THDv_L1, page3.THDv_L2, page3.THDv_L3]);
    const thdiAvg = avg([page3.THDi_L1, page3.THDi_L2, page3.THDi_L3]);

    setHistory((prev) => {
      const next: HistoryPoint[] = [
        ...prev,
        {
          timestamp: page1.timestamp,
          voltageAvg,
          V_LN1: page1.V_LN1,
          V_LN2: page1.V_LN2,
          V_LN3: page1.V_LN3,
          currentAvg,
          I_L1: page1.I_L1,
          I_L2: page1.I_L2,
          I_L3: page1.I_L3,
          powerTotal: page2.P_Total,
          P_Total: page2.P_Total,
          S_Total: page2.S_Total,
          Q_Total: page2.Q_Total,
          pfTotal: page3.PF_Total,
          PF_Total: page3.PF_Total,
          thdvAvg,
          THDv_L1: page3.THDv_L1,
          THDv_L2: page3.THDv_L2,
          THDv_L3: page3.THDv_L3,
          thdiAvg,
          THDi_L1: page3.THDi_L1,
          THDi_L2: page3.THDi_L2,
          THDi_L3: page3.THDi_L3,
          frequency: page1.Freq,
          kWh_Total: page4.kWh_Total,
          kVAh_Total: page4.kVAh_Total,
          kvarh_Total: page4.kvarh_Total,
        },
      ];
      return next.slice(-HISTORY_SIZE);
    });

    // Update log status
    if (data.logStatus) {
      setIsLogging((data.logStatus as { isLogging: boolean }).isLogging);
      const logStatusData = data.logStatus as { isLogging: boolean; logSizeKb?: number; faultRecordCount?: number };
      if (logStatusData.logSizeKb !== undefined) {
        setLogSizeKb(logStatusData.logSizeKb);
      }
      if (logStatusData.faultRecordCount !== undefined) {
        setFaultRecordCount(logStatusData.faultRecordCount);
      }
    }

    // Update simulation and connection status
    if (data.systemStatus) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sysStatus = data.systemStatus as any;
      if (sysStatus && typeof sysStatus.simulate_mode === 'boolean') {
        setIsSimulateMode(sysStatus.simulate_mode);
      }
      if (sysStatus && typeof sysStatus.connected === 'boolean') {
        setIsConnected(sysStatus.connected);
      }
      if (sysStatus && sysStatus.port !== undefined) {
        setActivePort(sysStatus.port);
      }
    }
  }, [data]);

  // Polling is natively handled via SWR configuration in useDashboardData





  const handleStartLogging = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/datalog/start`, { method: 'POST' });
      refresh(false);
    } catch (err) {
      console.error('Failed to start logging:', err);
    }
  }, [refresh, API_BASE_URL]);

  const handleStopLogging = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/datalog/stop`, { method: 'POST' });
      refresh(false);
    } catch (err) {
      console.error('Failed to stop logging:', err);
    }
  }, [refresh, API_BASE_URL]);

  const handleDownloadLog = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/datalog/download?t=${Date.now()}`);
      if (!res.ok) {
        alert('❌ ยังไม่มีข้อมูลให้ดาวน์โหลด กรุณากดปุ่ม REC ก่อนครับ');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PM2200_Data_Log.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('⚠️ เชื่อมต่อ API ล้มเหลว: ' + err);
    }
  }, [API_BASE_URL]);

  const handleClearLog = useCallback(async () => {
    if (confirm('แน่ใจหรือไม่ว่าต้องการล้างข้อมูลบันทึก (Data Log) ทั้งหมด?')) {
      try {
        await fetch(`${API_BASE_URL}/datalog/clear?type=normal`, { method: 'DELETE' });
        refresh(false);
        setIsClearMenuOpen(false);
      } catch (err) {
        console.error('Failed to clear log:', err);
      }
    }
  }, [refresh, API_BASE_URL]);

  const handleClearFaultLog = useCallback(async () => {
    if (confirm('แน่ใจหรือไม่ว่าต้องการล้างประวัติการเกิด Fault ทั้งหมด?')) {
      try {
        await fetch(`${API_BASE_URL}/datalog/clear?type=fault`, { method: 'DELETE' });
        setFaultRecordCount(0);
        refresh(false);
        aiAdvisor.setAiSummary(null);
        sessionStorage.removeItem('pm2000_ai_summary');
        setIsClearMenuOpen(false);
      } catch (err) {
        console.error('Failed to clear fault log:', err);
      }
    }
  }, [refresh, API_BASE_URL]);

  const handleClearAllLogs = useCallback(async () => {
    if (confirm('แน่ใจหรือไม่ว่าต้องการล้างข้อมูลบันทึกทั้งหมด (รวมถึงประวัติ Fault)?')) {
      try {
        await Promise.all([
          fetch(`${API_BASE_URL}/datalog/clear?type=normal`, { method: 'DELETE' }),
          fetch(`${API_BASE_URL}/datalog/clear?type=fault`, { method: 'DELETE' })
        ]);
        setFaultRecordCount(0);
        refresh(false);
        aiAdvisor.setAiSummary(null);
        sessionStorage.removeItem('pm2000_ai_summary');
        setIsClearMenuOpen(false);
      } catch (err) {
        console.error('Failed to clear all logs:', err);
      }
    }
  }, [refresh, API_BASE_URL]);

  const handleTestLineNotify = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/test-line-notify`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        alert('✅ ส่งข้อความทดสอบเข้า LINE เรียบร้อยแล้ว!');
      } else {
        alert('❌ ส่งไม่สำเร็จ: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('⚠️ เชื่อมต่อ API ล้มเหลว: ' + err);
    }
  }, [API_BASE_URL]);

  const handleExportPdf = useCallback(() => {
    setPdfLoading(true);
    aiAdvisor.setIsPrintingAiReport(true);

    // Allow React state to update before printing
    setTimeout(() => {
      window.print();
      setPdfLoading(false);
    }, 800);
  }, [aiAdvisor]);

  const handleToggleSimulateMode = async () => {
    try {
      setToggleLoading(true);
      const res = await fetch(`${API_BASE_URL}/mode/toggle`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to toggle mode');
      }
      const json = await res.json();
      setIsSimulateMode(json.simulate_mode);
      // Force an immediate refresh of all data and connections
      await refresh(true);
      alert(json.message);
    } catch (err) {
      alert('Error toggling simulate mode: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setToggleLoading(false);
    }
  };

  const handleScanAndConnect = async () => {
    try {
      setIsConnecting(true);
      const res = await fetch(`${API_BASE_URL}/auto-connect?t=${Date.now()}`);
      if (!res.ok) throw new Error('Auto-connect failed');
      const data = await res.json();
      if (data.status === 'connected') {
        alert(`เชื่อมต่อสำเร็จที่พอร์ต: ${data.port}`);
        await refresh(true);
      } else {
        alert('ค้นหาอุปกรณ์ไม่พบ กรุณาตรวจสอบสาย หรือตั้งค่าให้ถูกต้อง');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสแกน: ' + err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">ข้อผิดพลาด: {error}</p>
          <button
            onClick={() => refresh(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const page1 = data?.page1 as unknown as Page1Data | null;
  const page2 = data?.page2 as unknown as Page2Data | null;
  const page3 = data?.page3 as unknown as Page3Data | null;
  const page4 = data?.page4 as unknown as Page4Data | null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* AI Advisor Chat - Always mounted for persistence */}
      <ChatPanel />

      {/* Header */}
      <header
        ref={headerRef}
        style={{ transform: `translateY(${headerOffset}px)` }}
        className="no-print bg-gray-800/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50 will-change-transform"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Row: Title & Controls */}
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 w-full">
            {/* Title */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-white">PM2200 Dashboard</h1>
              <p className="text-gray-400 text-sm">ระบบแสดงผลค่าพารามิเตอร์ไฟฟ้า</p>
            </div>

            {/* Controls (Data Logger & Device Settings) */}
            <div className="flex flex-wrap items-center justify-end gap-3 min-h-[44px]">
              {/* Data Logger */}
              <div className="flex items-center gap-2 bg-gray-900/40 p-1.5 rounded-xl border border-gray-700 shadow-sm transition-all duration-300">
                <div className="flex flex-col px-2 min-w-[90px]">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-1">Data Logger</span>
                  <span className={`text-xs font-bold whitespace-nowrap leading-none ${isLogging ? 'text-rose-400 animate-pulse' : 'text-gray-500'}`}>
                    {isLogging ? '● REC' : '■ STOPPED'} <span className="font-normal">({logSizeKb}K)</span>
                  </span>
                </div>

                {!isLogging ? (
                  <button type="button" onClick={handleStartLogging} className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-500 border border-rose-500/50 rounded-lg text-xs transition font-medium whitespace-nowrap">
                    ▶ REC
                  </button>
                ) : (
                  <button type="button" onClick={handleStopLogging} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 rounded-lg text-xs transition font-medium whitespace-nowrap">
                    ■ STOP
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadLog}
                  className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-lg text-xs transition flex items-center gap-1 font-medium whitespace-nowrap"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> CSV
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE_URL}/datalog/download?t=${Date.now()}&type=fault`);
                      if (!res.ok) {
                        alert('❌ ยังไม่มีข้อมูลให้ดาวน์โหลด');
                        return;
                      }
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'PM2200_Fault_Log.csv';
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      a.remove();
                    } catch (err) {
                      alert('⚠️ เชื่อมต่อ API ล้มเหลว: ' + err);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-500/30 rounded-lg text-xs transition flex items-center gap-1 font-medium whitespace-nowrap"
                  title="Download Fault Log"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Faults
                </button>

                {/* Unified Clear Log Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsClearMenuOpen(!isClearMenuOpen)}
                    className={`px-2 py-1.5 transition ml-1 rounded-lg ${isClearMenuOpen ? 'bg-rose-600/20 text-rose-400' : 'text-gray-500 hover:text-rose-400'}`}
                    title="Log Management"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>

                  {isClearMenuOpen && (
                    <>
                      {/* Overlay to close menu when clicking outside */}
                      <div className="fixed inset-0 z-10" onClick={() => setIsClearMenuOpen(false)}></div>

                      <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-20 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 mb-1">
                          Manage Logs
                        </div>
                        <button
                          onClick={handleClearLog}
                          className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-rose-600/10 hover:text-rose-400 transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                          Clear Data Log
                        </button>
                        <button
                          onClick={handleClearFaultLog}
                          className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-rose-600/10 hover:text-rose-400 transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Clear Fault Log
                        </button>
                        <div className="border-t border-gray-800 my-1"></div>
                        <button
                          onClick={handleTestLineNotify}
                          className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-green-600/10 hover:text-green-400 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                          Test LINE Notify
                        </button>
                        <div className="border-t border-gray-800 my-1"></div>
                        <button
                          onClick={handleClearAllLogs}
                          className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-600 hover:text-white transition-colors flex items-center gap-2 font-medium"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          Clear All Logs
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Operating Mode & Connection Status */}
              <div className="flex items-center gap-2 bg-gray-900/40 p-1.5 rounded-xl border border-gray-700 shadow-sm transition-all duration-300">
                <button
                  type="button"
                  onClick={handleToggleSimulateMode}
                  disabled={toggleLoading}
                  title="Click to toggle between Simulator Data and Real Device Data"
                  className={`px-2 sm:px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm font-medium transition cursor-pointer select-none
                     ${toggleLoading ? 'opacity-50 cursor-wait' : 'hover:brightness-110'}
                     ${isSimulateMode
                      ? 'bg-purple-900/40 border-purple-500/50 text-purple-300'
                      : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'}
                  `}
                >
                  <span className="hidden sm:inline whitespace-nowrap">{isSimulateMode ? '🧪 SIMULATOR' : '🔌 REAL DEVICE'}</span>
                  <span className="sm:hidden">{isSimulateMode ? '🧪' : '🔌'}</span>
                  <div className={`w-6 h-3.5 sm:w-8 sm:h-4 rounded-full p-0.5 transition-colors relative ${isSimulateMode ? 'bg-purple-600' : 'bg-emerald-600'}`}>
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full transition-transform ${isSimulateMode ? 'translate-x-3 sm:translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </button>

                {/* Status Indicator for both modes */}
                <div className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-gray-700">
                  {isSimulateMode ? (
                    <div className="flex items-center gap-2 pr-2">
                      <div className="px-2 sm:px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] sm:text-sm font-medium whitespace-nowrap">
                        ✅ SIMULATOR MODE
                      </div>
                      <SimulatorControl />
                    </div>
                  ) : isConnected ? (
                    <div className="px-2 sm:px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-sm font-medium whitespace-nowrap uppercase">
                      ✅ CONNECTED ({activePort || 'OK'})
                    </div>
                  ) : (
                    <>
                      <div className="px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] sm:text-sm font-medium whitespace-nowrap animate-pulse">
                        OFFLINE
                      </div>
                      <button
                        type="button"
                        onClick={handleScanAndConnect}
                        disabled={isConnecting}
                        className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white border border-blue-500 rounded-lg text-[10px] sm:text-sm font-medium transition flex items-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        {isConnecting ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          '🔍 CONNECT'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Tabs & Update Time (Unified Single Row) */}
          <div className="flex flex-nowrap items-center gap-2 sm:gap-8 mt-4 w-full border-t border-gray-700/50 pt-3 overflow-x-auto no-scrollbar">

            {/* Tabs Group */}
            <div className="flex flex-nowrap gap-1 bg-gray-900/40 p-1 rounded-xl border border-gray-700/50 shadow-inner shrink-0">
              {[
                { id: 1, name: 'ภาพรวม', icon: '📊' },
                { id: 2, name: 'กำลังไฟฟ้า', icon: '⚡' },
                { id: 3, name: 'คุณภาพไฟฟ้า', icon: '📈' },
                { id: 4, name: 'พลังงาน', icon: '🔋' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2 py-1.5 sm:px-4 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                  <span className="text-base sm:text-sm">{tab.icon}</span>
                  <span className="hidden md:block whitespace-nowrap">{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Status & Timestamp Group (Directly following tabs on same row) */}
            <div className="flex items-center gap-3 sm:gap-8 ml-auto shrink-0">
              {/* Timestamp block */}
              <div className="text-left border-l border-gray-700/50 pl-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1 opacity-70">Last Update</p>
                <p className="text-gray-300 text-[9px] sm:text-xs font-mono leading-none">
                  {/* Always show only time on ultra-small screens to save space */}
                  <span className="sm:hidden">{page1 ? new Date(page1.timestamp).toLocaleTimeString('th-TH') : '--:--'}</span>
                  <span className="hidden sm:inline">{page1 ? new Date(page1.timestamp).toLocaleString('th-TH') : '-'}</span>
                </p>
              </div>

              {/* Status Indicator */}
              <div className={`flex items-center gap-1 ${page1?.status === 'OK' ? 'text-emerald-400' : 'text-rose-500'}`}>
                <span className="text-[10px] sm:text-sm font-bold whitespace-nowrap drop-shadow-sm uppercase">
                  ● {page1?.status === 'OK' ? 'CONNECTED' : 'OFFLINE'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 1 && page1 && (
          <div className="space-y-6">
            {/* ── Live Fault Alert Banner ── */}
            {!isAlertDismissed && persistentAlerts.length > 0 && (
              <div className="bg-[#151114] border border-red-500/20 rounded-xl py-4 flex flex-col sm:flex-row items-center justify-between shadow-[0_4px_20px_rgba(239,68,68,0.15)] relative overflow-hidden transition-all duration-300 mx-1 mt-6 mb-6">
                {/* Red Left Strip */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600 shadow-[2px_0_10px_rgba(239,68,68,0.8)]"></div>

                {/* Left Side: Icon & Text */}
                <div className="flex items-center gap-4 pl-6 pr-4 w-full sm:w-auto mb-3 sm:mb-0">
                  <div className="bg-red-500/10 p-2.5 rounded-full flex items-center justify-center animate-pulse-once shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]">
                    <span className="text-xl drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse">🚨</span>
                  </div>
                  <div>
                    <h3 className="text-red-100 font-bold text-[17px] tracking-wide flex items-center gap-2">
                      ระบบพบความผิดปกติ — <span className="text-red-400">{persistentAlerts.length} รายการ</span>
                    </h3>
                    <p className="text-red-200/50 text-[13px] mt-0.5 tracking-wide font-medium">
                      กรุณาคลิกเพื่อดูรายละเอียดสาเหตุและคำแนะนำ
                    </p>
                  </div>
                </div>

                {/* Right Side: Action Button */}
                <div className="pr-4 pl-6 sm:pl-0 w-full sm:w-auto">
                  <button
                    onClick={() => setIsFaultDetailsOpen(true)}
                    className="w-full sm:w-auto px-5 py-2 bg-[#1e2330] hover:bg-[#283145] text-[#b0c4de] hover:text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 border border-[#3b4766] shadow-sm tracking-wide"
                  >
                    <svg className="w-4 h-4 text-[#60a5fa] opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="9" strokeWidth="2" />
                      <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                      <line x1="12" y1="8" x2="12" y2="8.01" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            )}

            <FaultDetailsModal
              isOpen={isFaultDetailsOpen}
              onClose={() => setIsFaultDetailsOpen(false)}
              alerts={persistentAlerts}
              onAcknowledgeAll={() => {
                const categories = new Set(acknowledgedAlertCategories);
                persistentAlerts.forEach(a => categories.add(a.category));
                setAcknowledgedAlertCategories(categories);
                setPersistentAlerts([]);
                setIsAlertDismissed(true);
                setIsFaultDetailsOpen(false);
              }}
            />

            <AiInsightsPanel faultRecordCount={faultRecordCount} aiAdvisor={aiAdvisor} panelType="power" />
            <AiInsightsPanel faultRecordCount={faultRecordCount} aiAdvisor={aiAdvisor} panelType="predictive" />

            <div className={aiAdvisor.isPrintingAiReport ? 'no-print' : ''}>
              <Page1 data={page1} history={history} viewMode={viewMode1} setViewMode={setViewMode1} />
            </div>
            {page2 && page3 && page4 && (
              <div className={aiAdvisor.isPrintingAiReport ? 'no-print' : ''}>
                <OnePageReport
                  data1={page1}
                  data2={page2}
                  data3={page3}
                  data4={page4}
                  history={history}
                  onExportPdf={handleExportPdf}
                  isExportingPdf={pdfLoading}
                />
              </div>
            )}

            {aiAdvisor.isPrintingAiReport && aiAdvisor.aiSummary && (
              <div className="print-only">
                <ReportTemplate markdownContent={aiAdvisor.aiSummary} />
              </div>
            )}
          </div>
        )}
        {activeTab === 2 && page2 && <Page2 data={page2} history={history} viewMode={viewMode2} setViewMode={setViewMode2} />}
        {activeTab === 3 && page3 && <Page3 data={{ ...page3, Q_L1: page2?.Q_L1, Q_L2: page2?.Q_L2, Q_L3: page2?.Q_L3, Q_Total: page2?.Q_Total }} history={history} viewMode={viewMode3} setViewMode={setViewMode3} />}
        {activeTab === 4 && page4 && (
          <div className="space-y-6">
            {/* Energy Management AI Panel */}
            <AiInsightsPanel faultRecordCount={faultRecordCount} aiAdvisor={aiAdvisor} panelType="energy" />

            <Page4 data={page4} history={history} viewMode={viewMode4} setViewMode={setViewMode4} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          PM2200 Dashboard
          <br />
          COPYRIGHT© 2026 โดย กลุ่ม 2 เฉลียว
        </div>
      </footer>

    </main >
  );
}
