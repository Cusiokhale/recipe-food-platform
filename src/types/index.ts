export interface Recipe {
  id: string;
  title: string;
  description: string;
  instructions: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  categoryIds: string[];
  ingredientIds: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  recipeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  recipeId: string;
  userId: string;
  userName?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface ApiResponse<T> {
    status: string;
    data?: T;
    message?: string;
    error?: string;
    code?: string;
}

export const successResponse = <T>(
    data?: T,
    message?: string
): ApiResponse<T> => ({
    status: "success",
    data,
    message,
});

export interface CreateRecipeDto {
  title: string;
  description: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  categoryIds?: string[];
  ingredients?: CreateIngredientDto[];
}

export interface UpdateRecipeDto {
  title?: string;
  description?: string;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  categoryIds?: string[];
}

export interface CreateIngredientDto {
  name: string;
  unit: string;
  quantity: number;
}

export interface UpdateIngredientDto {
  name?: string;
  unit?: string;
  quantity?: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

export interface CreateReviewDto {
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
