import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';

interface OscilloscopeChartProps {
    l1: number; // RMS
    l2: number; // RMS
    l3: number; // RMS
    freq: number;
    unit: string;
}

export function OscilloscopeChart({ l1, l2, l3, freq, unit }: OscilloscopeChartProps) {
    const data = useMemo(() => {
        // Derive phase offset purely from the current timestamp, eliminating the need 
        // for state/refs and avoiding React strict-mode lint errors or extra re-renders.
        // 360 degrees per 3600ms = 1 degree per 10ms. (Roughly 30 degrees every 300ms poll)
        // eslint-disable-next-line
        const phaseOffset = Math.floor(Date.now() / 10) % 360;
        const points = [];
        const pointsCount = 60; // Lower resolution for better generic chart performance
        const cycles = 2; // Show 2 periods

        // Fallback frequency to 50 if 0 to avoid Infinity
        const f = freq > 0 ? freq : 50;
        const periodLength = 1 / f; // Seconds per cycle, usually 0.02s (20ms)

        // Vpeak = Vrms * sqrt(2)
        const p1 = l1 * Math.SQRT2;
        const p2 = l2 * Math.SQRT2;
        const p3 = l3 * Math.SQRT2;

        const omega = 2 * Math.PI * f; // Angular frequency

        for (let i = 0; i <= pointsCount; i++) {
            // Time ranges from 0 to (2 * 0.02) = 0.04s
            const t = (i / pointsCount) * (cycles * periodLength);

            // Convert animated phaseOffset from degrees to radians
            const offsetRad = (phaseOffset * Math.PI) / 180;

            // L1 is reference (0 degree)
            const rad1 = omega * t + offsetRad;
            // L2 lags L1 by 120 degrees (-2PI/3)
            const rad2 = omega * t - (2 * Math.PI / 3) + offsetRad;
            // L3 leads L1 by 120 degrees (+2PI/3)
            const rad3 = omega * t + (2 * Math.PI / 3) + offsetRad;

            points.push({
                timeMs: (t * 1000).toFixed(1), // X-axis label
                L1: p1 * Math.sin(rad1),
                L2: p2 * Math.sin(rad2),
                L3: p3 * Math.sin(rad3),
            });
        }

        return points;
    }, [l1, l2, l3, freq]);

    // Determine domain dynamically based on max peak
    const maxAbs = Math.max(l1, l2, l3) * Math.SQRT2;
    const padding = maxAbs * 0.1;
    const domainMax = Math.ceil(maxAbs + padding);
    const domainMin = -domainMax;

    return (
        <div className="h-64 w-full relative bg-gray-900 border border-gray-700/50 rounded-lg overflow-hidden flex flex-col items-center justify-center p-2 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    {/* Oscilloscope Grid - Classic Green */}
                    <CartesianGrid strokeDasharray="3 3" stroke="#166534" opacity={0.5} />

                    <XAxis
                        dataKey="timeMs"
                        stroke="#22c55e"
                        tick={{ fontSize: 10, fill: '#22c55e' }}
                        axisLine={{ stroke: '#15803d' }}
                        tickFormatter={(val) => `${val}ms`}
                        minTickGap={20}
                    />
                    <YAxis
                        stroke="#22c55e"
                        tick={{ fontSize: 10, fill: '#22c55e' }}
                        axisLine={{ stroke: '#15803d' }}
                        domain={[domainMin, domainMax]}
                        tickFormatter={(val) => Math.round(val).toString()}
                        width={45}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid #22c55e', borderRadius: '6px', color: '#22c55e', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ color: '#22c55e', fontWeight: 500 }}
                        labelStyle={{ color: '#22c55e', marginBottom: '6px', fontWeight: 'bold' }}
                        formatter={(value: number | string | undefined, name: string | undefined) => [`${Number(value || 0).toFixed(1)} ${unit}`, name || ""]}
                        animationDuration={150}
                    />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="line"
                        wrapperStyle={{ color: '#e5e7eb', fontSize: '12px', fontWeight: 'bold' }}
                    />

                    <ReferenceLine y={0} stroke="#22c55e" strokeOpacity={0.7} />

                    {/* Smooth curves for actual Sine Wave drawing */}
                    <Line type="monotone" dataKey="L1" stroke="#ef4444" strokeWidth={2.5} dot={false} isAnimationActive={false} style={{ filter: 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.8))' }} />
                    <Line type="monotone" dataKey="L2" stroke="#eab308" strokeWidth={2.5} dot={false} isAnimationActive={false} style={{ filter: 'drop-shadow(0 0 2px rgba(234, 179, 8, 0.8))' }} />
                    <Line type="monotone" dataKey="L3" stroke="#3b82f6" strokeWidth={2.5} dot={false} isAnimationActive={false} style={{ filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.8))' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
