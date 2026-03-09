'use client';

import React from 'react';

interface VoltageRowProps {
  label: string;
  value: number;
  unit: string;
}

export function VoltageRow({ label, value, unit }: VoltageRowProps) {
  const isLL = label.includes('LL');
  const isNormal = isLL ? (value >= 360 && value <= 440 || value === 0) : (value >= 207 && value <= 253 || value === 0);
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      <span className={`text-lg font-bold ${isNormal ? 'text-green-400' : 'text-red-400'}`}>
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}

interface CurrentRowProps {
  label: string;
  value: number;
  unit: string;
}

export function CurrentRow({ label, value, unit }: CurrentRowProps) {
  const isNormal = value >= 0 && value <= 6;
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      <span className={`text-lg font-bold ${isNormal ? 'text-green-400' : 'text-red-400'}`}>
        {value.toFixed(2)} {unit}
      </span>
    </div>
  );
}

interface PowerRowProps {
  label: string;
  value: number;
  unit: string;
  bold?: boolean;
}

export function PowerRow({ label, value, unit, bold = false }: PowerRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      <span className={`font-bold ${bold ? 'text-blue-400 text-xl' : 'text-white'}`}>
        {value.toFixed(3)} {unit}
      </span>
    </div>
  );
}

interface THDRowProps {
  label: string;
  value: number;
}

export function THDRow({ label, value }: THDRowProps) {
  let color = 'text-green-400';
  if (value > 8) color = 'text-red-400';
  else if (value > 5) color = 'text-yellow-400';

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      <span className={`text-lg font-bold ${color}`}>
        {value.toFixed(2)} %
      </span>
    </div>
  );
}

interface UnbalanceRowProps {
  label: string;
  value: number;
}

export function UnbalanceRow({ label, value }: UnbalanceRowProps) {
  const isVoltage = label.includes('unb') && (label.includes('V') || label.includes('U'));
  let color = 'text-green-400';

  if (isVoltage) {
    if (value > 5) color = 'text-red-400';
    else if (value > 2) color = 'text-yellow-400';
  } else {
    if (value > 20) color = 'text-red-400';
    else if (value > 10) color = 'text-yellow-400';
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      <span className={`text-lg font-bold ${color}`}>
        {value.toFixed(2)} %
      </span>
    </div>
  );
}

interface PFRowProps {
  label: string;
  value: number;
  qValue?: number;
  pfType?: string; // 'Lead' | 'Lag' from backend
}

export function PFRow({ label, value, qValue, pfType }: PFRowProps) {
  let color = 'text-green-400';
  const absPf = Math.abs(value);

  if (value !== 0) {
    if (absPf < 0.8) color = 'text-red-400';
    else if (absPf < 0.9) color = 'text-yellow-400';
  }

  // Use pfType from backend (4-quadrant decode) if available,
  // otherwise fallback to Q sign inference
  let displayType: 'LAGGING' | 'LEADING' | null = null;
  if (pfType && value !== 0) {
    displayType = pfType === 'Lead' ? 'LEADING' : 'LAGGING';
  } else if (qValue !== undefined && value !== 0) {
    displayType = qValue >= 0 ? 'LAGGING' : 'LEADING';
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      <span className="flex items-center gap-2">
        {displayType && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${displayType === 'LAGGING'
              ? 'bg-orange-900/50 text-orange-400 border border-orange-600/40'
              : 'bg-cyan-900/50 text-cyan-400 border border-cyan-600/40'
              }`}
          >
            {displayType}
          </span>
        )}
        <span className={`text-xl font-bold ${color}`}>
          {value.toFixed(3)}
        </span>
      </span>
    </div>
  );
}

interface EnergyStatProps {
  label: string;
  value: number;
  unit: string;
}

export function EnergyStat({ label, value, unit }: EnergyStatProps) {
  return (
    <div className="bg-gray-700 rounded-lg p-4 text-center">
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      <p className="text-white font-bold text-lg">{value.toFixed(3)} {unit}</p>
    </div>
  );
}
