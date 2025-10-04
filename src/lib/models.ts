import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import { User, EncryptedVaultItem } from '@/types';

// User collection operations
export class UserModel {
  private static async getCollection(): Promise<Collection<User>> {
    const db = await getDatabase();
    return db.collection<User>('users');
  }

  static async findByEmail(email: string): Promise<User | null> {
    const collection = await this.getCollection();
    return collection.findOne({ email });
  }

  static async create(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const collection = await this.getCollection();
    const now = new Date();
    const user: User = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await collection.insertOne(user);
    return { ...user, _id: result.insertedId.toString() };
  }

  static async findById(id: string): Promise<User | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }
}

// EncryptedVaultItem collection operations
export class VaultItemModel {
  private static async getCollection(): Promise<Collection<EncryptedVaultItem>> {
    const db = await getDatabase();
    return db.collection<EncryptedVaultItem>('vault_items');
  }

  static async findByUserId(userId: string): Promise<EncryptedVaultItem[]> {
    const collection = await this.getCollection();
    return collection.find({ userId }).sort({ updatedAt: -1 }).toArray();
  }

  static async create(itemData: Omit<EncryptedVaultItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<EncryptedVaultItem> {
    const collection = await this.getCollection();
    const now = new Date();
    const item: EncryptedVaultItem = {
      ...itemData,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await collection.insertOne(item);
    return { ...item, _id: result.insertedId.toString() };
  }

  static async update(id: string, updateData: Partial<EncryptedVaultItem>): Promise<EncryptedVaultItem | null> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: now 
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ 
      _id: new ObjectId(id),
      userId // Ensure user can only delete their own items
    });
    
    return result.deletedCount === 1;
  }

  static async findById(id: string): Promise<EncryptedVaultItem | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }
}