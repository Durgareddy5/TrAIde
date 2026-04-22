import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toFloat = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const environment = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: toInt(process.env.PORT, 5001),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // MySQL Configuration
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_PORT: toInt(process.env.MYSQL_PORT, 3306),
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'stock_trading_db',
  MYSQL_USER: process.env.MYSQL_USER || 'root',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
  MYSQL_POOL_MAX: toInt(process.env.MYSQL_POOL_MAX, 20),
  MYSQL_POOL_MIN: toInt(process.env.MYSQL_POOL_MIN, 5),

  // MongoDB Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_trading_mongo',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Cookie Configuration
  COOKIE_SECRET: process.env.COOKIE_SECRET || '',
  COOKIE_SECURE: process.env.NODE_ENV === 'production',
  COOKIE_HTTPONLY: true,
  COOKIE_SAMESITE: 'strict',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX: toInt(process.env.RATE_LIMIT_MAX, 100),

  // Default Paper Trading Balance (in INR)
  DEFAULT_BALANCE: toFloat(
    process.env.DEFAULT_VIRTUAL_BALANCE ?? process.env.DEFAULT_BALANCE,
    10000000
  ),

  // Indian Market Constants
  MARKET_OPEN_HOUR: 9,
  MARKET_OPEN_MINUTE: 15,
  MARKET_CLOSE_HOUR: 15,
  MARKET_CLOSE_MINUTE: 30,
  MARKET_TIMEZONE: 'Asia/Kolkata',

  // Kotak Trade API
  KOTAK_ACCESS_TOKEN: process.env.KOTAK_ACCESS_TOKEN || '',
  KOTAK_MOBILE_NUMBER: process.env.KOTAK_MOBILE_NUMBER || '',
  KOTAK_UCC: process.env.KOTAK_UCC || '',
  KOTAK_MPIN: process.env.KOTAK_MPIN || '',
  KOTAK_TOTP_SECRET: process.env.KOTAK_TOTP_SECRET || '',
  KOTAK_NEO_FIN_KEY: process.env.KOTAK_NEO_FIN_KEY || 'neotradeapi',
  KOTAK_LOGIN_BASE_URL: process.env.KOTAK_LOGIN_BASE_URL || 'https://mis.kotaksecurities.com',
  KOTAK_DEFAULT_BASE_URL: process.env.KOTAK_DEFAULT_BASE_URL || '',
  KOTAK_SCRIP_CACHE_DIR: process.env.KOTAK_SCRIP_CACHE_DIR || './cache/kotak',
  KOTAK_SESSION_STORAGE: process.env.KOTAK_SESSION_STORAGE || 'memory',
};

const validateEnvironment = () => {
  const requiredInProduction = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MYSQL_PASSWORD',
    'MONGODB_URI',
    'COOKIE_SECRET',
    'KOTAK_ACCESS_TOKEN',
    'KOTAK_MOBILE_NUMBER',
    'KOTAK_UCC',
    'KOTAK_MPIN',
  ];

  if (environment.NODE_ENV === 'production') {
    const missing = requiredInProduction.filter((key) => !environment[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables in production: ${missing.join(', ')}`
      );
    }
  }
};

validateEnvironment();

export default environment;
