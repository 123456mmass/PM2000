'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CustomTooltip } from '../common/CustomTooltip';
import { EnergyStat } from '../common';

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

export function Page4({
  data,
  history,
  viewMode,
  setViewMode,
}: {
  data: Page4Data;
  history: HistoryPoint[];
  viewMode: 'cards' | 'charts';
  setViewMode: (mode: 'cards' | 'charts') => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">🔋 พลังงานไฟฟ้า (Energy)</h2>
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button onClick={() => setViewMode('cards')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Cards</button>
          <button onClick={() => setViewMode('charts')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'charts' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Charts</button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Energy */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-4 text-center">💡 Active Energy</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-400">{data.kWh_Total.toFixed(2)}</p>
                <p className="text-gray-400 text-sm mt-2">kWh</p>
              </div>
            </div>

            {/* Apparent Energy */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-4 text-center">📈 Apparent Energy</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-400">{data.kVAh_Total.toFixed(2)}</p>
                <p className="text-gray-400 text-sm mt-2">kVAh</p>
              </div>
            </div>

            {/* Reactive Energy */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-4 text-center">⚡ Reactive Energy</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-400">{data.kvarh_Total.toFixed(2)}</p>
                <p className="text-gray-400 text-sm mt-2">kvarh</p>
              </div>
            </div>
          </div>

          {/* Energy Summary */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mt-6">
            <h3 className="text-gray-400 text-sm font-medium mb-4">📊 สรุปพลังงาน</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EnergyStat label="Power Factor" value={data.PF_Total} unit="" />
              <EnergyStat label="Reactive Ratio" value={data.kvarh_Total / (data.kWh_Total || 1)} unit="" />
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-200 font-medium mb-4">📈 กราฟแนวโน้มพลังงานไฟฟ้าสะสม (Energy)</h3>
            <div className="h-[400px] w-full">
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
                  <Line type="stepAfter" name="Active (kWh)" dataKey="kWh_Total" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="stepAfter" name="Apparent (kVAh)" dataKey="kVAh_Total" stroke="#a855f7" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="stepAfter" name="Reactive (kvarh)" dataKey="kvarh_Total" stroke="#f97316" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Page4;
