import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { validateRequest } from '../middleware/validation';
import { jewelryItemSchema } from '@jewelry-shop/shared';

const router = Router();
const inventoryController = new InventoryController();

// GET routes
router.get('/', inventoryController.getAllItems);
router.get('/valuation', inventoryController.getInventoryValuation);
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/:id', inventoryController.getItemById);

// POST routes
router.post('/', validateRequest(jewelryItemSchema), inventoryController.createItem);

// PUT routes
router.put('/:id', inventoryController.updateItem);
router.put('/:id/stock', inventoryController.updateStock);

// DELETE routes
router.delete('/:id', inventoryController.deleteItem);

export { router as inventoryRoutes };