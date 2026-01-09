import { useState, useEffect } from 'react';
import { Settings, Building2, Clock, DollarSign, Bell, CreditCard, Globe, Users } from 'lucide-react';
import api from '../lib/api';
import WhatsAppSettingsTab from '../components/WhatsAppSettingsTab';
import StaffManagementTab from '../components/StaffManagementTab';

interface TenantConfig {
  business_name?: string;
  preferred_language?: string;
  system_prompt?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_access_token?: string;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
}

interface Tenant {
  id: string;
  name: string;
  domain?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  logoUrl?: string;
  timezone?: string;
  currency?: string;
  active: boolean;
  config: TenantConfig;
}

interface ReminderSettings {
  reminderEnabled24hr: boolean;
  reminderEnabled2hr: boolean;
  timing24hr: number;
  timing2hr: number;
  messageTemplate24hr: string;
  messageTemplate2hr: string;
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

const SPECIALIZATIONS = [
  'General Practice',
  'Dermatology',
  'Dental',
  'Pediatrics',
  'Orthopedics',
  'Cardiology',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Psychiatry',
  'Other'
];

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'IST (Asia/Kolkata)' },
  { value: 'Asia/Dubai', label: 'GST (Asia/Dubai)' },
  { value: 'America/New_York', label: 'EST (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'PST (America/Los_Angeles)' },
  { value: 'Europe/London', label: 'GMT (Europe/London)' },
];

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'AED', name: 'UAE Dirham (د.إ)' },
];

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [activeSection, setActiveSection] = useState<string>('profile');
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    specialization: '',
    logoUrl: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  });
  
  const [languageData, setLanguageData] = useState({
    preferredLanguage: 'en',
    systemPrompt: ''
  });
  
  const [paymentData, setPaymentData] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: ''
  });
  
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    reminderEnabled24hr: true,
    reminderEnabled2hr: true,
    timing24hr: 24,
    timing2hr: 2,
    messageTemplate24hr: '',
    messageTemplate2hr: ''
  });
  
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTenantData();
    fetchReminderSettings();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const response = await api.get<Tenant>('/api/tenants/me');
      const tenant = response.data;
      setTenant(tenant);

      setProfileData({
        name: tenant.name || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        specialization: tenant.specialization || '',
        logoUrl: tenant.logoUrl || '',
        timezone: tenant.timezone || 'Asia/Kolkata',
        currency: tenant.currency || 'INR'
      });

      setLanguageData({
        preferredLanguage: tenant.config?.preferred_language || 'en',
        systemPrompt: tenant.config?.system_prompt || ''
      });

      setPaymentData({
        razorpayKeyId: tenant.config?.razorpay_key_id || '',
        razorpayKeySecret: tenant.config?.razorpay_key_secret || ''
      });
    } catch (error) {
      console.error('Failed to fetch tenant data:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReminderSettings = async () => {
    try {
      const response = await api.get<ReminderSettings>('/api/settings/reminders');
      setReminderSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch reminder settings:', error);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      showToast('Clinic name is required', 'error');
      return;
    }

    try {
      setSaving({ ...saving, profile: true });
      const updatedTenant: Tenant = {
        ...tenant!,
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        specialization: profileData.specialization,
        logoUrl: profileData.logoUrl,
        timezone: profileData.timezone,
        currency: profileData.currency
      };
      await api.put('/api/tenants/me', updatedTenant);
      showToast('Clinic profile saved successfully', 'success');
      await fetchTenantData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save profile', 'error');
    } finally {
      setSaving({ ...saving, profile: false });
    }
  };

  const saveLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving({ ...saving, language: true });
      const updatedTenant: Tenant = {
        ...tenant!,
        config: {
          ...tenant!.config,
          preferred_language: languageData.preferredLanguage,
          system_prompt: languageData.systemPrompt
        }
      };
      await api.put('/api/tenants/me', updatedTenant);
      showToast('Language settings saved successfully', 'success');
      await fetchTenantData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save language settings', 'error');
    } finally {
      setSaving({ ...saving, language: false });
    }
  };

  const savePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving({ ...saving, payment: true });
      const updatedTenant: Tenant = {
        ...tenant!,
        config: {
          ...tenant!.config,
          razorpay_key_id: paymentData.razorpayKeyId,
          razorpay_key_secret: paymentData.razorpayKeySecret
        }
      };
      await api.put('/api/tenants/me', updatedTenant);
      showToast('Payment settings saved successfully', 'success');
      await fetchTenantData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save payment settings', 'error');
    } finally {
      setSaving({ ...saving, payment: false });
    }
  };

  const saveReminders = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving({ ...saving, reminders: true });
      await api.put('/api/settings/reminders', reminderSettings);
      showToast('Reminder settings saved successfully', 'success');
      await fetchReminderSettings();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save reminder settings', 'error');
    } finally {
      setSaving({ ...saving, reminders: false });
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your clinic configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-6">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveSection('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'profile'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Clinic Profile</span>
              </button>
              
              <button
                onClick={() => setActiveSection('language')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'language'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span>Language & AI</span>
              </button>
              
              <button
                onClick={() => setActiveSection('staff')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'staff'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Team & Staff</span>
              </button>
              
              <button
                onClick={() => setActiveSection('whatsapp')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'whatsapp'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={() => setActiveSection('reminders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'reminders'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>Reminders</span>
              </button>
              
              <button
                onClick={() => setActiveSection('payment')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'payment'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Payment</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Clinic Profile Section */}
          {activeSection === 'profile' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Clinic Profile</h2>
              </div>
              
              <form onSubmit={saveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clinic Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Dr. Smith's Clinic"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="123 Main Street, City, State - 400001"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <select
                      value={profileData.specialization}
                      onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select specialization</option>
                      {SPECIALIZATIONS.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={profileData.logoUrl}
                      onChange={(e) => setProfileData({ ...profileData, logoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Timezone
                    </label>
                    <select
                      value={profileData.timezone}
                      onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Currency
                    </label>
                    <select
                      value={profileData.currency}
                      onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving.profile}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {saving.profile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Language & AI Section */}
          {activeSection === 'language' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Language & AI Settings</h2>
              </div>
              
              <form onSubmit={saveLanguage} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Language *
                  </label>
                  <select
                    value={languageData.preferredLanguage}
                    onChange={(e) => setLanguageData({ ...languageData, preferredLanguage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    AI responses will be translated to this language
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom System Prompt
                  </label>
                  <textarea
                    value={languageData.systemPrompt}
                    onChange={(e) => setLanguageData({ ...languageData, systemPrompt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="Override the default AI behavior with custom instructions..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: Customize how the AI assistant responds to patients
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving.language}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {saving.language ? 'Saving...' : 'Save Language Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff Management Section */}
          {activeSection === 'staff' && <StaffManagementTab />}

          {/* WhatsApp Section */}
          {activeSection === 'whatsapp' && (
            <WhatsAppSettingsTab />
          )}

          {/* Reminders Section */}
          {activeSection === 'reminders' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Appointment Reminders</h2>
              </div>
              
              <form onSubmit={saveReminders} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="reminder24hr"
                      checked={reminderSettings.reminderEnabled24hr}
                      onChange={(e) =>
                        setReminderSettings({ ...reminderSettings, reminderEnabled24hr: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="reminder24hr" className="text-sm font-medium text-gray-700">
                      Enable 24-hour reminder
                    </label>
                  </div>

                  {reminderSettings.reminderEnabled24hr && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Template (24hr)
                      </label>
                      <textarea
                        value={reminderSettings.messageTemplate24hr}
                        onChange={(e) =>
                          setReminderSettings({ ...reminderSettings, messageTemplate24hr: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Hi {name}, reminder: {service} appointment tomorrow at {time}"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="reminder2hr"
                      checked={reminderSettings.reminderEnabled2hr}
                      onChange={(e) =>
                        setReminderSettings({ ...reminderSettings, reminderEnabled2hr: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="reminder2hr" className="text-sm font-medium text-gray-700">
                      Enable 2-hour reminder
                    </label>
                  </div>

                  {reminderSettings.reminderEnabled2hr && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Template (2hr)
                      </label>
                      <textarea
                        value={reminderSettings.messageTemplate2hr}
                        onChange={(e) =>
                          setReminderSettings({ ...reminderSettings, messageTemplate2hr: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Hi {name}, your {service} appointment is in 2 hours at {time}"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving.reminders}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {saving.reminders ? 'Saving...' : 'Save Reminder Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Section */}
          {activeSection === 'payment' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
              </div>
              
              <form onSubmit={savePayment} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Payment integration is coming soon. Configure your Razorpay keys for future use.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={paymentData.razorpayKeyId}
                    onChange={(e) => setPaymentData({ ...paymentData, razorpayKeyId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="rzp_test_xxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    value={paymentData.razorpayKeySecret}
                    onChange={(e) => setPaymentData({ ...paymentData, razorpayKeySecret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter key secret"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving.payment}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {saving.payment ? 'Saving...' : 'Save Payment Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
