import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models';
import { comparePassword, generateToken } from '@/lib/auth';
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

    // Find user by email
    const user = await UserModel.findByEmail(email.toLowerCase());
    if (!user) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id!,
      email: user.email,
    });

    return NextResponse.json<AuthResponse>({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id!,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}