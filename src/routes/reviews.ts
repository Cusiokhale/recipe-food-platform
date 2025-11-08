import { Router, Response, NextFunction } from 'express';
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate';
import reviewService from '../services/reviewService';
import { CreateReviewDto, UpdateReviewDto } from '../types';
import isAuthorized from '../middleware/authorize';

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
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/recipes/{recipeId}/reviews:
 *   get:
 *     summary: Get all reviews for a recipe
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of reviews
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

      const result = await reviewService.getReviewsByRecipeId(
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
 * /api/recipes/{recipeId}/reviews:
 *   post:
 *     summary: Create a review for a recipe
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
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid rating or user already reviewed
 *       404:
 *         description: Recipe not found
 */
router.post(
  '/:recipeId/reviews',
  authenticate,
  isAuthorized({hasRole: ["user"]}),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data: CreateReviewDto = req.body;
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
 *     summary: Update a review
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
  isAuthorized({hasRole: ["user"]}),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data: UpdateReviewDto = req.body;
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
 *     summary: Delete a review
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
  isAuthorized({hasRole: ["user", "admin"]}),
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
 *     summary: Get all reviews by the current user
 *     tags: [Reviews]
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
 *           default: 20
 *     responses:
 *       200:
 *         description: List of user's reviews
 */
router.get(
  '/users/me/reviews',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user!.uid;

      const result = await reviewService.getReviewsByUserId(userId, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
