import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, Bell, BarChart, CheckCircle, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur w-full">
        <div className="w-full px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Bookzi</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/onboarding')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Complete Clinic Management
            <br />
            <span className="text-blue-600">OS for Modern Healthcare</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            End-to-end appointment booking, patient management, and clinic operations.
            Accept bookings from WhatsApp, web, and manual entry - all in one powerful platform.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-gray-400 font-semibold text-lg transition-colors"
            >
              Sign In
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required · Setup in under 10 minutes
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          All-in-One Clinic Operating System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Smart Appointment System
            </h3>
            <p className="text-gray-600">
              Calendar and list views, weekly/monthly scheduling, slot management,
              and availability controls. Perfect for desktop clinic operations.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              WhatsApp Integration
            </h3>
            <p className="text-gray-600">
              AI-powered WhatsApp bot for 24/7 appointment booking. Patients book
              in their language via chat - fully automated with smart scheduling.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Patient Management
            </h3>
            <p className="text-gray-600">
              Complete patient database with contact info, appointment history,
              and analytics. Search, filter, and manage all patient data in one place.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Automated Reminders
            </h3>
            <p className="text-gray-600">
              24-hour and 2-hour WhatsApp reminders sent automatically. Reduce
              no-shows by up to 70% and keep your schedule optimized.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Services & Staff Management
            </h3>
            <p className="text-gray-600">
              Manage services, pricing, duration, and provider availability. Set up
              multiple staff members with individual schedules and specializations.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Real-time Analytics
            </h3>
            <p className="text-gray-600">
              Track appointments, patients, booking sources (WhatsApp/Web/Manual),
              and clinic performance. Dashboard designed for desktop clinic operations.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="w-full px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Start Your Free Trial Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            30-day free trial · No credit card required · Cancel anytime
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-lg transition-colors shadow-lg"
          >
            Get Started in 10 Minutes
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 w-full">
        <div className="w-full px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="text-lg font-semibold text-gray-800 mb-2">Need Help?</p>
            <p className="mb-2">
              Contact us at{' '}
              <a 
                href="mailto:admin@bookzi.in" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                admin@bookzi.in
              </a>
            </p>
            <p className="text-sm text-gray-500 mb-4">We typically respond within 24 hours</p>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="font-medium text-gray-800">© 2025 Bookzi. All rights reserved.</p>
              <p className="text-sm mt-2">
                Complete Clinic Operating System · Appointment Management · WhatsApp Integration
              </p>
              <div className="mt-4 space-x-4">
                <button
                  onClick={() => navigate('/privacy-policy')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Privacy Policy
                </button>
                <span className="text-gray-400">·</span>
                <button
                  onClick={() => navigate('/terms')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
