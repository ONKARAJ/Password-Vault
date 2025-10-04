export interface User {
  _id?: string;
  email: string;
  password: string; // hashed
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VaultItem {
  _id?: string;
  userId: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EncryptedVaultItem {
  _id?: string;
  userId: string;
  encryptedData: {
    data: string; // base64 encoded encrypted JSON
    salt: string; // base64 encoded
    iv: string;   // base64 encoded
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export interface ClipboardItem {
  text: string;
  timeoutId: NodeJS.Timeout;
}