import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, isTokenExpired } from '../lib/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * ProtectedRoute component - Ensures user is authenticated before rendering children
 * 
 * Requirements:
 * - If not authenticated, redirect to /login
 * - If token is expired, redirect to /login
 * - Otherwise, render children or <Outlet />
 * 
 * @param children - Optional child components to render when authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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

  // User is authenticated and token is valid
  // Render children if provided, otherwise render <Outlet /> for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
