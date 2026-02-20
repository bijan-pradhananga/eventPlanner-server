import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { CreateUserRequest, LoginRequest } from '../types';
import { logger } from '../utils/logger';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      
      const result = await AuthService.register(userData);
      
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      logger.error('Registration failed:', error);
      
      if (error instanceof Error && error.message === 'User with this email already exists') {
        res.status(409).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        next(error);
      }
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      
      const result = await AuthService.login(loginData);
      
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      logger.error('Login failed:', error);
      
      if (error instanceof Error && error.message === 'Invalid email or password') {
        res.status(401).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        next(error);
      }
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      const result = await AuthService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      
      if (error instanceof Error && error.message === 'Invalid or expired refresh token') {
        res.status(401).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        next(error);
      }
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      
      res.status(200).json({
        success: true,
        data: { message: 'Logout successful' }
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is already authenticated and available in req.user
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' }
        });
        return;
      }

      // Get full user details from database
      const { db } = await import('../database/connection');
      const user = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'email_verified_at', 'created_at')
        .where('id', req.user.id)
        .first();

      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile failed:', error);
      next(error);
    }
  }
}