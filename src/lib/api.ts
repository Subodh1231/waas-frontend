import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Constants for localStorage keys
const TOKEN_KEY = 'waas_token';
const TENANT_KEY = 'waas_tenant';

// Base URL from environment variable or default to localhost
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Axios instance configured for WAAS API
 */
const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Request interceptor - Auto-attach Authorization and X-Tenant-ID headers
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach Authorization token if available
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach X-Tenant-ID header if available
    const tenantId = getTenantId();
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle 401 unauthorized errors
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If 401 Unauthorized, clear token and redirect to login
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized - clearing token and redirecting to login');
      clearToken();
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Set authentication token in localStorage
 * @param token - JWT token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Clear authentication token from localStorage
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
};

/**
 * Get authentication token from localStorage
 * @returns JWT token or null
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set tenant ID in localStorage
 * @param tenantId - Tenant UUID
 */
export const setTenantId = (tenantId: string): void => {
  localStorage.setItem(TENANT_KEY, tenantId);
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
  return !!getToken();
};

// Export the configured axios instance as default
export default api;
