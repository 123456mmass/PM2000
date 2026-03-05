from typing import List, Dict, Optional
import math

def calculate_unbalance(v1: float, v2: float, v3: float) -> float:
    """Calculate percentage unbalance using ANSI/NEMA standard."""
    avg = (v1 + v2 + v3) / 3.0
    if avg == 0:
        return 0.0
    max_dev = max(abs(v1 - avg), abs(v2 - avg), abs(v3 - avg))
    return (max_dev / avg) * 100.0

def diagnose_faults(data: Dict) -> Dict:
    """
    Advanced Fault Diagnostic Engine.
    Analyzes multiple parameters to identify specific electrical patterns.
    """
    alerts = []
    
    # 1. Capture basic values
    v1 = float(data.get("V_LN1", 0) or 0)
    v2 = float(data.get("V_LN2", 0) or 0)
    v3 = float(data.get("V_LN3", 0) or 0)
    v_avg = float(data.get("V_LN_avg", 0) or 0)
    
    i1 = float(data.get("I1") or data.get("I_L1", 0) or 0)
    i2 = float(data.get("I2") or data.get("I_L2", 0) or 0)
    i3 = float(data.get("I3") or data.get("I_L3", 0) or 0)
    i_avg = float(data.get("I_avg", 0) or 0)
    
    freq = float(data.get("Freq", 0) or 0)
    pf = abs(float(data.get("PF_Total", 0) or 0))
    
    # 2. Phase Loss Detection (Critical)
    phases_v = [v1, v2, v3]
    missing_phases = [i + 1 for i, v in enumerate(phases_v) if v < 50 and v_avg > 100]
    
    if missing_phases:
        phase_str = ", ".join([f"L{p}" for p in missing_phases])
        alerts.append({
            "category": "phase_loss",
            "severity": "critical",
            "message": f"Phase Loss Detected: {phase_str} disconnected",
            "detail": "Possible fuse blown or primary side failure."
        })
    
    # 3. Voltage Unbalance (ANSI)
    if v_avg > 100:
        v_unb = calculate_unbalance(v1, v2, v3)
        if v_unb > 5.0:  # Standards usually suggest < 3-5%
            alerts.append({
                "category": "unbalance",
                "severity": "high",
                "message": f"Critical Voltage Unbalance: {v_unb:.1f}%",
                "detail": "High risk of motor overheating/failure."
            })
    
    # 4. Overvoltage / Overload / Sag (Logic Correlation)
    if v_avg > 250: # Standard is typically 230V + 10% = 253V
        alerts.append({
            "category": "voltage_swell",
            "severity": "high",
            "message": f"Voltage Swell: {v_avg:.1f}V",
            "detail": "High supply voltage may damage sensitive equipment."
        })
    elif 0 < v_avg < 190:
        if i_avg > 45: # Assuming 50A is a critical threshold
            alerts.append({
                "category": "overload",
                "severity": "high",
                "message": f"System Overload Detected: {i_avg:.1f}A",
                "detail": "Voltage dropping due to excessive current draw."
            })
        else:
            alerts.append({
                "category": "voltage_sag",
                "severity": "high",
                "message": f"Voltage Sag: {v_avg:.1f}V",
                "detail": "Supply side voltage drop detected."
            })
    
    # 5. Harmonics (THD)
    thd_v1 = float(data.get("THDv_L1", 0) or 0)
    thd_v2 = float(data.get("THDv_L2", 0) or 0)
    thd_v3 = float(data.get("THDv_L3", 0) or 0)
    max_thd = max(thd_v1, thd_v2, thd_v3)
    
    if max_thd > 8.0: # Standard is typically < 5%
        alerts.append({
            "category": "harmonics",
            "severity": "medium",
            "message": f"High Harmonics Distortion: {max_thd:.1f}%",
            "detail": "May cause electronic equipment malfunction."
        })
    
    # 6. Basic Limits (Fallback/Simple checks)
    if freq > 0 and (freq < 49.0 or freq > 51.0):
        alerts.append({
            "category": "frequency",
            "severity": "high",
            "message": f"Frequency Anomaly: {freq:.2f} Hz",
            "detail": "Grid instability detected."
        })
    
    # 7. Short Circuit Detection
    if i_avg > 100: # Assuming 100A is a critical threshold for short circuit
        alerts.append({
            "category": "short_circuit",
            "severity": "critical",
            "message": f"Short Circuit Detected: {i_avg:.1f}A",
            "detail": "Immediate action required to prevent damage."
        })
    
    # 8. Ground Fault Detection
    i_n = float(data.get("I_N", 0) or 0)
    if i_n > 5: # Assuming 5A is a critical threshold for ground fault
        alerts.append({
            "category": "ground_fault",
            "severity": "critical",
            "message": f"Ground Fault Detected: {i_n:.1f}A",
            "detail": "Immediate action required to prevent damage."
        })
    
    return {
        "count": len(alerts),
        "status": "ALERT" if alerts else "OK",
        "alerts": alerts,
        "timestamp": data.get("timestamp")
    }