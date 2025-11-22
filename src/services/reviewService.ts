import { AppError } from '../errors/errors';
import {
  Review,
  CreateReviewDto,
  UpdateReviewDto,
  PaginatedResponse,
  ReviewQueryOptions,
} from '../types';
import reviewRepository from '../repositories/reviewRepository';
import recipeService from './recipeService';

class ReviewService {
  async createReview(
    recipeId: string,
    userId: string,
    userName: string | undefined,
    data: CreateReviewDto
  ): Promise<Review> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    // Check if user already reviewed this recipe
    const existingReview = await reviewRepository.findByRecipeAndUser(recipeId, userId);

    if (existingReview) {
      throw new AppError('You have already reviewed this recipe', 'DUPLICATE_REVIEW', 400);
    }

    return reviewRepository.createReview(recipeId, userId, userName, data);
  }

  async getReviewById(id: string): Promise<Review> {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new AppError('Review not found', 'REVIEW_NOT_FOUND', 404);
    }
    return review;
  }

  async getReviewsByRecipeId(
    recipeId: string,
    options: ReviewQueryOptions = {}
  ): Promise<PaginatedResponse<Review>> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    return reviewRepository.findByRecipeId(recipeId, options);
  }

  async getReviewsByUserId(
    userId: string,
    options: ReviewQueryOptions = {}
  ): Promise<PaginatedResponse<Review>> {
    return reviewRepository.findByUserId(userId, options);
  }

  async updateReview(id: string, userId: string, data: UpdateReviewDto): Promise<Review> {
    const review = await this.getReviewById(id);

    // Check if user is the author
    if (review.userId !== userId) {
      throw new AppError('Unauthorized to update this review', 'UNAUTHORIZED', 403);
    }

    const updatedReview = await reviewRepository.updateReview(id, data);
    if (!updatedReview) {
      throw new AppError('Failed to update review', 'UPDATE_FAILED', 500);
    }

    return updatedReview;
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const review = await this.getReviewById(id);

    // Check if user is the author
    if (review.userId !== userId) {
      throw new AppError('Unauthorized to delete this review', 'UNAUTHORIZED', 403);
    }

    const deleted = await reviewRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete review', 'DELETE_FAILED', 500);
    }
  }

  async getAverageRating(recipeId: string): Promise<{ average: number; count: number }> {
    return reviewRepository.getAverageRating(recipeId);
  }

  // Admin/testing methods
  async clearAll(): Promise<void> {
    await reviewRepository.clearAll();
  }
}

export default new ReviewService();
