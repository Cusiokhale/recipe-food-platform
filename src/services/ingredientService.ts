import { AppError } from '../errors/errors';
import {
  Ingredient,
  CreateIngredientDto,
  UpdateIngredientDto,
  PaginatedResponse,
  IngredientQueryOptions,
} from '../types';
import ingredientRepository from '../repositories/ingredientRepository';
import recipeService from './recipeService';

class IngredientService {
  async createIngredient(
    recipeId: string,
    data: CreateIngredientDto
  ): Promise<Ingredient> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    const ingredient = await ingredientRepository.createIngredient(recipeId, data);

    // Link ingredient to recipe
    await recipeService.addIngredientToRecipe(recipeId, ingredient.id);

    return ingredient;
  }

  async getIngredientById(id: string): Promise<Ingredient> {
    const ingredient = await ingredientRepository.findById(id);
    if (!ingredient) {
      throw new AppError('Ingredient not found', 'INGREDIENT_NOT_FOUND', 404);
    }
    return ingredient;
  }

  async getIngredientsByRecipeId(
    recipeId: string,
    options: IngredientQueryOptions = {}
  ): Promise<PaginatedResponse<Ingredient>> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    return ingredientRepository.findByRecipeId(recipeId, options);
  }

  async updateIngredient(
    id: string,
    data: UpdateIngredientDto
  ): Promise<Ingredient> {
    // Verify ingredient exists
    await this.getIngredientById(id);

    const updatedIngredient = await ingredientRepository.updateIngredient(id, data);
    if (!updatedIngredient) {
      throw new AppError('Failed to update ingredient', 'UPDATE_FAILED', 500);
    }

    return updatedIngredient;
  }

  async deleteIngredient(id: string): Promise<void> {
    const ingredient = await this.getIngredientById(id);

    // Remove ingredient from recipe
    await recipeService.removeIngredientFromRecipe(ingredient.recipeId, id);

    const deleted = await ingredientRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete ingredient', 'DELETE_FAILED', 500);
    }
  }

  async bulkCreateIngredients(
    recipeId: string,
    ingredientsData: CreateIngredientDto[]
  ): Promise<Ingredient[]> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    const ingredients: Ingredient[] = [];

    for (const data of ingredientsData) {
      const ingredient = await this.createIngredient(recipeId, data);
      ingredients.push(ingredient);
    }

    return ingredients;
  }

  // Admin/testing methods
  async clearAll(): Promise<void> {
    await ingredientRepository.clearAll();
  }
}

export default new IngredientService();
