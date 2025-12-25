import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleEmbeddedSignupCallback } from '../lib/api';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function WhatsAppCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting your WhatsApp number...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check if user denied access
    if (error) {
      setStatus('error');
      setMessage('Connection Cancelled');
      setErrorDetails(
        errorDescription || 
        'You cancelled the WhatsApp connection. No changes have been made to your account.'
      );
      return;
    }

    // Validate required parameters
    if (!code || !state) {
      setStatus('error');
      setMessage('Invalid Callback');
      setErrorDetails('Missing authorization code or state parameter. Please try connecting again.');
      return;
    }

    try {
      setMessage('Exchanging authorization code...');
      
      const response = await handleEmbeddedSignupCallback({ code, state });

      if (response.success) {
        setStatus('success');
        setMessage('WhatsApp Connected Successfully!');
        
        // Show success for 2 seconds, then redirect
        setTimeout(() => {
          navigate('/settings?tab=whatsapp&connected=true', { replace: true });
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Connection Failed');
        setErrorDetails(response.error || 'An unknown error occurred during the connection process.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Connection Failed');
      setErrorDetails(
        err.response?.data?.message || 
        err.message || 
        'Failed to complete WhatsApp connection. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        {status === 'processing' && (
          <div className="text-center">
            <RefreshCw className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing...</h2>
            <p className="text-gray-600">{message}</p>
            <div className="mt-6">
              <div className="animate-pulse flex flex-col space-y-2">
                <div className="h-2 bg-blue-200 rounded"></div>
                <div className="h-2 bg-blue-200 rounded w-5/6"></div>
                <div className="h-2 bg-blue-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ Your WhatsApp Business number is now connected and ready to use.
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-4">Redirecting you to settings...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
            {errorDetails && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-red-800">{errorDetails}</p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/settings?tab=whatsapp', { replace: true })}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Return to Settings
              </button>
              <button
                onClick={handleCallback}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
