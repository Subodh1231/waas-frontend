import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage, getClinicReadiness, type ClinicReadiness } from '../lib/api';

const DashboardPage = () => {
  const [readiness, setReadiness] = useState<ClinicReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const loadReadiness = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReadiness(await getClinicReadiness());
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'We could not load your clinic setup. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReadiness();
  }, [loadReadiness]);

  const copyBookingLink = async () => {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopyMessage('Booking link copied.');
    } catch {
      setCopyMessage('Could not copy the booking link. Please copy it from Settings.');
    }
  };

  const bookingUrl = readiness?.slug
    ? `${window.location.origin}/c/${readiness.slug}`
    : '';

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Loading clinic setup" />
      </div>
    );
  }

  if (error || !readiness) {
    return (
      <main className="min-h-full bg-gray-50 px-4 py-8 sm:px-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Dashboard</h1>
        <div role="alert" className="max-w-2xl rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
          <p>{error || 'Clinic setup could not be loaded.'}</p>
          <button
            type="button"
            onClick={() => void loadReadiness()}
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const tasks = [
    { key: 'clinicProfileComplete', label: 'Complete clinic profile', detail: 'Add your phone, address and specialization.', href: '/settings?section=profile' },
    { key: 'doctorConfigured', label: 'Add your first doctor', detail: 'Add the provider patients can book with.', href: '/settings?section=staff' },
    { key: 'serviceConfigured', label: 'Add a service', detail: 'Choose what patients can book.', href: '/services' },
    { key: 'availabilityConfigured', label: 'Set availability', detail: 'Choose when patients can book appointments.', href: '/settings?section=staff' },
  ] as const;
  const progress = readiness.completedSteps;

  return (
    <main className="min-h-full bg-gray-50 px-4 py-8 sm:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Dashboard</h1>

      {!readiness.bookingReady ? (
        <section aria-labelledby="setup-title" className="max-w-3xl rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Welcome to Bookzi</p>
          <h2 id="setup-title" className="mt-1 text-2xl font-bold text-gray-900">
            Get your clinic ready to accept appointments
          </h2>
          <p className="mt-2 text-gray-600">Complete these four essentials in any order. You can use the rest of Bookzi while you set things up.</p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Setup progress</span>
              <span>{progress} of {readiness.totalSteps}</span>
            </div>
            <progress
              className="h-2 w-full accent-blue-600"
              max={readiness.totalSteps}
              value={progress}
              aria-label={`Setup progress: ${progress} of ${readiness.totalSteps} complete`}
            />
          </div>

          <ul className="mt-5 divide-y divide-gray-100" aria-label="Clinic setup checklist">
            {tasks.map((task) => {
              const complete = readiness[task.key];
              return (
                <li key={task.key} className="flex items-start gap-3 py-4">
                  {complete
                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                    : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      {task.label}{complete && <span className="ml-2 text-sm font-medium text-green-700">Completed</span>}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{task.detail}</p>
                  </div>
                  <Link
                    to={task.href}
                    className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {complete ? 'Review' : task.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm text-gray-500">Usually takes only a few minutes. WhatsApp and branding are optional.</p>
        </section>
      ) : (
        <section aria-labelledby="ready-title" className="max-w-3xl rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-green-700" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 id="ready-title" className="text-2xl font-bold text-green-950">Your clinic is ready to accept appointments!</h2>
              <p className="mt-1 text-green-900">Your Bookzi booking page is ready to share with patients.</p>
              <p className="mt-4 break-all rounded-lg bg-white/70 p-3 text-sm text-gray-800">{bookingUrl || 'Your booking link is being prepared.'}</p>
              {bookingUrl && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                  >
                    Make a Test Booking <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyBookingLink()}
                    className="inline-flex items-center gap-2 rounded-lg border border-green-800 px-4 py-2 font-semibold text-green-900 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" /> Copy booking link
                  </button>
                  <Link
                    to="/settings?section=booking-page"
                    className="rounded-lg border border-green-800 px-4 py-2 font-semibold text-green-900 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    Booking page & QR
                  </Link>
                </div>
              )}
              {copyMessage && <p role="status" className="mt-3 text-sm text-green-900">{copyMessage}</p>}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default DashboardPage;
