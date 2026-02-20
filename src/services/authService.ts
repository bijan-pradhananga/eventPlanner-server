import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/connection';
import { User, JWTPayload, CreateUserRequest, LoginRequest } from '../types';
import { logger } from '../utils/logger';

// Helper to get required env vars with proper error
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  // Use runtime-checked required env vars (recommended in production)
  private static readonly JWT_SECRET = getRequiredEnvVar('JWT_SECRET');
  private static readonly JWT_REFRESH_SECRET = getRequiredEnvVar('JWT_REFRESH_SECRET');

  // You can keep fallbacks during local dev if you prefer, but better to fail fast in prod
  // private static readonly JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret';
  // private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-only-insecure-refresh';

  private static readonly JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  private static readonly JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'];

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });
  }

  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_REFRESH_SECRET) as JWTPayload;
  }

  static async register(
    userData: CreateUserRequest
  ): Promise<{ user: Omit<User, 'password_hash'>; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await db('users').where('email', userData.email).first();
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const password_hash = await this.hashPassword(userData.password);

    // Create user
    const [userId] = await db('users').insert({
      email: userData.email,
      password_hash,
      first_name: userData.first_name,
      last_name: userData.last_name,
    });

    // Fetch the newly created user
    const user = await db('users').where('id', userId).first();
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate tokens
    const tokenPayload: JWTPayload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Store refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

    await db('refresh_tokens').insert({
      token: refreshToken,
      user_id: user.id,
      expires_at: refreshTokenExpiry,
      // is_revoked defaults to false (assuming your schema has default false)
    });

    logger.info(`User registered successfully: ${user.email}`);

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  static async login(
    loginData: LoginRequest
  ): Promise<{ user: Omit<User, 'password_hash'>; accessToken: string; refreshToken: string }> {
    const user = await db('users').where('email', loginData.email).first();
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(loginData.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const tokenPayload: JWTPayload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

    await db('refresh_tokens').insert({
      token: refreshToken,
      user_id: user.id,
      expires_at: refreshTokenExpiry,
    });

    logger.info(`User logged in successfully: ${user.email}`);

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.verifyRefreshToken(refreshToken);

      const tokenRecord = await db('refresh_tokens')
        .where('token', refreshToken)
        .where('user_id', payload.id)
        .where('is_revoked', false)
        .where('expires_at', '>', new Date())
        .first();

      if (!tokenRecord) {
        throw new Error('Invalid or expired refresh token');
      }

      const newTokenPayload: JWTPayload = {
        id: payload.id,
        email: payload.email,
      };

      const newAccessToken = this.generateAccessToken(newTokenPayload);
      const newRefreshToken = this.generateRefreshToken(newTokenPayload);

      // Revoke old token
      await db('refresh_tokens')
        .where('token', refreshToken)
        .update({ is_revoked: true });

      // Store new refresh token
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

      await db('refresh_tokens').insert({
        token: newRefreshToken,
        user_id: payload.id,
        expires_at: refreshTokenExpiry,
      });

      logger.info(`Token refreshed successfully for user: ${payload.email}`);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    await db('refresh_tokens')
      .where('token', refreshToken)
      .update({ is_revoked: true });

    logger.info('User logged out successfully');
  }

  static async cleanupExpiredTokens(): Promise<void> {
    const deletedCount = await db('refresh_tokens')
      .where('expires_at', '<', new Date())
      .orWhere('is_revoked', true)
      .del();

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired/revoked refresh tokens`);
    }
  }
}