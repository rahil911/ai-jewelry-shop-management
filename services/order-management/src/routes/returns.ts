import { Router } from 'express';
import { Pool } from 'pg';
import { ReturnController } from '../controllers/ReturnController';
import { validateReturnCreation, validateReturnStatusUpdate } from '../middleware/validation';

const router = Router();

// Get database instance (will be injected when routes are used)
let db: Pool;

export const initializeReturnRoutes = (database: Pool) => {
  db = database;
  return router;
};

// Initialize controller
const getController = () => new ReturnController(db);

// Get all return requests with filtering and pagination
router.get('/', async (req, res) => {
  const controller = getController();
  await controller.getReturnRequests(req, res);
});

// Get single return by ID
router.get('/:id', async (req, res) => {
  const controller = getController();
  await controller.getReturnById(req, res);
});

// Create new return request
router.post('/', validateReturnCreation, async (req, res) => {
  const controller = getController();
  await controller.createReturnRequest(req, res);
});

// Approve return request
router.put('/:id/approve', async (req, res) => {
  const controller = getController();
  await controller.approveReturn(req, res);
});

// Reject return request
router.put('/:id/reject', async (req, res) => {
  const controller = getController();
  await controller.rejectReturn(req, res);
});

// Process return (handle refund and inventory)
router.put('/:id/process', async (req, res) => {
  const controller = getController();
  await controller.processReturn(req, res);
});

// Update return status
router.put('/:id/status', validateReturnStatusUpdate, async (req, res) => {
  const controller = getController();
  await controller.updateReturnStatus(req, res);
});

// Get return status history
router.get('/:id/history', async (req, res) => {
  const controller = getController();
  await controller.getReturnStatusHistory(req, res);
});

export default router;