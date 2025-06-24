import { Pool } from 'pg';
import PDFKit from 'pdfkit';
import { Invoice } from '@jewelry-shop/shared/types';
import { logger } from '../utils/logger';

export class InvoiceService {
  constructor(private db: Pool) {}

  // Generate invoice for order
  async generateInvoice(orderId: number): Promise<Invoice> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Check if invoice already exists
      const existingQuery = 'SELECT * FROM invoices WHERE order_id = $1';
      const existingResult = await client.query(existingQuery, [orderId]);
      
      if (existingResult.rows.length > 0) {
        return existingResult.rows[0];
      }

      // Get order details
      const orderQuery = `
        SELECT 
          o.*,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address
        FROM orders o
        LEFT JOIN users c ON o.customer_id = c.id
        WHERE o.id = $1
      `;
      
      const orderResult = await client.query(orderQuery, [orderId]);
      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];
      const invoiceNumber = this.generateInvoiceNumber();

      // Insert invoice
      const invoiceQuery = `
        INSERT INTO invoices (
          invoice_number, order_id, amount, gst_amount, total_amount,
          invoice_date, due_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      const invoiceValues = [
        invoiceNumber,
        orderId,
        order.subtotal + order.making_charges + order.wastage_amount,
        order.gst_amount,
        order.total_amount,
        new Date(),
        dueDate,
        'generated'
      ];

      const invoiceResult = await client.query(invoiceQuery, invoiceValues);
      const invoice = invoiceResult.rows[0];

      await client.query('COMMIT');

      return {
        ...invoice,
        amount: parseFloat(invoice.amount),
        gst_amount: parseFloat(invoice.gst_amount),
        total_amount: parseFloat(invoice.total_amount)
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error generating invoice:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const query = `
      SELECT 
        i.*,
        o.order_number,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      LEFT JOIN users c ON o.customer_id = c.id
      WHERE i.invoice_number = $1
    `;

    const result = await this.db.query(query, [invoiceId]);
    
    if (result.rows.length === 0) return null;

    const invoice = result.rows[0];
    return {
      ...invoice,
      amount: parseFloat(invoice.amount),
      gst_amount: parseFloat(invoice.gst_amount),
      total_amount: parseFloat(invoice.total_amount)
    };
  }

  // Generate invoice PDF
  async generateInvoicePDF(invoiceId: string): Promise<Buffer | null> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) return null;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Add invoice content
        this.addInvoiceContent(doc, invoice);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    return `INV${year}${month}${day}${timestamp}`;
  }

  private addInvoiceContent(doc: PDFKit.PDFDocument, invoice: Invoice): void {
    // Business header
    doc.fontSize(20).text('INVOICE', 50, 50);
    doc.fontSize(12).text(`Invoice No: ${invoice.invoice_number}`, 50, 100);
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 50, 120);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 50, 140);
    
    // Amount details
    doc.text(`Amount: ₹${invoice.amount.toLocaleString('en-IN')}`, 50, 180);
    doc.text(`GST: ₹${invoice.gst_amount.toLocaleString('en-IN')}`, 50, 200);
    doc.fontSize(16).text(`Total: ₹${invoice.total_amount.toLocaleString('en-IN')}`, 50, 240);
  }
}