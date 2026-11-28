import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../lib/api';
import { persistLoginResponse, type LoginResponse } from '../lib/auth';

interface InvitationPreview {
  clinicName: string;
  invitedEmail: string;
  roles: string[];
  expiresAt: string;
}

const AcceptInvitationPage = () => {
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setError('This invitation link is missing its secure token.');
      setLoading(false);
      return;
    }
    api.post<InvitationPreview>('/api/team/invitations/inspect', { token })
      .then(({ data }) => {
        if (active) setPreview(data);
      })
      .catch((inspectError) => {
        if (active) setError(getApiErrorMessage(inspectError, 'This invitation is invalid or has expired.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const acceptInvitation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!preview) return;
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post<LoginResponse>('/api/team/invitations/accept', {
        token,
        displayName,
        password,
      });
      persistLoginResponse(data);
      const roles = data.memberships?.find((membership) => membership.tenantId === data.tenantId)?.roles || [];
      const doctorOnly = roles.includes('DOCTOR') && !roles.includes('ADMIN') && !roles.includes('RECEPTIONIST');
      navigate(doctorOnly ? '/appointments' : '/dashboard', { replace: true });
    } catch (acceptError) {
      setError(getApiErrorMessage(acceptError, 'Could not accept this invitation.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <Link to="/" className="text-sm font-semibold text-blue-700">Bookzi</Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Accept clinic invitation</h1>
        {loading ? (
          <p className="mt-4 text-sm text-gray-600">Checking invitation…</p>
        ) : preview ? (
          <>
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="font-medium text-gray-900">{preview.clinicName}</p>
              <p className="mt-1 text-sm text-gray-700">Invited account: {preview.invitedEmail}</p>
              <p className="mt-1 text-sm text-gray-700">Roles: {preview.roles.join(', ')}</p>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              This invitation is tied to the email shown above. If you already have a Bookzi account with this email, use its existing password. If this email is new to Bookzi, choose a password with at least 12 characters. Ask the clinic admin to resend the invitation if the email is incorrect.
            </p>
            <form onSubmit={acceptInvitation} className="mt-5 space-y-4">
              <div>
                <label htmlFor="invite-display-name" className="mb-1 block text-sm font-medium text-gray-700">Your name</label>
                <input id="invite-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" autoComplete="name" />
              </div>
              <div>
                <label htmlFor="invite-password" className="mb-1 block text-sm font-medium text-gray-700">Password for this invited email *</label>
                <input
                  id="invite-password"
                  type="password"
                  required
                  minLength={1}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  autoComplete="new-password"
                />
              </div>
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {submitting ? 'Joining clinic…' : 'Accept invitation'}
              </button>
            </form>
          </>
        ) : (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error || 'This invitation is invalid or has expired.'}
          </div>
        )}
      </section>
    </main>
  );
};

export default AcceptInvitationPage;
