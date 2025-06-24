import { Pool } from 'pg';
import PDFKit from 'pdfkit';
import { JewelryOrder } from '@jewelry-shop/shared/types';
import { logger } from '../utils/logger';

export class InvoiceService {
  constructor(private db: Pool) {}

  // Generate PDF invoice for order
  async generateInvoice(order: JewelryOrder): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Business Header
        this.addBusinessHeader(doc);

        // Invoice Details
        this.addInvoiceDetails(doc, order);

        // Customer Details
        this.addCustomerDetails(doc, order);

        // Order Items Table
        this.addOrderItemsTable(doc, order);

        // Totals
        this.addOrderTotals(doc, order);

        // Terms and Conditions
        this.addTermsAndConditions(doc);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        logger.error('Error generating invoice PDF:', error);
        reject(error);
      }
    });
  }

  private addBusinessHeader(doc: PDFKit.PDFDocument): void {
    const businessName = process.env.BUSINESS_NAME || 'Premium Jewelry Shop';
    const businessAddress = process.env.BUSINESS_ADDRESS || '123 Main Street, City, State 12345';
    const businessPhone = process.env.BUSINESS_PHONE || '+91-9876543210';
    const businessEmail = process.env.BUSINESS_EMAIL || 'info@jewelryshop.com';
    const businessGST = process.env.BUSINESS_GST_NUMBER || '22AAAAA0000A1Z5';

    // Logo placeholder (you can add actual logo later)
    doc.rect(50, 50, 80, 80).stroke();
    doc.fontSize(12).text('LOGO', 70, 85);

    // Business details
    doc.fontSize(20).font('Helvetica-Bold').text(businessName, 150, 50);
    doc.fontSize(12).font('Helvetica').text(businessAddress, 150, 75);
    doc.text(`Phone: ${businessPhone}`, 150, 90);
    doc.text(`Email: ${businessEmail}`, 150, 105);
    doc.text(`GST No: ${businessGST}`, 150, 120);

    // Invoice title
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 450, 50);
    
    // Horizontal line
    doc.moveTo(50, 150).lineTo(550, 150).stroke();
  }

  private addInvoiceDetails(doc: PDFKit.PDFDocument, order: JewelryOrder): void {
    const invoiceDate = new Date().toLocaleDateString('en-IN');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Invoice Details:', 50, 170);
    
    doc.font('Helvetica');
    doc.text(`Invoice No: INV-${order.order_number}`, 50, 190);
    doc.text(`Order No: ${order.order_number}`, 50, 205);
    doc.text(`Invoice Date: ${invoiceDate}`, 50, 220);
    doc.text(`Due Date: ${dueDate}`, 50, 235);
    doc.text(`Status: ${order.status.toUpperCase()}`, 50, 250);

    if (order.estimated_completion) {
      doc.text(`Estimated Completion: ${new Date(order.estimated_completion).toLocaleDateString('en-IN')}`, 50, 265);
    }
  }

  private addCustomerDetails(doc: PDFKit.PDFDocument, order: JewelryOrder): void {
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Bill To:', 350, 170);
    
    doc.font('Helvetica');
    doc.text(`${order.customer?.first_name} ${order.customer?.last_name}`, 350, 190);
    if (order.customer?.email) {
      doc.text(`Email: ${order.customer.email}`, 350, 205);
    }
    if (order.customer?.phone) {
      doc.text(`Phone: ${order.customer.phone}`, 350, 220);
    }
    if (order.customer?.address) {
      doc.text(`Address: ${order.customer.address}`, 350, 235, { width: 150 });
    }

    if (order.staff) {
      doc.text(`Served by: ${order.staff.first_name} ${order.staff.last_name}`, 350, 270);
    }
  }

  private addOrderItemsTable(doc: PDFKit.PDFDocument, order: JewelryOrder): void {
    const tableTop = 320;
    const tableHeaders = ['Item', 'SKU', 'Metal/Purity', 'Qty', 'Unit Price', 'Total'];
    const columnWidths = [150, 80, 100, 40, 80, 80];
    
    // Table header
    doc.fontSize(12).font('Helvetica-Bold');
    let currentX = 50;
    
    tableHeaders.forEach((header, index) => {
      doc.text(header, currentX, tableTop, { width: columnWidths[index], align: 'center' });
      currentX += columnWidths[index];
    });

    // Header line
    doc.moveTo(50, tableTop + 20).lineTo(530, tableTop + 20).stroke();

    // Table rows
    doc.font('Helvetica').fontSize(10);
    let currentY = tableTop + 30;

    order.items?.forEach((item, index) => {
      if (currentY > 700) { // Start new page if needed
        doc.addPage();
        currentY = 100;
      }

      currentX = 50;
      
      // Item name
      doc.text(item.item?.name || 'N/A', currentX, currentY, { 
        width: columnWidths[0], 
        ellipsis: true 
      });
      currentX += columnWidths[0];

      // SKU
      doc.text(item.item?.sku || 'N/A', currentX, currentY, { 
        width: columnWidths[1], 
        align: 'center' 
      });
      currentX += columnWidths[1];

      // Metal/Purity
      const metalPurity = `${item.item?.metal_name || 'N/A'}/${item.item?.purity_name || 'N/A'}`;
      doc.text(metalPurity, currentX, currentY, { 
        width: columnWidths[2], 
        align: 'center' 
      });
      currentX += columnWidths[2];

      // Quantity
      doc.text(item.quantity.toString(), currentX, currentY, { 
        width: columnWidths[3], 
        align: 'center' 
      });
      currentX += columnWidths[3];

      // Unit Price
      doc.text(`₹${item.unit_price.toLocaleString('en-IN')}`, currentX, currentY, { 
        width: columnWidths[4], 
        align: 'right' 
      });
      currentX += columnWidths[4];

      // Total
      doc.text(`₹${item.total_price.toLocaleString('en-IN')}`, currentX, currentY, { 
        width: columnWidths[5], 
        align: 'right' 
      });

      currentY += 25;

      // Add customization details if any
      if (item.customization_details) {
        doc.fontSize(8).fillColor('gray');
        doc.text(`Customization: ${item.customization_details}`, 50, currentY, { 
          width: 480 
        });
        doc.fillColor('black').fontSize(10);
        currentY += 15;
      }
    });

    // Bottom line
    doc.moveTo(50, currentY).lineTo(530, currentY).stroke();
  }

  private addOrderTotals(doc: PDFKit.PDFDocument, order: JewelryOrder): void {
    const totalsStartY = doc.y + 20;
    const rightX = 400;

    doc.fontSize(12).font('Helvetica');

    // Subtotal
    doc.text('Subtotal:', rightX, totalsStartY);
    doc.text(`₹${order.subtotal.toLocaleString('en-IN')}`, rightX + 130, totalsStartY, { align: 'right' });

    // Making Charges
    doc.text('Making Charges:', rightX, totalsStartY + 20);
    doc.text(`₹${order.making_charges.toLocaleString('en-IN')}`, rightX + 130, totalsStartY + 20, { align: 'right' });

    // Wastage
    doc.text('Wastage:', rightX, totalsStartY + 40);
    doc.text(`₹${order.wastage_amount.toLocaleString('en-IN')}`, rightX + 130, totalsStartY + 40, { align: 'right' });

    // GST
    doc.text('GST (3%):', rightX, totalsStartY + 60);
    doc.text(`₹${order.gst_amount.toLocaleString('en-IN')}`, rightX + 130, totalsStartY + 60, { align: 'right' });

    // Total line
    doc.moveTo(rightX, totalsStartY + 80).lineTo(530, totalsStartY + 80).stroke();

    // Total Amount
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('Total Amount:', rightX, totalsStartY + 90);
    doc.text(`₹${order.total_amount.toLocaleString('en-IN')}`, rightX + 130, totalsStartY + 90, { align: 'right' });

    // Amount in words
    doc.fontSize(10).font('Helvetica');
    const amountInWords = this.numberToWords(order.total_amount);
    doc.text(`Amount in words: ${amountInWords} Rupees Only`, 50, totalsStartY + 120, { width: 480 });
  }

  private addTermsAndConditions(doc: PDFKit.PDFDocument): void {
    const termsY = doc.y + 40;
    
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Terms & Conditions:', 50, termsY);

    doc.fontSize(10).font('Helvetica');
    const terms = [
      '1. All payments are due within 30 days of invoice date.',
      '2. Goods once sold will not be taken back or exchanged.',
      '3. All disputes are subject to local jurisdiction only.',
      '4. Interest @24% per annum will be charged on overdue amounts.',
      '5. All gold prices are subject to market rates at the time of delivery.',
      '6. Customization charges are non-refundable.',
      '7. Please bring this invoice at the time of delivery/pickup.'
    ];

    terms.forEach((term, index) => {
      doc.text(term, 50, termsY + 20 + (index * 15), { width: 480 });
    });
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    // Signature section
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('For ' + (process.env.BUSINESS_NAME || 'Premium Jewelry Shop'), 350, footerY - 40);
    
    // Signature line
    doc.moveTo(350, footerY).lineTo(500, footerY).stroke();
    doc.fontSize(10).font('Helvetica');
    doc.text('Authorized Signatory', 350, footerY + 10);

    // Footer line
    doc.moveTo(50, footerY + 30).lineTo(550, footerY + 30).stroke();
    
    // Footer text
    doc.fontSize(8).text(
      'This is a computer generated invoice and does not require physical signature.',
      50, 
      footerY + 40,
      { align: 'center', width: 500 }
    );
  }

  // Convert number to words (simplified version)
  private numberToWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertHundreds = (num: number): string => {
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    };

    if (amount === 0) return 'Zero';

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = '';

    if (integerPart >= 10000000) {
      result += convertHundreds(Math.floor(integerPart / 10000000)) + 'Crore ';
      integerPart %= 10000000;
    }

    if (integerPart >= 100000) {
      result += convertHundreds(Math.floor(integerPart / 100000)) + 'Lakh ';
      integerPart %= 100000;
    }

    if (integerPart >= 1000) {
      result += convertHundreds(Math.floor(integerPart / 1000)) + 'Thousand ';
      integerPart %= 1000;
    }

    if (integerPart > 0) {
      result += convertHundreds(integerPart);
    }

    if (decimalPart > 0) {
      result += 'and ' + convertHundreds(decimalPart) + 'Paise ';
    }

    return result.trim();
  }
}