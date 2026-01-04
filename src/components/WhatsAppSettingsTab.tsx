import { useState, useEffect } from 'react';
import {
  getWhatsAppConfig,
  startEmbeddedSignup,
  getWhatsAppConnectionStatus,
  type WhatsAppConfig,
  type WhatsAppConnectionStatus,
} from '../lib/api';
import { CheckCircle, AlertCircle, RefreshCw, Link as LinkIcon, ExternalLink, Phone, Shield, Zap } from 'lucide-react';

export default function WhatsAppSettingsTab() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<WhatsAppConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadConfig();
    loadConnectionStatus();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWhatsAppConfig();
      setConfig(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionStatus = async () => {
    try {
      const status = await getWhatsAppConnectionStatus();
      setConnectionStatus(status);
    } catch (err: any) {
      console.error('Failed to load connection status:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const response = await startEmbeddedSignup();
      
      // Redirect to Meta OAuth page
      window.location.href = response.redirectUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start WhatsApp connection');
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading WhatsApp settings...</p>
        </div>
      </div>
    );
  };

  if (error && !config) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Settings</h3>
        <p className="text-red-700 mb-6">{error}</p>
        <button
          onClick={loadConfig}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected || config?.connected;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">WhatsApp Business</h1>
            <p className="text-green-100 text-lg">
              Connect your WhatsApp number using Meta's official Cloud API
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
            <Phone className="h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Connection Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Card */}
      {isConnected ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="bg-green-500 rounded-full p-2">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  WhatsApp Connected Successfully
                </h3>
                <p className="text-sm text-green-700">
                  Your WhatsApp Business number is active and ready to send and receive messages.
                </p>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="p-6 space-y-6">
            {/* Phone Number Display */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Your WhatsApp Business Number</p>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {connectionStatus?.displayNumber || config?.displayNumber || 'Not Available'}
                    </span>
                  </div>
                  {connectionStatus?.businessName && (
                    <p className="text-sm text-gray-600 mt-2">
                      Business: <span className="font-medium">{connectionStatus.businessName}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    const number = connectionStatus?.displayNumber || config?.displayNumber || '';
                    navigator.clipboard.writeText(number);
                    alert('Phone number copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Copy Number
                </button>
              </div>
            </div>

            {/* Connection Info Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-900">Active</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">WABA ID</p>
                <p className="text-sm font-mono text-gray-900">
                  {(connectionStatus?.wabaId || config?.wabaId || '').substring(0, 12)}...
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Connected</p>
                <p className="text-sm text-gray-900">
                  {connectionStatus?.connectedAt
                    ? new Date(connectionStatus.connectedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    Change Number
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Not Connected State */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Connect Your WhatsApp Number
              </h2>
              <p className="text-gray-700 mb-6">
                Use Meta's official Embedded Signup to connect your WhatsApp Business number in just 2 clicks. 
                Secure, instant, and fully managed by Meta.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-6 w-6" />
                    Connect WhatsApp Number
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Why Connect WhatsApp?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Instant Setup</h4>
                  <p className="text-sm text-gray-600">
                    Connect in 2 clicks using Meta's official OAuth. No manual API keys required.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Secure & Official</h4>
                  <p className="text-sm text-gray-600">
                    Direct integration with Meta's Cloud API. Your credentials never leave Meta's servers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Phone className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Your Number</h4>
                  <p className="text-sm text-gray-600">
                    Use your own WhatsApp Business number. Full ownership and control.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Meta WhatsApp Pricing (India)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Marketing</p>
                <p className="text-xl font-bold text-gray-900">₹0.88</p>
                <p className="text-xs text-gray-500 mt-1">per conversation</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Utility</p>
                <p className="text-xl font-bold text-gray-900">₹0.44</p>
                <p className="text-xs text-gray-500 mt-1">per conversation</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Authentication</p>
                <p className="text-xl font-bold text-gray-900">₹0.33</p>
                <p className="text-xs text-gray-500 mt-1">per conversation</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Service</p>
                <p className="text-xl font-bold text-gray-900">₹0.44</p>
                <p className="text-xs text-gray-500 mt-1">per conversation</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              First 1,000 conversations per month are <span className="font-semibold text-green-600">FREE</span>
            </p>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 rounded-lg p-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-700 mb-3">
              Learn more about Meta's WhatsApp Business Platform and how to get started.
            </p>
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View Meta Documentation
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
