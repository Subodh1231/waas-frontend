import { useState } from 'react';
import { Mail, X } from 'lucide-react';

interface SendOperationalEmailModalProps {
  title: string;
  description: string;
  initialEmail?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (recipient: string, updatePatientEmail: boolean) => Promise<void>;
}

const SendOperationalEmailModal = ({
  title,
  description,
  initialEmail,
  submitting = false,
  onClose,
  onSubmit,
}: SendOperationalEmailModalProps) => {
  const [recipient, setRecipient] = useState(initialEmail || '');
  const [updatePatientEmail, setUpdatePatientEmail] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = recipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    try {
      await onSubmit(normalizedEmail, updatePatientEmail);
    } catch (submitError: any) {
      setError(submitError.message || 'Could not queue this email. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="send-operational-email-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700"><Mail className="h-5 w-5" /></span>
            <div>
              <h2 id="send-operational-email-title" className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close email dialog" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="h-5 w-5" /></button>
        </header>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="operational-email-recipient" className="mb-1.5 block text-sm font-medium text-gray-700">Send to</label>
            <input id="operational-email-recipient" type="email" autoComplete="email" autoFocus required value={recipient} onChange={(event) => setRecipient(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="patient@example.com" />
          </div>
          {recipient.trim() && recipient.trim().toLowerCase() !== (initialEmail || '').trim().toLowerCase() && (
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={updatePatientEmail} onChange={(event) => setUpdatePatientEmail(event.target.checked)} className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
              <span>Update patient email for future communication</span>
            </label>
          )}
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Queuing…' : 'Confirm recipient & send'}</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default SendOperationalEmailModal;
