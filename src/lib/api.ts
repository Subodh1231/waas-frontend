import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Constants for localStorage keys
const TOKEN_KEY = 'waas_token';
const TENANT_KEY = 'waas_tenant';

// Base URL from environment variable or default to localhost
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  consultationType?: string;
  durationMinutes?: number;
  color?: string;
  providerId?: string;
  tenantId?: string;
  isActive?: boolean;
}

export interface DoctorAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  slotDuration?: number; // Deprecated, use slotDurationMinutes
  providerId?: string;
  doctorName?: string;
  isActive: boolean;
  tenantId?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  specialization?: string;
  qualifications?: string;
  licenseNumber?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  name: string;
  email?: string;
  phone?: string;
  role: string;
  specialization?: string;
  qualifications?: string;
  licenseNumber?: string;
  isActive?: boolean;
}

export interface CreateAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  providerId?: string;
  doctorName?: string;
}

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

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

// ============================================
// APPOINTMENTS API
// ============================================

export interface PatientInfo {
  phone: string;
  name?: string;
  email?: string;
}

export interface CreateAppointmentRequest {
  patient: PatientInfo;
  serviceId: string;
  providerName: string;
  providerId?: string;
  startTime: string; // ISO 8601 format
  durationMinutes?: number;
  notes?: string;
  source?: 'MANUAL' | 'WHATSAPP' | 'ONLINE';
}

export interface AppointmentResponse {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  providerId?: string;
  providerName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  appointmentStatus: string;
  source: 'MANUAL' | 'WHATSAPP' | 'ONLINE';
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  chatId?: string;
}

export interface ConflictingAppointment {
  id: string;
  patientName: string;
  startTime: string;
  endTime: string;
  serviceName: string;
}

export interface SuggestedSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AvailabilityCheckResponse {
  available: boolean;
  message: string;
  conflicts?: ConflictingAppointment[];
  suggestions?: SuggestedSlot[];
}

export interface AppointmentFilters {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  source?: string;
  status?: string;
  providerName?: string;
  page?: number;
  size?: number;
}

export interface PagedAppointments {
  content: AppointmentResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Create a new appointment
 */
export const createAppointment = async (
  request: CreateAppointmentRequest
): Promise<AppointmentResponse> => {
  const response = await api.post('/api/appointments', request);
  return response.data;
};

/**
 * List appointments with filters
 */
export const listAppointments = async (
  filters: AppointmentFilters
): Promise<PagedAppointments> => {
  const response = await api.get('/api/appointments', { params: filters });
  return response.data;
};

/**
 * Get appointment by ID
 */
export const getAppointment = async (id: string): Promise<AppointmentResponse> => {
  const response = await api.get(`/api/appointments/${id}`);
  return response.data;
};

/**
 * Update appointment
 */
export const updateAppointment = async (
  id: string,
  updates: Partial<CreateAppointmentRequest>
): Promise<AppointmentResponse> => {
  const response = await api.put(`/api/appointments/${id}`, updates);
  return response.data;
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (
  id: string,
  status: string,
  appointmentStatus?: string
): Promise<AppointmentResponse> => {
  const response = await api.put(`/api/appointments/${id}/status`, {
    status,
    appointmentStatus,
  });
  return response.data;
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (id: string): Promise<void> => {
  await api.delete(`/api/appointments/${id}`);
};

/**
 * Check slot availability
 */
export const checkAvailability = async (
  providerName: string,
  startTime: string,
  durationMinutes: number
): Promise<AvailabilityCheckResponse> => {
  const response = await api.post('/api/appointments/check-availability', {
    providerName,
    startTime,
    durationMinutes,
  });
  return response.data;
};

/**
 * Get patient appointment history
 */
export const getPatientHistory = async (patientId: string): Promise<{
  appointments: AppointmentResponse[];
  totalAppointments: number;
}> => {
  const response = await api.get(`/api/appointments/patients/${patientId}`);
  return response.data;
};

// ============================================
// STAFF API
// ============================================

/**
 * List all active staff members
 */
export const listStaff = async (role?: string, activeOnly: boolean = true): Promise<Staff[]> => {
  const response = await api.get('/api/staff', {
    params: { role, activeOnly },
  });
  return response.data;
};

/**
 * Get doctors only
 */
export const getDoctors = async (): Promise<Staff[]> => {
  const response = await api.get('/api/staff/doctors');
  return response.data;
};

/**
 * Get staff member by ID
 */
export const getStaff = async (id: string): Promise<Staff> => {
  const response = await api.get(`/api/staff/${id}`);
  return response.data;
};

/**
 * Create new staff member
 */
export const createStaff = async (request: CreateStaffRequest): Promise<Staff> => {
  const response = await api.post('/api/staff', request);
  return response.data;
};

/**
 * Update staff member
 */
export const updateStaff = async (
  id: string,
  updates: Partial<CreateStaffRequest>
): Promise<Staff> => {
  const response = await api.put(`/api/staff/${id}`, updates);
  return response.data;
};

/**
 * Deactivate staff member
 */
export const deactivateStaff = async (id: string): Promise<void> => {
  await api.delete(`/api/staff/${id}`);
};

/**
 * Search staff by name
 */
export const searchStaff = async (query: string): Promise<Staff[]> => {
  const response = await api.get('/api/staff/search', {
    params: { q: query },
  });
  return response.data;
};

// ============================================
// PATIENTS/CUSTOMERS API
// ============================================

export interface PatientSearchResult {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastAppointment?: string;
  totalAppointments: number;
}

/**
 * Search patients by phone number
 */
export const searchPatients = async (phone: string): Promise<PatientSearchResult[]> => {
  const response = await api.get('/api/patients', {
    params: { phone },
  });
  return response.data;
};

// ============================================
// AVAILABILITY API
// ============================================

/**
 * Get availability for a specific provider
 */
export const getProviderAvailability = async (providerId: string): Promise<DoctorAvailability[]> => {
  const response = await api.get(`/api/availability/provider/${providerId}`);
  return response.data;
};

/**
 * Create a new availability slot
 */
export const createAvailability = async (availability: CreateAvailabilityRequest): Promise<DoctorAvailability> => {
  const response = await api.post('/api/availability', availability);
  return response.data;
};

/**
 * Update an availability slot
 */
export const updateAvailability = async (id: string, availability: Partial<DoctorAvailability>): Promise<DoctorAvailability> => {
  const response = await api.put(`/api/availability/${id}`, availability);
  return response.data;
};

/**
 * Delete an availability slot
 */
export const deleteAvailability = async (id: string): Promise<void> => {
  await api.delete(`/api/availability/${id}`);
};

/**
 * Bulk create availability slots
 */
export const bulkCreateAvailability = async (availabilities: CreateAvailabilityRequest[]): Promise<DoctorAvailability[]> => {
  const response = await api.post('/api/availability/bulk', availabilities);
  return response.data;
};

// ============================================
// PROVIDER SERVICES API
// ============================================

/**
 * Get services for a specific provider
 */
export const getProviderServices = async (providerId: string): Promise<ServiceItem[]> => {
  const tenantId = localStorage.getItem('tenantId');
  if (!tenantId) throw new Error('No tenant ID found');
  
  const response = await api.get(`/api/services`, {
    params: { tenantId, providerId },
  });
  return response.data;
};

/**
 * Get clinic-wide services (no provider assigned)
 */
export const getClinicServices = async (): Promise<ServiceItem[]> => {
  const tenantId = localStorage.getItem('tenantId');
  if (!tenantId) throw new Error('No tenant ID found');
  
  const response = await api.get(`/api/services`, {
    params: { tenantId },
  });
  return response.data;
};

/**
 * Assign a service to a provider
 */
export const assignServiceToProvider = async (serviceId: string, providerId: string): Promise<ServiceItem> => {
  const response = await api.put(`/api/services/${serviceId}`, {
    providerId,
  });
  return response.data;
};

/**
 * Unassign a service from a provider (make it clinic-wide)
 */
export const unassignServiceFromProvider = async (serviceId: string): Promise<ServiceItem> => {
  const response = await api.put(`/api/services/${serviceId}`, {
    providerId: null,
  });
  return response.data;
};

// Export the configured axios instance as default
export default api;
