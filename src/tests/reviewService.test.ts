import reviewService from '../services/reviewService';
import recipeService from '../services/recipeService';
import { CreateReviewDto } from '../types';

describe('Review Service', () => {
  const userId = 'user123';
  const userName = 'Test User';
  let recipeId: string;

  beforeEach(async () => {
    reviewService.clearAll();
    recipeService.clearAll();

    // Create a recipe for testing
    const recipe = await recipeService.createRecipe(userId, {
      title: 'Test Recipe',
      description: 'Test',
      instructions: 'Test',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      difficulty: 'easy',
    });
    recipeId = recipe.id;
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const data: CreateReviewDto = {
        rating: 5,
        comment: 'Excellent recipe!',
      };

      const review = await reviewService.createReview(recipeId, userId, userName, data);

      expect(review.id).toBeDefined();
      expect(review.recipeId).toBe(recipeId);
      expect(review.userId).toBe(userId);
      expect(review.userName).toBe(userName);
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Excellent recipe!');
    });

    it('should validate rating between 1 and 5', async () => {
      const invalidRatings = [0, 6, -1, 10];

      for (const rating of invalidRatings) {
        await expect(
          reviewService.createReview(recipeId, userId, userName, { rating })
        ).rejects.toThrow('Rating must be between 1 and 5');
      }
    });

    it('should only accept integer ratings', async () => {
      await expect(
        reviewService.createReview(recipeId, userId, userName, { rating: 3.5 })
      ).rejects.toThrow('Rating must be a whole number');
    });

    it('should not allow duplicate reviews from same user', async () => {
      const data: CreateReviewDto = {
        rating: 4,
        comment: 'Good',
      };

      await reviewService.createReview(recipeId, userId, userName, data);

      await expect(
        reviewService.createReview(recipeId, userId, userName, data)
      ).rejects.toThrow('You have already reviewed this recipe');
    });

    it('should throw error for non-existent recipe', async () => {
      await expect(
        reviewService.createReview('invalid-recipe', userId, userName, { rating: 5 })
      ).rejects.toThrow('Recipe not found');
    });
  });

  describe('getReviewsByRecipeId', () => {
    it('should get all reviews for a recipe', async () => {
      await reviewService.createReview(recipeId, 'user1', 'User 1', {
        rating: 5,
        comment: 'Great!',
      });
      await reviewService.createReview(recipeId, 'user2', 'User 2', {
        rating: 4,
        comment: 'Good!',
      });

      const result = await reviewService.getReviewsByRecipeId(recipeId, 1, 10);

      expect(result.total).toBe(2);
      expect(result.data.length).toBe(2);
    });

    it('should paginate results', async () => {
      // Create 5 reviews
      for (let i = 0; i < 5; i++) {
        await reviewService.createReview(recipeId, `user${i}`, `User ${i}`, {
          rating: 5,
        });
      }

      const page1 = await reviewService.getReviewsByRecipeId(recipeId, 1, 2);
      const page2 = await reviewService.getReviewsByRecipeId(recipeId, 2, 2);

      expect(page1.data.length).toBe(2);
      expect(page2.data.length).toBe(2);
      expect(page1.totalPages).toBe(3);
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const review = await reviewService.createReview(recipeId, userId, userName, {
        rating: 3,
        comment: 'Okay',
      });

      const updated = await reviewService.updateReview(review.id, userId, {
        rating: 5,
        comment: 'Actually, it was great!',
      });

      expect(updated.rating).toBe(5);
      expect(updated.comment).toBe('Actually, it was great!');
    });

    it('should not allow unauthorized user to update', async () => {
      const review = await reviewService.createReview(recipeId, userId, userName, {
        rating: 4,
      });

      await expect(
        reviewService.updateReview(review.id, 'other-user', { rating: 1 })
      ).rejects.toThrow('Unauthorized to update this review');
    });

    it('should validate rating on update', async () => {
      const review = await reviewService.createReview(recipeId, userId, userName, {
        rating: 4,
      });

      await expect(
        reviewService.updateReview(review.id, userId, { rating: 10 })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const review = await reviewService.createReview(recipeId, userId, userName, {
        rating: 5,
      });

      await reviewService.deleteReview(review.id, userId);

      await expect(reviewService.getReviewById(review.id)).rejects.toThrow(
        'Review not found'
      );
    });

    it('should not allow unauthorized user to delete', async () => {
      const review = await reviewService.createReview(recipeId, userId, userName, {
        rating: 4,
      });

      await expect(reviewService.deleteReview(review.id, 'other-user')).rejects.toThrow(
        'Unauthorized to delete this review'
      );
    });
  });

  describe('getAverageRating', () => {
    it('should calculate average rating', async () => {
      await reviewService.createReview(recipeId, 'user1', 'User 1', { rating: 5 });
      await reviewService.createReview(recipeId, 'user2', 'User 2', { rating: 3 });
      await reviewService.createReview(recipeId, 'user3', 'User 3', { rating: 4 });

      const result = await reviewService.getAverageRating(recipeId);

      expect(result.average).toBe(4);
      expect(result.count).toBe(3);
    });

    it('should return 0 for recipes with no reviews', async () => {
      const result = await reviewService.getAverageRating(recipeId);

      expect(result.average).toBe(0);
      expect(result.count).toBe(0);
    });

    it('should round to 1 decimal place', async () => {
      await reviewService.createReview(recipeId, 'user1', 'User 1', { rating: 5 });
      await reviewService.createReview(recipeId, 'user2', 'User 2', { rating: 4 });
      await reviewService.createReview(recipeId, 'user3', 'User 3', { rating: 3 });

      const result = await reviewService.getAverageRating(recipeId);

      expect(result.average).toBe(4);
    });
  });
});
