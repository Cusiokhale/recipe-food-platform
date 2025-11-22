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

// Sorting options
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

// Recipe filter options
export interface RecipeFilterOptions {
  categoryId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  createdBy?: string;
  search?: string; // Search in title and description
  minPrepTime?: number;
  maxPrepTime?: number;
  minCookTime?: number;
  maxCookTime?: number;
  minServings?: number;
  maxServings?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Recipe sort fields
export type RecipeSortField = 'createdAt' | 'updatedAt' | 'title' | 'prepTime' | 'cookTime' | 'servings' | 'difficulty';

// Category filter options
export interface CategoryFilterOptions {
  search?: string; // Search in name and description
}

// Category sort fields
export type CategorySortField = 'name' | 'createdAt' | 'updatedAt';

// Ingredient filter options
export interface IngredientFilterOptions {
  search?: string; // Search in name
}

// Ingredient sort fields
export type IngredientSortField = 'name' | 'quantity' | 'createdAt';

// Review filter options
export interface ReviewFilterOptions {
  minRating?: number;
  maxRating?: number;
}

// Review sort fields
export type ReviewSortField = 'createdAt' | 'rating';

// Query options combining pagination, filtering, and sorting
export interface RecipeQueryOptions {
  page?: number;
  limit?: number;
  filters?: RecipeFilterOptions;
  sort?: {
    field: RecipeSortField;
    order: SortOrder;
  };
}

export interface CategoryQueryOptions {
  page?: number;
  limit?: number;
  filters?: CategoryFilterOptions;
  sort?: {
    field: CategorySortField;
    order: SortOrder;
  };
}

export interface IngredientQueryOptions {
  page?: number;
  limit?: number;
  filters?: IngredientFilterOptions;
  sort?: {
    field: IngredientSortField;
    order: SortOrder;
  };
}

export interface ReviewQueryOptions {
  page?: number;
  limit?: number;
  filters?: ReviewFilterOptions;
  sort?: {
    field: ReviewSortField;
    order: SortOrder;
  };
}
