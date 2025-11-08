import recipeService from '../services/recipeService';
import { CreateRecipeDto, UpdateRecipeDto } from '../types';

describe('Recipe Service', () => {
  const userId = 'user123';

  beforeEach(() => {
    recipeService.clearAll();
  });

  describe('createRecipe', () => {
    it('should create a new recipe', async () => {
      const data: CreateRecipeDto = {
        title: 'Pasta Carbonara',
        description: 'Classic Italian pasta dish',
        instructions: 'Cook pasta, mix with eggs and cheese',
        prepTime: 10,
        cookTime: 15,
        servings: 4,
        difficulty: 'medium',
      };

      const recipe = await recipeService.createRecipe(userId, data);

      expect(recipe.id).toBeDefined();
      expect(recipe.title).toBe('Pasta Carbonara');
      expect(recipe.createdBy).toBe(userId);
      expect(recipe.categoryIds).toEqual([]);
      expect(recipe.ingredientIds).toEqual([]);
    });

    it('should create a recipe with categories', async () => {
      const data: CreateRecipeDto = {
        title: 'Pizza',
        description: 'Delicious pizza',
        instructions: 'Make dough, add toppings, bake',
        prepTime: 30,
        cookTime: 20,
        servings: 6,
        difficulty: 'easy',
        categoryIds: ['cat1', 'cat2'],
      };

      const recipe = await recipeService.createRecipe(userId, data);

      expect(recipe.categoryIds).toEqual(['cat1', 'cat2']);
    });
  });

  describe('getRecipeById', () => {
    it('should get a recipe by ID', async () => {
      const data: CreateRecipeDto = {
        title: 'Test Recipe',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
      };

      const created = await recipeService.createRecipe(userId, data);
      const recipe = await recipeService.getRecipeById(created.id);

      expect(recipe.id).toBe(created.id);
      expect(recipe.title).toBe('Test Recipe');
    });

    it('should throw error for non-existent recipe', async () => {
      await expect(recipeService.getRecipeById('invalid-id')).rejects.toThrow(
        'Recipe not found'
      );
    });
  });

  describe('getAllRecipes', () => {
    it('should get all recipes with pagination', async () => {
      const data: CreateRecipeDto = {
        title: 'Recipe 1',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
      };

      await recipeService.createRecipe(userId, data);
      await recipeService.createRecipe(userId, { ...data, title: 'Recipe 2' });

      const result = await recipeService.getAllRecipes(1, 10);

      expect(result.total).toBe(2);
      expect(result.data.length).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by difficulty', async () => {
      const easyRecipe: CreateRecipeDto = {
        title: 'Easy Recipe',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
      };

      const hardRecipe: CreateRecipeDto = {
        ...easyRecipe,
        title: 'Hard Recipe',
        difficulty: 'hard',
      };

      await recipeService.createRecipe(userId, easyRecipe);
      await recipeService.createRecipe(userId, hardRecipe);

      const result = await recipeService.getAllRecipes(1, 10, { difficulty: 'easy' });

      expect(result.total).toBe(1);
      expect(result.data[0].title).toBe('Easy Recipe');
    });

    it('should filter by category', async () => {
      const data1: CreateRecipeDto = {
        title: 'Recipe with Category',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
        categoryIds: ['cat1'],
      };

      const data2: CreateRecipeDto = {
        ...data1,
        title: 'Recipe without Category',
        categoryIds: [],
      };

      await recipeService.createRecipe(userId, data1);
      await recipeService.createRecipe(userId, data2);

      const result = await recipeService.getAllRecipes(1, 10, { categoryId: 'cat1' });

      expect(result.total).toBe(1);
      expect(result.data[0].title).toBe('Recipe with Category');
    });
  });

  describe('updateRecipe', () => {
    it('should update a recipe', async () => {
      const data: CreateRecipeDto = {
        title: 'Original Title',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
      };

      const created = await recipeService.createRecipe(userId, data);

      const updateData: UpdateRecipeDto = {
        title: 'Updated Title',
        servings: 4,
      };

      const updated = await recipeService.updateRecipe(created.id, userId, updateData);

      expect(updated.title).toBe('Updated Title');
      expect(updated.servings).toBe(4);
      expect(updated.description).toBe('Test'); // unchanged
    });

    it('should not allow unauthorized user to update', async () => {
      const data: CreateRecipeDto = {
        title: 'Test',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
      };

      const created = await recipeService.createRecipe(userId, data);

      await expect(
        recipeService.updateRecipe(created.id, 'other-user', { title: 'Hacked' })
      ).rejects.toThrow('Unauthorized to update this recipe');
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe', async () => {
      const data: CreateRecipeDto = {
        title: 'To Delete',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
      };

      const created = await recipeService.createRecipe(userId, data);

      await recipeService.deleteRecipe(created.id, userId);

      await expect(recipeService.getRecipeById(created.id)).rejects.toThrow(
        'Recipe not found'
      );
    });

    it('should not allow unauthorized user to delete', async () => {
      const data: CreateRecipeDto = {
        title: 'Test',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
      };

      const created = await recipeService.createRecipe(userId, data);

      await expect(recipeService.deleteRecipe(created.id, 'other-user')).rejects.toThrow(
        'Unauthorized to delete this recipe'
      );
    });
  });

  describe('category management', () => {
    it('should add category to recipe', async () => {
      const data: CreateRecipeDto = {
        title: 'Test',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
      };

      const recipe = await recipeService.createRecipe(userId, data);
      const updated = await recipeService.addCategoryToRecipe(recipe.id, 'cat1');

      expect(updated.categoryIds).toContain('cat1');
    });

    it('should remove category from recipe', async () => {
      const data: CreateRecipeDto = {
        title: 'Test',
        description: 'Test',
        instructions: 'Test',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'easy',
        categoryIds: ['cat1', 'cat2'],
      };

      const recipe = await recipeService.createRecipe(userId, data);
      const updated = await recipeService.removeCategoryFromRecipe(recipe.id, 'cat1');

      expect(updated.categoryIds).not.toContain('cat1');
      expect(updated.categoryIds).toContain('cat2');
    });
  });
});
