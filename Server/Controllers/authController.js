// ============================================
// Auth Controller — ES Module Version
// ============================================

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/environment.js';
import { User, Fund, FundTransaction } from '../models/sql/index.js';
import { ActivityLog } from '../models/nosql/index.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

/* ─── Token generators ─────────────────────── */
const signAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

const logActivity = async (userId, action, description, meta = {}, req = null) => {
  try {
    await ActivityLog.create({
      user_id: userId,
      action,
      category: 'auth',
      description,
      metadata: meta,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent'],
      status: 'success',
    });
  } catch (e) {
    logger.warn('Activity log failed', { error: e.message });
  }
};

/* ════════════════════════════════════════════
   REGISTER
════════════════════════════════════════════ */
const register = async (req, res) => {
  try {
    const {
      first_name, last_name, email, password,
      phone, organization_name, organization_type,
      designation, pan_number, employee_id,
    } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return ApiResponse.conflict(res, 'Email already exists.');
    }

    const user = await User.create({
      first_name, last_name, email,
      password,
      phone, organization_name, organization_type,
      designation, pan_number, employee_id,
      last_login_at: new Date(),
      last_login_ip: req.ip,
    });

    const fund = await Fund.create({
      user_id: user.id,
      available_balance: env.DEFAULT_BALANCE,
      total_balance: env.DEFAULT_BALANCE,
      used_margin: 0,
      blocked_amount: 0,
    });

    await FundTransaction.create({
      user_id: user.id,
      transaction_type: 'deposit',
      amount: env.DEFAULT_BALANCE,
      credit_debit: 'credit',
      balance_after: env.DEFAULT_BALANCE,
      description: 'Initial virtual trading capital',
      reference_type: 'system',
      status: 'completed',
    });

    const access_token = signAccessToken(user.id, user.role);
    const refresh_token = signRefreshToken(user.id);

    await user.update({ refresh_token });

    await logActivity(user.id, 'register', `User registered: ${email}`, {}, req);

    res.cookie('access_token', access_token, {
      httpOnly: env.COOKIE_HTTPONLY,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAMESITE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.created(res, {
      message: 'Account created successfully!',
      data: {
        user: user.toSafeObject(),
        fund: { available_balance: fund.available_balance },
        access_token,
        refresh_token,
      },
    });
  } catch (error) {
    logger.error('Register error:', error.message);
    return ApiResponse.serverError(res);
  }
};

/* ════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════ */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return ApiResponse.unauthorized(res, 'Invalid credentials.');

    const valid = await user.comparePassword(password);
    if (!valid) return ApiResponse.unauthorized(res, 'Invalid password.');

    const access_token = signAccessToken(user.id, user.role);
    const refresh_token = signRefreshToken(user.id);

    await user.update({ refresh_token });

    const fund = await Fund.findOne({ where: { user_id: user.id } });

    await logActivity(user.id, 'login', 'User logged in', {}, req);

    return ApiResponse.success(res, {
      message: 'Login successful',
      data: {
        user: user.toSafeObject(),
        fund,
        access_token,
        refresh_token,
      },
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    return ApiResponse.serverError(res);
  }
};

/* ════════════════════════════════════════════
   LOGOUT
════════════════════════════════════════════ */
const logout = async (req, res) => {
  try {
    await req.user.update({ refresh_token: null });
    res.clearCookie('access_token');

    return ApiResponse.success(res, { message: 'Logged out' });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
};

/* ════════════════════════════════════════════
   REFRESH TOKEN
════════════════════════════════════════════ */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    const decoded = jwt.verify(refresh_token, env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    const access_token = signAccessToken(user.id, user.role);
    const new_refresh = signRefreshToken(user.id);

    await user.update({ refresh_token: new_refresh });

    return ApiResponse.success(res, {
      data: { access_token, refresh_token: new_refresh },
    });
  } catch {
    return ApiResponse.unauthorized(res);
  }
};

/* ════════════════════════════════════════════
   PROFILE
════════════════════════════════════════════ */
const getProfile = async (req, res) => {
  return ApiResponse.success(res, {
    data: req.user.toSafeObject(),
  });
};

const updateProfile = async (req, res) => {
  await req.user.update(req.body);
  return ApiResponse.success(res, { message: 'Profile updated' });
};

const changePassword = async (req, res) => {
  const { new_password } = req.body;
  await req.user.update({ password: new_password });

  return ApiResponse.success(res, { message: 'Password updated' });
};

/* ─── FINAL EXPORT ────────────────────────── */
export default {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
};