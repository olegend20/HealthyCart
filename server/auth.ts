import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { storage } from './storage';
import { registerSchema, loginSchema } from '../shared/schema';
import type { User } from '../shared/schema';

const SALT_ROUNDS = 12;

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    // Validate input
    const validatedData = registerSchema.parse(data);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, SALT_ROUNDS);
    
    // Create user
    const userData = {
      id: randomUUID(),
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      authProvider: 'email',
      emailVerified: false,
    };
    
    const user = await storage.upsertUser(userData);
    return user;
  }
  
  async login(data: { email: string; password: string }): Promise<User> {
    // Validate input
    const validatedData = loginSchema.parse(data);
    
    // Find user
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check if user uses email/password auth
    if (user.authProvider !== 'email' || !user.passwordHash) {
      throw new Error('Invalid authentication method for this user');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    return user;
  }
  
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.authProvider !== 'email' || !user.passwordHash) {
      throw new Error('Password change not supported for this user');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update password
    await storage.updateUser(userId, { passwordHash: newPasswordHash });
  }
}

export const authService = new AuthService();