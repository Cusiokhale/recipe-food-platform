import { Router, Response, NextFunction } from 'express';
import authenticate, { AuthenticatedRequest }  from '../middleware/authenticate';
import ingredientService from '../services/ingredientService';
import { CreateIngredientDto, UpdateIngredientDto } from '../types';

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
 *         unit:
 *           type: string
 *           example: cups
 *         quantity:
 *           type: number
 *           example: 2
 *         recipeId:
 *           type: string
 */

/**
 * @swagger
 * /api/recipes/{recipeId}/ingredients:
 *   get:
 *     summary: Get all ingredients for a recipe
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of ingredients
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

      const result = await ingredientService.getIngredientsByRecipeId(
        req.params.recipeId,
        page,
        limit
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
 *             $ref: '#/components/schemas/Ingredient'
 *     responses:
 *       201:
 *         description: Ingredient created successfully
 *       404:
 *         description: Recipe not found
 */
router.post(
  '/:recipeId/ingredients',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data: CreateIngredientDto = req.body;
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
 *             $ref: '#/components/schemas/Ingredient'
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *       404:
 *         description: Ingredient not found
 */
router.put(
  '/ingredients/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data: UpdateIngredientDto = req.body;
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
