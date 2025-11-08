import { Request, Response, NextFunction } from 'express';
import errorHandler from '../middleware/errorHandler';
import { AppError } from '../errors/errors';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should handle AppError with custom status code', () => {
    const appError = new AppError('Not found', 'ERROR-1', 404);

    errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Not found',
    });
  });

  it('should handle generic errors with 500 status', () => {
    const genericError = new Error('Something went wrong');

    errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });
  });

  it('should create AppError with correct properties', () => {
    const error = new AppError('Unauthorized', 'ERROR-1', 401);

    expect(error.message).toBe('Unauthorized');
    expect(error.statusCode).toBe(401);
    expect(error).toBeInstanceOf(Error);
  });
});
