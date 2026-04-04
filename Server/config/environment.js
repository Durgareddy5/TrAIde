// apps/api/config/environment.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the api directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const environment = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // MySQL Configuration
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_PORT: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'stock_trading_db',
  MYSQL_USER: process.env.MYSQL_USER || 'root',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || 'Kanna@25',
  MYSQL_POOL_MAX: parseInt(process.env.MYSQL_POOL_MAX, 10) || 20,
  MYSQL_POOL_MIN: parseInt(process.env.MYSQL_POOL_MIN, 10) || 5,

  // MongoDB Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_trading_mongo',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'protrade-super-secret-jwt-key-change-in-production-2025',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'protrade-refresh-secret-key-change-in-production-2025',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Cookie Configuration
  COOKIE_SECURE: process.env.NODE_ENV === 'production',
  COOKIE_HTTPONLY: true,
  COOKIE_SAMESITE: 'strict',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // Default Paper Trading Balance (in INR)
  DEFAULT_BALANCE: parseFloat(process.env.DEFAULT_BALANCE) || 10000000, // ₹1 Crore default

  // Indian Market Constants
  MARKET_OPEN_HOUR: 9,
  MARKET_OPEN_MINUTE: 15,
  MARKET_CLOSE_HOUR: 15,
  MARKET_CLOSE_MINUTE: 30,
  MARKET_TIMEZONE: 'Asia/Kolkata',
};

// Validate critical environment variables in production
const validateEnvironment = () => {
  const requiredInProduction = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MYSQL_PASSWORD',
    'MONGODB_URI',
  ];

  if (environment.NODE_ENV === 'production') {
    const missing = requiredInProduction.filter(
      (key) => !process.env[key]
    );
    if (missing.length > 0) {
      throw new Error(
        `❌ Missing required environment variables in production: ${missing.join(', ')}`
      );
    }
  }
};

validateEnvironment();

export default environment;