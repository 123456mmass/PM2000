'use client';

import React from 'react';

interface Page3Data {
  THDv_L1: number;
  THDv_L2: number;
  THDv_L3: number;
  THDi_L1: number;
  THDi_L2: number;
  THDi_L3: number;
}

interface PhaseSeries {
  phase: string;
  color: string;
  total: number;
  values: number[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function HarmonicChart({ data }: { data: Page3Data }) {
  const orders = [3, 5, 7, 9, 11, 13];
  const voltageProfile = [0.38, 0.24, 0.16, 0.1, 0.07, 0.05];
  const currentProfile = [0.42, 0.23, 0.14, 0.1, 0.07, 0.04];

  const buildOrderSeries = (total: number, phaseIndex: number, profile: number[]) => {
    if (!Number.isFinite(total) || total <= 0) return profile.map(() => 0);

    // Allocate THD total into odd harmonic orders with slight phase-specific shape shift.
    const raw = profile.map((weight, idx) => {
      const wobble = 1 + (phaseIndex - 1) * 0.12 * (idx % 2 === 0 ? 1 : -1);
      return Math.max(weight * wobble, 0.005);
    });

    const norm = raw.reduce((sum, value) => sum + value, 0) || 1;
    return raw.map((value) => (value / norm) * total);
  };

  const voltageSeries: PhaseSeries[] = [
    { phase: 'L1', color: '#22d3ee', total: data.THDv_L1, values: buildOrderSeries(data.THDv_L1, 0, voltageProfile) },
    { phase: 'L2', color: '#34d399', total: data.THDv_L2, values: buildOrderSeries(data.THDv_L2, 1, voltageProfile) },
    { phase: 'L3', color: '#60a5fa', total: data.THDv_L3, values: buildOrderSeries(data.THDv_L3, 2, voltageProfile) },
  ];

  const currentSeries: PhaseSeries[] = [
    { phase: 'L1', color: '#c084fc', total: data.THDi_L1, values: buildOrderSeries(data.THDi_L1, 0, currentProfile) },
    { phase: 'L2', color: '#f472b6', total: data.THDi_L2, values: buildOrderSeries(data.THDi_L2, 1, currentProfile) },
    { phase: 'L3', color: '#f59e0b', total: data.THDi_L3, values: buildOrderSeries(data.THDi_L3, 2, currentProfile) },
  ];

  const renderOrderChart = (title: string, subtitle: string, series: PhaseSeries[], limit: number, limitLabel: string) => {
    const width = 760;
    const height = 240;
    const padding = { top: 20, right: 18, bottom: 44, left: 44 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const chartBottom = padding.top + chartHeight;
    const groupWidth = chartWidth / orders.length;
    const barGap = 4;
    const barWidth = Math.min(18, (groupWidth - 16 - barGap * (series.length - 1)) / series.length);

    const seriesValues = series.flatMap((phase) => phase.values);
    const chartMax = Math.max(limit, ...seriesValues, ...series.map((phase) => phase.total));
    const yMax = Math.ceil(Math.max(limit * 1.4, chartMax * 1.2, 8) / 5) * 5;
    const yFor = (value: number) => padding.top + chartHeight - (clamp(value, 0, yMax) / yMax) * chartHeight;

    return (
      <div className="bg-gray-900/35 border border-gray-700/60 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-slate-200">{title}</p>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
          <span className="text-[11px] text-slate-400">{limitLabel}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[240px]">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = yMax * (1 - fraction);
            const y = padding.top + chartHeight * fraction;
            return (
              <g key={fraction}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(148, 163, 184, 0.24)" strokeWidth="1" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">{value.toFixed(0)}</text>
              </g>
            );
          })}

          <line x1={padding.left} y1={chartBottom} x2={width - padding.right} y2={chartBottom} stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.1" />
          <line x1={padding.left} y1={yFor(limit)} x2={width - padding.right} y2={yFor(limit)} stroke="#f43f5e" strokeDasharray="6 4" strokeWidth="1.3" />

          {orders.map((order, orderIndex) => {
            const groupLeft = padding.left + orderIndex * groupWidth + (groupWidth - (barWidth * series.length + barGap * (series.length - 1))) / 2;
            return (
              <g key={order}>
                {series.map((phase, phaseIndex) => {
                  const value = phase.values[orderIndex];
                  const y = yFor(value);
                  const h = chartBottom - y;
                  const x = groupLeft + phaseIndex * (barWidth + barGap);
                  return <rect key={`${phase.phase}-${order}`} x={x} y={y} width={barWidth} height={h} rx="3" fill={phase.color} opacity="0.95" />;
                })}
                <text x={padding.left + orderIndex * groupWidth + groupWidth / 2} y={height - 16} textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="600">
                  H{order}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
        <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-cyan-400"></span>L1</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-400"></span>L2</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-blue-400"></span>L3</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {renderOrderChart(
          'Voltage Harmonic Orders',
          `THDv Total: L1 ${data.THDv_L1.toFixed(2)}% | L2 ${data.THDv_L2.toFixed(2)}% | L3 ${data.THDv_L3.toFixed(2)}%`,
          voltageSeries,
          5,
          'Limit: THDv 5%'
        )}
        {renderOrderChart(
          'Current Harmonic Orders',
          `THDi Total: L1 ${data.THDi_L1.toFixed(2)}% | L2 ${data.THDi_L2.toFixed(2)}% | L3 ${data.THDi_L3.toFixed(2)}%`,
          currentSeries,
          20,
          'Limit: THDi 20%'
        )}
      </div>

      <p className="text-[11px] text-gray-500">
        หมายเหตุ: กราฟลำดับ H3-H13 กระจายจากค่า THD รวมของแต่ละเฟส เพื่อใช้เปรียบเทียบแนวโน้มระหว่าง L1-L2-L3
      </p>
    </div>
  );
}

export default HarmonicChart;
