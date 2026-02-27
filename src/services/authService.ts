import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../database/connection';
import { User, JWTPayload, TwoFATempPayload, CreateUserRequest, LoginRequest } from '../types';
import { logger } from '../utils/logger';
import { emailService } from '../utils/emailService';

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
    });

    // Send verification email
    try {
      await this.sendVerificationEmail(user.id);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    logger.info(`User registered successfully: ${user.email}`);

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  static async login(
    loginData: LoginRequest
  ): Promise<
    | { requires2FA: false; user: Omit<User, 'password_hash'>; accessToken: string; refreshToken: string }
    | { requires2FA: true; tempToken: string }
  > {
    const user = await db('users').where('email', loginData.email).first();
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(loginData.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // --- 2FA branch ---
    if (user.two_factor_enabled) {
      // Invalidate any existing unused codes
      await db('two_factor_codes')
        .where('user_id', user.id)
        .where('is_used', false)
        .update({ is_used: true });

      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db('two_factor_codes').insert({
        user_id: user.id,
        code,
        expires_at: expiresAt,
        is_used: false,
      });

      // Email the code (non-fatal)
      try {
        await emailService.send2FACode(user.email, user.first_name, code);
      } catch (err) {
        logger.error('Failed to send 2FA code email:', err);
      }

      // Issue a short-lived temp JWT (not an access token — different purpose)
      const tempTokenPayload: TwoFATempPayload = { id: user.id, email: user.email, purpose: '2fa' };
      const tempToken = jwt.sign(tempTokenPayload, this.JWT_SECRET, { expiresIn: '10m' });

      logger.info(`2FA code sent to ${user.email}`);
      return { requires2FA: true, tempToken };
    }

    // --- Normal login branch ---
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
    return { requires2FA: false, user: userWithoutPassword, accessToken, refreshToken };
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

  /**
   * Generate a random verification token
   */
  private static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send email verification token to user
   */
  static async sendVerificationEmail(userId: number): Promise<void> {
    // Get user details
    const user = await db('users').where('id', userId).first();
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already verified
    if (user.email_verified_at) {
      throw new Error('Email already verified');
    }

    // Generate verification token
    const token = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Store token in database
    await db('email_verification_tokens').insert({
      token,
      user_id: userId,
      expires_at: expiresAt,
      is_used: false,
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.first_name, token);
    logger.info(`Verification email sent to ${user.email}`);
  }

  /**
   * Verify email using token
   */
  static async verifyEmail(token: string): Promise<{ user: Omit<User, 'password_hash'> }> {
    // Find valid token
    const tokenRecord = await db('email_verification_tokens')
      .where('token', token)
      .where('is_used', false)
      .where('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      throw new Error('Invalid or expired verification token');
    }

    // Get user
    const user = await db('users').where('id', tokenRecord.user_id).first();
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already verified
    if (user.email_verified_at) {
      throw new Error('Email already verified');
    }

    // Mark email as verified
    await db('users')
      .where('id', user.id)
      .update({ email_verified_at: new Date() });

    // Mark token as used
    await db('email_verification_tokens')
      .where('token', token)
      .update({ is_used: true });

    logger.info(`Email verified successfully for user: ${user.email}`);

    // Get updated user
    const updatedUser = await db('users').where('id', user.id).first();
    const { password_hash: _, ...userWithoutPassword } = updatedUser;
    return { user: userWithoutPassword };
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<void> {
    const user = await db('users').where('email', email).first();
    if (!user) {
      throw new Error('User not found');
    }

    if (user.email_verified_at) {
      throw new Error('Email already verified');
    }

    // Invalidate any existing unused tokens
    await db('email_verification_tokens')
      .where('user_id', user.id)
      .where('is_used', false)
      .update({ is_used: true });

    // Send new verification email
    await this.sendVerificationEmail(user.id);
  }

  /**
   * Cleanup expired verification tokens
   */
  static async cleanupExpiredVerificationTokens(): Promise<void> {
    const deletedCount = await db('email_verification_tokens')
      .where('expires_at', '<', new Date())
      .orWhere('is_used', true)
      .del();

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired/used verification tokens`);
    }
  }

  // ─── Two-Factor Auth ──────────────────────────────────────────────────────

  /**
   * Verify a 2FA code issued during login and return full tokens
   */
  static async verify2FA(
    tempToken: string,
    code: string
  ): Promise<{ user: Omit<User, 'password_hash'>; accessToken: string; refreshToken: string }> {
    // Validate temp token
    let payload: TwoFATempPayload;
    try {
      payload = jwt.verify(tempToken, this.JWT_SECRET) as TwoFATempPayload;
    } catch {
      throw new Error('Invalid or expired 2FA session. Please log in again.');
    }

    if (payload.purpose !== '2fa') {
      throw new Error('Invalid token purpose');
    }

    // Find a valid, unused code
    const codeRecord = await db('two_factor_codes')
      .where('user_id', payload.id)
      .where('code', code)
      .where('is_used', false)
      .where('expires_at', '>', new Date())
      .first();

    if (!codeRecord) {
      throw new Error('Invalid or expired 2FA code');
    }

    // Mark code as used
    await db('two_factor_codes').where('id', codeRecord.id).update({ is_used: true });

    // Fetch fresh user
    const user = await db('users').where('id', payload.id).first();
    if (!user) {
      throw new Error('User not found');
    }

    // Issue tokens
    const tokenPayload: JWTPayload = { id: user.id, email: user.email };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

    await db('refresh_tokens').insert({
      token: refreshToken,
      user_id: user.id,
      expires_at: refreshTokenExpiry,
    });

    logger.info(`2FA verified, user logged in: ${user.email}`);

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  /**
   * Enable 2FA for a user
   */
  static async enable2FA(userId: number): Promise<void> {
    const user = await db('users').where('id', userId).first();
    if (!user) throw new Error('User not found');
    if (user.two_factor_enabled) throw new Error('Two-factor authentication is already enabled');

    await db('users').where('id', userId).update({ two_factor_enabled: true });
    logger.info(`2FA enabled for user: ${user.email}`);
  }

  /**
   * Disable 2FA for a user (requires password confirmation)
   */
  static async disable2FA(userId: number, password: string): Promise<void> {
    const user = await db('users').where('id', userId).first();
    if (!user) throw new Error('User not found');
    if (!user.two_factor_enabled) throw new Error('Two-factor authentication is not enabled');

    const isPasswordValid = await this.comparePassword(password, user.password_hash);
    if (!isPasswordValid) throw new Error('Invalid password');

    await db('users').where('id', userId).update({ two_factor_enabled: false });

    // Invalidate any pending 2FA codes
    await db('two_factor_codes').where('user_id', userId).where('is_used', false).update({ is_used: true });

    logger.info(`2FA disabled for user: ${user.email}`);
  }

  /**
   * Cleanup expired 2FA codes
   */
  static async cleanupExpired2FACodes(): Promise<void> {
    const deletedCount = await db('two_factor_codes')
      .where('expires_at', '<', new Date())
      .orWhere('is_used', true)
      .del();

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired/used 2FA codes`);
    }
  }
}