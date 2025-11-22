import { NextFunction, Router, Response } from 'express';
import { upload } from '../config/upload';
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate';
import { AppError } from '../errors/errors';
import recipeService from '../services/recipeService';
import isAuthorized from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /api/recipe-image:
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
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, or WebP, max 5MB)
 *               recipeId:
 *                 type: string
 *                 description: Optional recipe ID to update with the image URL
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
 *                   description: URL to access the uploaded image
 *                 filename:
 *                   type: string
 *                   description: The stored filename
 *                 recipe:
 *                   $ref: '#/components/schemas/Recipe'
 *                   description: Updated recipe (only if recipeId was provided)
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this recipe
 *       404:
 *         description: Recipe not found
 */
router.post(
  '/recipe-image',
  authenticate,
  isAuthorized({ hasRole: ['user', 'admin'] }),
  upload.single('image'),
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 'FILE_REQUIRED', 400);
      }

      // Build the URL to access the uploaded image
      const protocol = req.protocol;
      const host = req.get('host');
      const imageUrl = `${protocol}://${host}/uploads/recipes/${req.file.filename}`;

      const recipeId = (req.body as { recipeId?: string }).recipeId;

      // If recipeId is provided, update the recipe with the new imageUrl
      if (recipeId) {
        const userId = req.user!.uid;
        const updatedRecipe = await recipeService.updateRecipe(recipeId, userId, { imageUrl });

        res.json({
          imageUrl,
          filename: req.file.filename,
          recipe: updatedRecipe,
        });
        return;
      }

      res.json({
        imageUrl,
        filename: req.file.filename,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
