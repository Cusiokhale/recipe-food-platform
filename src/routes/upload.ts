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

      // const result = await cloudinary.uploader.upload(
      //       req.file.originalname
      // );

      // console.log('Result => ', result)

      return res.json({
        result:   `Image [${req.file.originalname}] uploaded locally!`
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;