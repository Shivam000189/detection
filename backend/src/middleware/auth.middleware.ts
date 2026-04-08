import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: 'admin' | 'police' | 'analyst';
    email: string;
  };
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 401, message: 'No token provided' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    //@ts-ignore
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    //@ts-ignore
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 401, message: 'Invalid or expired token' },
    });
  }
};

export const authorize = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: `Role '${req.user?.role}' is not allowed to access this route`,
        },
      });
      return;
    }
    next();
  };