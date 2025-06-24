import { Pool } from 'pg';
import sharp from 'sharp';
import { BlobServiceClient } from '@azure/storage-blob';
import { JewelryImage, ImageUploadRequest } from '@jewelry-shop/shared/types';
import { logger } from '../utils/logger';

export class ImageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerName: string;

  constructor(private db: Pool) {
    this.containerName = process.env.AZURE_STORAGE_CONTAINER || 'jewelry-images';
    
    // Initialize Azure Blob Storage if configured
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
    }
  }

  // Upload image to cloud storage and save metadata to database
  async uploadImage(file: Express.Multer.File, uploadData: ImageUploadRequest): Promise<JewelryImage> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Validate file format
      if (!this.isValidImageFormat(file.mimetype)) {
        throw new Error('Invalid image format. Supported formats: JPG, JPEG, PNG, WebP');
      }

      // Check file size
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
      if (file.size > maxSize) {
        throw new Error(`File size exceeds limit of ${maxSize / 1024 / 1024}MB`);
      }

      // Generate unique filename
      const filename = this.generateFilename(file.originalname);
      
      // Optimize and upload image
      const optimizedBuffer = await this.optimizeImageBuffer(file.buffer);
      const imageUrl = await this.uploadToCloudStorage(optimizedBuffer, filename, file.mimetype);

      // Generate different sizes
      const thumbnailUrl = await this.generateThumbnail(optimizedBuffer, filename);
      const mediumUrl = await this.generateMediumSize(optimizedBuffer, filename);

      // Save to database
      const imageQuery = `
        INSERT INTO jewelry_images (
          jewelry_item_id, image_url, thumbnail_url, medium_url, 
          filename, file_size, mime_type, alt_text, category, 
          is_primary, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const imageValues = [
        uploadData.jewelry_item_id,
        imageUrl,
        thumbnailUrl,
        mediumUrl,
        filename,
        optimizedBuffer.length,
        file.mimetype,
        uploadData.alt_text,
        uploadData.category,
        uploadData.is_primary,
        uploadData.uploaded_by
      ];

      const imageResult = await client.query(imageQuery, imageValues);
      const image = imageResult.rows[0];

      // If this is set as primary, unset other primary images for the same item
      if (uploadData.is_primary && uploadData.jewelry_item_id) {
        await client.query(
          'UPDATE jewelry_images SET is_primary = false WHERE jewelry_item_id = $1 AND id != $2',
          [uploadData.jewelry_item_id, image.id]
        );
      }

      await client.query('COMMIT');

      return {
        ...image,
        file_size: parseInt(image.file_size)
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error uploading image:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get image by ID
  async getImageById(imageId: number): Promise<JewelryImage | null> {
    const query = `
      SELECT 
        i.*,
        ji.name as jewelry_item_name,
        ji.sku as jewelry_item_sku
      FROM jewelry_images i
      LEFT JOIN jewelry_items ji ON i.jewelry_item_id = ji.id
      WHERE i.id = $1
    `;

    const result = await this.db.query(query, [imageId]);
    
    if (result.rows.length === 0) return null;

    const image = result.rows[0];
    return {
      ...image,
      file_size: parseInt(image.file_size),
      jewelry_item: image.jewelry_item_name ? {
        name: image.jewelry_item_name,
        sku: image.jewelry_item_sku
      } : undefined
    };
  }

  // Get images by jewelry item ID
  async getImagesByJewelryItemId(jewelryItemId: number): Promise<JewelryImage[]> {
    const query = `
      SELECT * FROM jewelry_images 
      WHERE jewelry_item_id = $1 
      ORDER BY is_primary DESC, created_at ASC
    `;

    const result = await this.db.query(query, [jewelryItemId]);
    
    return result.rows.map(image => ({
      ...image,
      file_size: parseInt(image.file_size)
    }));
  }

  // Get images by category with pagination
  async getImagesByCategory(category: string, page: number, limit: number): Promise<{
    images: JewelryImage[];
    total: number;
  }> {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        i.*,
        ji.name as jewelry_item_name,
        ji.sku as jewelry_item_sku,
        COUNT(*) OVER() as total_count
      FROM jewelry_images i
      LEFT JOIN jewelry_items ji ON i.jewelry_item_id = ji.id
      WHERE i.category = $1
      ORDER BY i.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [category, limit, offset]);
    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    const images = result.rows.map(image => ({
      ...image,
      file_size: parseInt(image.file_size),
      jewelry_item: image.jewelry_item_name ? {
        name: image.jewelry_item_name,
        sku: image.jewelry_item_sku
      } : undefined
    }));

    return { images, total };
  }

  // Update image metadata
  async updateImageMetadata(imageId: number, updateData: any, userId: number): Promise<JewelryImage | null> {
    const query = `
      UPDATE jewelry_images SET
        alt_text = COALESCE($1, alt_text),
        category = COALESCE($2, category),
        is_primary = COALESCE($3, is_primary),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await this.db.query(query, [
      updateData.alt_text,
      updateData.category,
      updateData.is_primary,
      imageId
    ]);

    if (result.rows.length === 0) return null;

    const image = result.rows[0];

    // If setting as primary, unset other primary images for the same item
    if (updateData.is_primary && image.jewelry_item_id) {
      await this.db.query(
        'UPDATE jewelry_images SET is_primary = false WHERE jewelry_item_id = $1 AND id != $2',
        [image.jewelry_item_id, imageId]
      );
    }

    return {
      ...image,
      file_size: parseInt(image.file_size)
    };
  }

  // Delete image
  async deleteImage(imageId: number, userId: number): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get image details first
      const image = await this.getImageById(imageId);
      if (!image) return false;

      // Delete from cloud storage
      if (this.blobServiceClient) {
        await this.deleteFromCloudStorage(image.filename);
        
        // Also delete thumbnail and medium size versions
        const thumbnailFilename = this.getThumbnailFilename(image.filename);
        const mediumFilename = this.getMediumFilename(image.filename);
        
        await this.deleteFromCloudStorage(thumbnailFilename);
        await this.deleteFromCloudStorage(mediumFilename);
      }

      // Delete from database
      const deleteResult = await client.query(
        'DELETE FROM jewelry_images WHERE id = $1',
        [imageId]
      );

      await client.query('COMMIT');

      return deleteResult.rowCount > 0;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error deleting image:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Set primary image
  async setPrimaryImage(imageId: number, userId: number): Promise<JewelryImage | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get the image to find the jewelry item
      const image = await this.getImageById(imageId);
      if (!image) return null;

      // Unset all primary images for this jewelry item
      if (image.jewelry_item_id) {
        await client.query(
          'UPDATE jewelry_images SET is_primary = false WHERE jewelry_item_id = $1',
          [image.jewelry_item_id]
        );
      }

      // Set this image as primary
      const result = await client.query(
        'UPDATE jewelry_images SET is_primary = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [imageId]
      );

      await client.query('COMMIT');

      return result.rows.length > 0 ? {
        ...result.rows[0],
        file_size: parseInt(result.rows[0].file_size)
      } : null;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Optimize existing image
  async optimizeImage(imageId: number, options: { quality?: number; width?: number; height?: number }): Promise<JewelryImage | null> {
    const image = await this.getImageById(imageId);
    if (!image) return null;

    try {
      // Download current image
      const imageBuffer = await this.downloadFromCloudStorage(image.filename);
      
      // Apply optimization
      let optimizedBuffer = sharp(imageBuffer);
      
      if (options.width || options.height) {
        optimizedBuffer = optimizedBuffer.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      if (options.quality) {
        optimizedBuffer = optimizedBuffer.jpeg({ quality: options.quality });
      }
      
      const finalBuffer = await optimizedBuffer.toBuffer();
      
      // Upload optimized version
      await this.uploadToCloudStorage(finalBuffer, image.filename, image.mime_type);
      
      // Update file size in database
      await this.db.query(
        'UPDATE jewelry_images SET file_size = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [finalBuffer.length, imageId]
      );

      return await this.getImageById(imageId);

    } catch (error) {
      logger.error('Error optimizing image:', error);
      throw error;
    }
  }

  // Private helper methods
  private isValidImageFormat(mimeType: string): boolean {
    const allowedFormats = (process.env.ALLOWED_FORMATS || 'jpg,jpeg,png,webp').split(',');
    const format = mimeType.split('/')[1];
    return allowedFormats.includes(format);
  }

  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${timestamp}-${random}.${extension}`;
  }

  private async optimizeImageBuffer(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .jpeg({ quality: 85 })
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
  }

  private async generateThumbnail(buffer: Buffer, originalFilename: string): Promise<string> {
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const thumbnailFilename = this.getThumbnailFilename(originalFilename);
    return await this.uploadToCloudStorage(thumbnailBuffer, thumbnailFilename, 'image/jpeg');
  }

  private async generateMediumSize(buffer: Buffer, originalFilename: string): Promise<string> {
    const mediumBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const mediumFilename = this.getMediumFilename(originalFilename);
    return await this.uploadToCloudStorage(mediumBuffer, mediumFilename, 'image/jpeg');
  }

  private getThumbnailFilename(filename: string): string {
    const [name, ext] = filename.split('.');
    return `${name}-thumb.${ext}`;
  }

  private getMediumFilename(filename: string): string {
    const [name, ext] = filename.split('.');
    return `${name}-medium.${ext}`;
  }

  private async uploadToCloudStorage(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    if (!this.blobServiceClient) {
      // Fallback to local storage
      return this.saveToLocalStorage(buffer, filename);
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
          blobCacheControl: 'public, max-age=31536000' // 1 year cache
        }
      });

      const cdnUrl = process.env.CDN_BASE_URL;
      return cdnUrl ? `${cdnUrl}/${filename}` : blockBlobClient.url;

    } catch (error) {
      logger.error('Error uploading to Azure Blob Storage:', error);
      // Fallback to local storage
      return this.saveToLocalStorage(buffer, filename);
    }
  }

  private async deleteFromCloudStorage(filename: string): Promise<void> {
    if (!this.blobServiceClient) return;

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      logger.error('Error deleting from Azure Blob Storage:', error);
    }
  }

  private async downloadFromCloudStorage(filename: string): Promise<Buffer> {
    if (!this.blobServiceClient) {
      throw new Error('Cloud storage not configured');
    }

    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    
    const downloadResponse = await blockBlobClient.download();
    const chunks: Buffer[] = [];
    
    if (downloadResponse.readableStreamBody) {
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }
    }
    
    return Buffer.concat(chunks);
  }

  private saveToLocalStorage(buffer: Buffer, filename: string): string {
    // This is a fallback for development - in production, use cloud storage
    const fs = require('fs');
    const path = require('path');
    
    const uploadDir = process.env.IMAGE_UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    return `/uploads/${filename}`;
  }
}