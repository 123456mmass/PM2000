'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CustomTooltip } from '../common/CustomTooltip';

interface Page1Data {
  timestamp: string;
  V_LN1: number;
  V_LN2: number;
  V_LN3: number;
  V_LN_avg: number;
  I_L1: number;
  I_L2: number;
  I_L3: number;
  Freq: number;
  status: string;
}

interface Page2Data {
  timestamp: string;
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
  kWh_Total: number;
  kVAh_Total: number;
  kvarh_Total: number;
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

type HealthLevel = 'good' | 'watch' | 'critical';

interface CategoryInsight {
  key: string;
  label: string;
  score: number;
  level: HealthLevel;
  description: string;
}

const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function evaluateRange(value: number, goodMin: number, goodMax: number, watchMin: number, watchMax: number): HealthLevel {
  if (value >= goodMin && value <= goodMax) return 'good';
  if (value >= watchMin && value <= watchMax) return 'watch';
  return 'critical';
}

function evaluateUpper(value: number, goodMax: number, watchMax: number): HealthLevel {
  if (value <= goodMax) return 'good';
  if (value <= watchMax) return 'watch';
  return 'critical';
}

function evaluateLower(value: number, goodMin: number, watchMin: number): HealthLevel {
  if (value >= goodMin) return 'good';
  if (value >= watchMin) return 'watch';
  return 'critical';
}

function levelScore(level: HealthLevel): number {
  if (level === 'good') return 100;
  if (level === 'watch') return 65;
  return 30;
}

function levelText(level: HealthLevel): string {
  if (level === 'good') return 'ดี';
  if (level === 'watch') return 'เฝ้าระวัง';
  return 'วิกฤต';
}

function levelClass(level: HealthLevel): string {
  if (level === 'good') return 'text-emerald-600 bg-emerald-100';
  if (level === 'watch') return 'text-amber-700 bg-amber-100';
  return 'text-rose-700 bg-rose-100';
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance = avg(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function buildChartPath(values: number[], width: number, height: number, padding = 14) {
  if (!values.length) {
    return { linePath: '', areaPath: '', min: 0, max: 0, last: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * usableWidth;
    const y = height - padding - ((value - min) / range) * usableHeight;
    return { x, y };
  });

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${padding + usableWidth} ${height - padding} L ${padding} ${height - padding} Z`;

  return { linePath, areaPath, min, max, last: values[values.length - 1] };
}

function scoreToLevel(score: number): HealthLevel {
  if (score >= 85) return 'good';
  if (score >= 65) return 'watch';
  return 'critical';
}

function levelTextColor(level: HealthLevel): string {
  if (level === 'good') return 'text-emerald-700';
  if (level === 'watch') return 'text-amber-700';
  return 'text-rose-700';
}

function scoreFill(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 65) return 'bg-amber-500';
  return 'bg-rose-500';
}

function formatValue(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '-';
  return value.toFixed(digits);
}

function ReportKpiCard({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{hint}</p>
    </div>
  );
}

function TrendChart({
  history,
  field,
  stroke,
  fill,
  unit,
}: {
  history: HistoryPoint[];
  field: keyof HistoryPoint;
  stroke: string;
  fill: string;
  unit: string;
}) {
  const values = history.map((item) => Number(item[field])).filter((value) => Number.isFinite(value));

  if (values.length < 2) {
    return <div className="h-[180px] grid place-items-center text-sm text-slate-500">กำลังรอข้อมูล trend เพิ่มเติม...</div>;
  }

  const width = 520;
  const height = 180;
  const { linePath, areaPath, min, max, last } = buildChartPath(values, width, height);

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[180px]">
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={12}
            y1={height * fraction}
            x2={width - 12}
            y2={height * fraction}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill={fill} opacity="0.18" />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Min: {formatValue(min, 3)} {unit}</span>
        <span className="font-semibold text-slate-700">Current: {formatValue(last, 3)} {unit}</span>
        <span>Max: {formatValue(max, 3)} {unit}</span>
      </div>
    </div>
  );
}

function CategoryScorePanel({ categories }: { categories: CategoryInsight[] }) {
  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{category.label}</span>
            <span className={`font-bold ${levelTextColor(category.level)}`}>{category.score}/100</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full rounded-full ${scoreFill(category.score)}`} style={{ width: `${clamp(category.score, 0, 100)}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{category.description}</p>
        </div>
      ))}
    </div>
  );
}

function PhaseBalanceChart({ voltages, currents }: { voltages: number[]; currents: number[] }) {
  const maxVoltage = Math.max(...voltages, 1);
  const maxCurrent = Math.max(...currents, 1);
  const phases = ['L1', 'L2', 'L3'];

  return (
    <div className="space-y-3">
      {phases.map((phase, index) => (
        <div key={phase}>
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold">{phase}</span>
            <span>{formatValue(voltages[index], 1)} V | {formatValue(currents[index], 2)} A</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(voltages[index] / maxVoltage) * 100}%` }} />
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(currents[index] / maxCurrent) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span>Voltage</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Current</span>
      </div>
    </div>
  );
}

function PowerQualityBars({
  values,
}: {
  values: Array<{ label: string; value: number; good: number; watch: number; unit: string }>;
}) {
  return (
    <div className="space-y-3">
      {values.map((item) => {
        const level = evaluateUpper(item.value, item.good, item.watch);
        const scaleMax = item.watch * 1.6 || 1;
        const width = clamp((item.value / scaleMax) * 100, 0, 100);

        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className={`font-semibold ${levelTextColor(level)}`}>
                {formatValue(item.value)} {item.unit}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full rounded-full ${scoreFill(levelScore(level))}`} style={{ width: `${width}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>ดี ≤ {item.good}{item.unit}</span>
              <span>เฝ้าระวัง ≤ {item.watch}{item.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OnePageReport({
  data1,
  data2,
  data3,
  data4,
  history,
  onExportPdf,
  isExportingPdf,
}: {
  data1: Page1Data;
  data2: Page2Data;
  data3: Page3Data;
  data4: Page4Data;
  history: HistoryPoint[];
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}) {
  const voltageAvg = data1.V_LN_avg || avg([data1.V_LN1, data1.V_LN2, data1.V_LN3]);
  const currents = [data1.I_L1, data1.I_L2, data1.I_L3];
  const currentMean = avg(currents);
  const currentUnbalance = currentMean > 0 ? ((Math.max(...currents) - Math.min(...currents)) / currentMean) * 100 : 0;
  const thdvAvg = avg([data3.THDv_L1, data3.THDv_L2, data3.THDv_L3]);
  const thdiAvg = avg([data3.THDi_L1, data3.THDi_L2, data3.THDi_L3]);
  const absPf = Math.abs(data3.PF_Total);
  const activeShare = Math.abs(data2.P_Total) / (Math.abs(data2.S_Total) || 1);
  const energyPf = data4.kWh_Total / (data4.kVAh_Total || 1);
  const reactiveRatio = data4.kvarh_Total / (data4.kWh_Total || 1);

  const powerSeries = history.map((point) => Math.abs(point.powerTotal)).filter((value) => value > 0);
  const volatility = powerSeries.length > 8 ? (standardDeviation(powerSeries) / (avg(powerSeries) || 1)) * 100 : 0;

  const voltageScore = Math.round(
    avg([
      levelScore(evaluateRange(voltageAvg, 218, 242, 207, 253)),
      levelScore(evaluateRange(data1.Freq, 49.8, 50.2, 49.5, 50.5)),
      levelScore(evaluateUpper(data3.V_unb, 2, 5)),
    ])
  );

  const loadScore = Math.round(
    avg([
      levelScore(evaluateUpper(currentUnbalance, 10, 20)),
      levelScore(evaluateLower(absPf, 0.9, 0.8)),
      levelScore(evaluateLower(activeShare, 0.85, 0.7)),
    ])
  );

  const qualityScore = Math.round(
    avg([
      levelScore(evaluateUpper(thdvAvg, 5, 8)),
      levelScore(evaluateUpper(thdiAvg, 20, 30)),
      levelScore(evaluateUpper(data3.I_unb, 10, 20)),
    ])
  );

  const volatilityLevel = powerSeries.length > 8 ? evaluateUpper(volatility, 15, 30) : 'watch';
  const energyScore = Math.round(
    avg([
      levelScore(evaluateLower(energyPf, 0.9, 0.8)),
      levelScore(evaluateUpper(reactiveRatio, 0.3, 0.6)),
      levelScore(volatilityLevel),
    ])
  );

  const categories: CategoryInsight[] = [
    {
      key: 'voltage',
      label: 'เสถียรภาพแรงดัน',
      score: voltageScore,
      level: scoreToLevel(voltageScore),
      description: `Vavg ${formatValue(voltageAvg, 1)}V, Freq ${formatValue(data1.Freq, 2)}Hz, V_unb ${formatValue(data3.V_unb)}%`,
    },
    {
      key: 'load',
      label: 'สมดุลโหลด',
      score: loadScore,
      level: scoreToLevel(loadScore),
      description: `PF ${formatValue(absPf, 3)}, Current Unbalance ${formatValue(currentUnbalance)}%, P/S ${formatValue(activeShare, 3)}`,
    },
    {
      key: 'quality',
      label: 'คุณภาพไฟฟ้า',
      score: qualityScore,
      level: scoreToLevel(qualityScore),
      description: `THDv ${formatValue(thdvAvg)}%, THDi ${formatValue(thdiAvg)}%, I_unb ${formatValue(data3.I_unb)}%`,
    },
    {
      key: 'energy',
      label: 'ประสิทธิภาพพลังงาน',
      score: energyScore,
      level: scoreToLevel(energyScore),
      description: `kWh/kVAh ${formatValue(energyPf, 3)}, kvarh/kWh ${formatValue(reactiveRatio, 3)}, Volatility ${formatValue(volatility)}%`,
    },
  ];

  const weights = [0.3, 0.25, 0.25, 0.2];
  const overallScore = Math.round(categories.reduce((total, category, index) => total + category.score * weights[index], 0));
  const overallLevel = scoreToLevel(overallScore);

  const alerts: string[] = [];
  if (Math.abs(data3.PF_Total) < 0.9) alerts.push(`Power Factor ต่ำ (${formatValue(data3.PF_Total, 3)})`);
  if (thdvAvg > 5) alerts.push(`THDv เฉลี่ยสูง (${formatValue(thdvAvg)}%)`);
  if (thdiAvg > 20) alerts.push(`THDi เฉลี่ยสูง (${formatValue(thdiAvg)}%)`);
  if (data3.V_unb > 2) alerts.push(`Voltage Unbalance สูง (${formatValue(data3.V_unb)}%)`);
  if (data3.I_unb > 10) alerts.push(`Current Unbalance สูง (${formatValue(data3.I_unb)}%)`);
  if (alerts.length === 0) alerts.push('ไม่พบค่าที่เกินเกณฑ์หลักในรอบการวัดล่าสุด');

  const highestCurrent = currents
    .map((value, index) => ({ phase: `L${index + 1}`, value }))
    .sort((a, b) => b.value - a.value)[0];

  const insights = [
    `โหลดสูงสุดอยู่ที่ ${highestCurrent.phase} = ${formatValue(highestCurrent.value, 2)} A ขณะที่ค่าเฉลี่ยอยู่ที่ ${formatValue(currentMean, 2)} A`,
    `กำลังรวมปัจจุบัน ${formatValue(data2.P_Total, 3)} kW เทียบกับกำลังปรากฏ ${formatValue(data2.S_Total, 3)} kVA ให้ค่า P/S = ${formatValue(activeShare, 3)}`,
    `ประสิทธิภาพพลังงาน kWh/kVAh = ${formatValue(energyPf, 3)} และ Reactive Ratio = ${formatValue(reactiveRatio, 3)}`,
  ];

  const recommendations: string[] = [];
  if (Math.abs(data3.PF_Total) < 0.9) recommendations.push('พิจารณาปรับปรุงระบบชดเชยกำลังรีแอคทีฟเพื่อลดค่า PF ต่ำ');
  if (thdvAvg > 5 || thdiAvg > 20) recommendations.push('ตรวจสอบโหลดไม่เชิงเส้นและพิจารณาใช้ Harmonic Filter');
  if (data3.V_unb > 2 || data3.I_unb > 10) recommendations.push('ปรับสมดุลการกระจายโหลดระหว่างเฟส L1-L2-L3');
  if (recommendations.length < 3) recommendations.push('บันทึก trend ต่อเนื่องอย่างน้อย 24 ชั่วโมงเพื่อยืนยันรูปแบบโหลดจริง');
  if (recommendations.length < 3) recommendations.push('วางแผนตั้งค่า Alert Threshold อัตโนมัติตามค่าเฉลี่ยจริงของระบบ');

  const reportTime = new Date(data1.timestamp).toLocaleString('th-TH');

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-300">
          Template รายงานสรุป 1 หน้า (A4) จากข้อมูล Real-time ล่าสุด + trend {history.length} จุด
        </p>
        <button
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium transition flex items-center gap-2"
        >
          {isExportingPdf ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> สร้าง PDF...</>
          ) : (
            <>📄 PM2230 - One Page Performance Report</>
          )}
        </button>
      </div>

      <section className="a4-report max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-xl p-5 md:p-8 space-y-5">
        <header className="border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">PM2230 - One Page Performance Report</h2>
              <p className="text-sm text-slate-600 mt-1">สรุปวิเคราะห์สถานะระบบไฟฟ้าแบบจัดหมวดหมู่</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Timestamp</p>
              <p className="font-mono text-sm text-slate-900">{reportTime}</p>
              <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${levelClass(overallLevel)}`}>
                ภาพรวม: {levelText(overallLevel)} ({overallScore}/100)
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ReportKpiCard label="System Health Score" value={`${overallScore}/100`} hint="รวมทุกหมวด" valueClass={levelTextColor(overallLevel)} />
          <ReportKpiCard label="Total Active Power" value={`${formatValue(data2.P_Total, 3)} kW`} hint="โหลดปัจจุบัน" valueClass="text-sky-700" />
          <ReportKpiCard label="Power Factor Total" value={formatValue(data3.PF_Total, 3)} hint="ค่าควรใกล้ 1.00" valueClass={Math.abs(data3.PF_Total) >= 0.9 ? 'text-emerald-700' : 'text-amber-700'} />
          <ReportKpiCard label="Priority Alerts" value={`${alerts.length}`} hint="รายการต้องติดตาม" valueClass={alerts[0]?.includes('ไม่พบ') ? 'text-emerald-700' : 'text-rose-700'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">กราฟแนวโน้มกำลังไฟฟ้า (kW)</h3>
            <TrendChart history={history} field="powerTotal" stroke="#0284c7" fill="#7dd3fc" unit="kW" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">หมวดหมู่คะแนน</h3>
            <CategoryScorePanel categories={categories} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">เปรียบเทียบ 3 เฟส</h3>
            <PhaseBalanceChart
              voltages={[data1.V_LN1, data1.V_LN2, data1.V_LN3]}
              currents={[data1.I_L1, data1.I_L2, data1.I_L3]}
            />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">กราฟคุณภาพไฟฟ้า</h3>
            <PowerQualityBars
              values={[
                { label: 'THDv Avg', value: thdvAvg, good: 5, watch: 8, unit: '%' },
                { label: 'THDi Avg', value: thdiAvg, good: 20, watch: 30, unit: '%' },
                { label: 'V_unb', value: data3.V_unb, good: 2, watch: 5, unit: '%' },
                { label: 'I_unb', value: data3.I_unb, good: 10, watch: 20, unit: '%' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">คำอธิบายเชิงวิเคราะห์</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {insights.map((item) => (
                <li key={item} className="leading-relaxed">• {item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">ข้อเสนอแนะ & แจ้งเตือน</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recommendations</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {recommendations.slice(0, 3).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Alerts</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {alerts.slice(0, 4).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OnePageReport;
