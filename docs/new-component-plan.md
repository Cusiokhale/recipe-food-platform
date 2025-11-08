# Image Upload Implementation Plan

## Overview

This document outlines the implementation plan for adding image upload functionality to the Food Recipe API. We'll explore multiple approaches, with Multer being the primary recommendation for local/development environments.

---

## Approach 1: Multer (Local File Storage) ⭐ Recommended for Development

### Description
Multer is a Node.js middleware for handling `multipart/form-data`, primarily used for uploading files. It's simple, well-maintained, and perfect for development and small-scale deployments.

### Pros
- ✅ Simple to implement and configure
- ✅ No external dependencies or services
- ✅ Works out of the box for development
- ✅ Good for testing and local development
- ✅ Fine-grained control over file handling
- ✅ Built-in file filtering and validation

### Cons
- ❌ Not suitable for production with multiple servers (no shared storage)
- ❌ Files stored on local filesystem (not scalable)
- ❌ No CDN integration
- ❌ Manual backup management required
- ❌ Limited to server disk space

### Use Cases
- Development and testing environments
- Single-server deployments
- Proof of concept / MVP
- Applications with low image volume

### Implementation Plan

#### 1. Install Dependencies
```bash
npm install multer
npm install --save-dev @types/multer
```

#### 2. Create Upload Configuration

**File:** `src/config/upload.ts`

```typescript
import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../middleware/errorHandler';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/recipes'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `recipe-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (JPEG, PNG, WebP)', 400));
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
```

#### 3. Create Upload Routes

**File:** `src/routes/upload.ts`

```typescript
import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { upload } from '../config/upload';
import path from 'path';

const router = Router();

/**
 * @swagger
 * /api/upload/recipe-image:
 *   post:
 *     summary: Upload a recipe image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   example: /uploads/recipes/recipe-1234567890-123456789.jpg
 *       400:
 *         description: Invalid file type or size
 */
router.post(
  '/recipe-image',
  authenticate,
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const imageUrl = `/uploads/recipes/${req.file.filename}`;

      res.json({
        message: 'Image uploaded successfully',
        imageUrl,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

#### 4. Serve Static Files

**Update:** `src/index.ts`

```typescript
// Add this line after middleware setup
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add upload routes
import uploadRouter from './routes/upload';
app.use('/api/upload', uploadRouter);
```

#### 5. Directory Setup

Create the uploads directory:
```bash
mkdir -p uploads/recipes
```

Add to `.gitignore`:
```
uploads/
```

#### 6. Update Recipe Creation

Recipes can now accept image URLs from the upload endpoint:

```typescript
// Client flow:
// 1. Upload image -> GET imageUrl
// 2. Create recipe with imageUrl

const recipe = await recipeService.createRecipe(userId, {
  title: 'Pizza',
  description: 'Delicious',
  // ... other fields
  imageUrl: '/uploads/recipes/recipe-1234567890-123456789.jpg'
});
```

---

## Approach 2: Cloud Storage (AWS S3) ⭐ Recommended for Production

### Description
Upload images to AWS S3 bucket using the AWS SDK. Provides scalable, durable, and CDN-ready storage.

### Pros
- ✅ Highly scalable and reliable
- ✅ CDN integration (CloudFront)
- ✅ Works with multiple servers
- ✅ Built-in backup and versioning
- ✅ Pay-as-you-go pricing
- ✅ Image processing integration (Lambda)

### Cons
- ❌ Requires AWS account and setup
- ❌ Additional costs
- ❌ More complex configuration
- ❌ External service dependency

### Implementation Overview

#### 1. Install Dependencies
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3
```

#### 2. Configure S3

**File:** `src/config/s3Upload.ts`

```typescript
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const s3Upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET!,
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `recipes/${uniqueSuffix}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});
```

#### 3. Environment Variables

Add to `.env`:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

---

## Approach 3: Cloudinary ⭐ Easiest Cloud Solution

### Description
Cloudinary is a cloud-based image management service with automatic optimization, transformations, and CDN delivery.

### Pros
- ✅ Very easy to set up
- ✅ Automatic image optimization
- ✅ On-the-fly transformations (resize, crop, etc.)
- ✅ Built-in CDN
- ✅ Free tier available
- ✅ No server storage needed

### Cons
- ❌ External service dependency
- ❌ Pricing based on transformations
- ❌ Vendor lock-in

### Implementation Overview

#### 1. Install Dependencies
```bash
npm install cloudinary multer
```

#### 2. Configure Cloudinary

**File:** `src/config/cloudinary.ts`

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

#### 3. Upload Handler

```typescript
import cloudinary from '../config/cloudinary';
import { upload } from '../config/upload'; // multer memory storage

router.post(
  '/recipe-image',
  authenticate,
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload_stream(
        {
          folder: 'recipes',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) throw error;
          return result;
        }
      );

      res.json({
        imageUrl: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      next(error);
    }
  }
);
```

---

## Approach 4: Firebase Storage

### Description
Use Firebase Cloud Storage, integrated with Firebase Auth already in use.

### Pros
- ✅ Already using Firebase Auth (consistent ecosystem)
- ✅ Good integration with Firebase services
- ✅ Automatic CDN
- ✅ Security rules integration

### Cons
- ❌ More complex than Multer
- ❌ Firebase vendor lock-in
- ❌ Requires Firebase setup

### Implementation Overview

```bash
npm install @google-cloud/storage
```

```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
  },
});

const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET!);
```

---

## Comparison Table

| Feature | Multer (Local) | AWS S3 | Cloudinary | Firebase Storage |
|---------|---------------|---------|------------|------------------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | Free | Pay-as-you-go | Free tier + paid | Pay-as-you-go |
| **Scalability** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Image Processing** | ❌ | Via Lambda | ✅ Built-in | Limited |
| **CDN** | ❌ | Via CloudFront | ✅ Built-in | ✅ Built-in |
| **Development** | ✅ Best | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Production** | ❌ | ✅ Best | ✅ Good | ✅ Good |

---

## Recommendations

### For Development/MVP
**Use Multer (Approach 1)**
- Quick to implement
- No external dependencies
- Perfect for testing
- Easy to migrate later

### For Production (Small-Medium Scale)
**Use Cloudinary (Approach 3)**
- Easy setup
- Automatic optimizations
- Free tier generous
- Less maintenance

### For Production (Large Scale)
**Use AWS S3 (Approach 2)**
- Most control
- Best scalability
- Integrate with existing AWS infrastructure
- Cost-effective at scale

### For Firebase Users
**Use Firebase Storage (Approach 4)**
- Consistent ecosystem
- Good if already invested in Firebase

---

## Security Considerations

### File Validation
```typescript
// Validate file type
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Validate file size (5MB max)
const maxSize = 5 * 1024 * 1024;

// Sanitize filename
const sanitizeFilename = (filename: string) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};
```

### Image Processing (Optional)
```bash
npm install sharp
```

```typescript
import sharp from 'sharp';

// Resize and optimize
await sharp(file.buffer)
  .resize(1000, 1000, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toFile(outputPath);
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: 'Too many uploads, please try again later',
});

router.post('/recipe-image', uploadLimiter, authenticate, upload.single('image'), ...);
```

---

## Migration Path

1. **Start with Multer** for development
2. **Test thoroughly** with local storage
3. **Switch to cloud storage** before production:
   - Update configuration
   - Change storage backend
   - Keep API interface the same
4. **No code changes needed** in recipe service

---

## Testing

### Unit Tests
```typescript
describe('Image Upload', () => {
  it('should upload valid image', async () => {
    const response = await request(app)
      .post('/api/upload/recipe-image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', 'test/fixtures/recipe.jpg');

    expect(response.status).toBe(200);
    expect(response.body.imageUrl).toBeDefined();
  });

  it('should reject invalid file type', async () => {
    const response = await request(app)
      .post('/api/upload/recipe-image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', 'test/fixtures/document.pdf');

    expect(response.status).toBe(400);
  });
});
```

---

## Next Steps

1. Choose approach based on requirements
2. Implement chosen solution
3. Add image upload tests
4. Update recipe creation flow
5. Add image deletion functionality
6. Implement image optimization (if needed)
7. Set up CDN (for production)
8. Monitor storage usage and costs
