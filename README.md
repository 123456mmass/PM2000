# 📊 PM2230 Dashboard - Mini Project

**วิชา:** 01026325 - ระบบควบคุมอัตโนมัติในอาคารและอุตสาหกรรม  
**อาจารย์:** รศ.ดร.เชาว์ ชมภูอินไหว  
**โดย:** พาย (Pi) 🐚

---

## 📋 **ข้อมูล Project**

| รายการ | รายละเอียด |
|--------|-----------|
| **Meter** | Schneider PM2230 |
| **Communication** | Modbus RTU over RS485 |
| **Parameters** | 36 ค่า |
| **Dashboard** | 4 หน้า (ไม่เกิน 4 หน้าตามโจทย์) |
| **ส่งงาน** | 10 มีนาคม 2568 |
| **นำเสนอ** | 11 มีนาคม 2568 |

---

## 🛠️ **ทางเลือกที่ 1: Node-RED (แนะนำ)**

### ✅ ข้อดี:
- เพื่อนใช้ด้วย → ทำงานร่วมกันง่าย
- ไม่ต้องเขียนโค้ดเยอะ
- มี Modbus Node พร้อม
- Dashboard สร้างง่าย (ลาก-วาง)

### 📦 ติดตั้ง:
```bash
# ติดตั้ง Node-RED + Modbus + Dashboard
npm install -g node-red
npm install -g node-red-contrib-modbus
npm install -g node-red-dashboard
```

### 🚀 เริ่มใช้งาน:
```bash
node-red
```

เปิด Browser: http://localhost:1880

### 📥 Import Flow:
1. เปิด Node-RED
2. คลิก Menu (≡) → Import
3. เลือกไฟล์ `pm2230-flow.json`
4. แก้ไข Modbus Client ให้ตรงกับ Board
5. Deploy

### 🎨 Dashboard:
http://localhost:1880/ui

---

## 🛠️ **ทางเลือกที่ 2: Next.js + Python**

### ✅ ข้อดี:
- สวยกว่า, ปรับแต่งได้เยอะ
- ควบคุมได้เต็มที่
- แยก Backend/Frontend ชัดเจน

### 📦 ติดตั้ง Backend:
```bash
cd /root/.openclaw/workspace/pm2230-dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 🎨 ติดตั้ง Frontend:
```bash
cd /root/.openclaw/workspace/pm2230-dashboard/frontend
npm install
npm run dev -- -p 3002
```

### 🌐 เข้าถึง:
- Dashboard: http://localhost:3002
- API: http://localhost:8002
- API Docs: http://localhost:8002/docs

---

## 🔌 **การตั้งค่า Modbus**

### PM2230 Default Settings:
| Parameter | ค่า |
|-----------|-----|
| **Baud Rate** | 9600 bps (default) |
| **Data Bits** | 8 |
| **Stop Bits** | 1 |
| **Parity** | None (หรือ Even) |
| **Slave ID** | 1 (default) |

### Register Map (ตัวอย่าง):
| Parameter | Register | Scale | Unit |
|-----------|----------|-------|------|
| V_LN1 | 0 | 0.1 | V |
| V_LN2 | 1 | 0.1 | V |
| V_LN3 | 2 | 0.1 | V |
| I_L1 | 16 | 0.001 | A |
| I_L2 | 17 | 0.001 | A |
| I_L3 | 18 | 0.001 | A |
| I_N | 19 | 0.001 | A |
| Freq | 32 | 0.01 | Hz |
| P_Total | 51 | 0.001 | kW |
| PF_Total | 147 | 0.001 | - |
| kWh_Total | 160 | 0.01 | kWh |

**⚠️ หมายเหตุ:** Register addresses จริงต้องตรวจสอบจาก PM2230 Modbus Map

---

## 📊 **36 Parameters แบ่งเป็น 4 หน้า**

### Page 1: ภาพรวม (Overview)
- ⏰ Timestamp
- 🔌 Voltage (V_LN1, V_LN2, V_LN3)
- ⚡ Current (I_L1, I_L2, I_L3, I_N)
- 📊 Frequency

### Page 2: กำลังไฟฟ้า (Power)
- 💡 Active Power (P_L1, P_L2, P_L3, P_Total)
- 📈 Apparent Power (S_L1, S_L2, S_L3, S_Total)
- ⚡ Reactive Power (Q_L1, Q_L2, Q_L3, Q_Total)

### Page 3: คุณภาพไฟฟ้า (Power Quality)
- 🌊 THD Voltage (THDv-L1, L2, L3)
- 🌊 THD Current (THDi-L1, L2, L3)
- ⚖️ Unbalance (V_unb, I_unb)
- 📐 Power Factor (PF_L1, L2, L3, Total)

### Page 4: พลังงาน (Energy)
- 🔋 kWh_Total
- 📊 kVAh_Total
- ⚡ kvarh_Total

---

## ✅ **Checklist ก่อนส่งงาน**

- [ ] Dashboard แสดงผล 36 Parameters ครบ
- [ ] ไม่เกิน 4 หน้า
- [ ] อ่านค่าจาก PM2230 ได้จริง
- [ ] ทดสอบกับ Unseen Load
- [ ] PPT Presentation (≤15 หน้า)
- [ ] ส่ง PDF ภายใน 10 มีนาคม 23:59

---

## 🎁 **Bonus Ideas (+10 คะแนน)**

### Smart Function Button:
1. **⚠️ Alert Summary** - สรุปค่าเกินเกณฑ์ กดปุ่มเดียว
2. **📊 Power Triangle** - แสดง P, Q, S เป็น Vector
3. **💰 Cost Calculator** - คำนวณค่าไฟจาก kWh
4. **📈 Trend Graph** - กราฟแนวโน้ม 24 ชม.
5. **🏆 Efficiency Score** - ให้คะแนนประสิทธิภาพระบบ

---

## 📞 **คำสั่งที่ใช้บ่อย**

### Node-RED:
```bash
# เริ่ม Node-RED
node-red

# หยุด
Ctrl+C
```

### Next.js + Python:
```bash
# เริ่มทั้งหมด
cd /root/.openclaw/workspace/pm2230-dashboard
./start.sh
```

### 🧪 Backend Testing:
```bash
# ไปที่ backend directory
cd backend

# ติดตั้ง dependencies (รวม pytest)
pip install -r requirements.txt

# รัน tests ทั้งหมด
pytest

# รัน tests พร้อมแสดง coverage
pytest --cov=. --cov-report=html

# รัน tests พร้อมแสดง coverage ใน terminal
pytest --cov=. --cov-report=term-missing

# รันเฉพาะ test_main.py
pytest test_main.py -v

# รันเฉพาะ test_pm2230_client.py
pytest test_pm2230_client.py -v

# รัน tests พร้อมแสดง output แบบละเอียด
pytest -v -s

# รัน เฉพาะ unit tests
pytest -m unit

# รัน เฉพาะ integration tests
pytest -m integration

# สร้าง coverage report
pytest --cov=. --cov-report=html --cov-report=xml
# เปิด report: open htmlcov/index.html
```

---

## 🐚 **พายช่วยอะไรได้บ้าง?**

1. ✅ สร้าง Node-RED Flow
2. ✅ สร้าง Next.js Dashboard
3. ✅ หา Modbus Register Map
4. ✅ ทดสอบกับ Board จริง
5. ✅ ทำ PPT Template
6. ✅ ช่วยคำนวณค่าไฟฟ้า

**สั่งพายได้เลยค่ะ!** ✨

---

**Last Updated:** 2026-03-02  
**Status:** Ready for Testing 🚀
# PM2000
