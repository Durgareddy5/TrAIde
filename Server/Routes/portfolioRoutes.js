import express from 'express';
import ctrl from '../Controllers/portfolioController.js';
import { authenticate } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/holdings',  ctrl.getHoldings);
router.get('/positions', ctrl.getPositions);
router.get('/summary',   ctrl.getPortfolioSummary);

export default router;