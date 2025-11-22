import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../errors/errors';

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: (arg0: null, arg1: string) => void) => {
    cb(null, 'uploads/recipes'); // Ensure this directory exists
  },
  filename: (_req: any, file: { originalname: string; }, cb: (arg0: null, arg1: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `recipe-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (JPEG, PNG, WebP)', 'ERROR-1', 400));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});