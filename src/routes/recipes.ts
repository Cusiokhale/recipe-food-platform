import { Router, Request, Response, NextFunction } from 'express';
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate';
import isAuthorized from '../middleware/authorize';
import recipeService from '../services/recipeService';
import ingredientService from '../services/ingredientService';
import {
  validateCreateRecipe,
  validateUpdateRecipe,
  validateRecipeSort,
  parseIntOrUndefined,
  parseDateOrUndefined,
} from '../utils/validation';
import { RecipeFilterOptions } from '../types';

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
 *           maxLength: 200
 *         description:
 *           type: string
 *           maxLength: 2000
 *         instructions:
 *           type: string
 *         prepTime:
 *           type: number
 *           description: Preparation time in minutes (0-10000)
 *         cookTime:
 *           type: number
 *           description: Cooking time in minutes (0-10000)
 *         servings:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *         imageUrl:
 *           type: string
 *           format: uri
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes with pagination, filtering, and sorting
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: minPrepTime
 *         schema:
 *           type: integer
 *         description: Minimum prep time in minutes
 *       - in: query
 *         name: maxPrepTime
 *         schema:
 *           type: integer
 *         description: Maximum prep time in minutes
 *       - in: query
 *         name: minCookTime
 *         schema:
 *           type: integer
 *         description: Minimum cook time in minutes
 *       - in: query
 *         name: maxCookTime
 *         schema:
 *           type: integer
 *         description: Maximum cook time in minutes
 *       - in: query
 *         name: minServings
 *         schema:
 *           type: integer
 *         description: Minimum servings
 *       - in: query
 *         name: maxServings
 *         schema:
 *           type: integer
 *         description: Maximum servings
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter recipes created after this date
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter recipes created before this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, prepTime, cookTime, servings, difficulty]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Paginated list of recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Build filters
    const filters: RecipeFilterOptions = {
      categoryId: req.query.categoryId as string,
      difficulty: req.query.difficulty as 'easy' | 'medium' | 'hard',
      createdBy: req.query.createdBy as string,
      search: req.query.search as string,
      minPrepTime: parseIntOrUndefined(req.query.minPrepTime),
      maxPrepTime: parseIntOrUndefined(req.query.maxPrepTime),
      minCookTime: parseIntOrUndefined(req.query.minCookTime),
      maxCookTime: parseIntOrUndefined(req.query.maxCookTime),
      minServings: parseIntOrUndefined(req.query.minServings),
      maxServings: parseIntOrUndefined(req.query.maxServings),
      createdAfter: parseDateOrUndefined(req.query.createdAfter),
      createdBefore: parseDateOrUndefined(req.query.createdBefore),
    };

    // Build sort options
    const sort = validateRecipeSort(
      req.query.sortBy as string,
      req.query.sortOrder as string
    );

    const result = await recipeService.getAllRecipes({
      page,
      limit,
      filters,
      sort,
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
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
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - instructions
 *               - prepTime
 *               - cookTime
 *               - servings
 *               - difficulty
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               instructions:
 *                 type: string
 *               prepTime:
 *                 type: number
 *               cookTime:
 *                 type: number
 *               servings:
 *                 type: integer
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     unit:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  authenticate,
  isAuthorized({ hasRole: ['user', 'admin'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = validateCreateRecipe(req.body);
      const userId = req.user!.uid;

      const recipe = await recipeService.createRecipe(userId, data);

      // Create ingredients if provided
      if (data.ingredients && data.ingredients.length > 0) {
        await ingredientService.bulkCreateIngredients(recipe.id, data.ingredients);
      }

      // Fetch updated recipe with ingredient IDs
      const updatedRecipe = await recipeService.getRecipeById(recipe.id);

      res.status(201).json(updatedRecipe);
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
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               instructions:
 *                 type: string
 *               prepTime:
 *                 type: number
 *               cookTime:
 *                 type: number
 *               servings:
 *                 type: integer
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *       400:
 *         description: Validation error
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
      const data = validateUpdateRecipe(req.body);
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
  isAuthorized({ hasRole: ['user'] }),
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
