import { Router, Response, NextFunction } from 'express';
import categoryService from '../services/categoryService';
import recipeService from '../services/recipeService';
import { CreateCategoryDto, UpdateCategoryDto } from '../types';
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate';
import isAuthorized from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get(
  '/',
  authenticate,
  isAuthorized,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await categoryService.getAllCategories(page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Category already exists
 */
router.post(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data: CreateCategoryDto = req.body;
      const category = await categoryService.createCategory(data);

      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
router.put(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data: UpdateCategoryDto = req.body;
      const category = await categoryService.updateCategory(req.params.id, data);

      res.json(category);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['admin'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/recipes/{recipeId}/categories/{categoryId}:
 *   post:
 *     summary: Add a category to a recipe
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category added to recipe
 *       404:
 *         description: Recipe or category not found
 */
router.post(
  '/recipes/:recipeId/categories/:categoryId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Verify category exists
      await categoryService.getCategoryById(req.params.categoryId);

      const recipe = await recipeService.addCategoryToRecipe(
        req.params.recipeId,
        req.params.categoryId
      );

      res.json(recipe);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/recipes/{recipeId}/categories/{categoryId}:
 *   delete:
 *     summary: Remove a category from a recipe
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category removed from recipe
 *       404:
 *         description: Recipe or category not found
 */
router.delete(
  '/recipes/:recipeId/categories/:categoryId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const recipe = await recipeService.removeCategoryFromRecipe(
        req.params.recipeId,
        req.params.categoryId
      );

      res.json(recipe);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
