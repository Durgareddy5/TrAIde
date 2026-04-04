import express from 'express';
import ctrl from '../Controllers/marketController.js';
import { authenticate, optionalAuth } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Market status — public
router.get('/status',       ctrl.getMarketStatus);
router.get('/indices',      authenticate, ctrl.getAllIndices);
router.get('/top-gainers',  authenticate, ctrl.getTopGainers);
router.get('/top-losers',   authenticate, ctrl.getTopLosers);
router.get('/most-active',  authenticate, ctrl.getMostActive);

// Stock routes (mounted at /stocks also via alias in routes/index.js)
router.get('/search',           authenticate, ctrl.searchStocks);
router.get('/:symbol',          authenticate, ctrl.getStockDetails);
router.get('/:symbol/quote',    authenticate, ctrl.getStockQuote);

export default router;