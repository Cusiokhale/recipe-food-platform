# API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Recipes](#recipes)
- [Ingredients](#ingredients)
- [Categories](#categories)
- [Reviews](#reviews)

## Authentication

All endpoints (except `/api/health`) require authentication using Firebase JWT tokens.

Include the token in the Authorization header:
```
Authorization: Bearer <your-firebase-id-token>
```

### Role-Based Access Control

- **admin**: Full access to all endpoints
- **chef**: Can create and manage recipes
- **user**: Can view recipes and create reviews (default)

---

## Recipes

### Create Recipe
**POST** `/api/recipes`

**Required Role:** `admin` or `chef`

**Request Body:**
```json
{
  "title": "Pasta Carbonara",
  "description": "Classic Italian pasta dish",
  "instructions": "1. Cook pasta\n2. Mix eggs with cheese\n3. Combine and serve",
  "prepTime": 10,
  "cookTime": 15,
  "servings": 4,
  "difficulty": "medium",
  "imageUrl": "https://example.com/image.jpg",
  "categoryIds": ["category_1"],
  "ingredients": [
    {
      "name": "Spaghetti",
      "quantity": 400,
      "unit": "grams"
    },
    {
      "name": "Eggs",
      "quantity": 4,
      "unit": "pieces"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "recipe_1",
  "title": "Pasta Carbonara",
  "description": "Classic Italian pasta dish",
  "instructions": "1. Cook pasta\n2. Mix eggs with cheese\n3. Combine and serve",
  "prepTime": 10,
  "cookTime": 15,
  "servings": 4,
  "difficulty": "medium",
  "imageUrl": "https://example.com/image.jpg",
  "createdBy": "user123",
  "categoryIds": ["category_1"],
  "ingredientIds": ["ingredient_1", "ingredient_2"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get All Recipes
**GET** `/api/recipes?page=1&limit=10&categoryId=category_1&difficulty=easy`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10
- `categoryId` (optional): Filter by category
- `difficulty` (optional): Filter by difficulty (easy, medium, hard)

**Response:** `200 OK`
```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Get Recipe by ID
**GET** `/api/recipes/:id`

**Response:** `200 OK`

### Update Recipe
**PUT** `/api/recipes/:id`

**Note:** Only the recipe creator can update their own recipe.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "servings": 6
}
```

**Response:** `200 OK`

### Delete Recipe
**DELETE** `/api/recipes/:id`

**Note:** Only the recipe creator can delete their own recipe.

**Response:** `204 No Content`

---

## Ingredients

### Get Ingredients for Recipe
**GET** `/api/recipes/:recipeId/ingredients?page=1&limit=50`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "ingredient_1",
      "name": "Spaghetti",
      "quantity": 400,
      "unit": "grams",
      "recipeId": "recipe_1",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### Add Ingredient to Recipe
**POST** `/api/recipes/:recipeId/ingredients`

**Request Body:**
```json
{
  "name": "Olive Oil",
  "quantity": 2,
  "unit": "tablespoons"
}
```

**Response:** `201 Created`

### Get Ingredient by ID
**GET** `/api/ingredients/:id`

**Response:** `200 OK`

### Update Ingredient
**PUT** `/api/ingredients/:id`

**Request Body:**
```json
{
  "quantity": 3,
  "unit": "tablespoons"
}
```

**Response:** `200 OK`

### Delete Ingredient
**DELETE** `/api/ingredients/:id`

**Response:** `204 No Content`

---

## Categories

### Get All Categories
**GET** `/api/categories?page=1&limit=50`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "category_1",
      "name": "Italian",
      "description": "Italian cuisine recipes",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### Get Category by ID
**GET** `/api/categories/:id`

**Response:** `200 OK`

### Create Category
**POST** `/api/categories`

**Required Role:** `admin`

**Request Body:**
```json
{
  "name": "Italian",
  "description": "Italian cuisine recipes"
}
```

**Response:** `201 Created`

### Update Category
**PUT** `/api/categories/:id`

**Required Role:** `admin`

**Request Body:**
```json
{
  "name": "Italian Cuisine",
  "description": "Traditional Italian recipes"
}
```

**Response:** `200 OK`

### Delete Category
**DELETE** `/api/categories/:id`

**Required Role:** `admin`

**Response:** `204 No Content`

### Add Category to Recipe
**POST** `/api/recipes/:recipeId/categories/:categoryId`

**Response:** `200 OK` (returns updated recipe)

### Remove Category from Recipe
**DELETE** `/api/recipes/:recipeId/categories/:categoryId`

**Response:** `200 OK` (returns updated recipe)

---

## Reviews

### Get Reviews for Recipe
**GET** `/api/recipes/:recipeId/reviews?page=1&limit=20`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "review_1",
      "recipeId": "recipe_1",
      "userId": "user123",
      "userName": "john@example.com",
      "rating": 5,
      "comment": "Excellent recipe!",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### Create Review
**POST** `/api/recipes/:recipeId/reviews`

**Note:** Users can only review a recipe once.

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Delicious and easy to make!"
}
```

**Validation:**
- `rating`: Integer between 1 and 5 (required)
- `comment`: String (optional)

**Response:** `201 Created`

### Get Recipe Average Rating
**GET** `/api/recipes/:recipeId/rating`

**Response:** `200 OK`
```json
{
  "average": 4.5,
  "count": 10
}
```

### Get Review by ID
**GET** `/api/reviews/:id`

**Response:** `200 OK`

### Update Review
**PUT** `/api/reviews/:id`

**Note:** Only the review author can update their own review.

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated my review after trying again"
}
```

**Response:** `200 OK`

### Delete Review
**DELETE** `/api/reviews/:id`

**Note:** Only the review author can delete their own review.

**Response:** `204 No Content`

### Get User's Reviews
**GET** `/api/users/me/reviews?page=1&limit=20`

**Response:** `200 OK` (returns all reviews by the authenticated user)

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Rating must be between 1 and 5"
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "No authentication token provided"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "Access denied. Required roles: admin, chef"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Recipe not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error"
}
```
