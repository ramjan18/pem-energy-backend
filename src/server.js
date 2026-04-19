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
// CORS configuration - Allow requests from localhost and network IP addresses
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and 127.0.0.1 (with or without port)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow private network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    // Match patterns like http://192.168.1.x:5173, https://10.x.x.x:5173, etc.
    // Regex includes optional port numbers
    if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+)(:\d+)?/.test(origin)) {
      return callback(null, true);
    }
    
    // Allow from environment variable if set
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    console.log(`CORS: Origin ${origin} not allowed`);
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  PEM Energy Monitoring System Backend                         ║
║  Server running on http://0.0.0.0:${PORT}                       ║
║  Localhost: http://localhost:${PORT}                            ║
║  Network Access: http://<YOUR_IP>:${PORT}                       ║
║  (Replace <YOUR_IP> with your computer's local IP)            ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

export default app;
