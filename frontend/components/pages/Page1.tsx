'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CustomTooltip } from '../common/CustomTooltip';
import { VoltageRow, CurrentRow } from '../common';

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

export function Page1({
  data,
  history,
  viewMode,
  setViewMode,
}: {
  data: Page1Data;
  history: HistoryPoint[];
  viewMode: 'cards' | 'charts';
  setViewMode: (mode: 'cards' | 'charts') => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">📊 ภาพรวมและพารามิเตอร์พื้นฐาน</h2>
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button onClick={() => setViewMode('cards')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Cards</button>
          <button onClick={() => setViewMode('charts')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'charts' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Charts</button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Voltage */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">🔌 แรงดันไฟฟ้า (Voltage)</h3>
            <div className="space-y-2">
              <VoltageRow label="V_LN1" value={data.V_LN1} unit="V" />
              <VoltageRow label="V_LN2" value={data.V_LN2} unit="V" />
              <VoltageRow label="V_LN3" value={data.V_LN3} unit="V" />
              <div className="border-t border-gray-600 pt-1 mt-1 mb-2">
                <VoltageRow label="V_LN_avg" value={data.V_LN_avg} unit="V" />
              </div>
              <VoltageRow label="V_LL12" value={data.V_LL12} unit="V" />
              <VoltageRow label="V_LL23" value={data.V_LL23} unit="V" />
              <VoltageRow label="V_LL31" value={data.V_LL31} unit="V" />
              <div className="border-t border-gray-600 pt-1 mt-1">
                <VoltageRow label="V_LL_avg" value={data.V_LL_avg} unit="V" />
              </div>
            </div>
          </div>

          {/* Current */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">⚡ กระแสไฟฟ้า (Current)</h3>
            <div className="space-y-3">
              <CurrentRow label="I_L1" value={data.I_L1} unit="A" />
              <CurrentRow label="I_L2" value={data.I_L2} unit="A" />
              <CurrentRow label="I_L3" value={data.I_L3} unit="A" />
              <CurrentRow label="I_N" value={data.I_N} unit="A" />
              <div className="border-t border-gray-600 pt-2 mt-2">
                <CurrentRow label="I_avg" value={data.I_avg} unit="A" />
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-4">📊 ความถี่ (Frequency)</h3>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-400">{data.Freq.toFixed(2)}</p>
                <p className="text-gray-400 text-sm mt-2">Hz</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 กราฟแนวโน้มแรงดันไฟฟ้า 3 เฟส (V)</h3>
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
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(0)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" name="L1" dataKey="V_LN1" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="L2" dataKey="V_LN2" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="L3" dataKey="V_LN3" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 กราฟแนวโน้มกระแสไฟฟ้า 3 เฟส (I)</h3>
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
                  <YAxis stroke="#9ca3af" domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(2)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" name="L1" dataKey="I_L1" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="L2" dataKey="I_L2" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="L3" dataKey="I_L3" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Page1;
