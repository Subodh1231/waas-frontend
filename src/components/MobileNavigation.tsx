import { useState } from 'react';
import { CalendarDays, Home, Menu, Plus, Users, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../lib/auth';

const moreItems = [
  { label: 'Invoices', to: '/invoices' },
  { label: 'Feedback', to: '/feedback' },
  { label: 'Services', to: '/services' },
  { label: 'Team & availability', to: '/settings?section=staff' },
  { label: 'Booking page', to: '/settings?section=booking-page' },
  { label: 'Reminders', to: '/settings?section=reminders' },
  { label: 'Settings', to: '/settings' },
  { label: 'Help', to: '/help' },
];

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = ['/invoices', '/feedback', '/services', '/settings', '/help']
    .some((path) => location.pathname.startsWith(path));

  return (
    <>
      <header className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
        <Link to="/dashboard" className="text-lg font-bold text-blue-600">Bookzi</Link>
      </header>

      {moreOpen && (
        <nav
          aria-label="More sections"
          className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 max-h-[min(70dvh,32rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl lg:hidden"
        >
          {moreItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              logout();
              setMoreOpen(false);
            }}
            className="flex min-h-11 w-full items-center rounded-lg px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Log out
          </button>
        </nav>
      )}

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <Link
          to="/dashboard"
          aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-medium ${location.pathname === '/dashboard' ? 'text-blue-700' : 'text-gray-600'}`}
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          Home
        </Link>
        <Link
          to="/appointments"
          aria-current={location.pathname === '/appointments' ? 'page' : undefined}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-medium ${location.pathname === '/appointments' ? 'text-blue-700' : 'text-gray-600'}`}
        >
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
          Appts
        </Link>
        <button
          type="button"
          onClick={() => {
            setMoreOpen(false);
            navigate('/appointments?new=1');
          }}
          className="flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          New
        </button>
        <Link
          to="/patients"
          aria-current={location.pathname.startsWith('/patients') ? 'page' : undefined}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-medium ${location.pathname.startsWith('/patients') ? 'text-blue-700' : 'text-gray-600'}`}
        >
          <Users className="h-5 w-5" aria-hidden="true" />
          Patients
        </Link>
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-label="More sections"
          className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-medium ${moreOpen || isMoreActive ? 'text-blue-700' : 'text-gray-600'}`}
        >
          {moreOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          More
        </button>
      </nav>
    </>
  );
};

export default MobileNavigation;
