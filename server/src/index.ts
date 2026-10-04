import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Middleware
app.use(cors());

// Razorpay webhook requires raw body for signature verification in some implementations,
// but for standard body access, we use json parser.
// In production you might separate webhook parsers.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/notification', notificationRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(config.port, () => {
  console.log(`=================================`);
  console.log(`🚀 Backend Server running on port ${config.port}`);
  console.log(`=================================`);
});
