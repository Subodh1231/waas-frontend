import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailVerificationModal from '../components/EmailVerificationModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Phase 1: Email verification + clinic name only
interface ClinicDetails {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  // Email verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  const [data, setData] = useState<ClinicDetails>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const updateClinic = (clinic: Partial<ClinicDetails>) => {
    setData((prev) => ({ ...prev, ...clinic }));
  };

  // Send verification OTP
  const handleSendOTP = async () => {
    setError('');
    
    // Validate all required fields
    if (!data.name) {
      setError('Please enter clinic name');
      return;
    }
    
    if (!data.email) {
      setError('Please enter email address');
      return;
    }
    
    if (!data.password) {
      setError('Please enter password');
      return;
    }
    
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (data.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsSendingOTP(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-verification-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          formData: {
            email: data.email,
            password: data.password,
            clinic: {
              name: data.name
            }
          }
        })
      });
      
      if (response.ok) {
        setShowVerificationModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsSendingOTP(false);
    }
  };
  
  // Handle successful verification - redirect to /setup for progressive onboarding
  const handleVerified = () => {
    setShowVerificationModal(false);
    navigate('/setup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <span className="text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Bookzi</h1>
          <p className="text-gray-600 mt-2">Create your clinic account in seconds</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Clinic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinic Name *
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => updateClinic({ name: e.target.value })}
                placeholder="e.g., Dr. Sharma's Clinic"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => updateClinic({ email: e.target.value })}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => updateClinic({ password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={data.confirmPassword}
                onChange={(e) => updateClinic({ confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSendOTP}
              disabled={isSendingOTP}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                isSendingOTP
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSendingOTP ? 'Sending Code...' : 'Continue'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By continuing, you'll receive a verification code via email
            </p>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={data.email}
        onVerified={handleVerified}
      />
    </div>
  );
};

export default OnboardingPage;
