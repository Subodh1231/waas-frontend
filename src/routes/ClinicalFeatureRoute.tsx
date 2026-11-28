import { Navigate } from 'react-router-dom';
import { hasClinicRole } from '../lib/auth';
import { clinicalFeatureEnabled } from '../lib/clinical';

interface ClinicalFeatureRouteProps {
  children: React.ReactNode;
}

const ClinicalFeatureRoute = ({ children }: ClinicalFeatureRouteProps) => {
  const canUseClinicalFeatures = clinicalFeatureEnabled
    && hasClinicRole('DOCTOR')
    && !hasClinicRole('RECEPTIONIST');
  return canUseClinicalFeatures ? <>{children}</> : <Navigate to="/appointments" replace />;
};

export default ClinicalFeatureRoute;
