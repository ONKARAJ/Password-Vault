import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import { hashPassword, generateToken } from '@/lib/auth';
import { AuthResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await UserModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id!,
      email: user.email,
    });

    return NextResponse.json<AuthResponse>({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id!,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    });
    return NextResponse.json<AuthResponse>(
      { success: false, message: `Registration failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}