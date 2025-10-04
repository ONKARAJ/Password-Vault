import { NextRequest, NextResponse } from 'next/server';
import { VaultItemModel } from '@/lib/models';
import { getAuthenticatedUser } from '@/lib/auth';

// PUT /api/vault/[id] - Update vault item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = getAuthenticatedUser(request.headers.get('authorization'));
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { encryptedData } = await request.json();

    // Validate input
    if (!encryptedData || !encryptedData.data || !encryptedData.salt || !encryptedData.iv) {
      return NextResponse.json(
        { success: false, message: 'Invalid encrypted data format' },
        { status: 400 }
      );
    }

    // Check if item exists and belongs to user
    const existingItem = await VaultItemModel.findById(id);
    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: 'Vault item not found' },
        { status: 404 }
      );
    }

    if (existingItem.userId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update vault item
    const updatedItem = await VaultItemModel.update(id, { encryptedData });

    return NextResponse.json({
      success: true,
      message: 'Vault item updated successfully',
      data: updatedItem,
    });

  } catch (error) {
    console.error('Update vault item error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/vault/[id] - Delete vault item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = getAuthenticatedUser(request.headers.get('authorization'));
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Delete vault item (includes user ownership check)
    const deleted = await VaultItemModel.delete(id, user.userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Vault item not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vault item deleted successfully',
    });

  } catch (error) {
    console.error('Delete vault item error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}