import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiInsightsPanelProps {
    faultRecordCount: number;
    aiAdvisor: any;
    panelType?: 'power' | 'predictive' | 'energy' | 'all';
}

export const AiInsightsPanel: React.FC<AiInsightsPanelProps> = ({ faultRecordCount, aiAdvisor, panelType = 'all' }) => {
    const {
        aiSummaryLoading,
        aiFaultLoading,
        aiSummary,
        isAiExpanded,
        setIsAiExpanded,
        aiCountdown,
        isAiProcessing,
        isPrintingAiReport,
        predictiveLoading,
        predictiveResult,
        isPredictiveExpanded,
        setIsPredictiveExpanded,
        energyLoading,
        energyResult,
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
    } = aiAdvisor;

    const handleDownloadAiTxt = () => {
        if (!aiSummary) return;
        const blob = new Blob([aiSummary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PM2200_Analysis_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportAiReport = () => {
        if (!aiSummary) return;
        aiAdvisor.setIsPrintingAiReport(true);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleExportPredictiveTxt = () => {
        if (!predictiveResult?.message) return;
        const content = `Predictive Maintenance Report\n\nStatus: ${predictiveResult.maintenance_needed ? 'Maintenance Required' : 'Normal'}\nConfidence: ${(predictiveResult.confidence * 100).toFixed(1)}%\n\n${predictiveResult.message}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PM2200_Predictive_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClearPredictive = () => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างผลลัพธ์นี้?')) return;
        aiAdvisor.setPredictiveResult(null);
        setIsPredictiveExpanded(false);
    };

    const handleExportEnergyTxt = () => {
        if (!energyResult?.analysis) return;
        const content = `Energy Management Report\n\n${energyResult.analysis}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PM2200_Energy_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClearEnergy = () => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างผลลัพธ์นี้?')) return;
        aiAdvisor.setEnergyResult(null);
        setIsEnergyExpanded(false);
    };

    return (
        <>
            {(panelType === 'all' || panelType === 'power') && (
                <div className={`bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-5 rounded-xl border border-blue-700/50 shadow-lg ${isPrintingAiReport ? 'no-print' : ''}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                ✨ AI Power Analysis <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Beta</span>
                            </h3>
                            <p className="text-sm text-blue-200 mt-1">
                                {(aiSummaryLoading || aiFaultLoading) ? (
                                    <span className="flex items-center gap-2">
                                        {aiSummaryLoading && aiCountdown > 0 ? (
                                            <span className="animate-pulse">🕒 กำลังรวบรวมข้อมูล ({aiCountdown} วินาที)...</span>
                                        ) : (
                                            <span className="animate-bounce">🧠 AI กำลังวิเคราะห์ข้อมูล...</span>
                                        )}
                                    </span>
                                ) : (
                                    <>
                                        วิเคราะห์แนวโน้มและข้อเสนอแนะด้านพลังงาน
                                        <br className="sm:hidden" />แบบเรียลไทม์ด้วย AI
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {aiSummary && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClearAiCache}
                                        title="ล้าง Cache ของ AI"
                                        className="px-3 py-2 bg-rose-900/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 rounded-lg text-sm transition"
                                    >
                                        🗑️
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadAiTxt}
                                        title="ดาวน์โหลดเป็นไฟล์ Text"
                                        className="px-3 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm transition flex items-center gap-2"
                                    >
                                        📄 TXT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportAiReport}
                                        title="Export PDF ผลวิเคราะห์"
                                        className="px-3 py-2 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm transition flex items-center gap-2"
                                    >
                                        📥 PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAskAiAboutSummary}
                                        title="ถามต่อ AI Advisor"
                                        className="px-3 py-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 border border-purple-500/30 rounded-lg text-sm transition flex items-center gap-2"
                                    >
                                        💬 ถามต่อ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAiExpanded(!isAiExpanded)}
                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-lg text-sm transition font-medium"
                                    >
                                        {isAiExpanded ? '🔼 ซ่อน' : '🔽 แสดง'}
                                    </button>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                                <button
                                    type="button"
                                    onClick={fetchAiSummary}
                                    disabled={aiSummaryLoading || aiFaultLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow transition flex items-center gap-2 text-sm max-w-fit"
                                >
                                    {aiSummaryLoading && aiCountdown > 0 ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>เก็บข้อมูล {aiCountdown}s...</span>
                                        </>
                                    ) : aiSummaryLoading && isAiProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span className="animate-pulse">AI กำลังวิเคราะห์...</span>
                                        </>
                                    ) : (
                                        <>
                                            🚀 วิเคราะห์ด้วย AI
                                        </>
                                    )}
                                </button>

                                {faultRecordCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={fetchAiFaultSummary}
                                        disabled={aiSummaryLoading || aiFaultLoading}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow transition flex items-center gap-2 text-sm max-w-fit"
                                    >
                                        {aiFaultLoading && isAiProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span className="animate-pulse">กำลังวิเคราะห์ Fault...</span>
                                            </>
                                        ) : (
                                            <>
                                                🚨 วิเคราะห์ Fault ด้วย AI
                                                <span className="ml-1 px-1.5 py-0.5 bg-rose-800 rounded-full text-[10px] font-bold">{faultRecordCount}</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {aiSummary && isAiExpanded && (
                        <div className="mt-4 p-5 bg-gray-900/60 border border-gray-700 rounded-lg text-gray-200 text-sm leading-relaxed overflow-x-auto">
                            <div className="prose prose-invert prose-sm max-w-none prose-blue">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {aiSummary}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(panelType === 'all' || panelType === 'predictive') && (
                <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 p-5 rounded-xl border border-emerald-700/50 shadow-lg mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                🔮 Predictive Maintenance <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">AI</span>
                            </h3>
                            <p className="text-sm text-emerald-200 mt-1">
                                ทำนายความต้องการบำรุงรักษาล่วงหน้าด้วย AI
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {predictiveResult && !predictiveResult.error && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClearPredictive}
                                        title="ล้างผลลัพธ์"
                                        className="px-3 py-2 bg-rose-900/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 rounded-lg text-sm transition"
                                    >
                                        🗑️
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportPredictiveTxt}
                                        title="ดาวน์โหลดเป็นไฟล์ Text"
                                        className="px-3 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm transition flex items-center gap-2"
                                    >
                                        📄 TXT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAskAiAboutPredictive}
                                        title="ถามต่อ AI Advisor"
                                        className="px-3 py-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 border border-purple-500/30 rounded-lg text-sm transition flex items-center gap-2"
                                    >
                                        💬 ถามต่อ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsPredictiveExpanded(!isPredictiveExpanded)}
                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-lg text-sm transition font-medium"
                                    >
                                        {isPredictiveExpanded ? '🔼 ซ่อน' : '🔽 แสดง'}
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={fetchPredictiveMaintenance}
                                disabled={predictiveLoading}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow transition flex items-center gap-2 text-sm"
                            >
                                {predictiveLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>กำลังวิเคราะห์...</span>
                                    </>
                                ) : (
                                    <>
                                        🔮 ทำนายการบำรุงรักษา
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {predictiveResult && isPredictiveExpanded && (
                        <div className="mt-4 p-4 bg-gray-900/60 border border-emerald-700/30 rounded-lg">
                            {predictiveResult.error ? (
                                <p className="text-rose-400">{predictiveResult.error}</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">สถานะ:</span>
                                        <span className={`font-medium ${predictiveResult.maintenance_needed ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {predictiveResult.maintenance_needed ? '⚠️ ต้องการบำรุงรักษา' : '✅ ปกติ'}
                                        </span>
                                    </div>
                                    {predictiveResult.confidence > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">ความมั่นใจ:</span>
                                            <span className="text-blue-400">{(predictiveResult.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                    )}
                                    {predictiveResult.message && (
                                        <div className="mt-2 prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {predictiveResult.message}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {(panelType === 'all' || panelType === 'energy') && (
                <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 p-5 rounded-xl border border-amber-700/50 shadow-lg mt-6">
                    {/* Energy Management AI Panel */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                ⚡ Energy Management <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full">AI</span>
                            </h3>
                            <p className="text-sm text-amber-200 mt-1">
                                วิเคราะห์ประสิทธิภาพพลังงานและแนะนำวิธีประหยัดไฟ
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {energyResult && !energyResult.error && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClearEnergy}
                                        title="ล้างผลลัพธ์"
                                        className="px-3 py-2 bg-rose-900/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 rounded-lg text-sm transition"
                                    >
                                        🗑️
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportEnergyTxt}
                                        title="ดาวน์โหลดเป็นไฟล์ Text"
                                        className="px-3 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm transition flex items-center gap-2"
                                    >
                                        📄 TXT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAskAiAboutEnergy}
                                        title="ถามต่อ AI Advisor"
                                        className="px-3 py-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 border border-purple-500/30 rounded-lg text-sm transition flex items-center gap-2"
                                    >
                                        💬 ถามต่อ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEnergyExpanded(!isEnergyExpanded)}
                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-lg text-sm transition font-medium"
                                    >
                                        {isEnergyExpanded ? '🔼 ซ่อน' : '🔽 แสดง'}
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={fetchEnergyEfficiencyAI}
                                disabled={energyLoading}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow transition flex items-center gap-2 text-sm"
                            >
                                {energyLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>กำลังวิเคราะห์...</span>
                                    </>
                                ) : (
                                    <>
                                        ⚡ วิเคราะห์ประสิทธิภาพพลังงาน
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {energyResult && isEnergyExpanded && (
                        <div className="mt-4 p-4 bg-gray-900/60 border border-amber-700/30 rounded-lg">
                            {energyResult.error ? (
                                <p className="text-rose-400">{energyResult.error}</p>
                            ) : energyResult.status === 'success' ? (
                                <div className="space-y-4">
                                    {energyResult.analysis && (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {energyResult.analysis}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                    {energyResult.is_cached && (
                                        <p className="text-xs text-gray-500">
                                            * ผลลัพธ์จาก Cache (key: {energyResult.cache_key})
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-400">ไม่สามารถวิเคราะห์ได้</p>
                            )}
                        </div>
                    )}
                </div >
            )}
        </>
    );
};
