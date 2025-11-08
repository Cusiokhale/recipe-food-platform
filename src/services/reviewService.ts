import { AppError } from '../errors/errors';
import { Review, CreateReviewDto, UpdateReviewDto, PaginatedResponse } from '../types';
import recipeService from './recipeService';

class ReviewService {
  private reviews: Map<string, Review> = new Map();
  private idCounter = 1;

  async createReview(
    recipeId: string,
    userId: string,
    userName: string | undefined,
    data: CreateReviewDto
  ): Promise<Review> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    // Validate rating
    this.validateRating(data.rating);

    // Check if user already reviewed this recipe
    const existingReview = Array.from(this.reviews.values()).find(
      (r) => r.recipeId === recipeId && r.userId === userId
    );

    if (existingReview) {
      throw new AppError('You have already reviewed this recipe', "ERROR-1", 400);
    }

    const id = `review_${this.idCounter++}`;

    const review: Review = {
      id,
      recipeId,
      userId,
      userName,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reviews.set(id, review);
    return review;
  }

  async getReviewById(id: string): Promise<Review> {
    const review = this.reviews.get(id);
    if (!review) {
      throw new AppError('Review not found', "ERROR-1", 404);
    }
    return review;
  }

  async getReviewsByRecipeId(
    recipeId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Review>> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    let reviews = Array.from(this.reviews.values()).filter(
      (r) => r.recipeId === recipeId
    );

    // Sort by creation date (newest first)
    reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const total = reviews.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = reviews.slice(start, end);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getReviewsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Review>> {
    let reviews = Array.from(this.reviews.values()).filter((r) => r.userId === userId);

    // Sort by creation date (newest first)
    reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const total = reviews.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = reviews.slice(start, end);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateReview(id: string, userId: string, data: UpdateReviewDto): Promise<Review> {
    const review = await this.getReviewById(id);

    // Check if user is the author
    if (review.userId !== userId) {
      throw new AppError('Unauthorized to update this review', "ERROR-1", 403);
    }

    // Validate rating if provided
    if (data.rating !== undefined) {
      this.validateRating(data.rating);
    }

    const updatedReview: Review = {
      ...review,
      ...data,
      updatedAt: new Date(),
    };

    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const review = await this.getReviewById(id);

    // Check if user is the author
    if (review.userId !== userId) {
      throw new AppError('Unauthorized to delete this review', "ERROR-1", 403);
    }

    this.reviews.delete(id);
  }

  async getAverageRating(recipeId: string): Promise<{ average: number; count: number }> {
    const reviews = Array.from(this.reviews.values()).filter(
      (r) => r.recipeId === recipeId
    );

    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;

    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal place
      count: reviews.length,
    };
  }

  private validateRating(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', "ERROR-1", 400);
    }

    if (!Number.isInteger(rating)) {
      throw new AppError('Rating must be a whole number', "ERROR-1", 400);
    }
  }

  // Admin/testing methods
  clearAll(): void {
    this.reviews.clear();
    this.idCounter = 1;
  }
}

export default new ReviewService();
