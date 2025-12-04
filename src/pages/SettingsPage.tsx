import { useState, useEffect } from 'react';
import api from '../lib/api';

interface TenantConfig {
  business_name?: string;
  preferred_language?: string;
  system_prompt?: string;
  whatsapp_phone_number_id?: string;
}

interface Tenant {
  id: string;
  name: string;
  domain?: string;
  active: boolean;
  config: TenantConfig;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
];

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    preferredLanguage: 'en',
    systemPrompt: '',
    phoneNumberId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTenantConfig();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchTenantConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get<Tenant>('/api/tenants/me');
      const tenant = response.data;
      setTenant(tenant);

      // Populate form with existing config
      setFormData({
        businessName: tenant.config?.business_name || tenant.name || '',
        preferredLanguage: tenant.config?.preferred_language || 'en',
        systemPrompt: tenant.config?.system_prompt || '',
        phoneNumberId: tenant.config?.whatsapp_phone_number_id || ''
      });
    } catch (error) {
      console.error('Failed to fetch tenant config:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.preferredLanguage) {
      newErrors.preferredLanguage = 'Preferred language is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix validation errors', 'error');
      return;
    }

    try {
      setSaving(true);

      // Build updated tenant object
      const updatedTenant: Tenant = {
        ...tenant!,
        name: formData.businessName.trim(),
        config: {
          ...tenant!.config,
          business_name: formData.businessName.trim(),
          preferred_language: formData.preferredLanguage,
          system_prompt: formData.systemPrompt.trim(),
          whatsapp_phone_number_id: formData.phoneNumberId.trim()
        }
      };

      await api.put('/api/tenants/me', updatedTenant);
      
      showToast('Settings saved successfully', 'success');
      
      // Refresh tenant data
      await fetchTenantConfig();
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.fields) {
        setErrors(error.response.data.fields);
        showToast('Validation errors', 'error');
      } else {
        showToast(error.response?.data?.message || 'Failed to save settings', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your WAAS tenant settings</p>
      </div>

      {/* Settings Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.businessName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Serenity Spa & Salon"
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-500">{errors.businessName}</p>
            )}
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Language *
            </label>
            <select
              id="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.preferredLanguage ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            {errors.preferredLanguage && (
              <p className="mt-1 text-sm text-red-500">{errors.preferredLanguage}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              AI responses will be translated to this language
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional: Custom instructions for the AI assistant..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Customize how the AI responds to customers (optional)
            </p>
          </div>

          {/* WhatsApp Phone Number ID */}
          <div>
            <label htmlFor="phoneNumberId" className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Phone Number ID
            </label>
            <input
              id="phoneNumberId"
              type="text"
              value={formData.phoneNumberId}
              onChange={(e) => handleInputChange('phoneNumberId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 123456789012345"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your WhatsApp Business Phone Number ID from Meta Business Manager
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 rounded-lg text-white transition-colors ${
                saving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* Tenant Info */}
        {tenant && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tenant Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Tenant ID:</span> {tenant.id}</p>
              <p><span className="font-medium">Domain:</span> {tenant.domain || 'Not set'}</p>
              <p><span className="font-medium">Status:</span> {tenant.active ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
