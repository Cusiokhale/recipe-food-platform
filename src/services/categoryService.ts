import { AppError } from '../errors/errors';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginatedResponse,
  CategoryQueryOptions,
} from '../types';
import categoryRepository from '../repositories/categoryRepository';

class CategoryService {
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    // Check for duplicate name (case-insensitive)
    const existingCategory = await categoryRepository.findByNameCaseInsensitive(data.name);

    if (existingCategory) {
      throw new AppError('Category with this name already exists', 'DUPLICATE_CATEGORY', 400);
    }

    return categoryRepository.createCategory(data);
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 'CATEGORY_NOT_FOUND', 404);
    }
    return category;
  }

  async getAllCategories(options: CategoryQueryOptions = {}): Promise<PaginatedResponse<Category>> {
    return categoryRepository.findAll(options);
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    // Verify category exists
    await this.getCategoryById(id);

    // Check for duplicate name if name is being updated
    if (data.name) {
      const isDuplicate = await categoryRepository.existsByNameExcludingId(data.name, id);

      if (isDuplicate) {
        throw new AppError('Category with this name already exists', 'DUPLICATE_CATEGORY', 400);
      }
    }

    const updatedCategory = await categoryRepository.updateCategory(id, data);
    if (!updatedCategory) {
      throw new AppError('Failed to update category', 'UPDATE_FAILED', 500);
    }

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    // Verify category exists
    await this.getCategoryById(id);

    const deleted = await categoryRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete category', 'DELETE_FAILED', 500);
    }
  }

  // Admin/testing methods
  async clearAll(): Promise<void> {
    await categoryRepository.clearAll();
  }
}

export default new CategoryService();
