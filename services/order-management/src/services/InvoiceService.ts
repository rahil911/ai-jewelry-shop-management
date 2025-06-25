import { Pool } from 'pg';
import PDFKit from 'pdfkit';
import { JewelryOrder, EnhancedInvoiceData, InvoiceItemDetail, TaxDetails } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export class InvoiceService {
  constructor(private db: Pool) {}

  // Generate basic PDF invoice for order (backward compatibility)
  async generateInvoice(order: JewelryOrder): Promise<Buffer> {
    const enhancedData = await this.prepareEnhancedInvoiceData(order);
    return this.generateEnhancedInvoice(order, enhancedData);
  }

  // Generate enhanced professional PDF invoice
  async generateEnhancedInvoice(order: JewelryOrder, enhancedData: EnhancedInvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Invoice ${order.order_number}`,
            Author: process.env.BUSINESS_NAME || 'Premium Jewelry Shop',
            Subject: `Invoice for Order ${order.order_number}`,
            Keywords: 'invoice, jewelry, GST'
          }
        });
        const buffers: Buffer[] = [];

        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Enhanced Business Header with Logo
        this.addEnhancedBusinessHeader(doc, enhancedData);

        // Professional Invoice Details
        this.addEnhancedInvoiceDetails(doc, order);

        // Customer Details
        this.addEnhancedCustomerDetails(doc, order);

        // Detailed Order Items Table
        this.addEnhancedOrderItemsTable(doc, order, enhancedData);

        // Professional Totals with Tax Breakdown
        this.addEnhancedOrderTotals(doc, order, enhancedData.tax_breakdown);

        // Enhanced Terms and Conditions
        this.addEnhancedTermsAndConditions(doc, enhancedData);

        // Professional Footer with Digital Signature
        this.addEnhancedFooter(doc, enhancedData);

        doc.end();
      } catch (error) {
        logger.error('Error generating enhanced invoice PDF:', error);
        reject(error);
      }
    });
  }

  // Prepare enhanced invoice data from order
  private async prepareEnhancedInvoiceData(order: JewelryOrder): Promise<EnhancedInvoiceData> {
    // Get detailed item information
    const itemizedBreakdown = await this.getItemizedBreakdown(order.id);
    
    // Calculate detailed tax breakdown
    const taxBreakdown = this.calculateDetailedTaxBreakdown(order);

    const data: EnhancedInvoiceData = {
      itemized_breakdown: itemizedBreakdown,
      tax_breakdown: taxBreakdown,
      payment_terms: process.env.PAYMENT_TERMS || 'Payment due within 30 days',
      digital_signature: true
    };
    
    // Add optional fields only if they exist
    if (process.env.BUSINESS_LOGO_PATH) {
      data.business_logo = process.env.BUSINESS_LOGO_PATH;
    }
    if (process.env.WARRANTY_INFO) {
      data.warranty_information = process.env.WARRANTY_INFO;
    } else {
      data.warranty_information = '1 year warranty on craftsmanship';
    }
    if (process.env.CARE_INSTRUCTIONS) {
      data.care_instructions = process.env.CARE_INSTRUCTIONS;
    } else {
      data.care_instructions = 'Keep jewelry in a dry place. Clean with soft cloth only.';
    }
    if (process.env.RETURN_POLICY) {
      data.return_policy = process.env.RETURN_POLICY;
    } else {
      data.return_policy = 'Returns accepted within 30 days with original invoice.';
    }
    data.qr_code = `INV-${order.order_number}-${Date.now()}`;
    
    return data;
  }

  // Get detailed itemized breakdown
  private async getItemizedBreakdown(orderId: number): Promise<InvoiceItemDetail[]> {
    const query = `
      SELECT 
        oi.*,
        ji.name, ji.sku, ji.description, ji.weight,
        mt.name as metal_name,
        p.purity_name,
        c.name as category_name,
        COALESCE(ji.making_charges, 0) as item_making_charges,
        COALESCE(ji.wastage_percentage, 0) as wastage_percentage
      FROM order_items oi
      LEFT JOIN jewelry_items ji ON oi.jewelry_item_id = ji.id
      LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
      LEFT JOIN purities p ON ji.purity_id = p.id
      LEFT JOIN categories c ON ji.category_id = c.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `;

    const result = await this.db.query(query, [orderId]);
    
    return result.rows.map(row => {
      const unitPrice = parseFloat(row.unit_price);
      const quantity = row.quantity;
      const weight = parseFloat(row.weight) || 0;
      const makingChargeRate = parseFloat(row.item_making_charges) || 0;
      const wastageRate = parseFloat(row.wastage_percentage) || 0;

      const makingCharges = (unitPrice * makingChargeRate) / 100;
      const wastageAmount = (unitPrice * wastageRate) / 100;
      const totalPrice = (unitPrice + makingCharges + wastageAmount) * quantity;

      return {
        name: row.name || 'N/A',
        sku: row.sku || 'N/A',
        description: row.description || '',
        metal_type: row.metal_name || 'N/A',
        purity: row.purity_name || 'N/A',
        weight: weight,
        quantity: quantity,
        unit_price: unitPrice,
        making_charges: makingCharges,
        wastage_amount: wastageAmount,
        total_price: totalPrice,
        customization_details: row.customization_details
      };
    });
  }

  // Calculate detailed tax breakdown
  private calculateDetailedTaxBreakdown(order: JewelryOrder): TaxDetails {
    const subtotal = order.subtotal;
    const makingChargesTotal = order.making_charges;
    const wastageTotal = order.wastage_amount;
    const totalBeforeTax = subtotal + makingChargesTotal + wastageTotal;

    // GST rates (configurable)
    const gstRate = 3; // 3% for jewelry
    const totalTax = order.gst_amount;

    // For interstate transactions, use IGST; for intrastate, use CGST + SGST
    const isInterstate = process.env.IS_INTERSTATE_BUSINESS === 'true';
    
    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    
    if (isInterstate) {
      igstAmount = totalTax;
    } else {
      cgstAmount = totalTax / 2;
      sgstAmount = totalTax / 2;
    }

    return {
      subtotal: subtotal,
      making_charges_total: makingChargesTotal,
      wastage_total: wastageTotal,
      cgst_rate: isInterstate ? 0 : gstRate / 2,
      cgst_amount: cgstAmount,
      sgst_rate: isInterstate ? 0 : gstRate / 2,
      sgst_amount: sgstAmount,
      igst_rate: isInterstate ? gstRate : 0,
      igst_amount: igstAmount,
      total_tax: totalTax,
      grand_total: order.total_amount
    };
  }

  // Enhanced PDF generation methods
  private addEnhancedBusinessHeader(doc: PDFKit.PDFDocument, enhancedData: EnhancedInvoiceData): void {
    const businessName = process.env.BUSINESS_NAME || 'Premium Jewelry Shop';
    const businessAddress = process.env.BUSINESS_ADDRESS || '123 Main Street, City, State 12345';
    const businessPhone = process.env.BUSINESS_PHONE || '+91-9876543210';
    const businessEmail = process.env.BUSINESS_EMAIL || 'info@jewelryshop.com';
    const businessGST = process.env.BUSINESS_GST_NUMBER || '22AAAAA0000A1Z5';
    const businessWebsite = process.env.BUSINESS_WEBSITE || 'www.jewelryshop.com';

    // Add professional color scheme
    const primaryColor = '#1a365d'; // Dark blue
    const accentColor = '#ed8936'; // Gold/orange
    
    // Header background
    doc.rect(0, 0, doc.page.width, 120).fill('#f7fafc');

    // Logo section (enhanced)
    if (enhancedData.business_logo) {
      try {
        doc.image(enhancedData.business_logo, 50, 20, { width: 80, height: 80 });
      } catch (error) {
        // Fallback to text logo
        doc.rect(50, 20, 80, 80).stroke(primaryColor);
        doc.fontSize(12).fillColor(primaryColor).text('LOGO', 70, 55);
      }
    } else {
      // Professional text logo
      doc.roundedRect(50, 20, 80, 80, 5).stroke(primaryColor).fillAndStroke('#ffffff', primaryColor);
      doc.fontSize(10).fillColor(primaryColor).text('JEWELRY', 62, 45);
      doc.fontSize(10).text('SHOP', 67, 58);
    }

    // Business details with enhanced typography
    doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text(businessName, 150, 30);
    doc.fontSize(11).font('Helvetica').fillColor('#4a5568').text(businessAddress, 150, 60);
    doc.text(`📞 ${businessPhone}  📧 ${businessEmail}`, 150, 75);
    doc.text(`🌐 ${businessWebsite}`, 150, 88);
    doc.fontSize(10).fillColor('#718096').text(`GST No: ${businessGST}`, 150, 103);

    // Invoice title with accent
    doc.fontSize(28).font('Helvetica-Bold').fillColor(accentColor).text('INVOICE', 420, 30);
    
    // Professional separator line
    doc.moveTo(50, 130).lineTo(550, 130).lineWidth(2).stroke(primaryColor);
    doc.moveTo(50, 133).lineTo(550, 133).lineWidth(1).stroke(accentColor);
  }

  private addEnhancedInvoiceDetails(doc: PDFKit.PDFDocument, order: JewelryOrder): void {
    const invoiceDate = new Date().toLocaleDateString('en-IN');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
    const primaryColor = '#1a365d';

    // Invoice details box
    doc.roundedRect(50, 150, 250, 120, 5).stroke('#e2e8f0').fillAndStroke('#f8fafc', '#e2e8f0');
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Invoice Details', 60, 165);
    
    doc.fontSize(11).font('Helvetica').fillColor('#2d3748');
    doc.text(`Invoice No:`, 60, 190);
    doc.font('Helvetica-Bold').text(`INV-${order.order_number}`, 140, 190);
    
    doc.font('Helvetica').text(`Order No:`, 60, 205);
    doc.font('Helvetica-Bold').text(`${order.order_number}`, 140, 205);
    
    doc.font('Helvetica').text(`Invoice Date:`, 60, 220);
    doc.font('Helvetica-Bold').text(`${invoiceDate}`, 140, 220);
    
    doc.font('Helvetica').text(`Due Date:`, 60, 235);
    doc.font('Helvetica-Bold').text(`${dueDate}`, 140, 235);
    
    doc.font('Helvetica').text(`Status:`, 60, 250);
    doc.font('Helvetica-Bold').fillColor('#38a169').text(`${order.status.toUpperCase()}`, 140, 250);

    if (order.estimated_completion) {
      doc.font('Helvetica').fillColor('#2d3748').text(`Completion:`, 200, 250);
      doc.font('Helvetica-Bold').text(`${new Date(order.estimated_completion).toLocaleDateString('en-IN')}`, 270, 250);
    }
  }

  private addEnhancedCustomerDetails(doc: PDFKit.PDFDocument, order: JewelryOrder): void {
    const primaryColor = '#1a365d';
    
    // Customer details box
    doc.roundedRect(320, 150, 230, 120, 5).stroke('#e2e8f0').fillAndStroke('#f8fafc', '#e2e8f0');
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Bill To', 330, 165);
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2d3748');
    doc.text(`${order.customer?.first_name} ${order.customer?.last_name}`, 330, 190);
    
    doc.fontSize(10).font('Helvetica').fillColor('#4a5568');
    if (order.customer?.email) {
      doc.text(`📧 ${order.customer.email}`, 330, 205);
    }
    if (order.customer?.phone) {
      doc.text(`📱 ${order.customer.phone}`, 330, 218);
    }
    if (order.customer?.address) {
      doc.text(`📍 ${order.customer.address}`, 330, 231, { width: 200, ellipsis: true });
    }

    if (order.staff) {
      doc.fontSize(9).fillColor('#718096').text(`Served by: ${order.staff.first_name} ${order.staff.last_name}`, 330, 250);
    }
  }

  private addEnhancedOrderItemsTable(doc: PDFKit.PDFDocument, order: JewelryOrder, enhancedData: EnhancedInvoiceData): void {
    const tableTop = 290;
    const primaryColor = '#1a365d';
    const headerColor = '#edf2f7';
    
    // Table header
    doc.rect(50, tableTop, 500, 25).fill(headerColor);
    doc.rect(50, tableTop, 500, 25).stroke('#cbd5e0');
    
    const headers = ['Item Details', 'SKU', 'Metal/Purity', 'Weight', 'Qty', 'Rate', 'Making', 'Wastage', 'Total'];
    const columnWidths = [120, 60, 70, 45, 30, 60, 50, 50, 65];
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor);
    let currentX = 55;
    
    headers.forEach((header, index) => {
      const width = columnWidths[index] || 60; // Default width if undefined
      doc.text(header, currentX, tableTop + 8, { width: width, align: 'center' });
      currentX += width;
    });

    // Table rows with enhanced itemization
    doc.font('Helvetica').fontSize(8);
    let currentY = tableTop + 30;
    const rowHeight = 30;

    enhancedData.itemized_breakdown.forEach((item, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 100;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(50, currentY - 5, 500, rowHeight).fill('#f8fafc');
      }

      currentX = 55;
      doc.fillColor('#2d3748');
      
      // Item Details (Name + Description)
      const col0Width = columnWidths[0] || 120;
      doc.font('Helvetica-Bold').text(item.name || 'N/A', currentX, currentY, { 
        width: col0Width - 5, 
        ellipsis: true 
      });
      if (item.description) {
        doc.font('Helvetica').fontSize(7).fillColor('#718096');
        doc.text(item.description, currentX, currentY + 10, { 
          width: col0Width - 5, 
          ellipsis: true 
        });
      }
      currentX += col0Width;

      // Reset formatting for other columns
      doc.fontSize(8).fillColor('#2d3748').font('Helvetica');

      // SKU
      const col1Width = columnWidths[1] || 60;
      doc.text(item.sku || 'N/A', currentX, currentY + 5, { width: col1Width, align: 'center' });
      currentX += col1Width;

      // Metal/Purity
      const col2Width = columnWidths[2] || 70;
      doc.text(`${item.metal_type || 'N/A'}/${item.purity || 'N/A'}`, currentX, currentY + 5, { 
        width: col2Width, 
        align: 'center' 
      });
      currentX += col2Width;

      // Weight
      const col3Width = columnWidths[3] || 45;
      doc.text(`${item.weight || 0}g`, currentX, currentY + 5, { width: col3Width, align: 'center' });
      currentX += col3Width;

      // Quantity
      const col4Width = columnWidths[4] || 30;
      doc.text((item.quantity || 0).toString(), currentX, currentY + 5, { width: col4Width, align: 'center' });
      currentX += col4Width;

      // Rate
      const col5Width = columnWidths[5] || 60;
      doc.text(`₹${(item.unit_price || 0).toLocaleString('en-IN')}`, currentX, currentY + 5, { 
        width: col5Width, 
        align: 'right' 
      });
      currentX += col5Width;

      // Making Charges
      const col6Width = columnWidths[6] || 50;
      doc.text(`₹${(item.making_charges || 0).toLocaleString('en-IN')}`, currentX, currentY + 5, { 
        width: col6Width, 
        align: 'right' 
      });
      currentX += col6Width;

      // Wastage
      const col7Width = columnWidths[7] || 50;
      doc.text(`₹${(item.wastage_amount || 0).toLocaleString('en-IN')}`, currentX, currentY + 5, { 
        width: col7Width, 
        align: 'right' 
      });
      currentX += col7Width;

      // Total
      const col8Width = columnWidths[8] || 65;
      doc.font('Helvetica-Bold').text(`₹${(item.total_price || 0).toLocaleString('en-IN')}`, currentX, currentY + 5, { 
        width: col8Width, 
        align: 'right' 
      });

      // Customization details
      if (item.customization_details) {
        doc.fontSize(7).fillColor('#9ca3af').font('Helvetica');
        doc.text(`⚡ ${item.customization_details}`, 55, currentY + 18, { width: 450 });
      }

      currentY += rowHeight;
    });

    // Table border
    doc.rect(50, tableTop, 500, currentY - tableTop).stroke('#cbd5e0');
  }

  private addEnhancedOrderTotals(doc: PDFKit.PDFDocument, order: JewelryOrder, taxBreakdown: TaxDetails): void {
    const totalsStartY = doc.y + 20;
    const rightX = 370;
    const primaryColor = '#1a365d';

    // Totals box
    doc.roundedRect(rightX - 20, totalsStartY - 10, 200, 160, 5).stroke('#e2e8f0').fillAndStroke('#f8fafc', '#e2e8f0');

    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Summary', rightX - 10, totalsStartY);

    doc.fontSize(10).font('Helvetica').fillColor('#2d3748');

    // Subtotal
    doc.text('Subtotal:', rightX, totalsStartY + 25);
    doc.text(`₹${taxBreakdown.subtotal.toLocaleString('en-IN')}`, rightX + 100, totalsStartY + 25, { align: 'right' });

    // Making Charges
    doc.text('Making Charges:', rightX, totalsStartY + 40);
    doc.text(`₹${taxBreakdown.making_charges_total.toLocaleString('en-IN')}`, rightX + 100, totalsStartY + 40, { align: 'right' });

    // Wastage
    doc.text('Wastage:', rightX, totalsStartY + 55);
    doc.text(`₹${taxBreakdown.wastage_total.toLocaleString('en-IN')}`, rightX + 100, totalsStartY + 55, { align: 'right' });

    // Tax Details
    if (taxBreakdown.cgst_amount > 0) {
      doc.text(`CGST (${taxBreakdown.cgst_rate}%):`, rightX, totalsStartY + 70);
      doc.text(`₹${taxBreakdown.cgst_amount.toLocaleString('en-IN')}`, rightX + 100, totalsStartY + 70, { align: 'right' });
      
      doc.text(`SGST (${taxBreakdown.sgst_rate}%):`, rightX, totalsStartY + 85);
      doc.text(`₹${taxBreakdown.sgst_amount.toLocaleString('en-IN')}`, rightX + 100, totalsStartY + 85, { align: 'right' });
    }

    if (taxBreakdown.igst_amount > 0) {
      doc.text(`IGST (${taxBreakdown.igst_rate}%):`, rightX, totalsStartY + 70);
      doc.text(`₹${taxBreakdown.igst_amount.toLocaleString('en-IN')}`, rightX + 100, totalsStartY + 70, { align: 'right' });
    }

    // Total line
    doc.moveTo(rightX, totalsStartY + 100).lineTo(rightX + 160, totalsStartY + 100).stroke('#cbd5e0');

    // Grand Total
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Grand Total:', rightX, totalsStartY + 110);
    doc.text(`₹${taxBreakdown.grand_total.toLocaleString('en-IN')}`, rightX + 100, totalsStartY + 110, { align: 'right' });

    // Amount in words
    doc.fontSize(9).font('Helvetica').fillColor('#4a5568');
    const amountInWords = this.numberToWords(taxBreakdown.grand_total);
    doc.text(`Amount in words: ${amountInWords} Rupees Only`, 50, totalsStartY + 140, { width: 480 });
  }

  private addEnhancedTermsAndConditions(doc: PDFKit.PDFDocument, enhancedData: EnhancedInvoiceData): void {
    const termsY = doc.y + 30;
    const primaryColor = '#1a365d';
    
    // Terms section
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Terms & Conditions', 50, termsY);

    doc.fontSize(9).font('Helvetica').fillColor('#4a5568');
    const terms = [
      `1. ${enhancedData.payment_terms}`,
      '2. Goods once sold will not be taken back or exchanged unless defective.',
      '3. All disputes are subject to local jurisdiction only.',
      '4. Interest @24% per annum will be charged on overdue amounts.',
      '5. All gold prices are subject to market rates at the time of delivery.',
      '6. Customization charges are non-refundable.',
      enhancedData.warranty_information ? `7. Warranty: ${enhancedData.warranty_information}` : '',
      enhancedData.care_instructions ? `8. Care Instructions: ${enhancedData.care_instructions}` : '',
      enhancedData.return_policy ? `9. Return Policy: ${enhancedData.return_policy}` : ''
    ].filter(term => term.length > 0);

    terms.forEach((term, index) => {
      doc.text(term, 50, termsY + 20 + (index * 12), { width: 480 });
    });
  }

  private addEnhancedFooter(doc: PDFKit.PDFDocument, enhancedData: EnhancedInvoiceData): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 120;
    const primaryColor = '#1a365d';
    const accentColor = '#ed8936';

    // Footer separator
    doc.moveTo(50, footerY - 20).lineTo(550, footerY - 20).lineWidth(2).stroke(primaryColor);

    // Thank you message
    doc.fontSize(12).font('Helvetica-Bold').fillColor(accentColor);
    doc.text('Thank you for choosing us! ✨', 50, footerY - 10, { align: 'center', width: 500 });

    // Signature section
    doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('For ' + (process.env.BUSINESS_NAME || 'Premium Jewelry Shop'), 350, footerY + 10);
    
    // Signature line
    doc.moveTo(350, footerY + 40).lineTo(500, footerY + 40).stroke('#cbd5e0');
    doc.fontSize(9).font('Helvetica').fillColor('#718096');
    doc.text('Authorized Signatory', 350, footerY + 45);

    // QR Code placeholder (if available)
    if (enhancedData.qr_code) {
      doc.rect(50, footerY + 10, 60, 60).stroke('#cbd5e0');
      doc.fontSize(8).text('QR Code', 65, footerY + 35);
      doc.fontSize(7).text(enhancedData.qr_code, 55, footerY + 50, { width: 50, ellipsis: true });
    }

    // Digital signature notice
    if (enhancedData.digital_signature) {
      doc.fontSize(8).fillColor('#9ca3af');
      doc.text(
        'This is a digitally generated invoice and does not require physical signature.',
        50, 
        footerY + 80,
        { align: 'center', width: 500 }
      );
    }
  }

  // Keep existing methods for backward compatibility
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
      const width = columnWidths[index] || 80; // Default width if undefined
      doc.text(header, currentX, tableTop, { width: width, align: 'center' });
      currentX += width;
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
      const col0Width = columnWidths[0] || 150;
      doc.text(item.item?.name || 'N/A', currentX, currentY, { 
        width: col0Width, 
        ellipsis: true 
      });
      currentX += col0Width;

      // SKU
      const col1Width = columnWidths[1] || 80;
      doc.text(item.item?.sku || 'N/A', currentX, currentY, { 
        width: col1Width, 
        align: 'center' 
      });
      currentX += col1Width;

      // Metal/Purity
      const col2Width = columnWidths[2] || 100;
      const metalPurity = `${item.item?.metal_name || 'N/A'}/${item.item?.purity_name || 'N/A'}`;
      doc.text(metalPurity, currentX, currentY, { 
        width: col2Width, 
        align: 'center' 
      });
      currentX += col2Width;

      // Quantity
      const col3Width = columnWidths[3] || 40;
      doc.text((item.quantity || 0).toString(), currentX, currentY, { 
        width: col3Width, 
        align: 'center' 
      });
      currentX += col3Width;

      // Unit Price
      const col4Width = columnWidths[4] || 80;
      doc.text(`₹${(item.unit_price || 0).toLocaleString('en-IN')}`, currentX, currentY, { 
        width: col4Width, 
        align: 'right' 
      });
      currentX += col4Width;

      // Total
      const col5Width = columnWidths[5] || 80;
      doc.text(`₹${(item.total_price || 0).toLocaleString('en-IN')}`, currentX, currentY, { 
        width: col5Width, 
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

    let remaining = integerPart;
    
    if (remaining >= 10000000) {
      result += convertHundreds(Math.floor(remaining / 10000000)) + 'Crore ';
      remaining %= 10000000;
    }

    if (remaining >= 100000) {
      result += convertHundreds(Math.floor(remaining / 100000)) + 'Lakh ';
      remaining %= 100000;
    }

    if (remaining >= 1000) {
      result += convertHundreds(Math.floor(remaining / 1000)) + 'Thousand ';
      remaining %= 1000;
    }

    if (remaining > 0) {
      result += convertHundreds(remaining);
    }

    if (decimalPart > 0) {
      result += 'and ' + convertHundreds(decimalPart) + 'Paise ';
    }

    return result.trim();
  }
}