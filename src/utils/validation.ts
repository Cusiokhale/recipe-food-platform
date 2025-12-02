import { AppError } from '../errors/errors';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  CreateIngredientDto,
  UpdateIngredientDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateReviewDto,
  UpdateReviewDto,
  RecipeSortField,
  CategorySortField,
  IngredientSortField,
  ReviewSortField,
  SortOrder,
} from '../types';

// Generic validation helpers
const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

const isNonNegativeNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
};

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
};

const isValidDifficulty = (value: unknown): value is 'easy' | 'medium' | 'hard' => {
  return value === 'easy' || value === 'medium' || value === 'hard';
};

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// Recipe validation
export const validateCreateRecipe = (data: unknown): CreateRecipeDto => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 'VALIDATION_ERROR', 400);
  }

  const body = data as Record<string, unknown>;
  const errors: string[] = [];

  // Required fields
  if (!isNonEmptyString(body.title)) {
    errors.push('Title is required and must be a non-empty string');
  } else if (body.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (!isNonEmptyString(body.description)) {
    errors.push('Description is required and must be a non-empty string');
  } else if ((body.description as string).length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }

  if (!isNonEmptyString(body.instructions)) {
    errors.push('Instructions are required and must be a non-empty string');
  }

  if (!isNonNegativeNumber(body.prepTime)) {
    errors.push('Prep time is required and must be a non-negative number');
  } else if (body.prepTime > 10000) {
    errors.push('Prep time must be 10000 minutes or less');
  }

  if (!isNonNegativeNumber(body.cookTime)) {
    errors.push('Cook time is required and must be a non-negative number');
  } else if (body.cookTime > 10000) {
    errors.push('Cook time must be 10000 minutes or less');
  }

  if (!isPositiveInteger(body.servings)) {
    errors.push('Servings is required and must be a positive integer');
  } else if (body.servings > 1000) {
    errors.push('Servings must be 1000 or less');
  }

  if (!isValidDifficulty(body.difficulty)) {
    errors.push('Difficulty must be one of: easy, medium, hard');
  }

  // Optional fields
  if (body.imageUrl !== undefined && body.imageUrl !== null) {
    if (!isNonEmptyString(body.imageUrl) || !isValidUrl(body.imageUrl as string)) {
      errors.push('Image URL must be a valid URL');
    }
  }

  if (body.categoryIds !== undefined) {
    if (!Array.isArray(body.categoryIds)) {
      errors.push('Category IDs must be an array');
    } else if (!body.categoryIds.every(id => typeof id === 'string')) {
      errors.push('All category IDs must be strings');
    }
  }

  if (body.ingredients !== undefined) {
    if (!Array.isArray(body.ingredients)) {
      errors.push('Ingredients must be an array');
    } else {
      body.ingredients.forEach((ing, index) => {
        try {
          validateCreateIngredient(ing);
        } catch (e) {
          errors.push(`Ingredient at index ${index}: ${(e as Error).message}`);
        }
      });
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 'VALIDATION_ERROR', 400);
  }

  return body as unknown as CreateRecipeDto;
};

export const validateUpdateRecipe = (data: unknown): UpdateRecipeDto => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 'VALIDATION_ERROR', 400);
  }

  const body = data as Record<string, unknown>;
  const errors: string[] = [];

  // All fields are optional, but if provided must be valid
  if (body.title !== undefined) {
    if (!isNonEmptyString(body.title)) {
      errors.push('Title must be a non-empty string');
    } else if (body.title.length > 200) {
      errors.push('Title must be 200 characters or less');
    }
  }

  if (body.description !== undefined) {
    if (!isNonEmptyString(body.description)) {
      errors.push('Description must be a non-empty string');
    } else if ((body.description as string).length > 2000) {
      errors.push('Description must be 2000 characters or less');
    }
  }

  if (body.instructions !== undefined && !isNonEmptyString(body.instructions)) {
    errors.push('Instructions must be a non-empty string');
  }

  if (body.prepTime !== undefined) {
    if (!isNonNegativeNumber(body.prepTime)) {
      errors.push('Prep time must be a non-negative number');
    } else if (body.prepTime > 10000) {
      errors.push('Prep time must be 10000 minutes or less');
    }
  }

  if (body.cookTime !== undefined) {
    if (!isNonNegativeNumber(body.cookTime)) {
      errors.push('Cook time must be a non-negative number');
    } else if (body.cookTime > 10000) {
      errors.push('Cook time must be 10000 minutes or less');
    }
  }

  if (body.servings !== undefined) {
    if (!isPositiveInteger(body.servings)) {
      errors.push('Servings must be a positive integer');
    } else if (body.servings > 1000) {
      errors.push('Servings must be 1000 or less');
    }
  }

  if (body.difficulty !== undefined && !isValidDifficulty(body.difficulty)) {
    errors.push('Difficulty must be one of: easy, medium, hard');
  }

  if (body.imageUrl !== undefined && body.imageUrl !== null) {
    if (!isNonEmptyString(body.imageUrl) || !isValidUrl(body.imageUrl as string)) {
      errors.push('Image URL must be a valid URL');
    }
  }

  if (body.categoryIds !== undefined) {
    if (!Array.isArray(body.categoryIds)) {
      errors.push('Category IDs must be an array');
    } else if (!body.categoryIds.every(id => typeof id === 'string')) {
      errors.push('All category IDs must be strings');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 'VALIDATION_ERROR', 400);
  }

  return body as UpdateRecipeDto;
};

// Ingredient validation
export const validateCreateIngredient = (data: unknown): CreateIngredientDto => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 'VALIDATION_ERROR', 400);
  }

  const body = data as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(body.name)) {
    errors.push('Name is required and must be a non-empty string');
  } else if (body.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }

  if (!isNonEmptyString(body.unit)) {
    errors.push('Unit is required and must be a non-empty string');
  } else if (body.unit.length > 50) {
    errors.push('Unit must be 50 characters or less');
  }

  if (!isPositiveNumber(body.quantity)) {
    errors.push('Quantity is required and must be a positive number');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 'VALIDATION_ERROR', 400);
  }

  return body as unknown as CreateIngredientDto;
};

export const validateUpdateIngredient = (data: unknown): UpdateIngredientDto => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 'VALIDATION_ERROR', 400);
  }

  const body = data as Record<string, unknown>;
  const errors: string[] = [];

  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name)) {
      errors.push('Name must be a non-empty string');
    } else if (body.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }
  }

  if (body.unit !== undefined) {
    if (!isNonEmptyString(body.unit)) {
      errors.push('Unit must be a non-empty string');
    } else if (body.unit.length > 50) {
      errors.push('Unit must be 50 characters or less');
    }
  }

  if (body.quantity !== undefined && !isPositiveNumber(body.quantity)) {
    errors.push('Quantity must be a positive number');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 'VALIDATION_ERROR', 400);
  }

  return body as UpdateIngredientDto;
};

// Category validation
export const validateCreateCategory = (data: unknown): CreateCategoryDto => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 'VALIDATION_ERROR', 400);
  }

  const body = data as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(body.name)) {
    errors.push('Name is required and must be a non-empty string');
  } else if (body.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push('Description must be a string');
    } else if (body.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 'VALIDATION_ERROR', 400);
  }

  return body as unknown as CreateCategoryDto;
};

export const validateUpdateCategory = (data: unknown): UpdateCategoryDto => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 'VALIDATION_ERROR', 400);
  }

  const body = data as Record<string, unknown>;
  const errors: string[] = [];

  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name)) {
      errors.push('Name must be a non-empty string');
    } else if (body.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push('Description must be a string');
    } else if (body.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 'VALIDATION_ERROR', 400);
  }

  return body as UpdateCategoryDto;
};

// Review validation
export const validateCreateReview = (data: unknown): CreateReviewDto => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 'VALIDATION_ERROR', 400);
  }

  const body = data as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof body.rating !== 'number' || !Number.isInteger(body.rating)) {
    errors.push('Rating is required and must be an integer');
  } else if (body.rating < 1 || body.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  if (body.comment !== undefined && body.comment !== null) {
    if (typeof body.comment !== 'string') {
      errors.push('Comment must be a string');
    } else if (body.comment.length > 1000) {
      errors.push('Comment must be 1000 characters or less');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 'VALIDATION_ERROR', 400);
  }

  return body as unknown as CreateReviewDto;
};

export const validateUpdateReview = (data: unknown): UpdateReviewDto => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body is required', 'VALIDATION_ERROR', 400);
  }

  const body = data as Record<string, unknown>;
  const errors: string[] = [];

  if (body.rating !== undefined) {
    if (typeof body.rating !== 'number' || !Number.isInteger(body.rating)) {
      errors.push('Rating must be an integer');
    } else if (body.rating < 1 || body.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }
  }

  if (body.comment !== undefined && body.comment !== null) {
    if (typeof body.comment !== 'string') {
      errors.push('Comment must be a string');
    } else if (body.comment.length > 1000) {
      errors.push('Comment must be 1000 characters or less');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 'VALIDATION_ERROR', 400);
  }

  return body as UpdateReviewDto;
};

// Sort validation
const validRecipeSortFields: RecipeSortField[] = ['createdAt', 'updatedAt', 'title', 'prepTime', 'cookTime', 'servings', 'difficulty'];
const validCategorySortFields: CategorySortField[] = ['name', 'createdAt', 'updatedAt'];
const validIngredientSortFields: IngredientSortField[] = ['name', 'quantity', 'createdAt'];
const validReviewSortFields: ReviewSortField[] = ['createdAt', 'rating'];
const validSortOrders: SortOrder[] = ['asc', 'desc'];

export const validateRecipeSort = (
  field?: string,
  order?: string
): { field: RecipeSortField; order: SortOrder } | undefined => {
  if (!field && !order) return undefined;

  const sortField = (field || 'createdAt') as RecipeSortField;
  const sortOrder = (order || 'desc') as SortOrder;

  if (!validRecipeSortFields.includes(sortField)) {
    throw new AppError(
      `Invalid sort field. Must be one of: ${validRecipeSortFields.join(', ')}`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (!validSortOrders.includes(sortOrder)) {
    throw new AppError('Invalid sort order. Must be "asc" or "desc"', 'VALIDATION_ERROR', 400);
  }

  return { field: sortField, order: sortOrder };
};

export const validateCategorySort = (
  field?: string,
  order?: string
): { field: CategorySortField; order: SortOrder } | undefined => {
  if (!field && !order) return undefined;

  const sortField = (field || 'name') as CategorySortField;
  const sortOrder = (order || 'asc') as SortOrder;

  if (!validCategorySortFields.includes(sortField)) {
    throw new AppError(
      `Invalid sort field. Must be one of: ${validCategorySortFields.join(', ')}`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (!validSortOrders.includes(sortOrder)) {
    throw new AppError('Invalid sort order. Must be "asc" or "desc"', 'VALIDATION_ERROR', 400);
  }

  return { field: sortField, order: sortOrder };
};

export const validateIngredientSort = (
  field?: string,
  order?: string
): { field: IngredientSortField; order: SortOrder } | undefined => {
  if (!field && !order) return undefined;

  const sortField = (field || 'name') as IngredientSortField;
  const sortOrder = (order || 'asc') as SortOrder;

  if (!validIngredientSortFields.includes(sortField)) {
    throw new AppError(
      `Invalid sort field. Must be one of: ${validIngredientSortFields.join(', ')}`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (!validSortOrders.includes(sortOrder)) {
    throw new AppError('Invalid sort order. Must be "asc" or "desc"', 'VALIDATION_ERROR', 400);
  }

  return { field: sortField, order: sortOrder };
};

export const validateReviewSort = (
  field?: string,
  order?: string
): { field: ReviewSortField; order: SortOrder } | undefined => {
  if (!field && !order) return undefined;

  const sortField = (field || 'createdAt') as ReviewSortField;
  const sortOrder = (order || 'desc') as SortOrder;

  if (!validReviewSortFields.includes(sortField)) {
    throw new AppError(
      `Invalid sort field. Must be one of: ${validReviewSortFields.join(', ')}`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (!validSortOrders.includes(sortOrder)) {
    throw new AppError('Invalid sort order. Must be "asc" or "desc"', 'VALIDATION_ERROR', 400);
  }

  return { field: sortField, order: sortOrder };
};

// Query parameter parsing helpers
export const parseIntOrUndefined = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseInt(value as string, 10);
  return isNaN(parsed) ? undefined : parsed;
};

export const parseFloatOrUndefined = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseFloat(value as string);
  return isNaN(parsed) ? undefined : parsed;
};

export const parseDateOrUndefined = (value: unknown): Date | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new Date(value as string);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};
