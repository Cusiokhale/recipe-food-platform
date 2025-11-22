import { Query, DocumentData } from 'firebase-admin/firestore';
import { BaseRepository } from './baseRepository';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginatedResponse,
  CategoryQueryOptions,
} from '../types';

class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super('categories');
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const docRef = this.collection.doc();
    const now = new Date();

    const category: Omit<Category, 'id'> = {
      name: data.name,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(category);
    return { id: docRef.id, ...category };
  }

  async findAll(options: CategoryQueryOptions = {}): Promise<PaginatedResponse<Category>> {
    const {
      page = 1,
      limit = 50,
      filters = {},
      sort = { field: 'name', order: 'asc' },
    } = options;

    let query: Query<DocumentData> = this.collection;

    // Apply sorting
    query = this.applySort(query, sort.field, sort.order);

    // For text search, we need to filter in memory
    if (filters.search) {
      const snapshot = await query.get();
      let categories = snapshot.docs.map(doc => this.docToEntity(doc)!);

      const searchLower = filters.search.toLowerCase();
      categories = categories.filter(
        c =>
          c.name.toLowerCase().includes(searchLower) ||
          (c.description && c.description.toLowerCase().includes(searchLower))
      );

      // Manual pagination
      const total = categories.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const data = categories.slice(start, start + limit);

      return { data, total, page, limit, totalPages };
    }

    return this.paginateQuery(query, page, limit);
  }

  async findByName(name: string): Promise<Category | null> {
    const snapshot = await this.collection
      .where('name', '==', name)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.docToEntity(snapshot.docs[0]);
  }

  async findByNameCaseInsensitive(name: string): Promise<Category | null> {
    // Firestore doesn't support case-insensitive queries natively
    // We need to fetch all and filter in memory
    const snapshot = await this.collection.get();
    const nameLower = name.toLowerCase();

    for (const doc of snapshot.docs) {
      const category = this.docToEntity(doc);
      if (category && category.name.toLowerCase() === nameLower) {
        return category;
      }
    }

    return null;
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category | null> {
    return this.update(id, data as Partial<Category>);
  }

  async existsByNameExcludingId(name: string, excludeId: string): Promise<boolean> {
    const snapshot = await this.collection.get();
    const nameLower = name.toLowerCase();

    for (const doc of snapshot.docs) {
      if (doc.id === excludeId) continue;
      const category = this.docToEntity(doc);
      if (category && category.name.toLowerCase() === nameLower) {
        return true;
      }
    }

    return false;
  }
}

export default new CategoryRepository();
