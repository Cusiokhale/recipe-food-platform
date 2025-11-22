import { AppError } from '../errors/errors';
import {
  Recipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  PaginatedResponse,
  RecipeQueryOptions,
} from '../types';
import recipeRepository from '../repositories/recipeRepository';

class RecipeService {
  async createRecipe(userId: string, data: CreateRecipeDto): Promise<Recipe> {
    return recipeRepository.createRecipe(userId, data);
  }

  async getRecipeById(id: string): Promise<Recipe> {
    const recipe = await recipeRepository.findById(id);
    if (!recipe) {
      throw new AppError('Recipe not found', 'RECIPE_NOT_FOUND', 404);
    }
    return recipe;
  }

  async getAllRecipes(options: RecipeQueryOptions = {}): Promise<PaginatedResponse<Recipe>> {
    return recipeRepository.findAll(options);
  }

  async updateRecipe(id: string, userId: string, data: UpdateRecipeDto): Promise<Recipe> {
    const recipe = await this.getRecipeById(id);

    // Check if user is the creator
    if (recipe.createdBy !== userId) {
      throw new AppError('Unauthorized to update this recipe', 'UNAUTHORIZED', 403);
    }

    const updatedRecipe = await recipeRepository.updateRecipe(id, data);
    if (!updatedRecipe) {
      throw new AppError('Failed to update recipe', 'UPDATE_FAILED', 500);
    }

    return updatedRecipe;
  }

  async deleteRecipe(id: string, userId: string): Promise<void> {
    const recipe = await this.getRecipeById(id);

    // Check if user is the creator
    if (recipe.createdBy !== userId) {
      throw new AppError('Unauthorized to delete this recipe', 'UNAUTHORIZED', 403);
    }

    const deleted = await recipeRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete recipe', 'DELETE_FAILED', 500);
    }
  }

  async addCategoryToRecipe(recipeId: string, categoryId: string): Promise<Recipe> {
    // Verify recipe exists
    await this.getRecipeById(recipeId);

    const recipe = await recipeRepository.addCategoryToRecipe(recipeId, categoryId);
    if (!recipe) {
      throw new AppError('Failed to add category to recipe', 'UPDATE_FAILED', 500);
    }

    return recipe;
  }

  async removeCategoryFromRecipe(recipeId: string, categoryId: string): Promise<Recipe> {
    // Verify recipe exists
    await this.getRecipeById(recipeId);

    const recipe = await recipeRepository.removeCategoryFromRecipe(recipeId, categoryId);
    if (!recipe) {
      throw new AppError('Failed to remove category from recipe', 'UPDATE_FAILED', 500);
    }

    return recipe;
  }

  async addIngredientToRecipe(recipeId: string, ingredientId: string): Promise<Recipe> {
    // Verify recipe exists
    await this.getRecipeById(recipeId);

    const recipe = await recipeRepository.addIngredientToRecipe(recipeId, ingredientId);
    if (!recipe) {
      throw new AppError('Failed to add ingredient to recipe', 'UPDATE_FAILED', 500);
    }

    return recipe;
  }

  async removeIngredientFromRecipe(recipeId: string, ingredientId: string): Promise<Recipe> {
    // Verify recipe exists
    await this.getRecipeById(recipeId);

    const recipe = await recipeRepository.removeIngredientFromRecipe(recipeId, ingredientId);
    if (!recipe) {
      throw new AppError('Failed to remove ingredient from recipe', 'UPDATE_FAILED', 500);
    }

    return recipe;
  }

  // Admin/testing methods
  async clearAll(): Promise<void> {
    await recipeRepository.clearAll();
  }
}

export default new RecipeService();
