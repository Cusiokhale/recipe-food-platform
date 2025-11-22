import { Query, DocumentData } from 'firebase-admin/firestore';
import { BaseRepository } from './baseRepository';
import {
  Review,
  CreateReviewDto,
  UpdateReviewDto,
  PaginatedResponse,
  ReviewQueryOptions,
} from '../types';

class ReviewRepository extends BaseRepository<Review> {
  constructor() {
    super('reviews');
  }

  async createReview(
    recipeId: string,
    userId: string,
    userName: string | undefined,
    data: CreateReviewDto
  ): Promise<Review> {
    const docRef = this.collection.doc();
    const now = new Date();

    const review: Omit<Review, 'id'> = {
      recipeId,
      userId,
      userName,
      rating: data.rating,
      comment: data.comment,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(review);
    return { id: docRef.id, ...review };
  }

  async findByRecipeId(
    recipeId: string,
    options: ReviewQueryOptions = {}
  ): Promise<PaginatedResponse<Review>> {
    const {
      page = 1,
      limit = 20,
      filters = {},
      sort = { field: 'createdAt', order: 'desc' },
    } = options;

    let query: Query<DocumentData> = this.collection.where('recipeId', '==', recipeId);

    // Apply rating filters using Firestore queries when possible
    if (filters.minRating !== undefined) {
      query = query.where('rating', '>=', filters.minRating);
    }

    if (filters.maxRating !== undefined) {
      query = query.where('rating', '<=', filters.maxRating);
    }

    // Apply sorting
    query = this.applySort(query, sort.field, sort.order);

    return this.paginateQuery(query, page, limit);
  }

  async findByUserId(
    userId: string,
    options: ReviewQueryOptions = {}
  ): Promise<PaginatedResponse<Review>> {
    const {
      page = 1,
      limit = 20,
      filters = {},
      sort = { field: 'createdAt', order: 'desc' },
    } = options;

    let query: Query<DocumentData> = this.collection.where('userId', '==', userId);

    // Apply rating filters
    if (filters.minRating !== undefined) {
      query = query.where('rating', '>=', filters.minRating);
    }

    if (filters.maxRating !== undefined) {
      query = query.where('rating', '<=', filters.maxRating);
    }

    // Apply sorting
    query = this.applySort(query, sort.field, sort.order);

    return this.paginateQuery(query, page, limit);
  }

  async findByRecipeAndUser(recipeId: string, userId: string): Promise<Review | null> {
    const snapshot = await this.collection
      .where('recipeId', '==', recipeId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.docToEntity(snapshot.docs[0]);
  }

  async updateReview(id: string, data: UpdateReviewDto): Promise<Review | null> {
    return this.update(id, data as Partial<Review>);
  }

  async getAverageRating(recipeId: string): Promise<{ average: number; count: number }> {
    const snapshot = await this.collection.where('recipeId', '==', recipeId).get();

    if (snapshot.empty) {
      return { average: 0, count: 0 };
    }

    let sum = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      sum += data.rating;
    });

    const count = snapshot.docs.length;
    const average = Math.round((sum / count) * 10) / 10;

    return { average, count };
  }

  async deleteByRecipeId(recipeId: string): Promise<void> {
    const snapshot = await this.collection.where('recipeId', '==', recipeId).get();
    const batch = this.collection.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

export default new ReviewRepository();
