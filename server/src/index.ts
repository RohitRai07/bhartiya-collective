import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { setSecurityHeaders } from './middleware/securityHeaders.middleware';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';

export const app = express();

// 1. Security Headers
app.use(setSecurityHeaders);

// 2. CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://rohitrai07.github.io',
  'https://bharatcollective.org',
  'https://www.bharatcollective.org',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or allowed origins
    if (!origin || allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
      callback(null, true);
    } else {
      callback(new Error('CORS request blocked by security policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Client-App', 'X-Client-Version'],
}));

// 3. Body Parsers with payload size limits (prevents DoS via large JSON payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Bharat Collective Backend API',
    security: {
      twoFactorEnabled: true,
      rateLimitingActive: true,
    }
  });
});

// 5. Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notification', notificationRoutes);

// 6. 404 Handler for unknown API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' });
});

// 7. Production-grade Error handling middleware (No stack trace exposure)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log internally for debugging, never leak details to client
  console.error('[Internal Server Error]', err.message || err);
  
  if (err.message && err.message.includes('CORS')) {
    res.status(403).json({ error: 'Cross-Origin Request Blocked', code: 'CORS_ERROR' });
    return;
  }

  res.status(500).json({ 
    error: 'An internal server error occurred. Please contact the administrator.', 
    code: 'INTERNAL_ERROR' 
  });
});

// 8. Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`=================================`);
    console.log(`🚀 Bharat Collective Backend running on port ${config.port}`);
    console.log(`🔐 Admin Security: 2FA & Rate Limiting ACTIVE`);
    console.log(`=================================`);
  });
}
