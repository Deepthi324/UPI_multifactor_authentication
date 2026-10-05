# 🔐 UPI SecurePay — Multi-Factor Authentication System

A full-stack web application simulating a UPI payment system with 3-factor authentication:
**QR Code Scan → Biometric (Fingerprint) → OTP Verification**

Built as a final-year engineering project demonstrating secure digital payment flows.

---

## 📁 Project Structure

```
upi-mfa/
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # Registration & device validation
│   │   ├── paymentController.js    # Payment flow (initiate, QR, biometric)
│   │   └── otpController.js        # OTP generation & verification
│   ├── models/
│   │   ├── User.js                 # User schema (device binding, lock state)
│   │   ├── Transaction.js          # Transaction schema (MFA step tracking)
│   │   └── SecurityLog.js          # Audit log schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── otpRoutes.js
│   ├── .env                        # Environment variables
│   ├── package.json
│   └── server.js                   # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Brand.js             # Logo/header component
        │   └── StepIndicator.js     # MFA progress dots
        ├── pages/
        │   ├── RegisterPage.js/.css # Registration / login
        │   ├── PaymentPage.js/.css  # Payment details entry
        │   ├── QRScanPage.js/.css   # QR scan simulation
        │   ├── BiometricPage.js/.css# Fingerprint scan simulation
        │   ├── OTPPage.js/.css      # 6-digit OTP entry
        │   ├── SuccessPage.js/.css  # Transaction success
        │   └── NotFoundPage.js
        ├── utils/
        │   └── api.js               # Axios API client
        ├── App.js                   # React Router setup
        ├── index.css                # Global styles (CSS variables, dark theme)
        └── index.js
```

---

## ⚙️ Prerequisites

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **MongoDB** v6+ running locally ([mongodb.com](https://www.mongodb.com/try/download/community))
- **npm** v9+

---

## 🚀 Installation & Setup

### Step 1 — Clone / Extract the project

```bash
cd upi-mfa
```

### Step 2 — Backend Setup

```bash
cd backend
npm install
```

Configure environment (already set with defaults):
```bash
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/upi_mfa
OTP_EXPIRY_MINUTES=5
MAX_FAILED_ATTEMPTS=3
```

Start backend:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

✅ You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

### Step 3 — Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm start
```

The React app opens at **http://localhost:3000**

---

## 🎯 Application Flow

```
Register / Login
      ↓
  Payment Form (Enter amount + recipient UPI ID)
      ↓
  [Factor 1] QR Code Scan — Click "Simulate QR Scan", watch scanner animation
      ↓
  [Factor 2] Biometric — Click "Start Fingerprint Scan", watch fingerprint animation
      ↓
  [Factor 3] OTP — 6-digit OTP shown on screen (and server console), enter to verify
      ↓
  Success Page — Transaction confirmed with details
```

---

## 🛡️ Security Features

| Feature | Implementation |
|--------|----------------|
| Device Binding | Device ID stored at registration; checked on every login |
| OTP Expiry | 5-minute window, stored in server memory |
| Retry Limit | Max 3 OTP attempts per transaction |
| Account Lock | Locked after 3 failures; `accountLocked: true` in MongoDB |
| Audit Logging | All events stored in `SecurityLog` MongoDB collection |
| MFA Flow | Each step gated by previous (QR → Biometric → OTP) |
| Session State | Stored in `sessionStorage` (cleared on tab close) |

---

## 🔌 REST API Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ username, deviceId }` | Register new user |
| POST | `/api/auth/validate` | `{ username, deviceId }` | Login & device check |

### Payment
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/payment/initiate` | `{ userId, username, deviceId, recipientUpiId, amount, note }` | Start transaction |
| PUT | `/api/payment/qr-scan` | `{ transactionId }` | Mark QR scan done |
| PUT | `/api/payment/biometric` | `{ transactionId }` | Mark biometric done |
| GET | `/api/payment/transaction/:id` | — | Get transaction details |

### OTP
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/otp/generate` | `{ transactionId, userId }` | Generate + store OTP |
| POST | `/api/otp/verify` | `{ transactionId, otp, userId }` | Verify OTP |

---

## 🧪 Testing the App

1. **Register**: Enter any username + click "Auto-detect my device"
2. **Payment**: Enter `test@upimfa` as recipient, amount `₹500`
3. **QR**: Click the blue scan button, watch the scanning animation
4. **Biometric**: Click the fingerprint sensor, watch the progress animation
5. **OTP**: The OTP appears in a green box on screen (and in server console)
6. **Success**: See full transaction receipt with MFA summary

### Testing Account Lock:
1. Complete QR + Biometric steps
2. On OTP page, enter `000000` three times
3. Account will be locked → `accountLocked: true` in MongoDB

---

## 📦 Tech Stack

**Frontend**
- React 18 with Hooks
- React Router v6
- Axios
- CSS Variables (dark theme, animations)
- Google Fonts: Syne + Inter

**Backend**
- Node.js + Express.js
- Mongoose + MongoDB
- In-memory OTP store (Map)
- dotenv, cors, uuid

---

## 🎓 Academic Notes

This project demonstrates:
- **Multi-Factor Authentication (MFA)**: Something you have (device), something you are (biometric), something you know (OTP)
- **Device Binding**: Prevents account access from unknown devices
- **Brute-force Protection**: Account lockout after failed attempts
- **Audit Trail**: All security events logged with timestamps
- **Layered Security**: Each payment step must complete before proceeding to next

---

## 👨‍💻 Development Notes

- OTP is shown in the browser UI for simulation purposes. In production, it would be sent via SMS/email.
- Biometric is simulated with animation; real implementation would use WebAuthn API.
- QR scan is simulated; real implementation would use a camera-based QR reader library.
