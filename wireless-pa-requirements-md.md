# Wireless PA Web Application — Requirements Document
**Version:** 1.0  
**Classification:** Internal Use Only  

---

## 1. ภาพรวมโครงการ (Overview)

พัฒนา Web Application ที่ทำหน้าที่เสมือน **IP Phone** เครื่องหนึ่ง เชื่อมต่อกับระบบ Asterisk PBX ที่มีอยู่เดิมผ่านโปรโตคอล **SIP over WebSocket** โดยไม่เปลี่ยนแปลง infrastructure เดิม ทำให้ผู้ใช้งานสามารถควบคุมระบบประกาศเสียงผ่าน Browser บนอุปกรณ์ใดก็ได้ โดยไม่ต้องติดตั้ง Application เพิ่มเติม

---

## 2. ระบบปัจจุบัน (Current System)

| Component | รายละเอียด |
|-----------|-----------|
| **Asterisk PBX Server** | ศูนย์กลางควบคุมการโทรทั้งหมด รองรับ Paging หลายจุดพร้อมกัน |
| **IP Speaker** | ลำโพงรับสัญญาณผ่าน SIP/UDP กระจายตามจุดต่างๆ ของเทศบาล |
| **Mobile App (นายก)** | ติดตั้ง SIP App บนมือถือ Android เพื่อประกาศจากระยะไกล |
| **ไมโครโฟน Android** | หน้าจอ Android ติด SIP App ใช้งานที่สำนักงานเทศบาล |

---

## 3. สถาปัตยกรรมระบบใหม่ (Architecture)

```
[ Web Browser (Any Device) ]   ← NEW
        JsSIP Library — SIP Softphone in Browser
              │
           WSS (WebSocket Secure)
              │
[ Nginx Reverse Proxy ]        ← NEW
        SSL Termination · WebSocket Proxy → Asterisk :8088
              │
        WS (WebSocket) + SIP
              │
[ Asterisk PBX ]               ← EXISTING (minor config change)
        เพิ่ม WebSocket Transport · Dial Plan คงเดิม
              │
     SIP / UDP — ไม่เปลี่ยนแปลง
       ┌───────────────┐
       │               │
[ IP Speakers ]   [ Mobile / Android ]   ← EXISTING (unchanged)
```

> **หมายเหตุ:** Asterisk เห็น Web App เป็นแค่ IP Phone เครื่องหนึ่ง ไม่กระทบ configuration เดิมใดๆ

---

## 4. ฟีเจอร์ที่ต้องการ (Features)

### Phase 1 — Core (MVP)
- [ ] โทรออกไปยัง IP Speaker แต่ละจุดได้
- [ ] Paging ลำโพงหลายตัวพร้อมกัน (Group Call)
- [ ] ปุ่มลัดเตือนภัยพิบัติ (โทร 000 ไซเรนทุกจุด)
- [ ] แผงควบคุมหลัก (Control Panel UI)

### Phase 2 — Extended
- [ ] เลือกโซน / พื้นที่ประกาศได้
- [ ] Upload ไฟล์ MP3 เปิดผ่านลำโพง
- [ ] ระบบ Login / Permission ผู้ใช้
- [ ] Log การประกาศ (วันเวลา / ผู้ใช้)

### Phase 3 — Future
- [ ] Stream เสียงจาก YouTube URL
- [ ] ตั้งเวลาประกาศอัตโนมัติ (Scheduler)

---

## 5. เทคโนโลยีที่ใช้ (Technology Stack)

| Layer | Technology | หมายเหตุ |
|-------|-----------|---------|
| **SIP Library** | JsSIP | JavaScript — รันใน Browser โดยตรง |
| **Audio Transport** | WebRTC | มาพร้อม Browser ทุกตัว |
| **Frontend** | HTML / CSS / JavaScript | ไม่ต้องมี Framework พิเศษ |
| **Proxy** | Nginx | WebSocket Proxy + SSL Termination |
| **PBX** | Asterisk (PJSIP) | เพิ่ม WebSocket Transport เท่านั้น |
| **SSL** | Let's Encrypt | ฟรี — จัดการที่ Nginx |

---

## 6. แผนการพัฒนา (Development Plan)

| Phase | งาน | เวลาโดยประมาณ |
|-------|-----|---------------|
| **P1** | Core Connection — เพิ่ม WebSocket Transport ใน Asterisk, Config Nginx Proxy, ทดสอบ Browser โทรออกได้ | ~1–2 ชั่วโมง |
| **P2** | Web App UI — Control Panel, แผงปุ่มลัด, ปุ่มเตือนภัย, เลือกโซน | ~1 วัน |
| **P3** | MP3 Streaming — Upload ไฟล์ MP3, แปลงเป็น Audio Stream, ส่งผ่าน WebRTC เข้าลำโพง | ~1–2 วัน |
| **P4** | Login & Permission — ระบบ Login, กำหนดสิทธิ์ผู้ใช้, Log การประกาศ | ~1–2 วัน |
| **P5** | Test & Deploy — ทดสอบกับ IP Speaker จริง, แก้ไขปัญหา, Deploy production | ~1–2 วัน |

**เวลารวมโดยประมาณ: 5–8 วันทำการ**

---

## 7. จุดสำคัญของแนวทางนี้ (Key Decisions)

### ✅ ไม่กระทบระบบเดิม
Asterisk, IP Speaker, Mobile App และ Android Mic ทำงานได้ปกติทุกอย่าง ไม่มีการหยุดให้บริการระหว่างพัฒนา

### 🌐 ใช้ได้ทุกอุปกรณ์
รองรับ Browser บน PC, Tablet และ Mobile ไม่ต้องติดตั้ง Application เพิ่มเติมบนเครื่องผู้ใช้

### 🔧 แก้ Asterisk น้อยมาก
เพิ่มแค่ WebSocket Transport และ Extension สำหรับ Web App เท่านั้น Dial Plan และ config เดิมคงอยู่ครบ

### 📈 ต่อยอดได้ในอนาคต
Architecture รองรับ Feature เพิ่มได้ไม่จำกัดบน Web App เดิม โดยไม่ต้องแตะ PBX อีก

---

## 8. ข้อกำหนดด้านความปลอดภัย (Security Requirements)

- การเชื่อมต่อทั้งหมดต้องใช้ **HTTPS / WSS** เท่านั้น
- SIP Credentials ต้องไม่ถูก Expose ใน Frontend Source Code
- ระบบ Login ต้องรองรับ Session Timeout
- Log การประกาศต้องบันทึกไว้อย่างน้อย **90 วัน**

---

*Wireless PA Web Application — Requirements v1.0 · Confidential · Internal Use Only*
