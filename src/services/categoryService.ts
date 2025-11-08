import { AppError } from '../errors/errors';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginatedResponse,
} from '../types';

class CategoryService {
  private categories: Map<string, Category> = new Map();
  private idCounter = 1;

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    // Check for duplicate name
    const existingCategory = Array.from(this.categories.values()).find(
      (c) => c.name.toLowerCase() === data.name.toLowerCase()
    );

    if (existingCategory) {
      throw new AppError('Category with this name already exists', "ERROR-1", 400);
    }

    const id = `category_${this.idCounter++}`;

    const category: Category = {
      id,
      name: data.name,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories.set(id, category);
    return category;
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = this.categories.get(id);
    if (!category) {
      throw new AppError('Category not found', "ERROR-1", 404);
    }
    return category;
  }

  async getAllCategories(
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<Category>> {
    let categories = Array.from(this.categories.values());

    // Sort by name
    categories.sort((a, b) => a.name.localeCompare(b.name));

    // Pagination
    const total = categories.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = categories.slice(start, end);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    const category = await this.getCategoryById(id);

    // Check for duplicate name if name is being updated
    if (data.name) {
      const existingCategory = Array.from(this.categories.values()).find(
        (c) => c.id !== id && c.name.toLowerCase() === data.name!.toLowerCase()
      );

      if (existingCategory) {
        throw new AppError('Category with this name already exists', "ERROR-1", 400);
      }
    }

    const updatedCategory: Category = {
      ...category,
      ...data,
      updatedAt: new Date(),
    };

    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.getCategoryById(id);
    this.categories.delete(id);
  }

  // Admin/testing methods
  clearAll(): void {
    this.categories.clear();
    this.idCounter = 1;
  }
}

export default new CategoryService();
