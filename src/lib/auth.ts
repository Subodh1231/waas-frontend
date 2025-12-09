import api from './api';

// Constants for localStorage keys
const TOKEN_KEY = 'waas_token';
const TENANT_KEY = 'waas_tenant';

/**
 * Type definitions
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tenantId: string;
  role: string;
}

export interface UserPayload {
  userId: string;
  tenantId: string;
  role: string;
  exp: number;
  iat?: number;
  sub?: string;
}

/**
 * Login user with email and password
 * @param email - User email
 * @param password - User password
 * @returns Login response with token, tenantId, and role
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const requestData: LoginRequest = { email, password };
  
  // No X-Tenant-ID header needed - backend resolves tenant from email
  const response = await api.post<LoginResponse>('/api/auth/login', requestData);
  
  const { token, tenantId } = response.data;
  
  // Save token and tenant ID to localStorage
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TENANT_KEY, tenantId);
  
  return response.data;
};

/**
 * Logout user - clear localStorage and redirect to login
 */
export const logout = (): void => {
  // Remove authentication data from localStorage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
  
  // Use pushState to redirect to login (works with SPA routing)
  window.location.href = '/';
};

/**
 * Get authentication token from localStorage
 * @returns JWT token or null
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get tenant ID from localStorage
 * @returns Tenant ID or null
 */
export const getTenantId = (): string | null => {
  return localStorage.getItem(TENANT_KEY);
};

/**
 * Check if user is authenticated
 * @returns true if token exists
 */
export const isAuthenticated = (): boolean => {
  return getToken() != null;
};

/**
 * Parse JWT token and extract payload
 * @param token - JWT token string
 * @returns Decoded user payload or null if invalid
 */
export const parseJwt = (token: string): UserPayload | null => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }
    
    // Decode the payload (second part)
    const base64Payload = parts[1];
    
    // Replace URL-safe characters and decode base64
    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload) as UserPayload;
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
};

/**
 * Get current user information from JWT token
 * @returns User payload if authenticated, null otherwise
 */
export const getUserInfo = (): UserPayload | null => {
  const token = getToken();
  
  if (!token) {
    return null;
  }
  
  return parseJwt(token);
};

/**
 * Check if JWT token is expired
 * @param token - JWT token string (optional, uses stored token if not provided)
 * @returns true if token is expired or invalid
 */
export const isTokenExpired = (token?: string): boolean => {
  const tokenToCheck = token || getToken();
  
  if (!tokenToCheck) {
    return true;
  }
  
  const payload = parseJwt(tokenToCheck);
  
  if (!payload || !payload.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
};

/**
 * Get user role from token
 * @returns User role or null
 */
export const getUserRole = (): string | null => {
  const userInfo = getUserInfo();
  return userInfo?.role || null;
};

/**
 * Get user ID from token
 * @returns User ID or null
 */
export const getUserId = (): string | null => {
  const userInfo = getUserInfo();
  return userInfo?.userId || null;
};
