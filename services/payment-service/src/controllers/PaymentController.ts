import { Request, Response } from 'express';
import { Pool } from 'pg';
import { PaymentService } from '../services/PaymentService';
import { InvoiceService } from '../services/InvoiceService';
import { logger } from '../utils/logger';
import { 
  CreatePaymentRequest, 
  PaymentStatus, 
  PaymentMethod,
  Payment,
  Invoice
} from '@jewelry-shop/shared/types';

export class PaymentController {
  private paymentService: PaymentService;
  private invoiceService: InvoiceService;

  constructor(db: Pool) {
    this.paymentService = new PaymentService(db);
    this.invoiceService = new InvoiceService(db);
  }

  // Create payment intent/order
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentData = req.body as CreatePaymentRequest;
      const userId = (req as any).user.id;

      // Validate payment data
      if (!paymentData.order_id || !paymentData.amount || !paymentData.payment_method) {
        res.status(400).json({
          success: false,
          error: 'Order ID, amount, and payment method are required'
        });
        return;
      }

      paymentData.created_by = userId;

      const payment = await this.paymentService.createPayment(paymentData);

      logger.info(`Payment created: ${payment.payment_id} for order ${paymentData.order_id} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully'
      });
    } catch (error) {
      logger.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get payment by ID
  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const payment = await this.paymentService.getPaymentById(id);

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
        return;
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get payments for an order
  async getOrderPayments(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      const payments = await this.paymentService.getPaymentsByOrderId(parseInt(orderId));

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      logger.error('Error fetching order payments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payments',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update payment status (usually called by webhooks)
  async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, gateway_transaction_id, gateway_response } = req.body;

      if (!status || !Object.values(PaymentStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Valid status is required'
        });
        return;
      }

      const updatedPayment = await this.paymentService.updatePaymentStatus(
        id, 
        status, 
        gateway_transaction_id, 
        gateway_response
      );

      if (!updatedPayment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
        return;
      }

      logger.info(`Payment status updated: ${id} -> ${status}`);

      res.json({
        success: true,
        data: updatedPayment,
        message: 'Payment status updated successfully'
      });
    } catch (error) {
      logger.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update payment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Process refund
  async processRefund(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      const userId = (req as any).user.id;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid refund amount is required'
        });
        return;
      }

      const refund = await this.paymentService.processRefund(id, amount, reason, userId);

      logger.info(`Refund processed: ${refund.refund_id} for payment ${id} by user ${userId}`);

      res.json({
        success: true,
        data: refund,
        message: 'Refund processed successfully'
      });
    } catch (error) {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process refund',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Generate invoice
  async generateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      const invoice = await this.invoiceService.generateInvoice(parseInt(orderId));

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice generated successfully'
      });
    } catch (error) {
      logger.error('Error generating invoice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate invoice',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get invoice by ID
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const invoice = await this.invoiceService.getInvoiceById(id);

      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
        return;
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch invoice',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Download invoice PDF
  async downloadInvoicePDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const invoicePdf = await this.invoiceService.generateInvoicePDF(id);

      if (!invoicePdf) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
      res.send(invoicePdf);

      logger.info(`Invoice PDF downloaded: ${id}`);
    } catch (error) {
      logger.error('Error downloading invoice PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download invoice PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Razorpay webhook handler
  async handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookBody = req.body;
      const webhookSignature = req.headers['x-razorpay-signature'] as string;

      // Verify webhook signature
      const isValid = await this.paymentService.verifyRazorpayWebhook(webhookBody, webhookSignature);

      if (!isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid webhook signature'
        });
        return;
      }

      // Process webhook event
      await this.paymentService.processRazorpayWebhook(webhookBody);

      logger.info('Razorpay webhook processed successfully');

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      logger.error('Error processing Razorpay webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Stripe webhook handler
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookBody = req.body;
      const webhookSignature = req.headers['stripe-signature'] as string;

      // Verify webhook signature
      const isValid = await this.paymentService.verifyStripeWebhook(webhookBody, webhookSignature);

      if (!isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid webhook signature'
        });
        return;
      }

      // Process webhook event
      await this.paymentService.processStripeWebhook(webhookBody);

      logger.info('Stripe webhook processed successfully');

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      logger.error('Error processing Stripe webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get payment statistics
  async getPaymentStats(req: Request, res: Response): Promise<void> {
    try {
      const { date_from, date_to } = req.query;

      const stats = await this.paymentService.getPaymentStats(
        date_from as string,
        date_to as string
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching payment stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}