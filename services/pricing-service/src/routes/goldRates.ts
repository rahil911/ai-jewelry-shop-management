import { Router } from 'express';
import { GoldRateController } from '../controllers/GoldRateController';

const router = Router();
const goldRateController = new GoldRateController();

// Public routes - no authentication required for gold rates
router.get('/current', goldRateController.getCurrentRates);
router.get('/history', goldRateController.getGoldRateHistory);

// Admin routes - require authentication (to be added when auth service is integrated)
router.post('/update', goldRateController.updateGoldRates);
router.post('/manual-update', goldRateController.manualRateUpdate);

export { router as goldRateRoutes };