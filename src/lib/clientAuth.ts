// Client-side JWT token verification
// Note: We can't use the server-side JWT verification on the client
// This is a simple implementation for client-side token parsing

export interface JWTPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

// Decode JWT token on client side (without verification for display purposes)
export function decodeToken(token: string): JWTPayload | null {
  try {
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decodedPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  const now = Date.now() / 1000;
  return decoded.exp < now;
}

// API request helper with auth headers
export async function apiRequest(
  endpoint: string, 
  options: RequestInit = {},
  token?: string | null
) {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${baseURL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}