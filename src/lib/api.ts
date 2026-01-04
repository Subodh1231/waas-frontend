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

// ============================================
// WHATSAPP CONFIGURATION API
// ============================================

export interface WhatsAppConfig {
  connected: boolean;
  whatsappStatus: 'NOT_CONNECTED' | 'CONNECTED' | 'SUSPENDED';
  connectedAt: string | null;
  displayNumber: string | null;
  phoneNumberId: string | null;
  wabaId: string | null;
  businessName: string | null;
  subscriptionStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  canSendMessages: boolean;
}

export interface PricingInfo {
  conversationType: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE';
  pricePerConversation: number;
  description: string;
  freeIncluded: boolean;
}

export interface MigrateToClinicRequest {
  clinicPhoneNumberId: string;
  clinicAccessToken: string;
  clinicDisplayNumber: string;
  clinicWabaId: string;
}

export interface PricingResponse {
  basicPlan: PricingInfo;
  premiumPlan: PricingInfo;
  currentPlan: string;
  currentConfigType: string;
}

/**
 * Get current WhatsApp configuration
 */
export const getWhatsAppConfig = async (): Promise<WhatsAppConfig> => {
  const response = await api.get('/api/whatsapp/config');
  return response.data;
};

/**
 * Migrate to clinic-owned WhatsApp number
 */
export const migrateToClinicNumber = async (
  request: MigrateToClinicRequest
): Promise<WhatsAppConfig> => {
  const response = await api.post('/api/whatsapp/config/migrate-to-clinic', request);
  return response.data;
};

/**
 * Revert to Bookzi-provided WhatsApp number
 */
export const revertToBookziNumber = async (): Promise<WhatsAppConfig> => {
  const response = await api.post('/api/whatsapp/config/revert-to-bookzi');
  return response.data;
};

/**
 * Get WhatsApp pricing information (Meta's per-conversation pricing)
 */
export const getWhatsAppPricing = async (): Promise<PricingInfo[]> => {
  const response = await api.get('/api/whatsapp/config/pricing');
  return response.data;
};

// ============================================
// META EMBEDDED SIGNUP API
// ============================================

export interface EmbeddedSignupStartResponse {
  redirectUrl: string;
  state: string;
  expiresAt: number;
}

export interface EmbeddedSignupCallbackRequest {
  code: string;
  state: string;
}

export interface EmbeddedSignupCallbackResponse {
  success: boolean;
  wabaId?: string;
  phoneNumberId?: string;
  displayNumber?: string;
  businessName?: string;
  connectedAt?: string;
  error?: string;
}

export interface WhatsAppConnectionStatus {
  connected: boolean;
  status: string;
  configType: string;
  displayNumber?: string;
  businessName?: string;
  connectedAt?: string;
  wabaId?: string;
  phoneNumberId?: string;
  canSendMessages: boolean;
  canReceiveMessages: boolean;
  error?: string;
}

/**
 * Start Meta Embedded Signup flow
 * Returns OAuth URL to redirect user to Meta
 */
export const startEmbeddedSignup = async (): Promise<EmbeddedSignupStartResponse> => {
  const response = await api.get('/api/whatsapp/embedded-signup/start');
  return response.data;
};

/**
 * Handle Embedded Signup callback
 * Exchange authorization code for access token and setup WhatsApp
 */
export const handleEmbeddedSignupCallback = async (
  request: EmbeddedSignupCallbackRequest
): Promise<EmbeddedSignupCallbackResponse> => {
  const response = await api.post('/api/whatsapp/embedded-signup/callback', request);
  return response.data;
};

/**
 * Get WhatsApp connection status
 */
export const getWhatsAppConnectionStatus = async (): Promise<WhatsAppConnectionStatus> => {
  const response = await api.get('/api/whatsapp/embedded-signup/status');
  return response.data;
};

// Export the configured axios instance as default
export default api;
