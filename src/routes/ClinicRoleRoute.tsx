import { Navigate } from 'react-router-dom';
import { getClinicRoles } from '../lib/auth';

interface ClinicRoleRouteProps {
  roles: string[];
  children: React.ReactNode;
}

const ClinicRoleRoute = ({ roles, children }: ClinicRoleRouteProps) => {
  const currentRoles = getClinicRoles();
  return roles.some((role) => currentRoles.includes(role))
    ? <>{children}</>
    : <Navigate to="/appointments" replace />;
};

export default ClinicRoleRoute;
