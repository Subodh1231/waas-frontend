import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const HelpReceptionistPage = () => {
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
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Receptionist guide</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Receptionist Quick Start Guide</h1>
          <p className="mt-3 text-gray-600">
            This page is for the everyday clinic workflow: looking up patients, creating appointments, and managing the day from the Bookzi dashboard.
          </p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">Start of day</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-600">
                <li>Open Bookzi and log in.</li>
                <li>Go to the <span className="font-medium text-gray-900">Appointments</span> section.</li>
                <li>Review the schedule for today and follow the appointment status shown in the list and calendar views.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Phone booking</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-600">
                <li>Search for the patient in the <span className="font-medium text-gray-900">Patients</span> section by name or phone.</li>
                <li>If the patient is not already in the system, create a new patient record.</li>
                <li>Open <span className="font-medium text-gray-900">Appointments</span> and create a booking.</li>
                <li>Select the doctor, choose the date and time, and confirm the booking.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Walk-in patient</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-600">
                <li>Search or create the patient in the patient list.</li>
                <li>Choose the correct service and doctor.</li>
                <li>Create a booking from the appointment screen.</li>
                <li>Update the appointment status if the clinic uses status tracking in the dashboard.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Online or QR booking</h2>
              <p className="mt-2 text-gray-600">
                Patients may book from the clinic’s public booking page or by scanning the QR code shared from the <span className="font-medium text-gray-900">Settings → Booking Page</span> section. Once the patient completes the booking, the appointment appears in the dashboard for review.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Reschedule</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-600">
                <li>Open the appointment in the dashboard.</li>
                <li>Select a new slot or date.</li>
                <li>Save the update.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Cancel</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-600">
                <li>Open the appointment.</li>
                <li>Use the cancel action.</li>
                <li>Provide a reason if the workflow requires it.</li>
              </ol>
            </section>

            <section id="patient-search">
              <h2 className="text-xl font-semibold text-gray-900">Patient search</h2>
              <p className="mt-2 text-gray-600">
                Use the Patients section to quickly find a patient by name or phone number. This is the fastest way to confirm past visits or create a new appointment without repeating data entry.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpReceptionistPage;
