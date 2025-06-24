import { Router } from 'express';
import { Pool } from 'pg';
import { OrderController } from '../controllers/OrderController';
import { validateOrderCreation, validateOrderUpdate, validateStatusUpdate } from '../middleware/validation';

const router = Router();

// Get database instance (will be injected when routes are used)
let db: Pool;

export const initializeOrderRoutes = (database: Pool) => {
  db = database;
  return router;
};

// Initialize controller
const getController = () => new OrderController(db);

// Get all orders with filtering and pagination
router.get('/', async (req, res) => {
  const controller = getController();
  await controller.getOrders(req, res);
});

// Get order statistics
router.get('/stats', async (req, res) => {
  const controller = getController();
  await controller.getOrderStats(req, res);
});

// Get single order by ID
router.get('/:id', async (req, res) => {
  const controller = getController();
  await controller.getOrderById(req, res);
});

// Create new order
router.post('/', validateOrderCreation, async (req, res) => {
  const controller = getController();
  await controller.createOrder(req, res);
});

// Update existing order
router.put('/:id', validateOrderUpdate, async (req, res) => {
  const controller = getController();
  await controller.updateOrder(req, res);
});

// Update order status
router.put('/:id/status', validateStatusUpdate, async (req, res) => {
  const controller = getController();
  await controller.updateOrderStatus(req, res);
});

// Add customization to order
router.post('/:id/customization', async (req, res) => {
  const controller = getController();
  await controller.addCustomization(req, res);
});

// Generate invoice for order
router.get('/:id/invoice', async (req, res) => {
  const controller = getController();
  await controller.generateInvoice(req, res);
});

// Cancel order
router.put('/:id/cancel', async (req, res) => {
  const controller = getController();
  await controller.cancelOrder(req, res);
});

export default router;