/**
 * Token validation and management utilities
 */

interface TokenPayload {
  exp: number;
  iat: number;
  userId: number;
  username: string;
  role: string;
}

/**
 * Decode JWT token payload without verification
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get token from localStorage and validate it
 */
export function getValidToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }
  
  if (isTokenExpired(token)) {
    // Clear expired token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
  
  return token;
}

/**
 * Clear authentication data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}