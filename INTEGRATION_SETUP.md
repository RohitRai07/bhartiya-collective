# Bharat Collective Foundation - Production Security & Integration Setup Guide

This document outlines the production security architecture and final configuration required to go live with the Bharat Collective Admin Portal and integrations for SMS, Email, WhatsApp, and Razorpay Payments.

---

## 1. Production Security Architecture

The Admin Portal is protected at the **backend API and route level** using layered security:

```text
Request
  ↓
Security Headers (HSTS, No-Sniff, Anti-Clickjacking)
  ↓
CORS Whitelist
  ↓
Rate Limiting (Sliding Window per IP)
  ↓
Authentication (Cryptographic JWT Bearer Token)
  ↓
2FA Verification Check (twoFactorVerified === true)
  ↓
Role Authorization (role === 'admin')
  ↓
Input Validation & File Upload Sanitization
  ↓
Business Logic (Protected Admin Operations)
```

### Key Security Guarantees:
- **No Direct URL Access:** Directly entering the `/admin` URL requires valid backend authentication. Unauthenticated requests are redirected to the Login + 2FA gateway.
- **Backend API Protection:** Hiding buttons or UI tabs does not grant access. Protected APIs reject unauthenticated requests with `401 Unauthorized` and non-admin tokens with `403 Forbidden`.
- **Mandatory 2FA:** Credentials validation only initiates a 2FA challenge. No full administrative session is issued until a valid 6-digit OTP is verified.
- **Zero Bypasses:** No hardcoded passwords, master passwords, or universal OTP codes (`123456`) exist anywhere in the production codebase.
- **Cryptographic Security:** OTP generation uses `crypto.randomInt()`, password hashing uses PBKDF2 (SHA-512, 100,000 iterations), and tokens use HMAC-SHA256 signatures with constant-time equality checks.
- **Session Security:** Features idle session timeout (30 minutes), absolute token expiration (2 hours), session revocation on logout, and IP/User-Agent tracking.

---

## 2. Setting up the Backend Server

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create `.env` inside the `server/` folder by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. **Start the server:**
   ```bash
   npm run dev
   ```
   *The server runs on port 5000 and is automatically proxied by Vite on port 3000.*

---

## 3. Production Configuration Still Required

Before launching to production, replace the placeholder values in `server/.env` with your actual provider credentials:

### A. Security & Cryptography
```env
SESSION_SECRET=your_production_session_secret_min_32_characters
OTP_SECRET=your_production_otp_secret_min_32_characters
ADMIN_EMAIL=admin@bharatcollective.org
ADMIN_INITIAL_PASSWORD=YourStrongAdminPassword2026!
```

### B. SMS Provider Configuration
```env
SMS_API_URL=https://api.smsprovider.com/v1/send
SMS_API_KEY=your_sms_api_key_here
SMS_SENDER_ID=BCFNDN
SMS_TEMPLATE_ID_OTP=your_otp_dlt_template_id
SMS_TEMPLATE_ID_SHORTLIST=your_shortlist_template_id
SMS_TEMPLATE_ID_SELECT=your_select_template_id
SMS_TEMPLATE_ID_GENERAL=your_general_template_id
```

### C. Email Provider (SMTP) Configuration
```env
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
EMAIL_FROM="Bharat Collective Foundation" <noreply@bharatcollective.org>
```

### D. WhatsApp Business API Configuration
```env
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_KEY=your_whatsapp_access_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_TEMPLATE_OTP=your_whatsapp_otp_template_name
WHATSAPP_TEMPLATE_SHORTLIST=your_whatsapp_shortlist_template_name
WHATSAPP_TEMPLATE_PUBLISH=your_whatsapp_publish_template_name
```

### E. Razorpay Payment Configuration
```env
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```
