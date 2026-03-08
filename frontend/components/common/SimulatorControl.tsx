import { useState } from 'react';
import apiClient from '@/utils/apiClient';
import useDashboardData from '@/hooks/useDashboardData';
import { API_BASE_URL } from '@/utils/apiClient';

export const SimulatorControl = () => {
    const { data, refresh } = useDashboardData(API_BASE_URL);
    const status = data?.simulatorStatus;
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (type: string) => {
        setIsLoading(true);
        try {
            await apiClient.injectFault(type);
            await refresh(); // Force SWR to revalidate immediately
        } catch (err) {
            alert('Failed to inject fault');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        setIsLoading(true);
        try {
            await apiClient.resetSimulator();
            await refresh(); // Force SWR to revalidate immediately
        } catch (err) {
            alert('Failed to reset simulator');
        } finally {
            setIsLoading(false);
        }
    };

    if (!status?.is_simulating) return null;

    const faults = [
        { key: 'phase_loss', label: 'Phase Loss L1', color: 'bg-red-500' },
        { key: 'voltage_sag', label: 'Voltage Sag', color: 'bg-orange-500' },
        { key: 'voltage_swell', label: 'Voltage Swell', color: 'bg-yellow-500' },
        { key: 'overload', label: 'Overload (High Current)', color: 'bg-purple-500' },
        { key: 'unbalance_high', label: 'Unbalance (V/I)', color: 'bg-blue-500' },
        { key: 'harmonics_high', label: 'High Harmonics', color: 'bg-teal-500' },
    ];

    return (
        <div className="relative">
            <div className={`absolute top-full right-0 mt-2 z-50 overflow-hidden transition-all duration-300 ${isExpanded ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                <div className="rounded-2xl border border-white/10 bg-slate-900 shadow-2xl backdrop-blur-xl p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Simulator Injection 🧪</h3>
                        <button onClick={handleReset} className="text-[10px] text-indigo-400 hover:text-indigo-300">
                            Reset All
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        {faults.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => handleToggle(f.key)}
                                disabled={isLoading}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] transition-colors ${status.state[f.key as keyof typeof status.state]
                                    ? `${f.color} text-white`
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                <span>{f.label}</span>
                                <div className={`h-1.5 w-1.5 rounded-full ${status.state[f.key as keyof typeof status.state] ? 'bg-white animate-pulse' : 'bg-white/20'
                                    }`} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-2 rounded-lg border border-indigo-500/30 px-3 py-1.5 text-[10px] sm:text-xs font-medium transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                    }`}
            >
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                </span>
                Simulation Tool
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};
