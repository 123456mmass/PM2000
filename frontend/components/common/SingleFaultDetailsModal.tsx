import React, { useEffect, useState } from 'react';

// Type definition for a single fault 
export interface FaultAlert {
    category: string;
    severity: string;
    message: string;
    detail?: string;
}

interface SingleFaultDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAcknowledge?: () => void;
    fault: FaultAlert | null;
}

// 1) Mapping maps Categories to Thai
const categoryMap: Record<string, string> = {
    'VOLTAGE': 'แรงดันไฟฟ้า',
    'CURRENT': 'กระแสไฟฟ้า',
    'FREQUENCY': 'ความถี่',
    'POWER': 'กำลังไฟฟ้า',
    'VOLTAGE UNBALANCE': 'แรงดันไฟฟ้าไม่สมดุล',
    'CURRENT UNBALANCE': 'กระแสไฟฟ้าไม่สมดุล',
    'HARMONICS': 'ฮาร์มอนิก (ความเพี้ยนคลื่น)',
    'SYSTEM': 'ระบบทั่วไป',
    'OVERLOAD': 'กระแสไฟฟ้าเกินพิกัด',
    'SHORT_CIRCUIT': 'ลัดวงจร'
};

// 2) Mapping Severities to Thai
const severityMap: Record<string, string> = {
    'critical': 'วิกฤต (CRITICAL)',
    'high': 'รุนแรง (HIGH)',
    'medium': 'ปานกลาง (MEDIUM)',
    'warning': 'แจ้งเตือน (WARNING)',
    'info': 'ทั่วไป (INFO)'
};

// 3) Heuristic translation for known English messages to Thai
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

// 4) Provide AI-like advice based on the Category / Message
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

    // Generic Fallback
    return 'ระบบประเมินค่าเซนเซอร์แบบเรียลไทม์พบความผิดปกติ แนะนำให้ส่งช่างซ่อมบำรุงตรวจสอบหน้างานตามจุดที่ระบุ และเช็คสายไฟ ขั้วต่อ หรือเบรกเกอร์ย่อยที่เกี่ยวข้อง';
};

export function SingleFaultDetailsModal({ isOpen, onClose, onAcknowledge, fault }: SingleFaultDetailsModalProps) {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen && fault) {
            // eslint-disable-next-line
            setIsRendered(true);
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            setTimeout(() => setIsRendered(false), 300);
        }
    }, [isOpen, fault]);

    if (!isRendered || !fault) return null;

    const rawCat = fault.category.toUpperCase().replace(/_/g, ' ');
    const rawSev = fault.severity.toLowerCase();

    const thCategory = categoryMap[rawCat] || rawCat;
    const thSeverity = severityMap[rawSev] || fault.severity;
    const thMessage = translateMessage(fault.message);
    const adviceLines = getAdviceForFault(fault).split('\n');

    // Colors
    let icon = '⚠️';
    let colorHeader = 'bg-gradient-to-r from-yellow-900/80 to-yellow-800/80 border-yellow-500/30';
    let badgeColor = 'bg-yellow-500 text-yellow-300 border-yellow-500/30';
    let lightColor = 'text-yellow-400';

    if (rawSev === 'critical' || rawSev === 'high') {
        icon = '🚨';
        colorHeader = 'bg-gradient-to-r from-red-900/80 to-red-800/80 border-red-500/30';
        badgeColor = 'bg-red-500 text-red-100 border-red-500/30';
        lightColor = 'text-red-400';
    }

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`}
            onClick={onClose}
        >
            <div
                className={`bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`${colorHeader} p-5 px-6 border-b flex justify-between items-center relative overflow-hidden`}>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-black/20 p-2 rounded-full shadow-inner animate-pulse-once">
                            <span className="text-3xl">{icon}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">รายงานข้อมูลปัญหา</h2>
                            <p className="text-white/70 text-sm mt-0.5">ประเภท: {thCategory}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors focus:outline-none z-10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

                    {/* Fault Summary Block */}
                    <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">รายละเอียดเซนเซอร์</h3>
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-opacity-20 border ${badgeColor}`}>
                                ระดับความรุนแรง: {thSeverity}
                            </span>
                        </div>

                        <p className="text-gray-100 font-medium text-lg leading-snug mb-2">{thMessage}</p>

                        {fault.detail && (
                            <div className="mt-3 flex gap-2 items-start bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-gray-300">{fault.detail}</span>
                            </div>
                        )}
                    </div>

                    {/* AI Advice Block */}
                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex-shrink-0">
                                <span className="text-3xl drop-shadow-md">👨‍🔧</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    คำแนะนำเบื้องต้นสำหรับการดูแลรักษา
                                </h3>
                                <div className="text-gray-300 text-sm leading-relaxed space-y-2">
                                    {adviceLines.map((line, idx) => (
                                        <p key={idx}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-800/90 p-4 border-t border-gray-700/50 flex justify-end gap-3 z-10 backdrop-blur-md">
                    {onAcknowledge && (
                        <button
                            onClick={onAcknowledge}
                            className="px-6 py-2.5 bg-green-600/80 hover:bg-green-500 text-white font-medium rounded-xl transition-all shadow-sm flex items-center gap-2 border border-green-500/50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            รับทราบ ข้ามปัญหานี้
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all shadow-sm"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
}
