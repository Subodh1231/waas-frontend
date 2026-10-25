import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  HelpCircle,
  MessageSquareText,
  Search,
  Stethoscope,
  Users,
} from 'lucide-react';
import { getAuthToken } from '../lib/auth';

const helpCards = [
  {
    title: 'Getting Started',
    summary: 'Setup checklist for clinic owners and admins who are launching Bookzi for the first time.',
    route: '/help/getting-started',
    icon: BookOpen,
  },
  {
    title: 'Receptionist Daily Guide',
    summary: 'The practical 10-minute playbook for booking, rescheduling, canceling, and patient search.',
    route: '/help/receptionist',
    icon: ClipboardCheck,
  },
  {
    title: 'Patient Booking & QR',
    summary: 'How the public clinic booking page, QR code, and patient journey work in the current app.',
    route: '/help/patient-booking',
    icon: MessageSquareText,
  },
  {
    title: 'Appointments',
    summary: 'How appointments are tracked, updated, and managed from the Bookzi dashboard.',
    route: '/help/appointments',
    icon: CalendarCheck2,
  },
  {
    title: 'Doctors, Services & Schedules',
    summary: 'The current setup flow for doctors, services, consultation types, and working hours.',
    route: '/help/getting-started',
    icon: Stethoscope,
  },
  {
    title: 'Patients',
    summary: 'How patient records are created and searched when a receptionist handles booking or follow-up.',
    route: '/help/receptionist',
    icon: Users,
  },
];

const HelpCenterPage = () => {
  const [search, setSearch] = useState('');
  const hasSession = Boolean(getAuthToken());

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return helpCards;

    return helpCards.filter((card) =>
      `${card.title} ${card.summary}`.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex justify-end">
          <Link
            to={hasSession ? '/dashboard' : '/'}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {hasSession ? 'Back to Bookzi dashboard' : 'Back to Bookzi home'}
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <HelpCircle className="w-4 h-4" />
                Bookzi Help Center
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything to run a clinic smoothly
              </h1>
              <p className="mt-3 max-w-2xl text-base text-gray-600">
                This help center reflects the current Bookzi app: setup, patient booking, QR sharing, appointments, and receptionist workflows.
              </p>
            </div>

            <div className="w-full max-w-md">
              <label className="sr-only">Search help articles</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search help topics"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCards.length > 0 ? (
            filteredCards.map(({ title, summary, route, icon: Icon }) => (
              <Link
                key={title}
                to={route}
                className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{summary}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
                  Open guide
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
              No matching help articles found for “{search}”.
            </div>
          )}
        </div>

        <div className="mt-10 rounded-2xl bg-blue-600 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-blue-100">Quick start</p>
              <h2 className="mt-1 text-2xl font-bold">Launch a clinic in a few steps</h2>
            </div>
            <Link
              to="/help/getting-started"
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Start setup guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
