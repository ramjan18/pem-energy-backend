import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './utils/database.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import meterRoutes from './routes/meterRoutes.js';
import readingRoutes from './routes/readingRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB
await connectDB();

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/readings', readingRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PEM Energy Monitoring System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      meters: '/api/meters',
      readings: '/api/readings',
      health: '/api/health',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║  PEM Energy Monitoring System Backend         ║
║  Server running on http://localhost:${PORT}     ║
╚═══════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

export default app;
