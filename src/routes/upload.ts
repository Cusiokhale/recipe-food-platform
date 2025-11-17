import { NextFunction, Router } from 'express';
import cloudinary from '../config/cloudinary';
import { upload } from '../config/upload';
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate';
import { AppError } from '../errors/errors';

const router = Router();

router.post(
  '/recipe-image',
  authenticate,
  upload.single('image'),
  async (req: any, res: any, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 'ERROR-1', 400);
      }

      console.log('Res ', req.file)

      const result = await cloudinary.uploader.upload(
            req.file.originalname
      );

      console.log('Result => ', result)

      return res.json({
        imageUrl: (result as any).secure_url,
        publicId: (result as any).public_id,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;