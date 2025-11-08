import { AppError } from '../errors/errors';
import {
  Ingredient,
  CreateIngredientDto,
  UpdateIngredientDto,
  PaginatedResponse,
} from '../types';
import recipeService from './recipeService';

class IngredientService {
  private ingredients: Map<string, Ingredient> = new Map();
  private idCounter = 1;

  async createIngredient(
    recipeId: string,
    data: CreateIngredientDto
  ): Promise<Ingredient> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    const id = `ingredient_${this.idCounter++}`;

    const ingredient: Ingredient = {
      id,
      name: data.name,
      unit: data.unit,
      quantity: data.quantity,
      recipeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ingredients.set(id, ingredient);

    // Link ingredient to recipe
    await recipeService.addIngredientToRecipe(recipeId, id);

    return ingredient;
  }

  async getIngredientById(id: string): Promise<Ingredient> {
    const ingredient = this.ingredients.get(id);
    if (!ingredient) {
      throw new AppError('Ingredient not found', "ERROR-1", 404);
    }
    return ingredient;
  }

  async getIngredientsByRecipeId(
    recipeId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<Ingredient>> {
    // Verify recipe exists
    await recipeService.getRecipeById(recipeId);

    let ingredients = Array.from(this.ingredients.values()).filter(
      (i) => i.recipeId === recipeId
    );

    // Sort by name
    ingredients.sort((a, b) => a.name.localeCompare(b.name));

    // Pagination
    const total = ingredients.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = ingredients.slice(start, end);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateIngredient(
    id: string,
    data: UpdateIngredientDto
  ): Promise<Ingredient> {
    const ingredient = await this.getIngredientById(id);

    const updatedIngredient: Ingredient = {
      ...ingredient,
      ...data,
      updatedAt: new Date(),
    };

    this.ingredients.set(id, updatedIngredient);
    return updatedIngredient;
  }

  async deleteIngredient(id: string): Promise<void> {
    const ingredient = await this.getIngredientById(id);

    // Remove ingredient from recipe
    await recipeService.removeIngredientFromRecipe(ingredient.recipeId, id);

    this.ingredients.delete(id);
  }

  async bulkCreateIngredients(
    recipeId: string,
    ingredientsData: CreateIngredientDto[]
  ): Promise<Ingredient[]> {
    const ingredients = await Promise.all(
      ingredientsData.map((data) => this.createIngredient(recipeId, data))
    );
    return ingredients;
  }

  // Admin/testing methods
  clearAll(): void {
    this.ingredients.clear();
    this.idCounter = 1;
  }
}

export default new IngredientService();
