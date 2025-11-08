# Food Recipe App

A production-ready TypeScript REST API for managing food recipes with Firebase Authentication, role-based access control, and comprehensive testing.

## Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated web framework
- **Firebase Authentication** - Secure user authentication with JWT tokens
- **Role-Based Access Control (RBAC)** - Admin, Chef, and User roles
- **RESTful API** - Complete CRUD operations for recipes, ingredients, categories, and reviews
- **Swagger/OpenAPI** - Interactive API documentation at `/docs`
- **Testing** - Comprehensive test suite with Jest and ts-jest
- **Code Quality** - ESLint + Prettier for consistent code style
- **CI/CD** - GitHub Actions for automated testing and linting
- **Pagination** - Built-in pagination for all list endpoints
- **Validation** - Input validation and error handling

Visit `http://localhost:3000/docs` for API documentation.


### Quick API Reference

For detailed endpoint documentation, see [API.md](API.md).

#### Recipes
- `GET /api/recipes` - List all recipes (paginated, filterable)
- `POST /api/recipes` - Create recipe (admin/chef only)
- `GET /api/recipes/:id` - Get recipe details
- `PUT /api/recipes/:id` - Update recipe (owner only)
- `DELETE /api/recipes/:id` - Delete recipe (owner only)

#### Ingredients
- `GET /api/recipes/:recipeId/ingredients` - List recipe ingredients
- `POST /api/recipes/:recipeId/ingredients` - Add ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

#### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

#### Reviews
- `GET /api/recipes/:recipeId/reviews` - List recipe reviews
- `POST /api/recipes/:recipeId/reviews` - Create review (1-5 stars)
- `GET /api/recipes/:recipeId/rating` - Get average rating
- `PUT /api/reviews/:id` - Update review (author only)
- `DELETE /api/reviews/:id` - Delete review (author only)

## Authentication

This API uses **Firebase Authentication** with JWT tokens.

### Making Authenticated Requests

Include the Firebase ID token in the Authorization header:

```bash
curl -H "Authorization: Bearer <firebase-id-token>" \
     http://localhost:3000/api/recipes
```

### Getting a Firebase Token

**For Testing (using Firebase Auth REST API):**
```bash
# Sign in with email/password
curl -X POST \
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "returnSecureToken": true
  }'
```

The response includes an `idToken` field - use this as your Bearer token.

Made with love by the Food Recipe API team (Cordilia)
