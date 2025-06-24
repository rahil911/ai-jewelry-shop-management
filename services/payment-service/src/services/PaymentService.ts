import { Pool } from 'pg';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import crypto from 'crypto';
import { 
  Payment, 
  CreatePaymentRequest, 
  PaymentStatus, 
  PaymentMethod,
  Refund,
  PaymentStats
} from '@jewelry-shop/shared/types';
import { logger } from '../utils/logger';

export class PaymentService {
  private razorpay: Razorpay | null = null;
  private stripe: Stripe | null = null;

  constructor(private db: Pool) {
    // Initialize payment gateways if configured
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }

    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
    }
  }

  // Generate unique payment ID
  private generatePaymentId(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    return `PAY${year}${month}${day}${timestamp}`;
  }

  // Create payment intent/order
  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Validate order exists
      const orderQuery = 'SELECT * FROM orders WHERE id = $1';
      const orderResult = await client.query(orderQuery, [paymentData.order_id]);
      
      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Generate payment ID
      const paymentId = this.generatePaymentId();

      // Create gateway payment intent/order
      let gatewayResponse: any = {};
      let gatewayOrderId: string = '';

      if (paymentData.payment_method === PaymentMethod.RAZORPAY && this.razorpay) {
        const razorpayOrder = await this.razorpay.orders.create({
          amount: Math.round(paymentData.amount * 100), // Convert to paise
          currency: paymentData.currency || 'INR',
          receipt: paymentId,
          notes: {
            order_id: paymentData.order_id.toString(),
            payment_id: paymentId
          }
        });
        
        gatewayResponse = razorpayOrder;
        gatewayOrderId = razorpayOrder.id;
      } else if (paymentData.payment_method === PaymentMethod.STRIPE && this.stripe) {
        const stripePaymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(paymentData.amount * 100), // Convert to paise/cents
          currency: paymentData.currency || 'inr',
          metadata: {
            order_id: paymentData.order_id.toString(),
            payment_id: paymentId
          }
        });
        
        gatewayResponse = stripePaymentIntent;
        gatewayOrderId = stripePaymentIntent.id;
      }

      // Insert payment record
      const paymentQuery = `
        INSERT INTO payments (
          payment_id, order_id, amount, currency, payment_method, status,
          gateway_order_id, gateway_response, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const paymentValues = [
        paymentId,
        paymentData.order_id,
        paymentData.amount,
        paymentData.currency || 'INR',
        paymentData.payment_method,
        PaymentStatus.PENDING,
        gatewayOrderId,
        JSON.stringify(gatewayResponse),
        paymentData.created_by
      ];

      const paymentResult = await client.query(paymentQuery, paymentValues);
      const payment = paymentResult.rows[0];

      await client.query('COMMIT');

      return {
        ...payment,
        amount: parseFloat(payment.amount),
        gateway_response: payment.gateway_response ? JSON.parse(payment.gateway_response) : null
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating payment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const query = `
      SELECT 
        p.*,
        o.order_number,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users c ON o.customer_id = c.id
      WHERE p.payment_id = $1
    `;

    const result = await this.db.query(query, [paymentId]);
    
    if (result.rows.length === 0) return null;

    const payment = result.rows[0];
    return {
      ...payment,
      amount: parseFloat(payment.amount),
      gateway_response: payment.gateway_response ? JSON.parse(payment.gateway_response) : null,
      order: {
        order_number: payment.order_number
      },
      customer: {
        first_name: payment.customer_first_name,
        last_name: payment.customer_last_name
      }
    };
  }

  // Get payments by order ID
  async getPaymentsByOrderId(orderId: number): Promise<Payment[]> {
    const query = `
      SELECT * FROM payments 
      WHERE order_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [orderId]);
    
    return result.rows.map(payment => ({
      ...payment,
      amount: parseFloat(payment.amount),
      gateway_response: payment.gateway_response ? JSON.parse(payment.gateway_response) : null
    }));
  }

  // Update payment status
  async updatePaymentStatus(
    paymentId: string, 
    status: PaymentStatus, 
    gatewayTransactionId?: string, 
    gatewayResponse?: any
  ): Promise<Payment | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Update payment
      const updateQuery = `
        UPDATE payments SET
          status = $1,
          gateway_transaction_id = COALESCE($2, gateway_transaction_id),
          gateway_response = COALESCE($3::jsonb, gateway_response),
          updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = $4
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        status,
        gatewayTransactionId,
        gatewayResponse ? JSON.stringify(gatewayResponse) : null,
        paymentId
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const payment = result.rows[0];

      // If payment is successful, update order status
      if (status === PaymentStatus.SUCCESS) {
        await client.query(
          'UPDATE orders SET status = $1 WHERE id = $2',
          ['paid', payment.order_id]
        );
      }

      // Log payment status change
      const logQuery = `
        INSERT INTO payment_logs (payment_id, status, gateway_transaction_id, notes)
        VALUES ($1, $2, $3, $4)
      `;
      
      await client.query(logQuery, [
        paymentId,
        status,
        gatewayTransactionId,
        `Payment status updated to ${status}`
      ]);

      await client.query('COMMIT');

      return {
        ...payment,
        amount: parseFloat(payment.amount),
        gateway_response: payment.gateway_response ? JSON.parse(payment.gateway_response) : null
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Process refund
  async processRefund(paymentId: string, amount: number, reason: string, userId: number): Promise<Refund> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get payment details
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.SUCCESS) {
        throw new Error('Can only refund successful payments');
      }

      if (amount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      // Generate refund ID
      const refundId = `REF${Date.now()}`;

      // Process refund with gateway
      let gatewayRefundResponse: any = {};

      if (payment.payment_method === PaymentMethod.RAZORPAY && this.razorpay) {
        gatewayRefundResponse = await this.razorpay.payments.refund(
          payment.gateway_transaction_id!,
          {
            amount: Math.round(amount * 100), // Convert to paise
            notes: {
              reason,
              refund_id: refundId
            }
          }
        );
      } else if (payment.payment_method === PaymentMethod.STRIPE && this.stripe) {
        gatewayRefundResponse = await this.stripe.refunds.create({
          payment_intent: payment.gateway_transaction_id!,
          amount: Math.round(amount * 100), // Convert to paise/cents
          metadata: {
            reason,
            refund_id: refundId
          }
        });
      }

      // Insert refund record
      const refundQuery = `
        INSERT INTO refunds (
          refund_id, payment_id, amount, reason, status,
          gateway_refund_id, gateway_response, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const refundValues = [
        refundId,
        paymentId,
        amount,
        reason,
        'processing',
        gatewayRefundResponse.id,
        JSON.stringify(gatewayRefundResponse),
        userId
      ];

      const refundResult = await client.query(refundQuery, refundValues);
      const refund = refundResult.rows[0];

      await client.query('COMMIT');

      return {
        ...refund,
        amount: parseFloat(refund.amount),
        gateway_response: refund.gateway_response ? JSON.parse(refund.gateway_response) : null
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error processing refund:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Verify Razorpay webhook signature
  async verifyRazorpayWebhook(body: any, signature: string): Promise<boolean> {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Error verifying Razorpay webhook signature:', error);
      return false;
    }
  }

  // Process Razorpay webhook
  async processRazorpayWebhook(webhookData: any): Promise<void> {
    const { event, payload } = webhookData;

    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload.payment.entity);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload.payment.entity);
        break;
      case 'refund.processed':
        await this.handleRefundProcessed(payload.refund.entity);
        break;
      default:
        logger.info(`Unhandled Razorpay webhook event: ${event}`);
    }
  }

  // Verify Stripe webhook signature
  async verifyStripeWebhook(body: any, signature: string): Promise<boolean> {
    try {
      if (!this.stripe) return false;
      
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return true;
    } catch (error) {
      logger.error('Error verifying Stripe webhook signature:', error);
      return false;
    }
  }

  // Process Stripe webhook
  async processStripeWebhook(webhookData: any): Promise<void> {
    const { type, data } = webhookData;

    switch (type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentCaptured(data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(data.object);
        break;
      case 'charge.dispute.created':
        // Handle chargebacks
        break;
      default:
        logger.info(`Unhandled Stripe webhook event: ${type}`);
    }
  }

  // Handle successful payment
  private async handlePaymentCaptured(paymentData: any): Promise<void> {
    const paymentId = paymentData.notes?.payment_id || paymentData.metadata?.payment_id;
    
    if (paymentId) {
      await this.updatePaymentStatus(
        paymentId,
        PaymentStatus.SUCCESS,
        paymentData.id,
        paymentData
      );
    }
  }

  // Handle failed payment
  private async handlePaymentFailed(paymentData: any): Promise<void> {
    const paymentId = paymentData.notes?.payment_id || paymentData.metadata?.payment_id;
    
    if (paymentId) {
      await this.updatePaymentStatus(
        paymentId,
        PaymentStatus.FAILED,
        paymentData.id,
        paymentData
      );
    }
  }

  // Handle processed refund
  private async handleRefundProcessed(refundData: any): Promise<void> {
    const refundId = refundData.notes?.refund_id || refundData.metadata?.refund_id;
    
    if (refundId) {
      await this.db.query(
        'UPDATE refunds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE refund_id = $2',
        ['completed', refundId]
      );
    }
  }

  // Get payment statistics
  async getPaymentStats(dateFrom?: string, dateTo?: string): Promise<PaymentStats> {
    const conditions = [];
    const params: any[] = [];

    if (dateFrom) {
      conditions.push(`created_at >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`created_at <= $${params.length + 1}`);
      params.push(dateTo + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'success' THEN amount ELSE NULL END), 0) as average_payment_value,
        COUNT(CASE WHEN payment_method = 'razorpay' THEN 1 END) as razorpay_payments,
        COUNT(CASE WHEN payment_method = 'stripe' THEN 1 END) as stripe_payments,
        COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments
      FROM payments ${whereClause}
    `;

    const result = await this.db.query(query, params);
    const row = result.rows[0];

    return {
      total_payments: parseInt(row.total_payments),
      pending_payments: parseInt(row.pending_payments),
      successful_payments: parseInt(row.successful_payments),
      failed_payments: parseInt(row.failed_payments),
      total_revenue: parseFloat(row.total_revenue),
      average_payment_value: parseFloat(row.average_payment_value),
      payment_methods: {
        razorpay: parseInt(row.razorpay_payments),
        stripe: parseInt(row.stripe_payments),
        cash: parseInt(row.cash_payments)
      }
    };
  }
}