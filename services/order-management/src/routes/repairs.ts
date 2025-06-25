import { Router } from 'express';
import { Pool } from 'pg';
import { RepairController } from '../controllers/RepairController';
import { validateRepairCreation, validateRepairUpdate, validateRepairStatusUpdate } from '../middleware/validation';

const router = Router();

// Get database instance (will be injected when routes are used)
let db: Pool;

export const initializeRepairRoutes = (database: Pool) => {
  db = database;
  return router;
};

// Initialize controller
const getController = () => new RepairController(db);

// Get all repair requests with filtering and pagination
router.get('/', async (req, res) => {
  const controller = getController();
  await controller.getRepairs(req, res);
});

// Get repair queue for technicians
router.get('/queue', async (req, res) => {
  const controller = getController();
  await controller.getRepairQueue(req, res);
});

// Get single repair by ID
router.get('/:id', async (req, res) => {
  const controller = getController();
  await controller.getRepairById(req, res);
});

// Create new repair request
router.post('/', validateRepairCreation, async (req, res) => {
  const controller = getController();
  await controller.createRepair(req, res);
});

// Update repair details
router.put('/:id', validateRepairUpdate, async (req, res) => {
  const controller = getController();
  await controller.updateRepair(req, res);
});

// Update repair status
router.put('/:id/status', validateRepairStatusUpdate, async (req, res) => {
  const controller = getController();
  await controller.updateRepairStatus(req, res);
});

// Upload repair photos
router.post('/:id/photos', async (req, res) => {
  const controller = getController();
  await controller.uploadRepairPhotos(req, res);
});

// Get repair photos
router.get('/:id/photos', async (req, res) => {
  const controller = getController();
  await controller.getRepairPhotos(req, res);
});

// Get repair status history
router.get('/:id/history', async (req, res) => {
  const controller = getController();
  await controller.getRepairStatusHistory(req, res);
});

// Update repair assessment
router.put('/:id/assessment', async (req, res) => {
  const controller = getController();
  await controller.updateRepairAssessment(req, res);
});

// Approve repair (customer approval)
router.put('/:id/approve', async (req, res) => {
  const controller = getController();
  await controller.approveRepair(req, res);
});

export default router;