import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatsPage = lazy(() => import('./pages/ChatsPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Setup route - protected but outside DashboardLayout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/setup" element={<SetupPage />} />
          </Route>

          {/* Protected routes with Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chats" element={<ChatsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
