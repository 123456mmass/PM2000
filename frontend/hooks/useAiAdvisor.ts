import { useState, useCallback, useEffect } from 'react';

export function useAiAdvisor(API_BASE_URL: string) {
    const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
    const [aiFaultLoading, setAiFaultLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isAiExpanded, setIsAiExpanded] = useState(false);
    const [aiCountdown, setAiCountdown] = useState(0);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [isPrintingAiReport, setIsPrintingAiReport] = useState(false);

    // Predictive Maintenance & Energy Management states
    const [predictiveLoading, setPredictiveLoading] = useState(false);
    const [predictiveResult, setPredictiveResult] = useState<any>(null);
    const [isPredictiveExpanded, setIsPredictiveExpanded] = useState(false);

    const [energyLoading, setEnergyLoading] = useState(false);
    const [energyResult, setEnergyResult] = useState<any>(null);
    const [isEnergyExpanded, setIsEnergyExpanded] = useState(false);

    const [isInitialMount, setIsInitialMount] = useState(true);

    // Load from sessionStorage on mount
    useEffect(() => {
        const savedSummary = sessionStorage.getItem('pm2000_ai_summary');
        const savedExpanded = sessionStorage.getItem('pm2000_ai_expanded');

        if (savedSummary) setAiSummary(savedSummary);
        if (savedExpanded) setIsAiExpanded(savedExpanded === 'true');

        setIsInitialMount(false);
    }, []);

    // Save to sessionStorage when state changes
    useEffect(() => {
        if (isInitialMount) return;
        if (aiSummary) {
            sessionStorage.setItem('pm2000_ai_summary', aiSummary);
        } else {
            sessionStorage.removeItem('pm2000_ai_summary');
        }
    }, [aiSummary, isInitialMount]);

    useEffect(() => {
        if (isInitialMount) return;
        sessionStorage.setItem('pm2000_ai_expanded', String(isAiExpanded));
    }, [isAiExpanded, isInitialMount]);

    useEffect(() => {
        const handleAfterPrint = () => setIsPrintingAiReport(false);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    const fetchAiSummary = useCallback(async () => {
        setAiSummaryLoading(true);
        setAiSummary(null);
        setAiCountdown(0);
        setIsAiProcessing(true);

        try {
            const res = await fetch(`${API_BASE_URL}/ai-summary-parallel?strategy=race`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setAiSummary(data.summary);
            } else {
                throw new Error(`API Error: ${res.status} ${res.statusText}`);
            }
        } catch (err) {
            setAiSummary('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI: ' + err);
        } finally {
            setAiSummaryLoading(false);
            setAiCountdown(0);
            setIsAiProcessing(false);
            setIsAiExpanded(true);
        }
    }, [API_BASE_URL]);
    const fetchAiFaultSummary = useCallback(async () => {
        setAiFaultLoading(true);
        setAiSummary(null);
        setAiCountdown(0);
        setIsAiProcessing(true);

        try {
            const res = await fetch(`${API_BASE_URL}/ai-fault-summary`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setAiSummary(data.summary);
            } else {
                throw new Error(`API Error: ${res.status} ${res.statusText}`);
            }
        } catch (err) {
            setAiSummary('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI (Fault): ' + err);
        } finally {
            setAiFaultLoading(false);
            setIsAiProcessing(false);
            setIsAiExpanded(true);
        }
    }, [API_BASE_URL]);

    const fetchPredictiveMaintenance = useCallback(async () => {
        setPredictiveLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/external-predictive-maintenance`);
            if (res.ok) {
                const data = await res.json();
                setPredictiveResult(data);
            } else {
                throw new Error(`API Error: ${res.status}`);
            }
        } catch (err) {
            setPredictiveResult({ error: '❌ ไม่สามารถเชื่อมต่อ AI ได้' });
        } finally {
            setPredictiveLoading(false);
            setIsPredictiveExpanded(true);
        }
    }, [API_BASE_URL]);

    const fetchEnergyEfficiencyAI = useCallback(async () => {
        setEnergyLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/energy-efficiency-ai`);
            if (res.ok) {
                const data = await res.json();
                setEnergyResult(data);
            } else {
                throw new Error(`API Error: ${res.status}`);
            }
        } catch (err) {
            setEnergyResult({ error: '❌ ไม่สามารถเชื่อมต่อ AI ได้' });
        } finally {
            setEnergyLoading(false);
            setIsEnergyExpanded(true);
        }
    }, [API_BASE_URL]);

    const handleClearAiCache = useCallback(async () => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการล้าง Cache ทั้งหมดของ AI?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/ai-summary`, { method: 'DELETE' });
            if (res.ok) {
                setAiSummary(null);
                sessionStorage.removeItem('pm2000_ai_summary');
                alert('ล้าง Cache สำเร็จแล้ว! คุณสามารถกดวิเคราะห์ใหม่ได้ทันที');
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการล้าง Cache: ' + err);
        }
    }, [API_BASE_URL]);

    const askAiAdvisor = useCallback((context: string, source: string) => {
        const event = new CustomEvent('open-chat-with-context', {
            detail: { context, source }
        });
        window.dispatchEvent(event);
    }, []);

    const handleAskAiAboutSummary = useCallback(() => {
        if (!aiSummary) return;
        askAiAdvisor(aiSummary, 'AI Power Analysis');
    }, [aiSummary, askAiAdvisor]);

    const handleAskAiAboutPredictive = useCallback(() => {
        if (!predictiveResult?.message) return;
        askAiAdvisor(predictiveResult.message, 'Predictive Maintenance');
    }, [predictiveResult, askAiAdvisor]);

    const handleAskAiAboutEnergy = useCallback(() => {
        if (!energyResult?.analysis) return;
        askAiAdvisor(energyResult.analysis, 'Energy Management');
    }, [energyResult, askAiAdvisor]);

    return {
        aiSummaryLoading,
        aiFaultLoading,
        aiSummary,
        isAiExpanded,
        setIsAiExpanded,
        aiCountdown,
        isAiProcessing,
        isPrintingAiReport,
        setIsPrintingAiReport,
        predictiveLoading,
        predictiveResult,
        setPredictiveResult,
        isPredictiveExpanded,
        setIsPredictiveExpanded,
        energyLoading,
        energyResult,
        setEnergyResult,
        isEnergyExpanded,
        setIsEnergyExpanded,
        fetchAiSummary,
        fetchAiFaultSummary,
        fetchPredictiveMaintenance,
        fetchEnergyEfficiencyAI,
        handleClearAiCache,
        handleAskAiAboutSummary,
        handleAskAiAboutPredictive,
        handleAskAiAboutEnergy,
        setAiSummary,
    };
}


