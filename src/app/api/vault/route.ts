import { NextRequest, NextResponse } from 'next/server';
import { VaultItemModel } from '@/lib/models';
import { getAuthenticatedUser } from '@/lib/auth';
import { EncryptedVaultItem } from '@/types';

// GET /api/vault - Get all vault items for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = getAuthenticatedUser(request.headers.get('authorization'));
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's vault items
    const vaultItems = await VaultItemModel.findByUserId(user.userId);

    return NextResponse.json({
      success: true,
      data: vaultItems,
    });

  } catch (error) {
    console.error('Get vault items error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/vault - Create new vault item
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = getAuthenticatedUser(request.headers.get('authorization'));
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { encryptedData } = await request.json();

    // Validate input
    if (!encryptedData || !encryptedData.data || !encryptedData.salt || !encryptedData.iv) {
      return NextResponse.json(
        { success: false, message: 'Invalid encrypted data format' },
        { status: 400 }
      );
    }

    // Create vault item
    const vaultItem = await VaultItemModel.create({
      userId: user.userId,
      encryptedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Vault item created successfully',
      data: vaultItem,
    });

  } catch (error) {
    console.error('Create vault item error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}