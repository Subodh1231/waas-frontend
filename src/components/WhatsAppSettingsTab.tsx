import { useState, useEffect } from 'react';
import {
  getWhatsAppConfig,
  migrateToClinicNumber,
  revertToBookziNumber,
  type WhatsAppConfig,
  type MigrateToClinicRequest,
} from '../lib/api';
import { Phone, CheckCircle, AlertCircle, ArrowRight, ExternalLink, RefreshCw, Copy, Settings } from 'lucide-react';

export default function WhatsAppSettingsTab() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWhatsAppConfig();
      setConfig(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load WhatsApp configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load Configuration</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadConfig}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {config.subscriptionStatus === 'TRIAL' && config.daysRemainingInTrial !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-blue-900">
                🎉 Trial Active - {config.daysRemainingInTrial} Days Remaining
              </h3>
              <p className="mt-2 text-sm text-blue-700">
                You're currently on a free trial with a Bookzi-provided WhatsApp number. Enjoy all
                features for free until {new Date(config.trialEndsAt!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired Banner */}
      {config.subscriptionStatus === 'EXPIRED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-900">Trial Expired</h3>
              <p className="mt-2 text-sm text-red-700">
                Your trial has ended. Please upgrade to continue using WhatsApp features.
              </p>
              <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Number - Prominently Displayed */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 mb-1">📱 Your WhatsApp Business Number</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {config.activeDisplayNumber || 'Not configured'}
              </span>
            </div>
            <p className="text-sm text-green-700">
              💬 Share this number with your patients for appointments and inquiries
            </p>
          </div>
          {config.activeDisplayNumber && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(config.activeDisplayNumber!);
                alert('✅ Phone number copied to clipboard!');
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Copy className="w-4 h-4" />
              Copy Number
            </button>
          )}
        </div>
      </div>

      {/* Current Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Configuration Details
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Configuration Type</p>
              <p className="text-base font-medium text-gray-900">
                {config.configType === 'BOOKZI_PROVIDED'
                  ? '📱 Bookzi-Provided'
                  : '🏥 Clinic-Owned'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-base font-medium">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    config.canSendMessages
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {config.canSendMessages ? '✓ Active' : '✗ Suspended'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-base font-medium text-gray-900">
                {config.currentPlanPricing.planName === 'BASIC'
                  ? 'Basic Plan'
                  : 'Premium Plan'}{' '}
                - ₹{config.currentPlanPricing.monthlyPrice}/month
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">{config.currentPlanPricing.description}</p>
          </div>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Options</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Plan */}
          <div className="border-2 border-blue-500 rounded-lg p-6 relative">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Current Plan
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {config.currentPlanPricing.planName === 'BASIC'
                ? '🏥 Basic Plan'
                : '📱 Premium Plan'}
            </h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">
                ₹{config.currentPlanPricing.monthlyPrice}
              </span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {config.currentPlanPricing.description}
            </p>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Alternative Plan */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {config.alternativePlanPricing.planName === 'BASIC'
                ? '🏥 Basic Plan'
                : '📱 Premium Plan'}
            </h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">
                ₹{config.alternativePlanPricing.monthlyPrice}
              </span>
              <span className="text-gray-500">/month</span>
              {config.alternativePlanPricing.monthlyPrice <
                config.currentPlanPricing.monthlyPrice && (
                <span className="ml-2 text-sm text-green-600 font-medium">
                  Save ₹
                  {config.currentPlanPricing.monthlyPrice -
                    config.alternativePlanPricing.monthlyPrice}
                  /mo
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {config.alternativePlanPricing.description}
            </p>
            <button
              onClick={() => {
                if (config.configType === 'BOOKZI_PROVIDED') {
                  setShowMigrateModal(true);
                } else {
                  setShowRevertModal(true);
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              Switch to This Plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Setup Guide Link */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Need Help Setting Up?</h3>
        <p className="text-sm text-gray-600 mb-4">
          If you want to use your own WhatsApp Business number, follow our step-by-step guide to
          connect your Meta Business account.
        </p>
        <a
          href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          View Setup Guide
          <ExternalLink className="ml-1 h-4 w-4" />
        </a>
      </div>

      {/* Migrate to Clinic Modal */}
      {showMigrateModal && (
        <MigrateModal
          onClose={() => setShowMigrateModal(false)}
          onSuccess={() => {
            setShowMigrateModal(false);
            loadConfig();
          }}
        />
      )}

      {/* Revert to Bookzi Modal */}
      {showRevertModal && (
        <RevertModal
          onClose={() => setShowRevertModal(false)}
          onSuccess={() => {
            setShowRevertModal(false);
            loadConfig();
          }}
        />
      )}
    </div>
  );
}

// Migrate to Clinic Modal Component
function MigrateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<MigrateToClinicRequest>({
    clinicPhoneNumberId: '',
    clinicAccessToken: '',
    clinicDisplayNumber: '',
    clinicWabaId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await migrateToClinicNumber(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to migrate. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Switch to Your Own WhatsApp Number
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 <strong>Before you proceed:</strong> Make sure you've completed the WhatsApp
              Business API setup in your Meta Business account. You'll need your Phone Number ID,
              Access Token, and WABA ID.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.clinicPhoneNumberId}
                onChange={(e) =>
                  setFormData({ ...formData, clinicPhoneNumberId: e.target.value })
                }
                placeholder="e.g., 123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.clinicAccessToken}
                onChange={(e) => setFormData({ ...formData, clinicAccessToken: e.target.value })}
                placeholder="Paste your access token here"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.clinicDisplayNumber}
                onChange={(e) => setFormData({ ...formData, clinicDisplayNumber: e.target.value })}
                placeholder="e.g., +919876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WABA ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.clinicWabaId}
                onChange={(e) => setFormData({ ...formData, clinicWabaId: e.target.value })}
                placeholder="e.g., 123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Migrating...
                  </>
                ) : (
                  'Migrate to My Number'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Revert to Bookzi Modal Component
function RevertModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRevert = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await revertToBookziNumber();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revert to Bookzi number.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Switch to Bookzi-Provided Number?
        </h2>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            You'll be switched to a Bookzi-provided WhatsApp number. This will:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Instantly activate a new WhatsApp number</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Zero setup hassle - we manage everything</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠️</span>
              <span>Increase your monthly cost by ₹500</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRevert}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {submitting ? (
              <>
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                Switching...
              </>
            ) : (
              'Yes, Switch to Bookzi Number'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
