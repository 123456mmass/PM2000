'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import useDashboardData from '@/hooks/useDashboardData';
import { API_BASE_URL } from '@/utils/apiClient';

interface AlertItem {
    id: string; // Unique ID for each spawned alert
    category: string;
    severity: string;
    message: string;
    timestamp: string;
}

// Industrial desktop alarm standard: Nag every 5 minutes if unacknowledged
const ALERT_REPEAT_INTERVAL_MS = 300000;

// Helper to play a short beep sound
const playBeep = () => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Low volume
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio playback prevented:", e);
    }
};

export function AlertToaster() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const lastNotifiedAtRef = useRef<Map<string, number>>(new Map());
    const { data } = useDashboardData(API_BASE_URL);

    const dismissAlert = useCallback((idToRemove: string) => {
        setAlerts(prev => prev.filter(a => a.id !== idToRemove));
    }, []);

    useEffect(() => {
        if (!data || !data.alerts) return;

        const response = data.alerts;

        if (Array.isArray(response.alerts) && response.alerts.length > 0) {
            let hasNewAlert = false;
            const newAlerts: AlertItem[] = [];
            const nowMs = Date.now();
            const now = new Date(nowMs).toLocaleTimeString('th-TH', { hour12: false });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            response.alerts.forEach((incoming: any) => {
                const categoryKey = String(incoming.category || 'unknown');
                const lastNotifiedAt = lastNotifiedAtRef.current.get(categoryKey) ?? 0;
                const shouldNotify = (nowMs - lastNotifiedAt) >= ALERT_REPEAT_INTERVAL_MS;

                if (!shouldNotify) return;

                hasNewAlert = true;
                lastNotifiedAtRef.current.set(categoryKey, nowMs);
                newAlerts.push({
                    id: `${categoryKey}-${nowMs}`,
                    category: incoming.category,
                    severity: incoming.severity,
                    message: incoming.message,
                    timestamp: now
                });
            });

            if (hasNewAlert) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                setAlerts(prev => {
                    // Prevent duplicate category toasts from stacking infinitely on screen
                    const filteredNew = newAlerts.filter(na => !prev.some(pa => pa.category === na.category));
                    if (filteredNew.length === 0) return prev;

                    // Only play beep if we actually render a new toast
                    playBeep();
                    return [...prev, ...filteredNew];
                });
            }
        } else if (response.status === 'OK') {
            // No active alerts according to server.
            // If faults go away, we DO NOT automatically clear the UI.
            // The user requested that alerts do not disappear until they click close.
            // So we do not clear the `alerts` array. 

            // However, since the system is completely healthy now, we MUST clear the cooldown map.
            // This ensures that if the user manually triggers a NEW fault (or the same one) 
            // 5 seconds from now, it will alert them immediately rather than being blocked by the 5-min cooldown.
            // NOTE: We only do this when status is strictly 'OK' (no active faults anywhere).
            lastNotifiedAtRef.current.clear();
        }
    }, [data?.alerts]);

    const categoryMap: Record<string, string> = {
        'VOLTAGE': 'ตัวแปรแรงดันไฟฟ้า',
        'CURRENT': 'ตัวแปรกระแสไฟฟ้า',
        'FREQUENCY': 'ตัวแปรความถี่',
        'POWER': 'ตัวแปรกำลังไฟฟ้า',
        'VOLTAGE UNBALANCE': 'แรงดันไฟฟ้าไม่สมดุล',
        'CURRENT UNBALANCE': 'กระแสไฟฟ้าไม่สมดุล',
        'HARMONICS': 'ฮาร์มอนิก',
        'SYSTEM': 'ระบบทั่วไป',
        'VOLTAGE_UNBALANCE': 'แรงดันไฟฟ้าไม่สมดุล',
        'CURRENT_UNBALANCE': 'กระแสไฟฟ้าไม่สมดุล',
        'OVERLOAD': 'กระแสไฟฟ้าเกินพิกัด',
        'SHORT_CIRCUIT': 'ลัดวงจร'
    };

    const severityMap: Record<string, string> = {
        'critical': 'วิกฤต',
        'high': 'รุนแรง',
        'medium': 'ปานกลาง',
        'warning': 'แจ้งเตือน',
        'info': 'ทั่วไป'
    };

    const translateMessage = (msg: string): string => {
        const m = msg.toLowerCase();
        if (m.includes('undervoltage detected')) return msg.replace(/Undervoltage detected/i, 'ตรวจพบแรงดันตก');
        if (m.includes('overvoltage detected')) return msg.replace(/Overvoltage detected/i, 'ตรวจพบแรงดันเกิน');
        if (m.includes('high current detected')) return msg.replace(/High current detected/i, 'ตรวจพบกระแสเกิน');
        if (m.includes('voltage unbalance exceeds limit')) return msg.replace(/Voltage unbalance exceeds limit/i, 'แรงดันไม่สมดุลเกินค่ามาตรฐาน');
        if (m.includes('current unbalance exceeds limit')) return msg.replace(/Current unbalance exceeds limit/i, 'กระแสไม่สมดุลเกินค่ามาตรฐาน');
        if (m.includes('frequency out of normal range')) return msg.replace(/Frequency out of normal range/i, 'ความถี่อยู่นอกย่านปกติ');
        if (m.includes('low power factor')) return msg.replace(/Low power factor detected/i, 'ค่าตัวประกอบกำลังต่ำกว่าเกณฑ์');
        return msg;
    };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
            {alerts.length > 1 && (
                <div className="flex justify-end pointer-events-auto animate-slide-in-right">
                    <button
                        onClick={() => setAlerts([])}
                        className="px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg shadow-lg backdrop-blur-sm border border-gray-600 transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        ปิดทั้งหมด ({alerts.length})
                    </button>
                </div>
            )}
            {alerts.slice(-5).map((alert) => {
                const s = (alert.severity || '').toLowerCase();
                const rawCat = (alert.category || 'UNKNOWN').replace(/_/g, ' ');
                const thCat = categoryMap[rawCat] || categoryMap[alert.category || ''] || rawCat;
                const thSev = severityMap[s] || alert.severity || '';
                const thMsg = translateMessage(alert.message);

                return (
                    <div
                        key={alert.id}
                        className={`
            relative p-4 rounded-lg shadow-xl border-l-4 pointer-events-auto transform transition-all duration-300 animate-slide-in-right
            ${s === 'critical' || s === 'high'
                                ? 'bg-red-50/95 dark:bg-[#2a1515]/95 border-red-500 text-red-900 dark:text-red-100 backdrop-blur-sm'
                                : s === 'medium' || s === 'warning'
                                    ? 'bg-yellow-50/95 dark:bg-[#2a2015]/95 border-yellow-500 text-yellow-900 dark:text-[#fcd34d] backdrop-blur-sm'
                                    : 'bg-blue-50/95 dark:bg-[#15202a]/95 border-blue-500 text-blue-900 dark:text-blue-100 backdrop-blur-sm'
                            }
          `}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => dismissAlert(alert.id)}
                            className="absolute top-2 right-2 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
                            aria-label="Dismiss alert"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        <div className="flex items-start pr-6">
                            <div className="flex-shrink-0 mt-0.5 mr-3">
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white shadow-sm ${s === 'critical' || s === 'high' ? 'bg-red-600' :
                                            s === 'medium' || s === 'warning' ? 'bg-yellow-600/90 text-yellow-50' :
                                                'bg-blue-600'
                                            }`}>
                                            {thSev}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono opacity-70 whitespace-nowrap ml-2">
                                        {alert.timestamp}
                                    </span>
                                </div>
                                <p className="text-sm font-medium leading-tight mt-1">
                                    {thMsg}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}
            <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
        </div>
    );
}
