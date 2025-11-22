import { Router, Response, NextFunction } from 'express';
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate';
import ingredientService from '../services/ingredientService';
import {
  validateCreateIngredient,
  validateUpdateIngredient,
  validateIngredientSort,
} from '../utils/validation';
import { IngredientFilterOptions } from '../types';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Ingredient:
 *       type: object
 *       required:
 *         - name
 *         - unit
 *         - quantity
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           maxLength: 100
 *         unit:
 *           type: string
 *           maxLength: 50
 *           example: cups
 *         quantity:
 *           type: number
 *           minimum: 0
 *           example: 2
 *         recipeId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/recipes/{recipeId}/ingredients:
 *   get:
 *     summary: Get all ingredients for a recipe with pagination, filtering, and sorting
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in ingredient name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, quantity, createdAt]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ingredient'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       404:
 *         description: Recipe not found
 */
router.get(
  '/:recipeId/ingredients',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      // Build filters
      const filters: IngredientFilterOptions = {
        search: req.query.search as string,
      };

      // Build sort options
      const sort = validateIngredientSort(
        req.query.sortBy as string,
        req.query.sortOrder as string
      );

      const result = await ingredientService.getIngredientsByRecipeId(
        req.params.recipeId,
        { page, limit, filters, sort }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/recipes/{recipeId}/ingredients:
 *   post:
 *     summary: Add an ingredient to a recipe
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - unit
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               unit:
 *                 type: string
 *                 maxLength: 50
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Ingredient created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Recipe not found
 */
router.post(
  '/:recipeId/ingredients',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = validateCreateIngredient(req.body);
      const ingredient = await ingredientService.createIngredient(req.params.recipeId, data);

      res.status(201).json(ingredient);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ingredients/{id}:
 *   get:
 *     summary: Get an ingredient by ID
 *     tags: [Ingredients]
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
 *         description: Ingredient details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 *       404:
 *         description: Ingredient not found
 */
router.get(
  '/ingredients/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ingredient = await ingredientService.getIngredientById(req.params.id);
      res.json(ingredient);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ingredients/{id}:
 *   put:
 *     summary: Update an ingredient
 *     tags: [Ingredients]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               unit:
 *                 type: string
 *                 maxLength: 50
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Ingredient not found
 */
router.put(
  '/ingredients/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = validateUpdateIngredient(req.body);
      const ingredient = await ingredientService.updateIngredient(req.params.id, data);

      res.json(ingredient);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ingredients/{id}:
 *   delete:
 *     summary: Delete an ingredient
 *     tags: [Ingredients]
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
 *         description: Ingredient deleted successfully
 *       404:
 *         description: Ingredient not found
 */
router.delete(
  '/ingredients/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await ingredientService.deleteIngredient(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
