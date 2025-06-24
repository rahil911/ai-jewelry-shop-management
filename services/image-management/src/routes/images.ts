import { Router } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import { ImageController } from '../controllers/ImageController';

const router = Router();
let db: Pool;

export const initializeImageRoutes = (database: Pool) => {
  db = database;
  return router;
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedFormats = (process.env.ALLOWED_FORMATS || 'jpg,jpeg,png,webp').split(',');
    const fileExtension = file.mimetype.split('/')[1];
    
    if (allowedFormats.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`));
    }
  }
});

const getController = () => new ImageController(db);

// Upload single image
router.post('/upload', upload.single('image'), async (req, res) => {
  const controller = getController();
  await controller.uploadImage(req, res);
});

// Upload multiple images
router.post('/upload/multiple', upload.array('images', 10), async (req, res) => {
  const controller = getController();
  await controller.uploadMultipleImages(req, res);
});

// Get image by ID
router.get('/:id', async (req, res) => {
  const controller = getController();
  await controller.getImageById(req, res);
});

// Get images for jewelry item
router.get('/jewelry-item/:jewelryItemId', async (req, res) => {
  const controller = getController();
  await controller.getJewelryItemImages(req, res);
});

// Get images by category
router.get('/category/:category', async (req, res) => {
  const controller = getController();
  await controller.getImagesByCategory(req, res);
});

// Update image metadata
router.put('/:id', async (req, res) => {
  const controller = getController();
  await controller.updateImage(req, res);
});

// Set primary image
router.put('/:id/primary', async (req, res) => {
  const controller = getController();
  await controller.setPrimaryImage(req, res);
});

// Optimize image
router.put('/:id/optimize', async (req, res) => {
  const controller = getController();
  await controller.optimizeImage(req, res);
});

// Delete image
router.delete('/:id', async (req, res) => {
  const controller = getController();
  await controller.deleteImage(req, res);
});

export default router;