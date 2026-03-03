'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CustomTooltip } from '../common/CustomTooltip';
import { PowerRow } from '../common';
import { PhasorDiagram } from '../charts';

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

export function Page2({
  data,
  history,
  viewMode,
  setViewMode,
}: {
  data: Page2Data;
  history: HistoryPoint[];
  viewMode: 'cards' | 'charts';
  setViewMode: (mode: 'cards' | 'charts') => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">⚡ กำลังไฟฟ้า (Power)</h2>
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button onClick={() => setViewMode('cards')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Cards</button>
          <button onClick={() => setViewMode('charts')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'charts' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Charts</button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Active Power */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">💡 กำลังไฟฟ้าจริง (Active Power)</h3>
            <div className="space-y-3">
              <PowerRow label="P_L1" value={data.P_L1} unit="kW" />
              <PowerRow label="P_L2" value={data.P_L2} unit="kW" />
              <PowerRow label="P_L3" value={data.P_L3} unit="kW" />
              <div className="border-t border-gray-700 pt-3 mt-3">
                <PowerRow label="P_Total" value={data.P_Total} unit="kW" bold />
              </div>
            </div>
          </div>

          {/* Apparent Power */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">📈 กำลังไฟฟ้าปรากฏ (Apparent Power)</h3>
            <div className="space-y-3">
              <PowerRow label="S_L1" value={data.S_L1} unit="kVA" />
              <PowerRow label="S_L2" value={data.S_L2} unit="kVA" />
              <PowerRow label="S_L3" value={data.S_L3} unit="kVA" />
              <div className="border-t border-gray-700 pt-3 mt-3">
                <PowerRow label="S_Total" value={data.S_Total} unit="kVA" bold />
              </div>
            </div>
          </div>

          {/* Reactive Power */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">⚡ กำลังไฟฟ้ารีแอคตีฟ (Reactive Power)</h3>
            <div className="space-y-3">
              <PowerRow label="Q_L1" value={data.Q_L1} unit="kvar" />
              <PowerRow label="Q_L2" value={data.Q_L2} unit="kvar" />
              <PowerRow label="Q_L3" value={data.Q_L3} unit="kvar" />
              <div className="border-t border-gray-700 pt-3 mt-3">
                <PowerRow label="Q_Total" value={data.Q_Total} unit="kvar" bold />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 lg:col-span-1 flex flex-col items-center">
            <h3 className="text-gray-200 font-medium mb-4 w-full text-left flex items-center gap-2">🧭 Power Triangle Phasor</h3>
            <PhasorDiagram data={data} />
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 lg:col-span-2">
            <h3 className="text-gray-200 font-medium mb-4">📈 กราฟแนวโน้มกำลังไฟฟ้ารวม (P, S, Q Total)</h3>
            <div className="h-72 w-full">
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
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(2)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" name="Active (kW)" dataKey="P_Total" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="Apparent (kVA)" dataKey="S_Total" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="Reactive (kvar)" dataKey="Q_Total" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Page2;
