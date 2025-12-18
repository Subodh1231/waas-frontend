import { useNavigate } from 'react-router-dom';
import { getOnboardingStatus } from '../lib/auth';

const DashboardPage = () => {
  const navigate = useNavigate();
  const onboardingStatus = getOnboardingStatus();
  const isOnboardingIncomplete = onboardingStatus !== 'COMPLETED';

  return (
    <div className="p-6">
      {/* Incomplete Onboarding Banner */}
      {isOnboardingIncomplete && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800">
                Complete Your Clinic Setup
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your clinic profile is incomplete. Complete the setup to start accepting appointments.
              </p>
            </div>
            <button
              onClick={() => navigate('/setup')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold text-sm"
            >
              Complete Setup
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">Welcome to WAAS Dashboard</p>
    </div>
  );
};

export default DashboardPage;
