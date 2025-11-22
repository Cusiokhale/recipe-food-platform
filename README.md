# Food Recipe App

A production-ready TypeScript REST API for managing food recipes with Firebase Authentication, Firestore database, role-based access control, and comprehensive testing.

## Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated web framework
- **Firebase Authentication** - Secure user authentication with JWT tokens
- **Firestore Database** - Cloud-native NoSQL database for data persistence
- **Role-Based Access Control (RBAC)** - Admin, Chef, and User roles
- **RESTful API** - Complete CRUD operations for recipes, ingredients, categories, and reviews
- **Advanced Filtering** - Search, filter by multiple criteria, and date ranges
- **Sorting** - Customizable sorting on all list endpoints
- **Image Upload** - Local file storage with automatic recipe linking
- **Swagger/OpenAPI** - Interactive API documentation at `/docs`
- **Testing** - Comprehensive test suite with Jest and ts-jest
- **Code Quality** - ESLint + Prettier for consistent code style
- **CI/CD** - GitHub Actions for automated testing and linting
- **Pagination** - Built-in pagination for all list endpoints
- **Validation** - Comprehensive input validation and error handling

Visit `http://localhost:3000/docs` for API documentation.

## Setup

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- Firebase service account key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add your Firebase service account key as `service-account-key.json` in the project root
4. Create a `.env` file (optional):
   ```
   PORT=3000
   NODE_ENV=development
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

## Quick API Reference

For detailed endpoint documentation, see [API.md](API.md) or visit `/docs` for interactive Swagger UI.

### Recipes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | List all recipes (paginated, filterable, sortable) |
| POST | `/api/recipes` | Create recipe (user/admin only) |
| GET | `/api/recipes/:id` | Get recipe details |
| PUT | `/api/recipes/:id` | Update recipe (owner only) |
| DELETE | `/api/recipes/:id` | Delete recipe (owner only) |

#### Recipe Filtering & Sorting

```bash
# Search recipes by title or description
GET /api/recipes?search=pasta

# Filter by difficulty
GET /api/recipes?difficulty=easy

# Filter by category
GET /api/recipes?categoryId=category_123

# Filter by prep/cook time range
GET /api/recipes?minPrepTime=10&maxPrepTime=30

# Filter by servings
GET /api/recipes?minServings=2&maxServings=6

# Filter by date range
GET /api/recipes?createdAfter=2024-01-01&createdBefore=2024-12-31

# Sort results
GET /api/recipes?sortBy=title&sortOrder=asc
GET /api/recipes?sortBy=prepTime&sortOrder=desc

# Available sort fields: createdAt, updatedAt, title, prepTime, cookTime, servings, difficulty
```

### Ingredients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes/:recipeId/ingredients` | List recipe ingredients |
| POST | `/api/recipes/:recipeId/ingredients` | Add ingredient |
| GET | `/api/ingredients/:id` | Get ingredient details |
| PUT | `/api/ingredients/:id` | Update ingredient |
| DELETE | `/api/ingredients/:id` | Delete ingredient |

#### Ingredient Filtering & Sorting

```bash
# Search ingredients by name
GET /api/recipes/:recipeId/ingredients?search=flour

# Sort ingredients
GET /api/recipes/:recipeId/ingredients?sortBy=name&sortOrder=asc

# Available sort fields: name, quantity, createdAt
```

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category (admin only) |
| GET | `/api/categories/:id` | Get category details |
| PUT | `/api/categories/:id` | Update category (admin only) |
| DELETE | `/api/categories/:id` | Delete category (admin only) |
| POST | `/api/recipes/:recipeId/categories/:categoryId` | Add category to recipe |
| DELETE | `/api/recipes/:recipeId/categories/:categoryId` | Remove category from recipe |

#### Category Filtering & Sorting

```bash
# Search categories
GET /api/categories?search=dessert

# Sort categories
GET /api/categories?sortBy=name&sortOrder=asc

# Available sort fields: name, createdAt, updatedAt
```

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes/:recipeId/reviews` | List recipe reviews |
| POST | `/api/recipes/:recipeId/reviews` | Create review (1-5 stars, one per user) |
| GET | `/api/recipes/:recipeId/rating` | Get average rating |
| GET | `/api/reviews/:id` | Get review details |
| PUT | `/api/reviews/:id` | Update review (author only) |
| DELETE | `/api/reviews/:id` | Delete review (author/admin only) |
| GET | `/api/users/me/reviews` | Get current user's reviews |

#### Review Filtering & Sorting

```bash
# Filter by rating
GET /api/recipes/:recipeId/reviews?minRating=4&maxRating=5

# Sort reviews
GET /api/recipes/:recipeId/reviews?sortBy=rating&sortOrder=desc

# Available sort fields: createdAt, rating
```

### Image Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recipe-image` | Upload recipe image |

#### Upload an Image

```bash
# Upload image only
curl -X POST http://localhost:3000/api/recipe-image \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg"

# Upload and link to existing recipe
curl -X POST http://localhost:3000/api/recipe-image \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg" \
  -F "recipeId=abc123"
```

**Response:**
```json
{
  "imageUrl": "http://localhost:3000/uploads/recipes/recipe-1234567890.jpg",
  "filename": "recipe-1234567890.jpg",
  "recipe": { /* Updated recipe object (only if recipeId provided) */ }
}
```

**Supported formats:** JPEG, PNG, WebP (max 5MB)

**Accessing uploaded images:**
```
GET http://localhost:3000/uploads/recipes/<filename>
```

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (no auth required) |

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

## Data Validation

All endpoints include comprehensive input validation:

### Recipe Validation
- `title`: Required, max 200 characters
- `description`: Required, max 2000 characters
- `instructions`: Required
- `prepTime`: Required, 0-10000 minutes
- `cookTime`: Required, 0-10000 minutes
- `servings`: Required, 1-1000
- `difficulty`: Required, one of: `easy`, `medium`, `hard`
- `imageUrl`: Optional, must be valid URL

### Ingredient Validation
- `name`: Required, max 100 characters
- `unit`: Required, max 50 characters
- `quantity`: Required, positive number

### Category Validation
- `name`: Required, max 100 characters, unique (case-insensitive)
- `description`: Optional, max 500 characters

### Review Validation
- `rating`: Required, integer 1-5
- `comment`: Optional, max 1000 characters

## Project Structure

```
src/
├── app.ts                    # Express app initialization
├── config/                   # Configuration files
│   ├── firebaseConfig.ts    # Firebase Admin SDK setup
│   ├── swagger.ts           # Swagger/OpenAPI config
│   └── upload.ts            # Multer file upload config
├── repositories/            # Firestore data access layer
│   ├── baseRepository.ts    # Abstract base repository
│   ├── recipeRepository.ts
│   ├── ingredientRepository.ts
│   ├── categoryRepository.ts
│   └── reviewRepository.ts
├── services/                # Business logic layer
│   ├── recipeService.ts
│   ├── ingredientService.ts
│   ├── categoryService.ts
│   └── reviewService.ts
├── routes/                  # API route handlers
│   ├── recipes.ts
│   ├── ingredients.ts
│   ├── categories.ts
│   ├── reviews.ts
│   ├── upload.ts
│   └── health.ts
├── middleware/              # Express middleware
│   ├── authenticate.ts      # JWT verification
│   ├── authorize.ts         # Role-based access control
│   ├── errorHandler.ts      # Global error handling
│   └── logger.ts            # Request logging
├── types/                   # TypeScript interfaces
│   └── index.ts
├── utils/                   # Utility functions
│   └── validation.ts        # Input validation helpers
└── errors/                  # Custom error classes
    └── errors.ts
```

## Scripts

```bash
npm run dev       # Start development server with hot reload
npm run build     # Build TypeScript to JavaScript
npm start         # Start production server
npm test          # Run test suite
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
```

---

Made with love by the Food Recipe API team (Cordilia)
