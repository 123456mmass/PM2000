# 🤖 Parallel LLM Mode - คู่มือการใช้งาน

เรียกใช้ AI หลายตัวพร้อมกัน (Mistral + DashScope) เลือกผลลัพธ์ที่ดีที่สุดอัตโนมัติ

---

## 🎯 ทำไมต้อง Parallel Mode?

| คุณสมบัติ | Sequential (เดิม) | Parallel (ใหม่) |
|-----------|-------------------|----------------|
| **ความเร็ว** | ช้า (เรียงกัน) | เร็วกว่า ~1.5-2x (พร้อมกัน) |
| **ความน่าเชื่อถือ** | ปานกลาง | สูง (มีตัวสำรองพร้อม) |
| **คุณภาพ** | ขึ้นกับตัวแรก | ดีที่สุด (เลือกจากหลายตัว) |
| **ความโปร่งใส** | ไม่รู้ว่าใครตอบ | รู้ว่าใครตอบ + คะแนนคุณภาพ |

---

## 🚀 วิธีใช้งาน

### 1. API Endpoint

```bash
# Parallel Mode (ค่าเริ่มต้น: quality strategy)
POST /api/v1/ai-summary-parallel

# กำหนด strategy
POST /api/v1/ai-summary-parallel?strategy=quality
POST /api/v1/ai-summary-parallel?strategy=fastest
POST /api/v1/ai-summary-parallel?strategy=ensemble
```

### 2. Response Format

```json
{
  "summary": "# รายงานวิเคราะห์...\n\n---\n*🤖 AI Analysis: mistral selected...",
  "is_cached": false,
  "cache_key": "a1b2c3d4",
  "is_aggregated": true,
  "samples": 6,
  "parallel_mode": true,
  "selected_provider": "mistral",
  "quality_score": 87.5,
  "latency_seconds": 3.45,
  "providers_compared": 2,
  "all_results": [
    {
      "provider": "mistral",
      "success": true,
      "latency": 3.45,
      "quality_score": 87.5
    },
    {
      "provider": "dashscope_primary",
      "success": true,
      "latency": 4.12,
      "quality_score": 82.3
    }
  ]
}
```

---

## 🎛️ Selection Strategies

### 1. `quality` (แนะนำ)
เลือกคำตอบที่มีคะแนนคุณภาพสูงสุด

```python
เกณฑ์คะแนน:
- ความยาวเนื้อหา (มากกว่า 1000 ตัวอักษร = +15)
- โครงสร้างชัดเจน (มีหัวข้อ ## หรือ **) = +15
- มีตัวเลข/ข้อมูลเชิงลึก = +10
- มีคำศัพท์เทคนิค (THD, Harmonic, Power Factor...) = +10
- ไม่มี error message = -15 (ถ้ามี)
```

### 2. `fastest`
เลือกตัวที่ตอบกลับเร็วที่สุดที่ success

เหมาะกับ: ต้องการผลลัพธ์เร็วๆ ไม่เน้นละเอียดมาก

### 3. `ensemble`
รวมผลลัพธ์จากหลายตัว แสดงว่ามี consensus สูง

เหมาะกับ: วิเคราะห์สำคัญที่ต้องการความแม่นยำสูงสุด

---

## 🧪 การทดสอบ

รัน test script:

```bash
cd backend
python test_parallel_llm.py
```

ผลลัพธ์ที่ควรได้:
```
🚀 PM2000 Parallel LLM Test
======================================================================

======================================================================
🔄 TEST 1: Sequential Mode (Mistral → DashScope)
======================================================================
⏱️  Time: 8.52 seconds
📦 Cached: False
🔑 Cache Key: e7f8a9b2

======================================================================
⚡ TEST 2: Parallel Mode (Mistral + DashScope พร้อมกัน)
======================================================================
✅ Available providers: ['mistral', 'dashscope_primary', 'dashscope_fallback']

--- Testing strategy: 'quality' ---
⏱️  Time: 4.23 seconds
🤖 Selected: mistral
⭐ Quality Score: 87.5/100
📊 Providers Compared: 2
📋 All Results:
   - mistral: score=87.5, time=3.45s
   - dashscope_primary: score=82.3, time=4.12s

======================================================================
📊 TEST 3: Performance Comparison
======================================================================
🔄 Sequential Mode: 8.52s
⚡ Parallel Mode: 4.23s

📈 Speedup: 2.01x
   (Sequential ช้ากว่า 4.29 วินาที)
```

---

## ⚙️ การตั้งค่า

### Environment Variables

```env
# ต้องมีอย่างน้อย 2 providers
MISTRAL_API_KEY=your_mistral_key
DASHSCOPE_API_KEY=your_dashscope_key

# Optional: ปรับ timeout
AI_TIMEOUT_SECONDS=60
```

### ในโค้ด

```python
from ai_analyzer import generate_power_summary_parallel

# ใช้ default (quality strategy)
result = await generate_power_summary_parallel(data)

# กำหนด strategy
result = await generate_power_summary_parallel(
    data,
    selection_strategy="fastest"  # หรือ "quality", "ensemble"
)

# ดู metadata
print(f"Selected: {result['provider']}")
print(f"Quality Score: {result['quality_score']:.1f}")
print(f"Latency: {result['latency']:.2f}s")
print(f"Providers compared: {len(result['all_providers'])}")
```

---

## 📊 Quality Scoring Algorithm

```python
def score_thai_power_analysis(content: str) -> float:
    score = 50.0  # Base
    
    # 1. ความยาว
    if len(content) > 1000: score += 15
    elif len(content) > 500: score += 10
    
    # 2. โครงสร้าง (headers)
    headers = content.count('##') + content.count('**')
    score += min(headers * 3, 15)
    
    # 3. ตัวเลข/ข้อมูลเชิงลึก
    numbers = len(re.findall(r'\d+\.?\d*', content))
    score += min(numbers * 0.5, 10)
    
    # 4. คำศัพท์เทคนิค
    technical_terms = ['THD', 'Harmonic', 'Power Factor', 'แรงดัน', 'กระแส']
    term_count = sum(1 for t in technical_terms if t in content)
    score += min(term_count * 2, 10)
    
    # 5. หักคะแนนถ้ามี error
    if '❌' in content or 'ข้อผิดพลาด' in content:
        score -= 15
    
    return max(0, min(100, score))
```

---

## 🔄 Fallback Behavior

ถ้า Parallel Mode ไม่สามารถใช้งานได้ (มี provider ไม่ครบ):

```python
# อัตโนมัติ fallback ไป Sequential Mode
if len(providers) < 2:
    logger.info("Not enough providers for parallel, using sequential mode")
    return await generate_power_summary(data)
```

---

## 💡 Use Cases

| สถานการณ์ | แนะนำ Strategy | เหตุผล |
|-----------|---------------|--------|
| **Presentation สำคัญ** | `quality` | ได้ผลลัพธ์ดีที่สุด |
| **Demo ต้องรวดเร็ว** | `fastest` | ผลลัพธ์เร็ว ไม่รอนาน |
| **วิเคราะห์ Fault อันตราย** | `ensemble` | ความน่าเชื่อถือสูงสุด |
| **Chat ทั่วไป** | `fastest` | ตอบสนองเร็ว |
| **รายงานลูกค้า** | `quality` | คุณภาพสูง ดู professional |

---

## 🐛 Troubleshooting

### "Not enough providers for parallel"
```bash
# ตรวจสอบ API Keys
python -c "import os; print('Mistral:', bool(os.getenv('MISTRAL_API_KEY'))); print('DashScope:', bool(os.getenv('DASHSCOPE_API_KEY')))"
```

### Timeout
```python
# เพิ่ม timeout ใน llm_parallel.py
router.timeout = 90.0  # จาก 60 เป็น 90 วินาที
```

### Quality Score ต่ำทุกตัว
- ตรวจสอบว่า prompt มีข้อมูลครบถ้วน
- ตรวจสอบว่า AI ตอบเป็นภาษาไทยจริงๆ
- อาจต้องปรับเกณฑ์คะแนนใน `QualityScorer`

---

## 📁 Files Added

```
backend/
├── llm_parallel.py          # Parallel Router หลัก
├── test_parallel_llm.py     # Test script
└── ai_analyzer.py           # เพิ่ม generate_power_summary_parallel()

PARALLEL_LLM_GUIDE.md        # คู่มือนี้
```

---

## ✅ Checklist ก่อนใช้งาน

- [ ] มี MISTRAL_API_KEY ใน .env
- [ ] มี DASHSCOPE_API_KEY ใน .env
- [ ] รัน `python test_parallel_llm.py` ผ่าน
- [ ] ทดสอบ API `POST /api/v1/ai-summary-parallel` ผ่าน Postman/curl
- [ ] ตรวจสอบว่า response มี `parallel_mode: true`

---

**พร้อมใช้งานแล้ว!** 🎉
