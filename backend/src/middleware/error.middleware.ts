import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  details?: string;

  constructor(message: string, statusCode: number, details?: string) {
    super(message);
    this.statusCode = statusCode;
    //@ts-ignore
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message: err.message || 'Internal Server Error',
      details: err.details || null,
    },
  });
};