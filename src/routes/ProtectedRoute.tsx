import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated, isTokenExpired, getOnboardingStatus } from '../lib/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * ProtectedRoute component - Ensures user is authenticated before rendering children
 * 
 * Requirements:
 * - If not authenticated, redirect to /login
 * - If token is expired, redirect to /login
 * - If onboarding incomplete and trying to access dashboard routes, redirect to /setup
 * - Otherwise, render children or <Outlet />
 * 
 * @param children - Optional child components to render when authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Not authenticated - redirect to login
    return <Navigate to="/login" replace />;
  }

  // Check if token is expired
  if (isTokenExpired()) {
    // Token expired - redirect to login
    return <Navigate to="/login" replace />;
  }

  // Check onboarding status
  const onboardingStatus = getOnboardingStatus();
  const isOnSetupPage = location.pathname === '/setup';
  const isDashboardRoute = ['/dashboard', '/chats', '/customers', '/services', '/availability', '/appointments', '/settings'].includes(location.pathname);

  // If onboarding is not completed and trying to access dashboard routes, redirect to setup
  if (onboardingStatus !== 'COMPLETED' && isDashboardRoute) {
    return <Navigate to="/setup" replace />;
  }

  // If onboarding is completed and on setup page, redirect to dashboard
  if (onboardingStatus === 'COMPLETED' && isOnSetupPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and token is valid
  // Render children if provided, otherwise render <Outlet /> for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
