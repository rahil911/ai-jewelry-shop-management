import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { createApiResponse, ServiceError } from '@jewelry-shop/shared';
import { BarcodeService } from '../services/BarcodeService';
import { logger } from '../utils/logger';

const router = Router();
const barcodeService = new BarcodeService();

// Generate barcode for existing item
router.post('/generate/:itemId', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const { itemId } = req.params;
    
    // Get item details
    const itemResult = await db.query('SELECT sku, barcode FROM jewelry_items WHERE id = $1', [itemId]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json(createApiResponse(false, undefined, null, 'Item not found'));
    }
    
    const item = itemResult.rows[0];
    
    // Generate new barcode if item doesn't have one
    let barcode = item.barcode;
    if (!barcode) {
      barcode = await barcodeService.generateBarcode(item.sku);
      
      // Update item with new barcode
      await db.query('UPDATE jewelry_items SET barcode = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [barcode, itemId]);
    }
    
    // Generate QR code data
    const qrCodeData = await barcodeService.generateQRCode(itemId, item.sku);
    
    const response = {
      itemId,
      sku: item.sku,
      barcode,
      qrCodeData,
      printFormat: {
        barcode: barcode,
        qrCode: qrCodeData,
        itemInfo: {
          sku: item.sku,
          itemId
        }
      }
    };
    
    logger.info('Barcode generated', { itemId, sku: item.sku, barcode });
    
    res.json(createApiResponse(true, response, 'Barcode generated successfully'));
    
  } catch (error) {
    logger.error('Generate barcode error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to generate barcode'));
  }
});

// Generate batch barcodes for multiple items
router.post('/generate-batch', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const { itemIds } = req.body;
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json(createApiResponse(false, undefined, null, 'itemIds array is required'));
    }
    
    // Get items that need barcodes
    const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(',');
    const itemsResult = await db.query(
      `SELECT id, sku, barcode FROM jewelry_items WHERE id IN (${placeholders})`,
      itemIds
    );
    
    const items = itemsResult.rows;
    const itemsNeedingBarcodes = items.filter(item => !item.barcode);
    
    if (itemsNeedingBarcodes.length > 0) {
      // Generate barcodes for items that need them
      const batchBarcodes = await barcodeService.generateBatchBarcodes(
        itemsNeedingBarcodes.map(item => ({ id: item.id, sku: item.sku }))
      );
      
      // Update items with new barcodes
      for (const barcodeData of batchBarcodes) {
        await db.query(
          'UPDATE jewelry_items SET barcode = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [barcodeData.barcode, barcodeData.id]
        );
      }
      
      // Update local items array with new barcodes
      for (const item of items) {
        const barcodeData = batchBarcodes.find(b => b.id === item.id);
        if (barcodeData) {
          item.barcode = barcodeData.barcode;
        }
      }
    }
    
    // Generate response with all barcode data
    const response = [];
    for (const item of items) {
      const qrCodeData = await barcodeService.generateQRCode(item.id, item.sku);
      response.push({
        itemId: item.id,
        sku: item.sku,
        barcode: item.barcode,
        qrCodeData,
        printFormat: {
          barcode: item.barcode,
          qrCode: qrCodeData,
          itemInfo: {
            sku: item.sku,
            itemId: item.id
          }
        }
      });
    }
    
    logger.info('Batch barcodes generated', { 
      totalItems: items.length, 
      newBarcodes: itemsNeedingBarcodes.length 
    });
    
    res.json(createApiResponse(true, response, 'Batch barcodes generated successfully'));
    
  } catch (error) {
    logger.error('Generate batch barcodes error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to generate batch barcodes'));
  }
});

// Lookup item by barcode
router.get('/lookup/:barcode', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const { barcode } = req.params;
    
    if (!barcodeService.validateBarcode(barcode)) {
      return res.status(400).json(createApiResponse(false, undefined, null, 'Invalid barcode format'));
    }
    
    const result = await db.query(`
      SELECT ji.*, 
             c.name as category_name,
             mt.name as metal_name,
             mt.symbol as metal_symbol,
             p.purity_name,
             p.purity_percentage
      FROM jewelry_items ji
      LEFT JOIN categories c ON ji.category_id = c.id
      LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
      LEFT JOIN purities p ON ji.purity_id = p.id
      WHERE ji.barcode = $1 AND ji.is_available = true
    `, [barcode]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createApiResponse(false, undefined, null, 'Item not found with this barcode'));
    }
    
    const item = result.rows[0];
    
    // Log barcode lookup for audit trail
    logger.info('Barcode lookup', { barcode, itemId: item.id, sku: item.sku });
    
    res.json(createApiResponse(true, item, 'Item found successfully'));
    
  } catch (error) {
    logger.error('Barcode lookup error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to lookup barcode'));
  }
});

// Validate barcode format
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.body;
    
    if (!barcode) {
      return res.status(400).json(createApiResponse(false, undefined, null, 'Barcode is required'));
    }
    
    const isValid = barcodeService.validateBarcode(barcode);
    
    res.json(createApiResponse(true, { 
      barcode, 
      isValid,
      format: isValid ? 'Valid jewelry barcode format' : 'Invalid format'
    }, 'Barcode validation completed'));
    
  } catch (error) {
    logger.error('Barcode validation error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to validate barcode'));
  }
});

// Get barcode statistics
router.get('/stats', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(barcode) as items_with_barcodes,
        COUNT(*) - COUNT(barcode) as items_without_barcodes,
        COUNT(CASE WHEN barcode IS NOT NULL AND is_available = true THEN 1 END) as active_barcoded_items
      FROM jewelry_items
    `);
    
    const categoryStats = await db.query(`
      SELECT 
        c.name as category_name,
        COUNT(ji.id) as total_items,
        COUNT(ji.barcode) as items_with_barcodes
      FROM categories c
      LEFT JOIN jewelry_items ji ON c.id = ji.category_id AND ji.is_available = true
      WHERE c.is_active = true
      GROUP BY c.id, c.name
      ORDER BY total_items DESC
    `);
    
    const response = {
      overall: stats.rows[0],
      byCategory: categoryStats.rows
    };
    
    res.json(createApiResponse(true, response, 'Barcode statistics retrieved successfully'));
    
  } catch (error) {
    logger.error('Get barcode stats error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to get barcode statistics'));
  }
});

// Print barcode labels (generates print-ready data)
router.post('/print-labels', async (req: Request, res: Response) => {
  const db: Pool = req.app.locals.db;
  
  try {
    const { itemIds, format } = req.body;
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json(createApiResponse(false, undefined, null, 'itemIds array is required'));
    }
    
    const labelFormat = format || 'standard'; // standard, small, large
    
    // Get items with their details
    const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await db.query(`
      SELECT ji.id, ji.sku, ji.barcode, ji.name, ji.selling_price,
             c.name as category_name,
             mt.symbol as metal_symbol,
             p.purity_name
      FROM jewelry_items ji
      LEFT JOIN categories c ON ji.category_id = c.id
      LEFT JOIN metal_types mt ON ji.metal_type_id = mt.id
      LEFT JOIN purities p ON ji.purity_id = p.id
      WHERE ji.id IN (${placeholders}) AND ji.is_available = true
    `, itemIds);
    
    if (result.rows.length === 0) {
      return res.status(404).json(createApiResponse(false, undefined, null, 'No items found'));
    }
    
    // Generate print-ready label data
    const labels = [];
    for (const item of result.rows) {
      if (!item.barcode) {
        // Generate barcode if missing
        const newBarcode = await barcodeService.generateBarcode(item.sku);
        await db.query('UPDATE jewelry_items SET barcode = $1 WHERE id = $2', [newBarcode, item.id]);
        item.barcode = newBarcode;
      }
      
      const qrCodeData = await barcodeService.generateQRCode(item.id, item.sku);
      
      labels.push({
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        price: item.selling_price,
        category: item.category_name,
        metal: item.metal_symbol,
        purity: item.purity_name,
        barcode: item.barcode,
        qrCode: qrCodeData,
        printFormat: labelFormat
      });
    }
    
    logger.info('Print labels generated', { itemCount: labels.length, format: labelFormat });
    
    res.json(createApiResponse(true, { 
      labels, 
      format: labelFormat,
      totalLabels: labels.length 
    }, 'Print labels generated successfully'));
    
  } catch (error) {
    logger.error('Generate print labels error:', error);
    res.status(500).json(createApiResponse(false, undefined, null, 'Failed to generate print labels'));
  }
});

export { router as barcodeRoutes };