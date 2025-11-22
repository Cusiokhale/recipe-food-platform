import { Router, Response, NextFunction } from 'express';
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate';
import reviewService from '../services/reviewService';
import isAuthorized from '../middleware/authorize';
import {
  validateCreateReview,
  validateUpdateReview,
  validateReviewSort,
  parseIntOrUndefined,
} from '../utils/validation';
import { ReviewFilterOptions } from '../types';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         id:
 *           type: string
 *         recipeId:
 *           type: string
 *         userId:
 *           type: string
 *         userName:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5
 *         comment:
 *           type: string
 *           maxLength: 1000
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/recipes/{recipeId}/reviews:
 *   get:
 *     summary: Get all reviews for a recipe with pagination, filtering, and sorting
 *     tags: [Reviews]
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating filter
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum rating filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
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
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
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
  '/:recipeId/reviews',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Build filters
      const filters: ReviewFilterOptions = {
        minRating: parseIntOrUndefined(req.query.minRating),
        maxRating: parseIntOrUndefined(req.query.maxRating),
      };

      // Build sort options
      const sort = validateReviewSort(
        req.query.sortBy as string,
        req.query.sortOrder as string
      );

      const result = await reviewService.getReviewsByRecipeId(
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
 * /api/recipes/{recipeId}/reviews:
 *   post:
 *     summary: Create a review for a recipe (one per user per recipe)
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid rating or user already reviewed this recipe
 *       404:
 *         description: Recipe not found
 */
router.post(
  '/:recipeId/reviews',
  authenticate,
  isAuthorized({ hasRole: ['user'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = validateCreateReview(req.body);
      const userId = req.user!.uid;
      const userName = req.user!.email;

      const review = await reviewService.createReview(
        req.params.recipeId,
        userId,
        userName,
        data
      );

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/recipes/{recipeId}/rating:
 *   get:
 *     summary: Get average rating for a recipe
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Average rating and count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 average:
 *                   type: number
 *                   example: 4.5
 *                 count:
 *                   type: integer
 *                   example: 10
 */
router.get(
  '/:recipeId/rating',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rating = await reviewService.getAverageRating(req.params.recipeId);
      res.json(rating);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get a review by ID
 *     tags: [Reviews]
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
 *         description: Review details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       404:
 *         description: Review not found
 */
router.get(
  '/reviews/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await reviewService.getReviewById(req.params.id);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review (author only)
 *     tags: [Reviews]
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Invalid rating
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.put(
  '/reviews/:id',
  authenticate,
  isAuthorized({ hasRole: ['user'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = validateUpdateReview(req.body);
      const userId = req.user!.uid;

      const review = await reviewService.updateReview(req.params.id, userId, data);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (author or admin only)
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.delete(
  '/reviews/:id',
  authenticate,
  isAuthorized({ hasRole: ['user', 'admin'] }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.uid;
      await reviewService.deleteReview(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/me/reviews:
 *   get:
 *     summary: Get all reviews by the current user with pagination, filtering, and sorting
 *     tags: [Reviews]
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating filter
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum rating filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
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
 *         description: List of user's reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get(
  '/users/me/reviews',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user!.uid;

      // Build filters
      const filters: ReviewFilterOptions = {
        minRating: parseIntOrUndefined(req.query.minRating),
        maxRating: parseIntOrUndefined(req.query.maxRating),
      };

      // Build sort options
      const sort = validateReviewSort(
        req.query.sortBy as string,
        req.query.sortOrder as string
      );

      const result = await reviewService.getReviewsByUserId(userId, {
        page,
        limit,
        filters,
        sort,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
