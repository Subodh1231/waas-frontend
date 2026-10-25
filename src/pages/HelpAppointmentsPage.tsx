import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const HelpAppointmentsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/help" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
            <ChevronLeft className="h-4 w-4" />
            Back to Help Center
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Appointments</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Appointment Management</h1>
          <p className="mt-3 text-gray-600">
            The current Bookzi dashboard supports viewing upcoming and past appointments, managing status, and reviewing bookings created from manual entry or the public booking page.
          </p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">Where to manage appointments</h2>
              <p className="mt-2 text-gray-600">
                Open the <span className="font-medium text-gray-900">Appointments</span> page from the Bookzi dashboard. The calendar and list views show appointments by date and provider.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Booking sources</h2>
              <p className="mt-2 text-gray-600">
                Bookzi currently exposes appointment views that differentiate between manual entries and online booking sources, including patient self-bookings from the public booking page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Status handling</h2>
              <p className="mt-2 text-gray-600">
                The appointment detail flow includes updating the appointment status and cancellation actions. This makes it possible for reception teams to manage day-of scheduling without leaving the Bookzi interface.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">What to verify when a booking is made</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-600">
                <li>The patient name and contact details are correct.</li>
                <li>The doctor and service match the booking request.</li>
                <li>The date and time appear correctly in the appointment list.</li>
                <li>The appointment is visible in the clinic dashboard after confirmation.</li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpAppointmentsPage;
