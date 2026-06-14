# 🚀 THE Facility — Next.js

เครื่องมืออำนวยความสะดวกที่ย้ายและพัฒนาขึ้นใหม่ด้วยสถาปัตยกรรม **Next.js 15 (App Router)** ร่วมกับ **TypeScript, TailwindCSS และ Firebase Admin SDK** พร้อมปรับปรุงและเสริมเกราะความปลอดภัยสูงสุด (Security Hardening) ตามมาตรฐาน OWASP

---

## 🛠️ เครื่องมือในระบบ (Included Tools)

1. **Word Counter (เครื่องมือนับคำ):** นับคำ ตัวอักษร บรรทัด ประโยค คำไม่ซ้ำ พร้อมคำนวณเวลาในการอ่านอัตโนมัติ ด้วยระบบนับคำภาษาไทยและแอนิเมชันแสดงผลทันที (Real-time micro-animation)
2. **Speed Reader (เครื่องมือฝึกอ่านเร็ว):** แสดงคำทีละคำอย่างต่อเนื่องตามความเร็ว WPM (Words Per Minute) ปรับแต่งได้ พร้อมระบบตัดคำภาษาไทยและเก็บบันทึกสถิติความเร็วลงเครื่องผู้ใช้
3. **Markdown to Rich Text Converter:** ตัวแปลงรหัส Markdown ไปเป็นรูปแบบตารางและ Rich Text ปรับแต่งชุดสีหัวข้อและเส้นตารางได้อิสระ สำหรับใช้ Copy & Paste ไปวางใน Google Docs ได้ทันทีโดยไม่เสียรูปแบบ
4. **Online Clipboard (คลิปบอร์ดซิงค์ออนไลน์):** คลิปบอร์ดรับส่งข้อมูลระหว่างอุปกรณ์แบบ **End-to-End Encrypted (AES-256-GCM)** ป้องกันการอ่านข้อมูลจากคนภายนอกและผู้ให้บริการ โดยข้อมูลจะถูกถอดรหัสฝั่ง Client เท่านั้น

---

## 🔒 ฟีเจอร์ความปลอดภัยขั้นสูง (OWASP Security Shield)

1. **Strict Content Security Policy (CSP) & Nonces:** ป้องกันช่องโหว่ XSS (Cross-Site Scripting) อย่างสมบูรณ์ผ่าน Edge Middleware ที่สุ่ม Nonce Token ทุกครั้งที่เข้าหน้าเว็บเพื่อยืนยันเฉพาะสคริปต์ที่ปลอดภัย
2. **Zero-Knowledge Architecture:** ข้อมูลใน Online Clipboard ทุกชิ้นจะถูกเข้ารหัสบนเบราว์เซอร์ของผู้ใช้ก่อนส่งไปเซิร์ฟเวอร์ โดยคีย์ถอดรหัส (Passphrase) จะเก็บในหน่วยความจำชั่วคราวบน Client และไม่ถูกส่งเข้าฐานข้อมูลเด็ดขาด
3. **Firebase API Key Encapsulation:** ซ่อนโครงสร้างการต่อฐานข้อมูล Firebase Firestore ไว้หลัง API Routes บนฝั่งเซิร์ฟเวอร์ผ่าน Firebase Admin SDK ป้องกันแฮกเกอร์แอบขโมย API Credentials หรือแก้ไขฐานข้อมูลโดยตรง
4. **Edge Rate Limiting & CSRF Check:** ปกป้องการส่งคำขอแบบ DDoS และสกัดการรันสคริปต์ข้ามไซต์ (Cross-Site Request Forgery) โดยการเทียบโดเมนต้นทาง (Origin) และจำกัดการเข้าใช้งาน API ที่ 100 requests/นาที

---

## 🚀 การติดตั้งและรันใช้งานในเครื่อง (Local Setup)

### 1. ติดตั้ง Dependencies

เปิด Terminal ในโฟลเดอร์โครงการ แล้วรันคำสั่ง:

```bash
npm install
```

### 2. ตั้งค่าไฟล์สภาพแวดล้อม (Environment Variables)

ก๊อบปี้ไฟล์ `.env.example` ไปเป็น `.env.local` เพื่อป้อนรหัสคีย์จริง:

```bash
cp .env.example .env.local
```

ป้อนคีย์ที่ได้จาก **Firebase Console -> Project Settings -> Service Accounts**:

```env
FIREBASE_PROJECT_ID=online-clipboard-c0362
FIREBASE_CLIENT_EMAIL=your-adminsdk-email@online-clipboard-c0362.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### 3. รันโปรเจกต์ช่วงพัฒนา

```bash
npm run dev
```

แล้วเข้าใช้งานได้ทันทีที่ [http://localhost:3000](http://localhost:3000)

### 4. การทดสอบและ Build

```bash
# ตรวจสอบ Type
npx tsc --noEmit

# ทดสอบ Build เป็น Production
npm run build
```
