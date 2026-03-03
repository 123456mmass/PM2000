import React from 'react';

interface PhasorDiagramProps {
    data: {
        P_L1: number;
        P_L2: number;
        P_L3: number;
        Q_L1: number;
        Q_L2: number;
        Q_L3: number;
        S_L1: number;
        S_L2: number;
        S_L3: number;
    };
}

export function PhasorDiagram({ data }: PhasorDiagramProps) {
    // SVG center and radius
    const cx = 150;
    const cy = 150;
    const maxRadius = 120; // Maximum length of vector

    // Ensure robust scaling
    const maxApparentPower = Math.max(
        Math.abs(data.S_L1) || 1,
        Math.abs(data.S_L2) || 1,
        Math.abs(data.S_L3) || 1
    );

    const scale = (value: number) => (value / maxApparentPower) * maxRadius;

    // Function to calculate vector components (x, y) given magnitude and phase angle (degrees)
    // Mathematical convention: 0 is Right, + is counter-clockwise.
    // In SVG, Y increases downwards, so we negate the Y component.
    const getCoordinates = (magnitude: number, phaseAngle: number) => {
        const angleRad = (phaseAngle * Math.PI) / 180;
        const r = scale(magnitude);
        // Negate Y because SVG coordinates go down
        const x = cx + r * Math.cos(angleRad);
        const y = cy - r * Math.sin(angleRad);
        return { x, y };
    };

    /**
     * Phase definitions:
     * L1 is reference (0 degrees)
     * L2 is lagging L1 by 120 degrees (-120 degrees)
     * L3 is leading L1 by 120 degrees (+120 degrees)
     * 
     * Active Power (P) is on the reference axis for each phase.
     * Reactive Power (Q) is 90 degrees out of phase.
     * Power Factor angle (Theta) = arccos(P/S)
     */

    const drawPhase = (phaseId: 'L1' | 'L2' | 'L3', baseAngle: number, color: string) => {
        // Determine the raw angle deviation from the PF
        const p = data[`P_${phaseId}`] || 0;
        const s = data[`S_${phaseId}`] || 1; // Prevent division by zero
        const q = data[`Q_${phaseId}`] || 0;

        // Calculate Power Factor and corresponding phase angle deviation
        // Add small protection against floating point > 1 or < -1
        let pf = p / s;
        if (pf > 1) pf = 1;
        if (pf < -1) pf = -1;

        // Angle in degrees. If Q is positive (inductive), current lags voltage (angle is negative).
        // If Q is negative (capacitive), current leads voltage (angle is positive).
        const thetaRad = Math.acos(pf);
        let thetaDeg = (thetaRad * 180) / Math.PI;

        // Assign sign based on Reactive Power Q
        if (q > 0) thetaDeg = -thetaDeg; // Inductive -> Lagging

        const finalAngle = baseAngle + thetaDeg;

        // We plot Apparent Power (S) as the main vector showing the actual phase angle
        const { x: endX, y: endY } = getCoordinates(s, finalAngle);

        return (
            <g key={phaseId}>
                {/* Main Vector (Apparent Power S) */}
                <line x1={cx} y1={cy} x2={endX} y2={endY} stroke={color} strokeWidth="3" markerEnd={`url(#arrow-${phaseId})`} />

                {/* Active Power (P) Projection */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={getCoordinates(p, baseAngle).x}
                    y2={getCoordinates(p, baseAngle).y}
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                />

                {/* Text Label */}
                <text
                    x={endX + (endX > cx ? 10 : -30)}
                    y={endY + (endY > cy ? 15 : -10)}
                    fill={color}
                    fontSize="12"
                    fontWeight="bold"
                >
                    {phaseId} ({thetaDeg.toFixed(1)}°)
                </text>
            </g>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <svg width="300" height="300" viewBox="0 0 300 300" className="bg-gray-800 rounded-full border border-gray-700 shadow-inner">
                <defs>
                    <marker id="arrow-L1" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                    </marker>
                    <marker id="arrow-L2" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#eab308" />
                    </marker>
                    <marker id="arrow-L3" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                    </marker>
                </defs>

                {/* Reference Axes */}
                <line x1={0} y1={cy} x2={300} y2={cy} stroke="#374151" strokeWidth="1" strokeDasharray="5 5" />
                <line x1={cx} y1={0} x2={cx} y2={300} stroke="#374151" strokeWidth="1" strokeDasharray="5 5" />

                <circle cx={cx} cy={cy} r={maxRadius} fill="none" stroke="#4b5563" strokeWidth="1" opacity="0.3" />
                <circle cx={cx} cy={cy} r={maxRadius * 0.5} fill="none" stroke="#4b5563" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />

                {/* Phase Vectors */}
                {drawPhase('L1', 0, '#ef4444')}     {/* Red, 0 deg */}
                {drawPhase('L2', -120, '#eab308')}  {/* Yellow, -120 deg */}
                {drawPhase('L3', 120, '#3b82f6')}   {/* Blue, +120 deg */}

                {/* Center Dot */}
                <circle cx={cx} cy={cy} r="4" fill="#ffffff" />
            </svg>
            <div className="mt-4 flex gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> L1 (0°)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> L2 (-120°)</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> L3 (+120°)</div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
                *เวกเตอร์หลักแสดง Apparent Power (S) ประกอบรวมเข้ากับมุมเฟส (θ) ที่บิดเบี้ยวจาก Active Power (P) สืบเนื่องจากค่า Reactive Power (Q)
            </p>
        </div>
    );
}
