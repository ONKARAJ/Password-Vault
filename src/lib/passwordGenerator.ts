import { PasswordGeneratorOptions } from '@/types';

// Character sets for password generation
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Similar characters that might be confusing
const SIMILAR_CHARS = 'il1Lo0O';

// Remove similar characters from a character set
function removeSimilarChars(charSet: string): string {
  return charSet.split('').filter(char => !SIMILAR_CHARS.includes(char)).join('');
}

// Generate a secure random password
export function generatePassword(options: PasswordGeneratorOptions): string {
  let charset = '';
  
  // Build character set based on options
  if (options.includeLowercase) {
    charset += options.excludeSimilar ? removeSimilarChars(LOWERCASE) : LOWERCASE;
  }
  
  if (options.includeUppercase) {
    charset += options.excludeSimilar ? removeSimilarChars(UPPERCASE) : UPPERCASE;
  }
  
  if (options.includeNumbers) {
    charset += options.excludeSimilar ? removeSimilarChars(NUMBERS) : NUMBERS;
  }
  
  if (options.includeSymbols) {
    charset += options.excludeSimilar ? removeSimilarChars(SYMBOLS) : SYMBOLS;
  }
  
  // If no character types selected, default to lowercase
  if (charset === '') {
    charset = LOWERCASE;
  }
  
  // Generate password using crypto.getRandomValues for security
  let password = '';
  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < options.length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  return password;
}

// Get default password generator options
export function getDefaultPasswordOptions(): PasswordGeneratorOptions {
  return {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
  };
}

// Estimate password strength (very basic)
export function estimatePasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 12) score += 1;
  else if (password.length >= 8) score += 0.5;
  else feedback.push('Use at least 8 characters');
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 0.5;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 0.5;
  else feedback.push('Include uppercase letters');
  
  if (/[0-9]/.test(password)) score += 0.5;
  else feedback.push('Include numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 0.5;
  else feedback.push('Include symbols');
  
  // Bonus for longer passwords
  if (password.length >= 16) score += 0.5;
  if (password.length >= 20) score += 0.5;
  
  // Cap at 4
  score = Math.min(4, score);
  
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const label = labels[Math.floor(score)] || 'Very Weak';
  
  return {
    score: Math.floor(score),
    label,
    feedback,
  };
}