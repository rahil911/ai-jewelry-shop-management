import { Request, Response } from 'express';
import { Pool } from 'pg';
import { ImageService } from '../services/ImageService';
import { logger } from '../utils/logger';
import { JewelryImage, ImageUploadRequest } from '@jewelry-shop/shared/types';

export class ImageController {
  private imageService: ImageService;

  constructor(db: Pool) {
    this.imageService = new ImageService(db);
  }

  // Upload single image
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      const { jewelry_item_id, category, alt_text, is_primary } = req.body;
      const userId = (req as any).user.id;

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
        return;
      }

      const uploadData: ImageUploadRequest = {
        jewelry_item_id: jewelry_item_id ? parseInt(jewelry_item_id) : undefined,
        category: category || 'product',
        alt_text: alt_text || '',
        is_primary: is_primary === 'true',
        uploaded_by: userId
      };

      const image = await this.imageService.uploadImage(file, uploadData);

      logger.info(`Image uploaded: ${image.image_url} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: image,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      logger.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Upload multiple images
  async uploadMultipleImages(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const { jewelry_item_id, category, alt_text } = req.body;
      const userId = (req as any).user.id;

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
        return;
      }

      const uploadPromises = files.map((file, index) => {
        const uploadData: ImageUploadRequest = {
          jewelry_item_id: jewelry_item_id ? parseInt(jewelry_item_id) : undefined,
          category: category || 'product',
          alt_text: alt_text || `Image ${index + 1}`,
          is_primary: index === 0, // First image is primary
          uploaded_by: userId
        };
        return this.imageService.uploadImage(file, uploadData);
      });

      const images = await Promise.all(uploadPromises);

      logger.info(`${images.length} images uploaded by user ${userId}`);

      res.status(201).json({
        success: true,
        data: images,
        message: `${images.length} images uploaded successfully`
      });
    } catch (error) {
      logger.error('Error uploading multiple images:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload images',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get image by ID
  async getImageById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const image = await this.imageService.getImageById(parseInt(id));

      if (!image) {
        res.status(404).json({
          success: false,
          error: 'Image not found'
        });
        return;
      }

      res.json({
        success: true,
        data: image
      });
    } catch (error) {
      logger.error('Error fetching image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get images for jewelry item
  async getJewelryItemImages(req: Request, res: Response): Promise<void> {
    try {
      const { jewelryItemId } = req.params;

      const images = await this.imageService.getImagesByJewelryItemId(parseInt(jewelryItemId));

      res.json({
        success: true,
        data: images
      });
    } catch (error) {
      logger.error('Error fetching jewelry item images:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch images',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get images by category
  async getImagesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await this.imageService.getImagesByCategory(
        category,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.images,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string))
        }
      });
    } catch (error) {
      logger.error('Error fetching images by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch images',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update image metadata
  async updateImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = (req as any).user.id;

      const updatedImage = await this.imageService.updateImageMetadata(
        parseInt(id),
        updateData,
        userId
      );

      if (!updatedImage) {
        res.status(404).json({
          success: false,
          error: 'Image not found'
        });
        return;
      }

      logger.info(`Image metadata updated: ${id} by user ${userId}`);

      res.json({
        success: true,
        data: updatedImage,
        message: 'Image updated successfully'
      });
    } catch (error) {
      logger.error('Error updating image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete image
  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const deleted = await this.imageService.deleteImage(parseInt(id), userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Image not found'
        });
        return;
      }

      logger.info(`Image deleted: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Set primary image for jewelry item
  async setPrimaryImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const updatedImage = await this.imageService.setPrimaryImage(parseInt(id), userId);

      if (!updatedImage) {
        res.status(404).json({
          success: false,
          error: 'Image not found'
        });
        return;
      }

      logger.info(`Primary image set: ${id} by user ${userId}`);

      res.json({
        success: true,
        data: updatedImage,
        message: 'Primary image set successfully'
      });
    } catch (error) {
      logger.error('Error setting primary image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set primary image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Optimize image
  async optimizeImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quality = 80, width, height } = req.body;

      const optimizedImage = await this.imageService.optimizeImage(
        parseInt(id),
        { quality, width, height }
      );

      if (!optimizedImage) {
        res.status(404).json({
          success: false,
          error: 'Image not found'
        });
        return;
      }

      res.json({
        success: true,
        data: optimizedImage,
        message: 'Image optimized successfully'
      });
    } catch (error) {
      logger.error('Error optimizing image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}