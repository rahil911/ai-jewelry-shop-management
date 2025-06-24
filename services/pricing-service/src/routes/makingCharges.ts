import { Router } from 'express';
import { MakingChargesController } from '../controllers/MakingChargesController';

const router = Router();
const makingChargesController = new MakingChargesController();

// Get making charges configuration
router.get('/', makingChargesController.getMakingCharges);
router.get('/category/:categoryId', makingChargesController.getMakingChargesByCategory);
router.get('/purity/:purityId', makingChargesController.getMakingChargesByPurity);

// Admin routes for configuration
router.post('/', makingChargesController.createMakingChargesConfig);
router.put('/:id', makingChargesController.updateMakingChargesConfig);
router.delete('/:id', makingChargesController.deleteMakingChargesConfig);

export { router as makingChargesRoutes };