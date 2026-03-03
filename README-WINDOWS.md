# 🪟 PM2230 Dashboard - Windows Guide

## 🚀 วิธีใช้งาน (Windows)

### **วิธีที่ 1: ใช้ Batch File (ง่ายสุด!)**

1. **ดับเบิลคลิก** `start-windows.bat`
2. **รอ** โปรแกรมติดตั้งและเริ่มอัตโนมัติ
3. **เปิด Browser:** http://localhost:3002

**เสร็จแล้ว!** 🎉

---

### **วิธีที่ 2: ทำทีละขั้น**

#### **1. ติดตั้ง Backend**
```cmd
cd pm2230-nextjs\backend

# สร้าง virtual environment
python -m venv .venv

# เปิดใช้งาน
.venv\Scripts\activate

# ติดตั้ง dependencies
pip install -r requirements.txt
```

#### **2. เริ่ม Backend**
```cmd
python main.py
```

#### **3. ติดตั้ง Frontend** (เปิด terminal ใหม่)
```cmd
cd pm2230-nextjs\frontend
npm install
```

#### **4. เริ่ม Frontend**
```cmd
npm run dev -- -p 3002
```

#### **5. เปิด Dashboard**
```
http://localhost:3002
```

---

## 📦 **สิ่งที่ต้องติดตั้งก่อน:**

### **1. Python 3.12**
- ดาวน์โหลด: https://www.python.org/downloads/
- ✅ **สำคัญ:** ติ๊ก "Add Python to PATH" ตอนติดตั้ง

### **2. Node.js (LTS)**
- ดาวน์โหลด: https://nodejs.org/
- เลือก "LTS Version"
- ติดตั้งแบบปกติ

---

## ✅ **เช็คว่าติดตั้งครบ:**

**เปิด Command Prompt:**
```cmd
python --version
# ต้องเห็น: Python 3.12.x

node --version
# ต้องเห็น: v20.x.x

npm --version
# ต้องเห็น: 10.x.x
```

---

## 🎯 **วิธีใช้ Dashboard:**

### **Tab 1: 📊 ภาพรวม**
- Voltage (V_LN1, V_LN2, V_LN3)
- Current (I_L1, I_L2, I_L3, I_N)
- Frequency

### **Tab 2: ⚡ กำลังไฟฟ้า**
- Active Power (P)
- Apparent Power (S)
- Reactive Power (Q)

### **Tab 3: 📈 คุณภาพไฟฟ้า**
- THD, Unbalance, Power Factor

### **Tab 4: 🔋 พลังงาน**
- kWh, kVAh, kvarh

### **Tab 5: 🎁 Bonus Functions**
- Health Score, Alert, Cost, Triangle

### **Tab 6: 📤 Excel Import**
- Upload Excel → Analyze

---

## 🛑 **วิธีหยุด:**

1. **ปิดหน้าต่าง** Command Prompt ทั้ง 2 อัน
2. หรือ กด **Ctrl+C** ในแต่ละหน้าต่าง

---

## ❓ **แก้ปัญหา:**

### **Python ไม่เจอ:**
```
ติดตั้งใหม่ → ติ๊ก "Add Python to PATH"
```

### **npm ไม่เจอ:**
```
ติดตั้ง Node.js ใหม่
```

### **Port 3002 ใช้งานอยู่:**
```cmd
npm run dev -- -p 3003
# แล้วเปิด: http://localhost:3003
```

### **Permission Error:**
```
คลิกขวาที่ start-windows.bat → Run as Administrator
```

---

## 🐚 **ต้องการความช่วยเหลือ?**

ส่งข้อความมาที่: [Telegram]
หรือถามในแชทได้เลยค่ะ!

---

**โดย:** พาย (Pi) 🐚  
**สำหรับ:** Windows 10/11
