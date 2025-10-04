/**
 * Client-side encryption using Web Crypto API
 * Uses AES-256-GCM for authenticated encryption
 * All encryption/decryption happens on the client - server never sees plaintext
 */

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive key from password using PBKDF2
async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate random salt
function generateSalt(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(16)).buffer;
}

// Generate random IV
function generateIV(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(12)).buffer;
}

export interface EncryptedData {
  data: string; // base64 encoded
  salt: string; // base64 encoded
  iv: string;   // base64 encoded
}

// Encrypt data with user's master password
export async function encryptData(plaintext: string, masterPassword: string): Promise<EncryptedData> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(masterPassword, salt);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    stringToArrayBuffer(plaintext)
  );

  return {
    data: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv)
  };
}

// Decrypt data with user's master password
export async function decryptData(encryptedData: EncryptedData, masterPassword: string): Promise<string> {
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const data = base64ToArrayBuffer(encryptedData.data);
  
  const key = await deriveKey(masterPassword, salt);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    data
  );

  return arrayBufferToString(decrypted);
}

// Encrypt vault item
export async function encryptVaultItem(item: Record<string, unknown>, masterPassword: string): Promise<EncryptedData> {
  const plaintext = JSON.stringify(item);
  return encryptData(plaintext, masterPassword);
}

// Decrypt vault item
export async function decryptVaultItem(encryptedData: EncryptedData, masterPassword: string): Promise<Record<string, unknown>> {
  const plaintext = await decryptData(encryptedData, masterPassword);
  return JSON.parse(plaintext);
}
