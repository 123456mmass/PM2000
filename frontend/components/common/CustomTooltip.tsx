'use client';

import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: number | string;
  }>;
  label?: string | number;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    let timeStr = "";
    if (label) {
      try {
        timeStr = new Date(label as string).toLocaleTimeString('th-TH');
      } catch (e) {
        timeStr = String(label);
      }
    }
    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl">
        {timeStr && <p className="text-gray-300 text-xs mb-2 whitespace-nowrap">{timeStr}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center gap-4 text-sm font-medium">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-white">{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default CustomTooltip;
