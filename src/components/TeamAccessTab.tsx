import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Shield, Trash2, UserPlus, Users } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/api';

type ClinicRole = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR';

interface TeamMember {
  id: string;
  userId: string;
  displayName?: string;
  email: string;
  roles: ClinicRole[];
  providerId?: string;
  providerName?: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  displayName?: string;
  roles: ClinicRole[];
  providerId?: string;
  status: string;
  expiresAt: string;
}

interface Provider {
  id: string;
  name: string;
}

interface MemberForm {
  displayName: string;
  roles: ClinicRole[];
  providerId: string;
}

const roleOptions: { value: ClinicRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'DOCTOR', label: 'Doctor' },
];

const emptyForm = (): MemberForm => ({ displayName: '', roles: ['RECEPTIONIST'], providerId: '' });

const TeamAccessTab = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState<MemberForm>(emptyForm());
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState<MemberForm>(emptyForm());
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [memberResponse, invitationResponse, providerResponse] = await Promise.all([
        api.get<TeamMember[]>('/api/team/members'),
        api.get<TeamInvitation[]>('/api/team/invitations'),
        api.get<Provider[]>('/api/staff?role=DOCTOR'),
      ]);
      setMembers(memberResponse.data);
      setInvitations(invitationResponse.data);
      setProviders(providerResponse.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Could not load clinic team access.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleRole = (current: MemberForm, setCurrent: (next: MemberForm) => void, role: ClinicRole) => {
    const roles = current.roles.includes(role)
      ? current.roles.filter((item) => item !== role)
      : [...current.roles, role];
    setCurrent({ ...current, roles, providerId: roles.includes('DOCTOR') ? current.providerId : '' });
  };

  const submitInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!form.roles.length) {
      setError('Select at least one role.');
      return;
    }
    if (form.roles.includes('DOCTOR') && !form.providerId) {
      setError('Link the doctor account to a provider profile.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/team/invitations', {
        email,
        displayName: form.displayName,
        roles: form.roles,
        providerId: form.roles.includes('DOCTOR') ? form.providerId : null,
      });
      setEmail('');
      setForm(emptyForm());
      setNotice('Invitation queued. The invitee will receive an email with a secure acceptance link.');
      await load();
    } catch (inviteError) {
      setError(getApiErrorMessage(inviteError, 'Could not send invitation.'));
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({
      displayName: member.displayName || '',
      roles: member.roles,
      providerId: member.providerId || '',
    });
  };

  const saveMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingMember) return;
    setError('');
    setNotice('');
    if (editForm.roles.includes('DOCTOR') && !editForm.providerId) {
      setError('Link the doctor account to a provider profile.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/team/members/${editingMember.id}`, {
        displayName: editForm.displayName,
        roles: editForm.roles,
        providerId: editForm.roles.includes('DOCTOR') ? editForm.providerId : null,
      });
      setEditingMember(null);
      setNotice('Membership access updated.');
      await load();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, 'Could not update membership.'));
    } finally {
      setSaving(false);
    }
  };

  const deactivateMember = async (member: TeamMember) => {
    if (!window.confirm(`Deactivate ${member.displayName || member.email}'s clinic access?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/team/members/${member.id}`);
      setNotice('Clinic access deactivated.');
      await load();
    } catch (deactivateError) {
      setError(getApiErrorMessage(deactivateError, 'Could not deactivate membership.'));
    }
  };

  const resendInvitation = async (invitation: TeamInvitation) => {
    setError('');
    setNotice('');
    try {
      await api.post(`/api/team/invitations/${invitation.id}/resend`);
      setNotice('A fresh invitation link has been sent.');
      await load();
    } catch (resendError) {
      setError(getApiErrorMessage(resendError, 'Could not resend invitation.'));
    }
  };

  const revokeInvitation = async (invitation: TeamInvitation) => {
    setError('');
    try {
      await api.delete(`/api/team/invitations/${invitation.id}`);
      setNotice('Invitation revoked.');
      await load();
    } catch (revokeError) {
      setError(getApiErrorMessage(revokeError, 'Could not revoke invitation.'));
    }
  };

  const renderRolePicker = (
    current: MemberForm,
    setCurrent: (next: MemberForm) => void,
  ) => (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-gray-700">Clinic roles</legend>
      <div className="flex flex-wrap gap-3">
        {roleOptions.map((role) => (
          <label key={role.value} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={current.roles.includes(role.value)}
              onChange={() => toggleRole(current, setCurrent, role.value)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
            {role.label}
          </label>
        ))}
      </div>
    </fieldset>
  );

  const renderProviderSelect = (current: MemberForm, setCurrent: (next: MemberForm) => void) => current.roles.includes('DOCTOR') && (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Linked doctor profile *</label>
      <select
        required
        value={current.providerId}
        onChange={(event) => setCurrent({ ...current, providerId: event.target.value })}
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      >
        <option value="">Select a doctor profile</option>
        {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
      </select>
      {providers.length === 0 && <p className="mt-1 text-sm text-amber-700">Create an active doctor profile under Providers &amp; Availability first.</p>}
    </div>
  );

  if (loading) return <div className="rounded-lg bg-white p-6 text-sm text-gray-600">Loading team access…</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team &amp; Access</h2>
            <p className="mt-1 text-sm text-gray-700">Invite individual accounts and grant predefined clinic roles. Provider profiles remain managed separately. If an owner password is shared, invite individual accounts first, then rotate it under Account &amp; Security.</p>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">Invite a team member</h3>
        </div>
        <form onSubmit={submitInvite} className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="invite-name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input id="invite-name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
            <input id="invite-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div className="md:col-span-2">{renderRolePicker(form, setForm)}</div>
          <div className="md:col-span-2">{renderProviderSelect(form, setForm)}</div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Sending…' : 'Send invitation'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">Active members</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{member.displayName || member.providerName || member.email}</p>
                <p className="truncate text-sm text-gray-600">{member.email}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {member.roles.join(' · ')}{member.providerName ? ` · Provider: ${member.providerName}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => startEditing(member)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Edit access</button>
                <button type="button" onClick={() => void deactivateMember(member)} aria-label={`Deactivate ${member.email}`} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          {members.length === 0 && <p className="py-4 text-sm text-gray-500">No active members found.</p>}
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Invitations</h3>
        <div className="divide-y divide-gray-100">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{invitation.displayName || invitation.email}</p>
                <p className="truncate text-sm text-gray-600">{invitation.email}</p>
                <p className="mt-1 text-xs text-gray-500">{invitation.roles.join(' · ')} · {invitation.status.toLowerCase()}</p>
              </div>
              {invitation.status === 'PENDING' && (
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => void resendInvitation(invitation)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" /> Resend
                  </button>
                  <button type="button" onClick={() => void revokeInvitation(invitation)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Revoke</button>
                </div>
              )}
            </div>
          ))}
          {invitations.length === 0 && <p className="py-4 text-sm text-gray-500">No invitations yet.</p>}
        </div>
      </section>

      {editingMember && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditingMember(null);
        }}>
          <form onSubmit={saveMember} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-xl">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Edit member access</h3>
              <p className="text-sm text-gray-600">{editingMember.email}</p>
            </div>
            <div>
              <label htmlFor="member-display-name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input id="member-display-name" value={editForm.displayName} onChange={(event) => setEditForm({ ...editForm, displayName: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            {renderRolePicker(editForm, setEditForm)}
            {renderProviderSelect(editForm, setEditForm)}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingMember(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Save access</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamAccessTab;
