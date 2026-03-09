'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CustomTooltip } from '../common/CustomTooltip';
import { THDRow, UnbalanceRow, PFRow } from '../common';
import { HarmonicChart } from '../charts/HarmonicChart';

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
  // PF Lead/Lag type from backend 4-quadrant decode
  PF_L1_type?: string;
  PF_L2_type?: string;
  PF_L3_type?: string;
  PF_Total_type?: string;
  // Reactive power (optional) — fallback for LAGGING / LEADING
  Q_L1?: number;
  Q_L2?: number;
  Q_L3?: number;
  Q_Total?: number;
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

export function Page3({
  data,
  history,
  viewMode,
  setViewMode,
}: {
  data: Page3Data;
  history: HistoryPoint[];
  viewMode: 'cards' | 'charts';
  setViewMode: (mode: 'cards' | 'charts') => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">📈 คุณภาพไฟฟ้า (Power Quality)</h2>
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button onClick={() => setViewMode('cards')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Cards</button>
          <button onClick={() => setViewMode('charts')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'charts' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Charts</button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* THD Voltage */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-4">🌊 THD แรงดัน (Voltage)</h3>
              <div className="space-y-3">
                <THDRow label="THDv-L1" value={data.THDv_L1} />
                <THDRow label="THDv-L2" value={data.THDv_L2} />
                <THDRow label="THDv-L3" value={data.THDv_L3} />
              </div>
            </div>

            {/* THD Current */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-4">🌊 THD กระแส (Current)</h3>
              <div className="space-y-3">
                <THDRow label="THDi-L1" value={data.THDi_L1} />
                <THDRow label="THDi-L2" value={data.THDi_L2} />
                <THDRow label="THDi-L3" value={data.THDi_L3} />
              </div>
            </div>

            {/* Unbalance & PF */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-4">⚖️ Unbalance & Power Factor</h3>
              <div className="space-y-3">
                <UnbalanceRow label="V_unb" value={data.V_unb} />
                <UnbalanceRow label="U_unb" value={data.U_unb || 0} />
                <UnbalanceRow label="I_unb" value={data.I_unb} />
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <PFRow label="PF_L1" value={data.PF_L1} qValue={data.Q_L1} pfType={data.PF_L1_type} />
                  <PFRow label="PF_L2" value={data.PF_L2} qValue={data.Q_L2} pfType={data.PF_L2_type} />
                  <PFRow label="PF_L3" value={data.PF_L3} qValue={data.Q_L3} pfType={data.PF_L3_type} />
                  <PFRow label="PF_Total" value={data.PF_Total} qValue={data.Q_Total} pfType={data.PF_Total_type} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <h3 className="text-gray-300 text-sm font-medium">📊 Harmonic Order Comparison (3 เฟส)</h3>
              <p className="text-xs text-gray-500">เปรียบเทียบลำดับฮาร์มอนิก H3-H13 ของ L1-L2-L3</p>
            </div>
            <HarmonicChart data={data} />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 THDv (3 เฟส)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#9ca3af"
                    tickFormatter={(val) => {
                      if (!val) return '';
                      try { return new Date(val).toLocaleTimeString('th-TH'); }
                      catch { return ''; }
                    }}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(1)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" name="THDv L1" dataKey="THDv_L1" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="THDv L2" dataKey="THDv_L2" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="THDv L3" dataKey="THDv_L3" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 THDi (3 เฟส)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#9ca3af"
                    tickFormatter={(val) => {
                      if (!val) return '';
                      try { return new Date(val).toLocaleTimeString('th-TH'); }
                      catch { return ''; }
                    }}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(1)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" name="THDi L1" dataKey="THDi_L1" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="THDi L2" dataKey="THDi_L2" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="THDi L3" dataKey="THDi_L3" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 THD เฉลี่ย (Voltage vs Current)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#9ca3af"
                    tickFormatter={(val) => {
                      if (!val) return '';
                      try { return new Date(val).toLocaleTimeString('th-TH'); }
                      catch { return ''; }
                    }}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(1)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" name="THDv Average" dataKey="thdvAvg" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="THDi Average" dataKey="thdiAvg" stroke="#f472b6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 Power Factor (Total)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#9ca3af"
                    tickFormatter={(val) => {
                      if (!val) return '';
                      try { return new Date(val).toLocaleTimeString('th-TH'); }
                      catch { return ''; }
                    }}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(3)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" name="Power Factor" dataKey="PF_Total" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Page3;
