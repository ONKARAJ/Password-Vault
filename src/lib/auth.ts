import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('JWT_SECRET not found, using placeholder for build');
  // Use a placeholder secret for build process
  process.env.JWT_SECRET = 'placeholder-jwt-secret-for-build-only-please-change-in-production';
}

export interface JWTPayload {
  userId: string;
  email: string;
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { 
    expiresIn: '7d' // Token expires in 7 days
  });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Compare password with hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Extract token from Authorization header
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

// Middleware to verify JWT token from request headers
export function getAuthenticatedUser(authHeader: string | null): JWTPayload | null {
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}