// ============================================
// Validation Middleware — All route validations
// ============================================
import { body, param, query, validationResult } from 'express-validator';
import ApiResponse from '../utils/ApiResponse.js';

// ─── Handle validation result ─────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
      value:   e.value,
    }));
    return ApiResponse.validationError(res, formatted);
  }
  next();
};

// ─── Auth ─────────────────────────────────
const validateRegister = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name required')
    .isLength({ min: 2, max: 50 }).withMessage('2-50 chars'),

  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name required')
    .isLength({ min: 2, max: 50 }).withMessage('2-50 chars'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email required')
    .isEmail().withMessage('Invalid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password required')
    .isLength({ min: 8 }).withMessage('Min 8 chars')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Must include upper, lower, number & special char'),

  body('phone')
    .optional()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Invalid phone number'),

  body('pan_number')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN (e.g. ABCDE1234F)'),

  body('organization_name')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Max 150 characters'),

  body('organization_type')
    .optional()
    .isIn([
      'private_limited',
      'public_limited',
      'llp',
      'partnership',
      'proprietorship',
      'huf',
      'trust',
      'other'
    ])
    .withMessage('Invalid organization type'),

  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Max 100 characters'),

  body('employee_id')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Max 50 characters'),

  // ❗ Do NOT validate confirm_password (frontend only)

  handleValidationErrors,
];

const validateLogin = [
  body('email').trim().notEmpty().withMessage('Email required').isEmail(),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors,
];

const validatePasswordChange = [
  body('current_password').notEmpty().withMessage('Current password required'),
  body('new_password').notEmpty().withMessage('New password required')
    .isLength({ min:8 }).withMessage('Min 8 chars')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Must include upper, lower, number & special char'),
  handleValidationErrors,
];

// ─── Orders ───────────────────────────────
const validatePlaceOrder = [
  body('symbol').trim().notEmpty().withMessage('Symbol required')
    .isLength({ max:20 }).toUpperCase(),
  body('exchange').optional().isIn(['NSE','BSE']).withMessage('NSE or BSE only'),
  body('transaction_type').notEmpty().withMessage('transaction_type required')
    .isIn(['buy','sell']).withMessage('buy or sell only'),
  body('order_type').notEmpty().withMessage('order_type required')
    .isIn(['market','limit','stop_loss','stop_limit']),
  body('product_type').optional().isIn(['CNC','MIS','NRML']),
  body('quantity').notEmpty().withMessage('Quantity required')
    .isInt({ min:1 }).withMessage('Min 1').toInt(),
  body('price').optional().isFloat({ min:0.01 }).withMessage('Invalid price').toFloat(),
  body('trigger_price').optional().isFloat({ min:0.01 }).toFloat(),
  body('validity').optional().isIn(['DAY','IOC','GTC','GTD']),
  handleValidationErrors,
];

const validateModifyOrder = [
  param('id').notEmpty().isUUID().withMessage('Invalid order ID'),
  body('quantity').optional().isInt({ min:1 }).toInt(),
  body('price').optional().isFloat({ min:0.01 }).toFloat(),
  body('trigger_price').optional().isFloat({ min:0.01 }).toFloat(),
  body('validity').optional().isIn(['DAY','IOC','GTC','GTD']),
  handleValidationErrors,
];

// ─── Watchlist ────────────────────────────
const validateCreateWatchlist = [
  body('name').trim().notEmpty().withMessage('Name required')
    .isLength({ min:1, max:50 }).withMessage('1-50 chars'),
  body('color').optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
  handleValidationErrors,
];

const validateAddWatchlistItem = [
  body('symbol').trim().notEmpty().withMessage('Symbol required').toUpperCase(),
  body('exchange').optional().isIn(['NSE','BSE']),
  handleValidationErrors,
];

// ─── Funds ────────────────────────────────
const validateFundAmount = [
  body('amount').notEmpty().withMessage('Amount required')
    .isFloat({ min:0.01 }).withMessage('Must be positive').toFloat(),
  handleValidationErrors,
];

export {
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validatePlaceOrder,
  validateModifyOrder,
  validateCreateWatchlist,
  validateAddWatchlistItem,
  validateFundAmount,
  handleValidationErrors,
};