import { Query, DocumentData } from 'firebase-admin/firestore';
import { BaseRepository } from './baseRepository';
import {
  Ingredient,
  CreateIngredientDto,
  UpdateIngredientDto,
  PaginatedResponse,
  IngredientQueryOptions,
} from '../types';

class IngredientRepository extends BaseRepository<Ingredient> {
  constructor() {
    super('ingredients');
  }

  async createIngredient(recipeId: string, data: CreateIngredientDto): Promise<Ingredient> {
    const docRef = this.collection.doc();
    const now = new Date();

    const ingredient: Omit<Ingredient, 'id'> = {
      name: data.name,
      unit: data.unit,
      quantity: data.quantity,
      recipeId,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(ingredient);
    return { id: docRef.id, ...ingredient };
  }

  async findByRecipeId(
    recipeId: string,
    options: IngredientQueryOptions = {}
  ): Promise<PaginatedResponse<Ingredient>> {
    const {
      page = 1,
      limit = 50,
      filters = {},
      sort = { field: 'name', order: 'asc' },
    } = options;

    let query: Query<DocumentData> = this.collection.where('recipeId', '==', recipeId);

    // Apply sorting
    query = this.applySort(query, sort.field, sort.order);

    // For text search, we need to filter in memory
    if (filters.search) {
      const snapshot = await query.get();
      let ingredients = snapshot.docs.map(doc => this.docToEntity(doc)!);

      const searchLower = filters.search.toLowerCase();
      ingredients = ingredients.filter(i => i.name.toLowerCase().includes(searchLower));

      // Manual pagination
      const total = ingredients.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const data = ingredients.slice(start, start + limit);

      return { data, total, page, limit, totalPages };
    }

    return this.paginateQuery(query, page, limit);
  }

  async updateIngredient(id: string, data: UpdateIngredientDto): Promise<Ingredient | null> {
    return this.update(id, data as Partial<Ingredient>);
  }

  async bulkCreate(recipeId: string, ingredientsData: CreateIngredientDto[]): Promise<Ingredient[]> {
    const ingredients: Ingredient[] = [];

    for (const data of ingredientsData) {
      const ingredient = await this.createIngredient(recipeId, data);
      ingredients.push(ingredient);
    }

    return ingredients;
  }

  async deleteByRecipeId(recipeId: string): Promise<void> {
    const snapshot = await this.collection.where('recipeId', '==', recipeId).get();
    const batch = this.collection.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

export default new IngredientRepository();
