import { useEffect, useState } from 'react';
import api from '../lib/api';
import { getTenantId, persistLoginResponse, type ClinicMembershipSummary, type LoginResponse } from '../lib/auth';

const ClinicSwitcher = () => {
  const [memberships, setMemberships] = useState<ClinicMembershipSummary[]>([]);
  const [tenantId, setTenantId] = useState(getTenantId() || '');
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<ClinicMembershipSummary[]>('/api/auth/memberships')
      .then(({ data }) => {
        if (active) setMemberships(data);
      })
      .catch(() => {
        if (active) setError('Clinics unavailable');
      });
    return () => {
      active = false;
    };
  }, []);

  const switchClinic = async (nextTenantId: string) => {
    if (!nextTenantId || nextTenantId === tenantId) return;
    setError('');
    setSwitching(true);
    try {
      const { data } = await api.post<LoginResponse>('/api/auth/select-clinic', { tenantId: nextTenantId });
      persistLoginResponse(data);
      setTenantId(nextTenantId);
      window.location.reload();
    } catch {
      setError('Could not switch clinic');
      setSwitching(false);
    }
  };

  const selected = memberships.find((membership) => membership.tenantId === tenantId);
  if (memberships.length <= 1) {
    return (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{selected?.clinicName || 'Bookzi clinic'}</p>
        {error && <span className="sr-only" role="status">{error}</span>}
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <label className="sr-only" htmlFor="clinic-switcher">Active clinic</label>
      <select
        id="clinic-switcher"
        value={tenantId}
        disabled={switching}
        onChange={(event) => void switchClinic(event.target.value)}
        className="max-w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        {memberships.map((membership) => (
          <option key={membership.tenantId} value={membership.tenantId}>{membership.clinicName}</option>
        ))}
      </select>
      {error && <p role="status" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default ClinicSwitcher;
