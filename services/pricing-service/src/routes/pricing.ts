import { Router } from 'express';
import { PricingController } from '../controllers/PricingController';

const router = Router();
const pricingController = new PricingController();

// Price calculation endpoints
router.post('/calculate-item-price', pricingController.calculateItemPrice);
router.post('/calculate-custom-price', pricingController.calculateCustomPrice);
router.get('/price-breakdown/:itemId', pricingController.getPriceBreakdown);

// GST calculation
router.post('/calculate-gst', pricingController.calculateGST);

// Price comparison and analytics
router.get('/price-trends', pricingController.getPriceTrends);
router.get('/profit-margins', pricingController.getProfitMargins);

export { router as pricingRoutes };