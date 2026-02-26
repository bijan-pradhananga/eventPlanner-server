import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { JWTPayload } from '../types';
import { logger } from '../utils/logger';
import { db } from '../database/connection';

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

/**
 * Middleware to require email verification
 * Must be used AFTER authenticateToken middleware
 */
export const requireEmailVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. Please log in first.' }
      });
      return;
    }

    // Check if user's email is verified
    const user = await db('users')
      .where('id', req.user.id)
      .select('email_verified_at')
      .first();

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
      return;
    }

    if (!user.email_verified_at) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Email verification required. Please verify your email to access this feature.',
          code: 'EMAIL_NOT_VERIFIED'
        }
      });
      return;
    }

    // Email is verified, proceed
    next();
  } catch (error) {
    logger.error('Email verification check failed:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};