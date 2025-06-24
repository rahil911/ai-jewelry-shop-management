import { generateId } from '@jewelry-shop/shared';

export class BarcodeService {
  async generateBarcode(sku: string): Promise<string> {
    // Generate a simple barcode based on SKU and timestamp
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `${sku}-${timestamp.slice(-6)}${random}`.toUpperCase();
  }
  
  async generateQRCode(itemId: string, sku: string): Promise<string> {
    // Generate QR code data with item information
    const qrData = {
      itemId,
      sku,
      type: 'jewelry_item',
      timestamp: new Date().toISOString(),
      verify_url: `${process.env.FRONTEND_URL}/verify/${itemId}`
    };
    
    return JSON.stringify(qrData);
  }
  
  validateBarcode(barcode: string): boolean {
    // Basic barcode validation
    return /^[A-Z0-9-]{10,}$/.test(barcode);
  }
  
  async generateBatchBarcodes(items: Array<{sku: string, id: string}>): Promise<Array<{id: string, barcode: string}>> {
    const barcodes = [];
    
    for (const item of items) {
      const barcode = await this.generateBarcode(item.sku);
      barcodes.push({
        id: item.id,
        barcode
      });
    }
    
    return barcodes;
  }
}