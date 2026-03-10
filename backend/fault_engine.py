from typing import List, Dict, Optional
import math

# ============================================================================
# มาตรฐานอ้างอิง (Thai Electrical Standards) - ฉบับปรับปรุง (MEA/PEA/วสท./IEEE 519)
# ============================================================================
# กฟน. (MEA) : ระบบ 230V จ่ายไฟปกติ 214V - 237V, จ่ายไฟฉุกเฉิน 209V - 250V
# กฟภ. (PEA) : ระบบ 230V แรงดันตกไม่เกิน 5% (218.5V), ควบคุมปลายสายไม่ต่ำกว่า 200V
# ความถี่     : 50Hz ±1% (49.5Hz – 50.5Hz)
# Power Factor: ต่ำกว่า 0.85 (lagging) มีค่าปรับ (กฟภ. 56.07 บาท/กิโลวาร์, กฟน. 14.02 บาท/กิโลวาร์)
# วสท./IEEE 519 : ค่าเพี้ยนฮาร์มอนิกแรงดัน THDv ≤ 5% (บางกรณี 8%), กระแส THDi ≤ 8-10%
# วสท.       : แรงดันไม่สมดุล ≤ 2% (เตือน), ≤ 5% (วิกฤต) / กระแสไม่สมดุล ≤ 5% (เตือน), ≤ 10% (วิกฤต)
# ============================================================================

# Hardcoded Thresholds (Fallback if not provided)
DEFAULT_THRESHOLDS = {
    "voltage_nominal": 230.0,
    "voltage_tolerance_pct": 10.0, # ~207V to 253V
    "v_sag_critical": 200,       
    "v_phase_loss": 50,          

    "freq_nominal": 50.0,
    "freq_tolerance": 1.0,
    "freq_critical_low": 49.0,
    "freq_critical_high": 51.0,

    "v_unb_warning": 2.0,        
    "v_unb_critical": 5.0,       

    "i_unb_warning": 5.0,        
    "i_unb_critical": 10.0,      
    "i_unb_min_load": 0.5,       

    "thdv_warning": 5.0,         
    "thdv_critical": 8.0,        
    "thdi_warning": 8.0,         
    "thdi_critical": 10.0,       

    "pf_warning": 0.85,
    "pf_critical": 0.70,
    "pf_min_load": 0.5,

    "i_overload_warning": 80,
    "i_overload_critical": 100,

    "i_neutral_warning": 3.0,
    "i_neutral_critical": 5.0,
}

def calculate_unbalance(v1: float, v2: float, v3: float) -> float:
    """Calculate percentage unbalance using ANSI/NEMA standard."""
    avg = (v1 + v2 + v3) / 3.0
    if avg == 0:
        return 0.0
    max_dev = max(abs(v1 - avg), abs(v2 - avg), abs(v3 - avg))
    return (max_dev / avg) * 100.0

def diagnose_faults(data: Dict, config: Dict = None) -> Dict:
    """
    Advanced Fault Diagnostic Engine
    อ้างอิงมาตรฐาน กฟน./กฟภ./วสท./IEEE 519
    """
    alerts = []
    T = DEFAULT_THRESHOLDS.copy()
    if config:
        # Merge provided config overrides
        for k, v in config.items():
            try:
                T[k] = float(v)
            except (ValueError, TypeError):
                pass
    
    # Calculate implicit thresholds from nominals
    v_nom = T.get("voltage_nominal", 230.0)
    v_tol = T.get("voltage_tolerance_pct", 10.0) / 100.0
    v_swell_warning = v_nom * (1.0 + v_tol)
    v_swell_critical = v_nom * 1.08  # Typically ~250V for 230V
    v_sag_warning = v_nom * (1.0 - v_tol)
    freq_nom = T.get("freq_nominal", 50.0)
    freq_tol = T.get("freq_tolerance", 1.0)
    
    # ── 1. ดึงค่าจากข้อมูล ────────────────────────────────────────────────
    v1 = float(data.get("V_LN1", 0) or 0)
    v2 = float(data.get("V_LN2", 0) or 0)
    v3 = float(data.get("V_LN3", 0) or 0)
    v_avg = float(data.get("V_LN_avg", 0) or 0)
    
    i1 = float(data.get("I1") or data.get("I_L1", 0) or 0)
    i2 = float(data.get("I2") or data.get("I_L2", 0) or 0)
    i3 = float(data.get("I3") or data.get("I_L3", 0) or 0)
    i_avg = float(data.get("I_avg", 0) or 0)
    i_n = float(data.get("I_N", 0) or 0)
    
    freq = float(data.get("Freq", 0) or 0)
    pf = abs(float(data.get("PF_Total", 0) or 0))
    
    thdv1 = float(data.get("THDv_L1", 0) or 0)
    thdv2 = float(data.get("THDv_L2", 0) or 0)
    thdv3 = float(data.get("THDv_L3", 0) or 0)
    thdi1 = float(data.get("THDi_L1", 0) or 0)
    thdi2 = float(data.get("THDi_L2", 0) or 0)
    thdi3 = float(data.get("THDi_L3", 0) or 0)
    
    v_unb = float(data.get("V_unb", 0) or 0)
    i_unb = float(data.get("I_unb", 0) or 0)
    
    # ── 2. Phase Loss (วิกฤตสูงสุด) ──────────────────────────────────────
    phases_v = [v1, v2, v3]
    missing_phases = [i + 1 for i, v in enumerate(phases_v) if v < T["v_phase_loss"] and v_avg > 100]
    
    if missing_phases:
        phase_str = ", ".join([f"L{p}" for p in missing_phases])
        alerts.append({
            "category": "phase_loss",
            "severity": "critical",
            "message": f"ตรวจพบเฟสหลุด: {phase_str} — แรงดันต่ำกว่า {T['v_phase_loss']}V",
            "detail": "สาเหตุ: ฟิวส์ขาด, สายหลุด, หรือหม้อแปลงชำรุด — ต้องตัดโหลดมอเตอร์ 3 เฟสทันที"
        })
    
    # ── 3. Voltage Sag / Swell (กฟน./กฟภ. 230V) ──────────────────────────
    if v_avg > 0 and not missing_phases:
        if v_avg > v_swell_critical:
            alerts.append({
                "category": "voltage_swell",
                "severity": "critical",
                "message": f"แรงดันไฟฟ้าสูงเกินวิกฤต {v_avg:.1f}V (เกิน {v_swell_critical:.1f}V เกณฑ์จ่ายไฟฉุกเฉินสูงสุด กฟน.)",
                "detail": "ตรวจสอบ AVR, แทปหม้อแปลง, หรือแจ้ง กฟน./กฟภ. ตรวจสอบระบบจ่ายไฟเพื่อป้องกันฉนวนทะลุ"
            })
        elif v_avg > v_swell_warning:
            alerts.append({
                "category": "voltage_swell",
                "severity": "high",
                "message": f"แรงดันไฟฟ้าเกินมาตรฐาน {v_avg:.1f}V (เกิน {v_swell_warning:.1f}V เกณฑ์จ่ายไฟปกติสูงสุด กฟน.)",
                "detail": "ตรวจสอบ AVR หรือปรับแทปหม้อแปลงลง อุปกรณ์อิเล็กทรอนิกส์เสี่ยงเสียหาย"
            })
        elif v_avg < T["v_sag_critical"]:
            alerts.append({
                "category": "voltage_sag",
                "severity": "critical",
                "message": f"ไฟตกรุนแรง {v_avg:.1f}V (ต่ำกว่า {T['v_sag_critical']}V เกณฑ์ต่ำสุด กฟภ.)",
                "detail": "มอเตอร์เสี่ยงไหม้ หรืออุปกรณ์รีเซ็ต — ตรวจสอบโหลดสายส่ง, กฟน./กฟภ."
            })
        elif v_avg < v_sag_warning:
            alerts.append({
                "category": "voltage_sag",
                "severity": "high",
                "message": f"แรงดันไฟฟ้าตก {v_avg:.1f}V (ต่ำกว่า {v_sag_warning:.1f}V เกณฑ์ -{T['voltage_tolerance_pct']}% กฟภ.)",
                "detail": "ตรวจสอบแทปหม้อแปลง, โหลดดึงกระแสเกิน, หรือติดตั้ง AVR"
            })

    # ── 4. Voltage Unbalance (วสท. ≤ 2%) ─────────────────────────────────
    if v_avg > 100:
        # ใช้ค่าจากมิเตอร์ หรือคำนวณเอง
        if v_unb == 0:
            v_unb = calculate_unbalance(v1, v2, v3)
        
        if v_unb > T["v_unb_critical"]:
            alerts.append({
                "category": "voltage_unbalance",
                "severity": "critical",
                "message": f"แรงดันไม่สมดุลวิกฤต {v_unb:.1f}% (เกิน {T['v_unb_critical']}% มาตรฐาน วสท.) มอเตอร์ 3 เฟสเสี่ยงไหม้",
                "detail": "ตรวจสอบการกระจายโหลด 1 เฟส, จุดต่อสาย/ขั้วหลวม, หรือฟิวส์เสีย"
            })
        elif v_unb > T["v_unb_warning"]:
            alerts.append({
                "category": "voltage_unbalance",
                "severity": "medium",
                "message": f"แรงดันไม่สมดุล {v_unb:.1f}% (เกิน {T['v_unb_warning']}% มาตรฐาน วสท.) มอเตอร์กินกระแสเกินปกติ",
                "detail": "ตรวจสอบการกระจายโหลด 1 เฟสให้สมดุลในทุกเฟส"
            })
    
    # ── 5. Current Unbalance (วสท./IEC ≤ 5%) ─────────────────────────────
    if i_avg > T["i_unb_min_load"]:
        # ใช้ค่าจากมิเตอร์ หรือคำนวณเอง
        if i_unb == 0:
            i_unb = calculate_unbalance(i1, i2, i3)
        
        if i_unb > T["i_unb_critical"]:
            alerts.append({
                "category": "current_unbalance",
                "severity": "critical",
                "message": f"กระแสไม่สมดุลวิกฤต {i_unb:.1f}% (เกิน {T['i_unb_critical']}% มาตรฐาน วสท.) มอเตอร์ร้อนจัด เสี่ยงเสียหาย",
                "detail": "ตรวจสอบโหลดแต่ละเฟส, ขั้วต่อสายหลวม, หรือขดลวดมอเตอร์ที่อาจเสียหาย"
            })
        elif i_unb > T["i_unb_warning"]:
            alerts.append({
                "category": "current_unbalance",
                "severity": "high",
                "message": f"กระแสไม่สมดุล {i_unb:.1f}% (เกิน {T['i_unb_warning']}% มาตรฐาน วสท./IEC) มอเตอร์สูญเสียประสิทธิภาพ",
                "detail": "ตรวจสอบการกระจายโหลดในแต่ละเฟส"
            })

    # ── 6. Harmonics THDv (วสท. อ้างอิง IEEE 519) ───────────────────────
    max_thdv = max(thdv1, thdv2, thdv3)
    if max_thdv > T["thdv_critical"]:
        alerts.append({
            "category": "harmonics_voltage",
            "severity": "critical",
            "message": f"ฮาร์มอนิกแรงดันสูงวิกฤต THDv {max_thdv:.1f}% (เกิน {T['thdv_critical']}% มาตรฐาน IEEE 519) หม้อแปลงเสี่ยงร้อนจัด",
            "detail": "ตรวจสอบ VSD/Inverter, UPS, อุปกรณ์ Non-linear — ต้องติดตั้ง Harmonic Filter"
        })
    elif max_thdv > T["thdv_warning"]:
        alerts.append({
            "category": "harmonics_voltage",
            "severity": "high",
            "message": f"ฮาร์มอนิกแรงดันเฉียดมาตรฐาน THDv {max_thdv:.1f}% (เกิน {T['thdv_warning']}% ทั่วไป)",
            "detail": "ตรวจสอบอุปกรณ์ที่สร้าง Harmonic เช่น VSD, Inverter, หลอดไฟ LED จำนวนมาก"
        })

    # ── 7. Harmonics THDi (วสท. / IEEE 519) ──────────────────────────────
    max_thdi = max(thdi1, thdi2, thdi3)
    if i_avg > T["i_unb_min_load"]:
        thdi_critical = T.get("thd_i_critical_pct", T.get("thdi_critical", 10.0))
        thdi_warning = T.get("thd_i_warning_pct", T.get("thdi_warning", 8.0))
        
        if max_thdi > thdi_critical:
            alerts.append({
                "category": "harmonics_current",
                "severity": "high",
                "message": f"ฮาร์มอนิกกระแสสูง THDi {max_thdi:.1f}% (เกิน {thdi_critical}%) Neutral รับกระแสเกิน",
                "detail": "ตรวจสอบขนาดสาย Neutral และพิจารณาติดตั้ง Active Harmonic Filter"
            })
        elif max_thdi > thdi_warning:
            alerts.append({
                "category": "harmonics_current",
                "severity": "medium",
                "message": f"ฮาร์มอนิกกระแสเริ่มสูง THDi {max_thdi:.1f}% (เกิน {thdi_warning}%)",
                "detail": "ตรวจสอบอุปกรณ์ Non-linear ในระบบ"
            })

    # ── 8. Frequency (กฟน./กฟภ. 50Hz ±1%) ────────────────────────────────
    if freq > 0:
        if freq < T["freq_critical_low"] or freq > T["freq_critical_high"]:
            alerts.append({
                "category": "frequency",
                "severity": "critical",
                "message": f"ความถี่ผิดปกติวิกฤต {freq:.2f}Hz (นอกช่วง {T['freq_critical_low']}-{T['freq_critical_high']}Hz / ±2%)",
                "detail": "อาจเกิดจากระบบไฟฟ้าไม่เสถียร หรือเครื่องกำเนิดไฟฟ้าทำงานผิดปกติ"
            })
        elif freq < freq_nom - freq_tol or freq > freq_nom + freq_tol:
            alerts.append({
                "category": "frequency",
                "severity": "high",
                "message": f"ความถี่เบี่ยงเบน {freq:.2f}Hz (นอกช่วง {freq_nom - freq_tol}-{freq_nom + freq_tol}Hz / ±{freq_tol}%)",
                "detail": "เฝ้าระวังสถานการณ์ — อาจส่งผลต่อ PLC, นาฬิกา, มอเตอร์"
            })

    # ── 9. Power Factor (กฟน./กฟภ. มีค่าปรับถ้าต่ำกว่า 0.85) ─────────────
    if i_avg > T["pf_min_load"] and pf > 0:
        pf_type = data.get("PF_Total_type", "")
        # Add a space before pf_type if it exists to display nicely e.g., "0.82 Lag"
        pf_suffix = f" {pf_type}" if pf_type else ""
        
        if pf < T["pf_critical"]:
            alerts.append({
                "category": "power_factor",
                "severity": "critical",
                "message": f"ค่า Power Factor ต่ำวิกฤต {pf:.2f}{pf_suffix} (ต่ำกว่า {T['pf_warning']} เกณฑ์ กฟน./กฟภ.)",
                "detail": "โดนเรียกเก็บค่าปรับ! (กฟภ. 56.07 บาท/kVAR, กฟน. 14.02 บาท/kVAR ที่เกินเกณฑ์) — ควรตรวจสอบ Capacitor Bank"
            })
        elif pf < T["pf_warning"]:
            alerts.append({
                "category": "power_factor",
                "severity": "high",
                "message": f"ค่า Power Factor ต่ำ {pf:.2f}{pf_suffix} (เริ่มต่ำกว่า {T['pf_warning']}) เสี่ยงถูกปรับ",
                "detail": "พิจารณาติดตั้ง Capacitor Bank หรือตรวจสอบระบบชดเชยกำลังไฟฟ้า (APFC) ว่าสเต็ปพังหรือไม่"
            })

    # ── 10. Overload / Short Circuit ──────────────────────────────────────
    if i_avg > T["i_overload_critical"]:
        alerts.append({
            "category": "short_circuit",
            "severity": "critical",
            "message": f"กระแสเกินวิกฤต {i_avg:.1f}A (เกิน {T['i_overload_critical']}A) สงสัยลัดวงจร — ต้องตัดไฟทันที",
            "detail": "ตรวจสอบจุดลัดวงจร, เบรกเกอร์, และฉนวนสายไฟ"
        })
    elif i_avg > T["i_overload_warning"]:
        alerts.append({
            "category": "overload",
            "severity": "high",
            "message": f"โหลดสูงผิดปกติ {i_avg:.1f}A (เกิน {T['i_overload_warning']}A) สายไฟและเบรกเกอร์อาจรับไม่ไหว",
            "detail": "ตรวจสอบโหลดที่เพิ่มขึ้น พิจารณาลดโหลดหรือเพิ่มขนาดสาย/เบรกเกอร์"
        })

    # ── 11. Ground Fault / Neutral Current สูง ────────────────────────────
    if i_n > T["i_neutral_critical"]:
        alerts.append({
            "category": "ground_fault",
            "severity": "critical",
            "message": f"กระแส Neutral สูงผิดปกติ {i_n:.1f}A (เกิน {T['i_neutral_critical']}A) สงสัย Ground Fault",
            "detail": "ตรวจสอบฉนวนสายไฟ, จุดรั่วไหลลงดิน, อุปกรณ์ชำรุด — ตัดไฟทันที"
        })
    elif i_n > T["i_neutral_warning"]:
        alerts.append({
            "category": "neutral_high",
            "severity": "high",
            "message": f"กระแส Neutral สูง {i_n:.1f}A (เกิน {T['i_neutral_warning']}A) อาจเกิดจากโหลดไม่สมดุลหรือฮาร์มอนิก",
            "detail": "ตรวจสอบการกระจายโหลด 1 เฟส และ Harmonic ลำดับที่ 3 (Triplen)"
        })
    
    return {
        "count": len(alerts),
        "status": "ALERT" if alerts else "OK",
        "alerts": alerts,
        "timestamp": data.get("timestamp")
    }