import { AppError } from '../errors/errors';
import { Recipe, CreateRecipeDto, UpdateRecipeDto, PaginatedResponse } from '../types';

// In-memory storage (replace with database in production)
class RecipeService {
  private recipes: Map<string, Recipe> = new Map();
  private idCounter = 1;

  async createRecipe(userId: string, data: CreateRecipeDto): Promise<Recipe> {
    const id = `recipe_${this.idCounter++}`;

    const recipe: Recipe = {
      id,
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      difficulty: data.difficulty,
      imageUrl: data.imageUrl,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryIds: data.categoryIds || [],
      ingredientIds: [],
    };

    this.recipes.set(id, recipe);
    return recipe;
  }

  async getRecipeById(id: string): Promise<Recipe> {
    const recipe = this.recipes.get(id);
    if (!recipe) {
      throw new AppError('Recipe not found', "ERROR-1", 404);
    }
    return recipe;
  }

  async getAllRecipes(
    page: number = 1,
    limit: number = 10,
    filters?: {
      categoryId?: string;
      difficulty?: string;
      createdBy?: string;
    }
  ): Promise<PaginatedResponse<Recipe>> {
    let recipes = Array.from(this.recipes.values());

    // Apply filters
    if (filters?.categoryId) {
      recipes = recipes.filter((r) => r.categoryIds.includes(filters.categoryId!));
    }
    if (filters?.difficulty) {
      recipes = recipes.filter((r) => r.difficulty === filters.difficulty);
    }
    if (filters?.createdBy) {
      recipes = recipes.filter((r) => r.createdBy === filters.createdBy);
    }

    // Sort by creation date (newest first)
    recipes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const total = recipes.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = recipes.slice(start, end);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateRecipe(id: string, userId: string, data: UpdateRecipeDto): Promise<Recipe> {
    const recipe = await this.getRecipeById(id);

    // Check if user is the creator
    if (recipe.createdBy !== userId) {
      throw new AppError('Unauthorized to update this recipe', "ERROR-1", 403);
    }

    const updatedRecipe: Recipe = {
      ...recipe,
      ...data,
      updatedAt: new Date(),
    };

    this.recipes.set(id, updatedRecipe);
    return updatedRecipe;
  }

  async deleteRecipe(id: string, userId: string): Promise<void> {
    const recipe = await this.getRecipeById(id);

    // Check if user is the creator
    if (recipe.createdBy !== userId) {
      throw new AppError('Unauthorized to delete this recipe', "ERROR-1", 403);
    }

    this.recipes.delete(id);
  }

  async addCategoryToRecipe(recipeId: string, categoryId: string): Promise<Recipe> {
    const recipe = await this.getRecipeById(recipeId);

    if (!recipe.categoryIds.includes(categoryId)) {
      recipe.categoryIds.push(categoryId);
      recipe.updatedAt = new Date();
      this.recipes.set(recipeId, recipe);
    }

    return recipe;
  }

  async removeCategoryFromRecipe(recipeId: string, categoryId: string): Promise<Recipe> {
    const recipe = await this.getRecipeById(recipeId);

    recipe.categoryIds = recipe.categoryIds.filter((id) => id !== categoryId);
    recipe.updatedAt = new Date();
    this.recipes.set(recipeId, recipe);

    return recipe;
  }

  async addIngredientToRecipe(recipeId: string, ingredientId: string): Promise<Recipe> {
    const recipe = await this.getRecipeById(recipeId);

    if (!recipe.ingredientIds.includes(ingredientId)) {
      recipe.ingredientIds.push(ingredientId);
      recipe.updatedAt = new Date();
      this.recipes.set(recipeId, recipe);
    }

    return recipe;
  }

  async removeIngredientFromRecipe(recipeId: string, ingredientId: string): Promise<Recipe> {
    const recipe = await this.getRecipeById(recipeId);

    recipe.ingredientIds = recipe.ingredientIds.filter((id) => id !== ingredientId);
    recipe.updatedAt = new Date();
    this.recipes.set(recipeId, recipe);

    return recipe;
  }

  // Admin/testing methods
  clearAll(): void {
    this.recipes.clear();
    this.idCounter = 1;
  }
}

export default new RecipeService();
