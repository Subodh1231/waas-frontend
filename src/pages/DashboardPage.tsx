import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Copy, ExternalLink, Loader2, CalendarDays, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getApiErrorMessage, getClinicReadiness, type ClinicReadiness } from '../lib/api';
import api from '../lib/api';

interface DashboardBooking {
  id: string;
  customerName: string;
  serviceName: string;
  dateTime: string;
  status: string;
  providerName?: string;
}

const DashboardPage = () => {
  const [readiness, setReadiness] = useState<ClinicReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [todayBookings, setTodayBookings] = useState<DashboardBooking[]>([]);
  const [todayBookingsLoading, setTodayBookingsLoading] = useState(true);
  const [todayBookingsError, setTodayBookingsError] = useState('');

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

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const loadTodayBookings = async () => {
      try {
        const response = await api.get<{
          status: string;
          bookingsByDate?: Record<string, DashboardBooking[]>;
        }>('/api/bookings/calendar', { params: { startDate: today, endDate: today } });
        if (response.data.status !== 'success') {
          throw new Error('The appointments response was not successful.');
        }
        setTodayBookings(response.data.bookingsByDate?.[today] || []);
      } catch (err: unknown) {
        setTodayBookingsError(getApiErrorMessage(err, 'Could not load today’s appointments.'));
      } finally {
        setTodayBookingsLoading(false);
      }
    };
    void loadTodayBookings();
  }, []);

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
      <main className="h-full overflow-y-auto bg-gray-50 px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-8">
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
    <main className="h-full overflow-y-auto bg-gray-50 px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/appointments?new=1" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> New appointment
        </Link>
      </div>

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
                <li key={task.key} className="flex flex-col items-start gap-3 py-4 sm:flex-row">
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
                    className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <section aria-labelledby="today-appointments-title" className="mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 id="today-appointments-title" className="text-lg font-semibold text-gray-900">Today’s appointments</h2>
          </div>
          <Link to="/appointments" className="min-h-11 inline-flex items-center font-semibold text-blue-700 hover:underline">View schedule</Link>
        </div>
        {todayBookingsLoading ? (
          <p className="mt-4 text-sm text-gray-500">Loading today’s schedule…</p>
        ) : todayBookingsError ? (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{todayBookingsError}</p>
        ) : todayBookings.length === 0 ? (
          <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No appointments scheduled for today.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {todayBookings
              .filter((booking) => booking.status !== 'CANCELLED')
              .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
              .map((booking) => (
                <li key={booking.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{booking.customerName || 'Patient'}</p>
                    <p className="text-sm text-gray-600">{booking.serviceName}{booking.providerName ? ` · ${booking.providerName}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{new Date(booking.dateTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{booking.status}</span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;
