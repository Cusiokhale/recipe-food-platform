import { Query, DocumentData } from 'firebase-admin/firestore';
import { BaseRepository } from './baseRepository';
import {
  Recipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  PaginatedResponse,
  RecipeQueryOptions,
} from '../types';

class RecipeRepository extends BaseRepository<Recipe> {
  constructor() {
    super('recipes');
  }

  async createRecipe(userId: string, data: CreateRecipeDto): Promise<Recipe> {
    const docRef = this.collection.doc();
    const now = new Date();

    const recipe: Omit<Recipe, 'id'> = {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      difficulty: data.difficulty,
      imageUrl: data.imageUrl,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      categoryIds: data.categoryIds || [],
      ingredientIds: [],
    };

    await docRef.set(recipe);
    return { id: docRef.id, ...recipe };
  }

  async findAll(options: RecipeQueryOptions = {}): Promise<PaginatedResponse<Recipe>> {
    const {
      page = 1,
      limit = 10,
      filters = {},
      sort = { field: 'createdAt', order: 'desc' },
    } = options;

    let query: Query<DocumentData> = this.collection;

    // Apply filters that Firestore can handle directly
    if (filters.difficulty) {
      query = query.where('difficulty', '==', filters.difficulty);
    }

    if (filters.createdBy) {
      query = query.where('createdBy', '==', filters.createdBy);
    }

    if (filters.categoryId) {
      query = query.where('categoryIds', 'array-contains', filters.categoryId);
    }

    // Apply date range filters
    if (filters.createdAfter) {
      query = query.where('createdAt', '>=', filters.createdAfter);
    }

    if (filters.createdBefore) {
      query = query.where('createdAt', '<=', filters.createdBefore);
    }

    // Apply sorting
    query = this.applySort(query, sort.field, sort.order);

    // For filters that Firestore can't handle well (text search, range filters on multiple fields),
    // we need to fetch more data and filter in memory
    const needsMemoryFiltering =
      filters.search ||
      filters.minPrepTime !== undefined ||
      filters.maxPrepTime !== undefined ||
      filters.minCookTime !== undefined ||
      filters.maxCookTime !== undefined ||
      filters.minServings !== undefined ||
      filters.maxServings !== undefined;

    if (needsMemoryFiltering) {
      // Fetch all matching documents and filter in memory
      const snapshot = await query.get();
      let recipes = snapshot.docs.map(doc => this.docToEntity(doc)!);

      // Apply text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        recipes = recipes.filter(
          r =>
            r.title.toLowerCase().includes(searchLower) ||
            r.description.toLowerCase().includes(searchLower)
        );
      }

      // Apply numeric range filters
      if (filters.minPrepTime !== undefined) {
        recipes = recipes.filter(r => r.prepTime >= filters.minPrepTime!);
      }
      if (filters.maxPrepTime !== undefined) {
        recipes = recipes.filter(r => r.prepTime <= filters.maxPrepTime!);
      }
      if (filters.minCookTime !== undefined) {
        recipes = recipes.filter(r => r.cookTime >= filters.minCookTime!);
      }
      if (filters.maxCookTime !== undefined) {
        recipes = recipes.filter(r => r.cookTime <= filters.maxCookTime!);
      }
      if (filters.minServings !== undefined) {
        recipes = recipes.filter(r => r.servings >= filters.minServings!);
      }
      if (filters.maxServings !== undefined) {
        recipes = recipes.filter(r => r.servings <= filters.maxServings!);
      }

      // Manual pagination
      const total = recipes.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const data = recipes.slice(start, start + limit);

      return { data, total, page, limit, totalPages };
    }

    // Use Firestore pagination for simple queries
    return this.paginateQuery(query, page, limit);
  }

  async updateRecipe(id: string, data: UpdateRecipeDto): Promise<Recipe | null> {
    return this.update(id, data as Partial<Recipe>);
  }

  async addCategoryToRecipe(recipeId: string, categoryId: string): Promise<Recipe | null> {
    const recipe = await this.findById(recipeId);
    if (!recipe) return null;

    if (!recipe.categoryIds.includes(categoryId)) {
      recipe.categoryIds.push(categoryId);
      return this.update(recipeId, { categoryIds: recipe.categoryIds } as Partial<Recipe>);
    }

    return recipe;
  }

  async removeCategoryFromRecipe(recipeId: string, categoryId: string): Promise<Recipe | null> {
    const recipe = await this.findById(recipeId);
    if (!recipe) return null;

    recipe.categoryIds = recipe.categoryIds.filter(id => id !== categoryId);
    return this.update(recipeId, { categoryIds: recipe.categoryIds } as Partial<Recipe>);
  }

  async addIngredientToRecipe(recipeId: string, ingredientId: string): Promise<Recipe | null> {
    const recipe = await this.findById(recipeId);
    if (!recipe) return null;

    if (!recipe.ingredientIds.includes(ingredientId)) {
      recipe.ingredientIds.push(ingredientId);
      return this.update(recipeId, { ingredientIds: recipe.ingredientIds } as Partial<Recipe>);
    }

    return recipe;
  }

  async removeIngredientFromRecipe(recipeId: string, ingredientId: string): Promise<Recipe | null> {
    const recipe = await this.findById(recipeId);
    if (!recipe) return null;

    recipe.ingredientIds = recipe.ingredientIds.filter(id => id !== ingredientId);
    return this.update(recipeId, { ingredientIds: recipe.ingredientIds } as Partial<Recipe>);
  }
}

export default new RecipeRepository();
