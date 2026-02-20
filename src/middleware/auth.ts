import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { JWTPayload } from '../types';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Access token is required' }
      });
      return;
    }

    const decoded = AuthService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Token verification failed:', error);
    res.status(403).json({
      success: false,
      error: { message: 'Invalid or expired access token' }
    });
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token) {
      const decoded = AuthService.verifyAccessToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens, just continue without user
    logger.debug('Optional auth token verification failed:', error);
    next();
  }
};