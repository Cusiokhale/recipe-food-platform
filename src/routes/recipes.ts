import { Router, Request, Response, NextFunction } from 'express';
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate';
import isAuthorized from '../middleware/authorize';
import recipeService from '../services/recipeService';
import ingredientService from '../services/ingredientService';
import { CreateRecipeDto, UpdateRecipeDto } from '../types';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - instructions
 *         - prepTime
 *         - cookTime
 *         - servings
 *         - difficulty
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         instructions:
 *           type: string
 *         prepTime:
 *           type: number
 *           description: Preparation time in minutes
 *         cookTime:
 *           type: number
 *           description: Cooking time in minutes
 *         servings:
 *           type: number
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *         imageUrl:
 *           type: string
 *         createdBy:
 *           type: string
 *         categoryIds:
 *           type: array
 *           items:
 *             type: string
 *         ingredientIds:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes with pagination
 *     tags: [Recipes]
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
 *           default: 10
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *     responses:
 *       200:
 *         description: Paginated list of recipes
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const categoryId = req.query.categoryId as string;
    const difficulty = req.query.difficulty as string;

    const result = await recipeService.getAllRecipes(page, limit, {
      categoryId,
      difficulty,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Get a recipe by ID
 *     tags: [Recipes]
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
 *         description: Recipe details
 *       404:
 *         description: Recipe not found
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recipe = await recipeService.getRecipeById(req.params.id);
    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       201:
 *         description: Recipe created successfully
 */
router.post(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['user', 'admin'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data: CreateRecipeDto = req.body;

      const userId = req.user!.uid;

      const recipe = await recipeService.createRecipe(userId, data);

      // Create ingredients if provided
      if (data.ingredients && data.ingredients.length > 0) {
        await ingredientService.bulkCreateIngredients(recipe.id, data.ingredients);
      }

      res.status(201).json(recipe);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Update a recipe
 *     tags: [Recipes]
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
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 */
router.put(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['user'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data: UpdateRecipeDto = req.body;
      const userId = req.user!.uid;

      const recipe = await recipeService.updateRecipe(req.params.id, userId, data);
      res.json(recipe);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     tags: [Recipes]
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
 *         description: Recipe deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 */
router.delete(
  '/:id',
  authenticate,
  isAuthorized({ hasRole: ['user', 'admin'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.uid;
      await recipeService.deleteRecipe(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
