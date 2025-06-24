import { Router } from 'express';
import { Pool } from 'pg';
import { PaymentController } from '../controllers/PaymentController';

const router = Router();
let db: Pool;

export const initializePaymentRoutes = (database: Pool) => {
  db = database;
  return router;
};

const getController = () => new PaymentController(db);

// Webhook endpoints (no auth required)
router.post('/webhooks/razorpay', async (req, res) => {
  const controller = getController();
  await controller.handleRazorpayWebhook(req, res);
});

router.post('/webhooks/stripe', async (req, res) => {
  const controller = getController();
  await controller.handleStripeWebhook(req, res);
});

// Protected payment endpoints
router.post('/', async (req, res) => {
  const controller = getController();
  await controller.createPayment(req, res);
});

router.get('/stats', async (req, res) => {
  const controller = getController();
  await controller.getPaymentStats(req, res);
});

router.get('/:id', async (req, res) => {
  const controller = getController();
  await controller.getPaymentById(req, res);
});

router.get('/order/:orderId', async (req, res) => {
  const controller = getController();
  await controller.getOrderPayments(req, res);
});

router.put('/:id/status', async (req, res) => {
  const controller = getController();
  await controller.updatePaymentStatus(req, res);
});

router.post('/:id/refund', async (req, res) => {
  const controller = getController();
  await controller.processRefund(req, res);
});

// Invoice endpoints
router.post('/invoices/:orderId', async (req, res) => {
  const controller = getController();
  await controller.generateInvoice(req, res);
});

router.get('/invoices/:id', async (req, res) => {
  const controller = getController();
  await controller.getInvoiceById(req, res);
});

router.get('/invoices/:id/pdf', async (req, res) => {
  const controller = getController();
  await controller.downloadInvoicePDF(req, res);
});

export default router;