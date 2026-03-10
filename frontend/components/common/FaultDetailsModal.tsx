import React, { useEffect, useState } from 'react';
import { FaultAlert } from './types';

interface FaultDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAcknowledgeAll?: () => void;
    alerts: FaultAlert[];
}

const categoryMap: Record<string, string> = {
    'VOLTAGE': 'ตัวแปรแรงดันไฟฟ้า',
    'CURRENT': 'ตัวแปรกระแสไฟฟ้า',
    'FREQUENCY': 'ตัวแปรความถี่',
    'POWER': 'ตัวแปรกำลังไฟฟ้า',
    'VOLTAGE UNBALANCE': 'แรงดันไฟฟ้าไม่สมดุล',
    'CURRENT UNBALANCE': 'กระแสไฟฟ้าไม่สมดุล',
    'HARMONICS': 'ฮาร์มอนิก (ความเพี้ยนคลื่น)',
    'SYSTEM': 'ระบบทั่วไป'
};

const severityMap: Record<string, string> = {
    'critical': 'วิกฤต (CRITICAL)',
    'high': 'รุนแรง (HIGH)',
    'medium': 'ปานกลาง (MEDIUM)',
    'warning': 'แจ้งเตือน (WARNING)',
    'info': 'ทั่วไป (INFO)'
};

const translateMessage = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes('undervoltage detected')) return msg.replace(/Undervoltage detected/i, 'ตรวจพบแรงดันตก');
    if (m.includes('overvoltage detected')) return msg.replace(/Overvoltage detected/i, 'ตรวจพบแรงดันเกิน');
    if (m.includes('high current detected')) return msg.replace(/High current detected/i, 'ตรวจพบกระแสเกิน');
    if (m.includes('voltage unbalance exceeds limit')) return msg.replace(/Voltage unbalance exceeds limit/i, 'แรงดันไม่สมดุลเกินค่ามาตรฐาน');
    if (m.includes('current unbalance exceeds limit')) return msg.replace(/Current unbalance exceeds limit/i, 'กระแสไม่สมดุลเกินค่ามาตรฐาน');
    if (m.includes('frequency out of normal range')) return msg.replace(/Frequency out of normal range/i, 'ความถี่อยู่นอกย่านปกติ');
    if (m.includes('low power factor')) return msg.replace(/Low power factor detected/i, 'ค่าตัวประกอบกำลังต่ำกว่าเกณฑ์');
    return msg;
};

const getAdviceForFault = (fault: FaultAlert): string => {
    const cat = fault.category.toUpperCase().replace(/_/g, ' ');
    const m = fault.message.toLowerCase();

    if (cat.includes('VOLTAGE UNBALANCE')) {
        return '1. ตรวจสอบโหลด 1 เฟส (Single-phase loads) ภายในระบบ ว่ามีการกระจายการใช้งานแต่ละเฟสใกล้เคียงกันหรือไม่\n2. อาจเกิดจากขดลวดมอเตอร์ หรือหม้อแปลงตัวใดตัวหนึ่งมีความผิดปกติ ให้เช็คความต้านทานขดลวด\n3. การปล่อยให้แรงดันไม่สมดุลนานๆ จะทำให้อุปกรณ์ร้อนจัดและอายุการใช้งานสั้นลง';
    }
    if (cat.includes('CURRENT UNBALANCE')) {
        return '1. การกินกระแสแต่ละเฟสต่างกันเกินไป ตรวจเช็คเครื่องจักรที่ใช้ไฟ 1 เฟสว่าเปิดใช้งานพร้อมกันที่เฟสใดเฟสหนึ่งกระจุกตัวหรือไม่\n2. สาเหตุอาจมาจากแรงดันไม่สมดุลก่อนหน้า ทำให้กระแสไม่สมดุลตาม\n3. รีบกระจายโหลดใหม่เพื่อป้องกันเบรกเกอร์ทริปเฉพาะเฟส';
    }
    if (m.includes('undervoltage')) {
        return '1. แรงดันขาเข้าต่ำกว่าเกณฑ์ ให้ตรวจสอบหม้อแปลงของการไฟฟ้าหรือจุดเชื่อมต่อต่างๆ ว่ามีจุดหลวมไหม\n2. หากในโรงงานเพิ่งเปิดเครื่องจักรขนาดใหญ่ (Motor starting) อาจทำให้แรงดันตกชั่วขณะได้\n3. ตรวจสอบการตั้งค่า Tap หม้อแปลง (หากสามารถทำได้)';
    }
    if (m.includes('overvoltage')) {
        return '1. แรงดันขาเข้าสูงกว่าเกณฑ์ อาจส่งผลให้อุปกรณ์อิเล็กทรอนิกส์และหลอดไฟชำรุด\n2. ให้ลองตรวจสอบชุด Capacitor Bank ว่ามีการสับค้างไว้ในช่วงที่โหลดน้อยหรือไม่ (Leading PF)';
    }
    if (m.includes('frequency')) {
        return '1. ความถี่เบี่ยงเบน มักเกิดจากฝั่งระบบสายส่งของการไฟฟ้า หรือหากใช้เครื่องปั่นไฟ (Generator) ให้ตรวจสอบตัวคุมความเร็วรอบเครื่องยนต์ (Governor)\n2. อุปกรณ์ประเภทมอเตอร์ซิงโครนัสอาจทำงานผิดจังหวะได้หากปล่อยไว้';
    }
    if (cat.includes('POWER') || m.includes('power factor')) {
        return '1. ค่า Power Factor ต่ำกว่าที่ควรจะเป็น (อาจต่ำกว่า 0.85) ทำให้สูญเสียพลังงานเชิงReactiveเยอะ\n2. ตรวจสอบ Capacitor Bank ว่าฟิวส์ขาด หรือ Step Controller ทำงานปกติหรือไม่\n3. ค่า PF ต่ำอาจส่งผลให้โดนการไฟฟ้าปรับปรุงค่าไฟเพิ่ม (ค่า KVAR)';
    }

    return 'ระบบประเมินค่าเซนเซอร์แบบเรียลไทม์พบความผิดปกติ แนะนำให้ส่งช่างซ่อมบำรุงตรวจสอบหน้างานตามจุดที่ระบุ และเช็คสายไฟ ขั้วต่อ หรือเบรกเกอร์ย่อยที่เกี่ยวข้อง';
};

export function FaultDetailsModal({ isOpen, onClose, onAcknowledgeAll, alerts }: FaultDetailsModalProps) {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line
            setIsRendered(true);
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            setTimeout(() => setIsRendered(false), 300);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={onClose}
        >
            <div
                className={`bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-900/80 to-red-800/80 p-5 px-6 border-b border-red-500/30 flex justify-between items-center relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-black/20 p-2 rounded-full shadow-inner animate-pulse-once">
                            <span className="text-3xl drop-shadow-md">🚨</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">รายงานข้อมูลปัญหาอย่างละเอียด</h2>
                            <p className="text-red-200/80 text-sm mt-0.5">พบทั้งหมด {alerts.length} รายการ ที่ต้องดำเนินการตรวจสอบ</p>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {alerts.map((a, i) => {
                        const s = (a.severity || '').toLowerCase();
                        let colorClass = '';
                        let bgClass = '';
                        let badgeClass = '';
                        let dotClass = '';

                        if (s === 'critical' || s === 'high') {
                            colorClass = 'text-red-400';
                            bgClass = 'bg-[#2a1515] hover:bg-[#3a1c1c]';
                            badgeClass = 'bg-red-500 text-white';
                            dotClass = 'from-red-300 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
                        } else if (s === 'medium' || s === 'warning') {
                            colorClass = 'text-yellow-400';
                            bgClass = 'bg-[#2a2015] hover:bg-[#3a2c1c]';
                            badgeClass = 'bg-[#eab308] text-[#422006]';
                            dotClass = 'from-[#fcd34d] to-[#d97706] shadow-[0_0_8px_rgba(234,179,8,0.8)]';
                        } else {
                            colorClass = 'text-blue-400';
                            bgClass = 'bg-[#15202a] hover:bg-[#1c2a3a]';
                            badgeClass = 'bg-blue-500 text-white';
                            dotClass = 'from-blue-300 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.8)]';
                        }

                        const thMessage = translateMessage(a.message);
                        const thSeverity = severityMap[s] || a.severity;
                        const adviceLines = getAdviceForFault(a).split('\n');

                        return (
                            <div key={i} className="flex flex-col rounded-xl border border-gray-700/60 overflow-hidden shadow-sm">
                                {/* Top sleek header identical to what they liked on dashboard */}
                                <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 transition-colors border-b border-gray-800/80 ${bgClass}`}>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${dotClass}`}></div>
                                        <span className={`font-bold uppercase tracking-wider text-[15px] ${colorClass}`}>
                                            {categoryMap[a.category] || (a.category || '').replace(/_/g, ' ')}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${badgeClass}`}>
                                            {thSeverity}
                                        </span>
                                        <span className="text-gray-200 font-medium text-sm sm:text-base ml-1">
                                            {thMessage}
                                        </span>
                                    </div>
                                </div>

                                {/* Body with AI advice */}
                                <div className="p-5 bg-gray-900/60 flex flex-col md:flex-row gap-5">
                                    <div className="flex-1 w-full">
                                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 relative overflow-hidden h-full">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 flex-shrink-0">
                                                    <span className="text-2xl drop-shadow-md">👨‍🔧</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        คำแนะนำเบื้องต้นสำหรับการดูแลรักษา (ระดับ: {thSeverity})
                                                    </h3>
                                                    <div className="text-gray-300 text-sm leading-relaxed space-y-1.5 pt-1">
                                                        {adviceLines.map((line, idx) => (
                                                            <p key={idx}>{line}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="bg-gray-800/90 p-4 border-t border-gray-700/50 flex flex-col sm:flex-row justify-end gap-3 z-10 backdrop-blur-md">
                    {onAcknowledgeAll && (
                        <button
                            onClick={onAcknowledgeAll}
                            className="w-full sm:w-auto px-6 py-2.5 bg-green-600/80 hover:bg-green-500 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border border-green-500/50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            รับทราบปัญหาทั้งหมด
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
}
