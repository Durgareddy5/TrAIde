// ============================================
// ProTrade Institutional — Server Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

import env from './config/environment.js';
import { initializeDatabases } from './config/database.js';

// Load env variables
dotenv.config();

// Import all SQL models (side effects)
import './Models/sql/index.js';

// Import all NoSQL models
import './Models/nosql/index.js';

// Import routes
import routes from './Routes/index.js';

const app = express();

// ─── Security Middleware ───────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── Rate Limiting ─────────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

app.use('/api', limiter);

// ─── Body Parsing ──────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ───────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Health Check ──────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ProTrade Institutional API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ────────────────────────────
app.use(env.API_PREFIX, routes);

// ─── 404 handler ───────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// ─── Global Error Handler ──────────────────
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─── Start Server ──────────────────────────
const startServer = async () => {
  try {
    await initializeDatabases();

    app.listen(env.PORT, () => {
      console.log('\n═══════════════════════════════════════════════');
      console.log('  🚀 ProTrade Institutional API Server');
      console.log('═══════════════════════════════════════════════');
      console.log(`  ✅ Server   : http://localhost:${env.PORT}`);
      console.log(`  ✅ API Base : http://localhost:${env.PORT}${env.API_PREFIX}`);
      console.log(`  ✅ Health   : http://localhost:${env.PORT}/health`);
      console.log(`  📦 Env      : ${env.NODE_ENV}`);
      console.log('═══════════════════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;