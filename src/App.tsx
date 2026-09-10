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
const PatientsPage = lazy(() => import('./pages/PatientsPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WhatsAppCallbackPage = lazy(() => import('./pages/WhatsAppCallbackPage'));
const PublicClinicPage = lazy(() => import('./pages/PublicClinicPage'));

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

          {/* Public patient booking page - bookzi.in/c/{slug} */}
          <Route path="/c/:slug" element={<PublicClinicPage />} />

          {/* Setup route - protected but outside DashboardLayout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/settings/whatsapp/callback" element={<WhatsAppCallbackPage />} />
          </Route>

          {/* Protected routes with Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chats" element={<ChatsPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/services" element={<ServicesPage />} />
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
