import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import errorHandler from './middleware/errorHandler';
import recipesRouter from './routes/recipes';
import ingredientsRouter from './routes/ingredients';
import categoriesRouter from './routes/categories';
import reviewsRouter from './routes/reviews';
import healthRouter from './routes/health';
import uploadRouter from './routes/upload';
import adminRouter from './routes/admin';
import { accessLogger, consoleLogger, errorLogger } from './middleware/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

if (process.env.NODE_ENV !== 'production') {
  app.use(consoleLogger);
}

app.use(accessLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/', uploadRouter);

app.use(errorLogger);
app.use(errorHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/docs`);
  });
}

export default app;
