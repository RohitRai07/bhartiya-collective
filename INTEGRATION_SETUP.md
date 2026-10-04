# Bharat Collective Foundation - Integration Setup Guide

This document outlines the final steps to activate the production integrations for SMS, Email, WhatsApp, and Razorpay Payments. The core business logic and modular services are completely implemented. 

## 1. Architecture Overview

Because your existing React application runs entirely in the browser (client-side SPA), it is not secure to store API secrets (like Razorpay secret keys, WhatsApp tokens) on the frontend. Doing so would allow anyone to steal your keys and charge money or send spam from your accounts.

To solve this, I have created a fully configured **Node.js/Express Backend Server** located in the \`server/\` folder.
Your frontend has been configured to talk to this backend using \`BackendNotificationService\` and \`BackendPaymentService\`.

---

## 2. Setting up the Backend

1. **Open a terminal** and navigate to the server folder:
   \`\`\`bash
   cd server
   \`\`\`
2. **Install dependencies** (already done, but good to know):
   \`\`\`bash
   npm install
   \`\`\`
3. **Configure Environment Variables:**
   Rename the \`.env.example\` file to \`.env\` in the \`server/\` folder.
   Fill in your API keys (see sections below for details).
4. **Start the server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   *The server will run on port 5000.*

---

## 3. Required API Keys & Credentials

Below is the exact list of details you need to procure from your providers before going live.

### A. SMS Provider Configuration
*(Supports providers like Twilio, MSG91, Textlocal, AWS SNS)*

You need to add the following to \`server/.env\`:
- \`SMS_API_URL\`: Your provider's POST endpoint
- \`SMS_API_KEY\`: Your authentication token or key
- \`SMS_SENDER_ID\`: Your 6-character DLT approved Sender ID (e.g., \`BCFNDN\`)
- \`SMS_TEMPLATE_ID_SHORTLIST\`: The exact Template ID for the "Application Shortlisted" message
- \`SMS_TEMPLATE_ID_SELECT\`: Template ID for "Application Selected"
- \`SMS_TEMPLATE_ID_GENERAL\`: Template ID for general content publishing notifications

**Note on DLT (India):** If you are sending SMS to Indian numbers, you must register your templates and sender ID on a DLT platform (like Jio, Airtel, or Videocon) before the provider will allow the messages to go through.

### B. Email Provider (SMTP) Configuration
*(Supports SendGrid, Amazon SES, Mailgun, or standard SMTP)*

You need to add the following to \`server/.env\`:
- \`EMAIL_HOST\`: e.g., \`smtp.sendgrid.net\`
- \`EMAIL_PORT\`: e.g., \`587\`
- \`EMAIL_SECURE\`: \`false\` for 587, \`true\` for 465
- \`EMAIL_USER\`: Your SMTP username (often \`apikey\` for SendGrid)
- \`EMAIL_PASS\`: Your SMTP password/API key
- \`EMAIL_FROM\`: Exact email address you verified with the provider (e.g., \`noreply@bharatcollective.org\`)

### C. WhatsApp Business API Configuration
*(Requires a Meta Developer Account and WhatsApp Business Account)*

You need to add the following to \`server/.env\`:
- \`WHATSAPP_PHONE_NUMBER_ID\`: Your registered WhatsApp phone number ID
- \`WHATSAPP_API_KEY\`: A permanent system user access token from Meta Business Settings
- \`WHATSAPP_BUSINESS_ACCOUNT_ID\`: Your WABA ID
- \`WHATSAPP_TEMPLATE_SHORTLIST\`: The EXACT name of the approved template in your WhatsApp Manager
- \`WHATSAPP_TEMPLATE_PUBLISH\`: The EXACT name of the approved template for publishing alerts

**Crucial:** WhatsApp requires all outbound templates to be pre-approved by Meta before you can send them.

### D. Razorpay Payment Configuration

You need to add the following to \`server/.env\`:
- \`RAZORPAY_KEY_ID\`: Your public Razorpay Key (Starts with \`rzp_test_\` or \`rzp_live_\`)
- \`RAZORPAY_KEY_SECRET\`: Your private Razorpay Secret
- \`RAZORPAY_WEBHOOK_SECRET\`: The secret you configure in the Razorpay Webhooks dashboard.

*To configure Webhooks in Razorpay:*
1. Go to Razorpay Dashboard -> Account & Settings -> Webhooks -> Add New Webhook
2. Webhook URL: \`https://your-backend-domain.com/api/payment/webhook\`
3. Secret: Enter the value of \`RAZORPAY_WEBHOOK_SECRET\`
4. Active Events: Select \`payment.captured\` and \`payment.failed\`.

---

## 4. UI Integrations Included

I have built and integrated the following inside your React application:

1. **Publish & Notify Flow (\`PublishNotifyModal.tsx\`)**
   When publishing content, you will be prompted to select SMS, Email, or WhatsApp. The system will retrieve active subscribers and broadcast the notification via the backend.
   *(Integration note: Hook this modal into the \`AdminPreviewPage.tsx\` near the 'Publish' buttons)*

2. **Admin Gateway Integration (\`SendNotificationModal.tsx\`)**
   The existing Send Notification modal has been wired to the backend API. It now pushes the message securely to the server queue rather than relying on frontend mocks.

3. **Backend Services Architecture (\`server/src/services/\`)**
   Fully decoupled, object-oriented services for Email, SMS, WhatsApp, and Payments. The Notification Service orchestrates them, ensuring that if one channel fails, it doesn't crash the main app.

## 5. Deployment Recommendation

Because this app uses GitHub Pages for the frontend, you cannot run the Node.js backend there. You will need to deploy the \`server/\` folder to a service like **Render, Railway, Heroku, or DigitalOcean App Platform**. 

Once the backend is deployed, simply update the \`VITE_API_BASE_URL\` in your frontend \`.env\` to point to your new backend URL (e.g., \`https://bcf-backend.onrender.com/api\`), and re-deploy your frontend to GitHub Pages.
