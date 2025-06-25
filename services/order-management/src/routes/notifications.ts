import { Router } from 'express';
import { Pool } from 'pg';
import { NotificationController } from '../controllers/NotificationController';
import { validateNotificationRequest } from '../middleware/validation';

const router = Router();

// Get database instance (will be injected when routes are used)
let db: Pool;

export const initializeNotificationRoutes = (database: Pool) => {
  db = database;
  return router;
};

// Initialize controller
const getController = () => new NotificationController(db);

// Send custom notification
router.post('/send', validateNotificationRequest, async (req, res) => {
  const controller = getController();
  await controller.sendCustomNotification(req, res);
});

// Get notification history for an order
router.get('/order/:id/history', async (req, res) => {
  const controller = getController();
  await controller.getOrderNotificationHistory(req, res);
});

// Get notification history for a repair
router.get('/repair/:id/history', async (req, res) => {
  const controller = getController();
  await controller.getRepairNotificationHistory(req, res);
});

// Get notification history for a return
router.get('/return/:id/history', async (req, res) => {
  const controller = getController();
  await controller.getReturnNotificationHistory(req, res);
});

// Get notification templates
router.get('/templates', async (req, res) => {
  const controller = getController();
  await controller.getNotificationTemplates(req, res);
});

// Update notification template
router.put('/templates/:id', async (req, res) => {
  const controller = getController();
  await controller.updateNotificationTemplate(req, res);
});

export default router;