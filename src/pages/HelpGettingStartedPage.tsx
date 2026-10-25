import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Circle } from 'lucide-react';

const tasks = [
  'Clinic profile completed',
  'First doctor added',
  'Services configured',
  'Doctor schedule configured',
  'Receptionist can access Bookzi',
  'Public booking page verified',
  'QR code downloaded',
  'Test patient booking completed',
  'Appointment visible in clinic dashboard',
  'Clinic ready to accept bookings',
];

const HelpGettingStartedPage = () => {
  const [checked, setChecked] = useState<number[]>([]);

  const toggleTask = (index: number) => {
    setChecked((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
  };

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
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Getting started</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Clinic Setup & Go-Live Guide</h1>
          <p className="mt-3 max-w-3xl text-gray-600">
            This guide follows the real Bookzi setup flow that exists in the current app. It is designed for a clinic owner or admin who wants to go live without founder support.
          </p>

          <div className="mt-8 space-y-8">
            <section id="setup">
              <h2 className="text-xl font-semibold text-gray-900">1. Sign in and start onboarding</h2>
              <p className="mt-2 text-gray-600">
                From the landing page, use the <span className="font-medium text-gray-900">Get Started Free</span> or <span className="font-medium text-gray-900">Login</span> option. A new clinic is configured through the onboarding flow and then lands in the clinic dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">2. Complete the clinic profile</h2>
              <p className="mt-2 text-gray-600">
                In the setup flow, add the clinic address, phone number, and specialization. In the app settings area, the clinic profile can also be saved with contact information, branding, and clinic details.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Clinic name</li>
                <li>Phone number</li>
                <li>Address</li>
                <li>Specialization</li>
                <li>Clinic logo / branding if available</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">3. Add your first doctor</h2>
              <p className="mt-2 text-gray-600">
                The onboarding flow asks for doctor details such as name and qualifications. These are created as clinic staff profiles and are used later for appointment booking and scheduling.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Doctor name</li>
                <li>Qualifications</li>
                <li>Doctor is marked active for booking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">4. Configure services and consultation types</h2>
              <p className="mt-2 text-gray-600">
                Bookzi lets you define consultation types with a price and duration. The same data is also used in the services section of the clinic dashboard for ongoing updates.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Service or consultation name</li>
                <li>Price</li>
                <li>Duration</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">5. Set doctor working hours</h2>
              <p className="mt-2 text-gray-600">
                During onboarding, the app asks for working hours by day. This is the basis for patient availability in the booking flow. Bookzi supports selecting which weekdays are active and setting each day’s start and end time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">6. Publish the public booking page</h2>
              <p className="mt-2 text-gray-600">
                Once the clinic has a profile and at least one doctor/service setup, the public booking page is available from the Booking Page section in the app settings. The page is served under the clinic’s slug and opens at a URL like /c/clinic-slug in the browser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">7. Download the QR code</h2>
              <p className="mt-2 text-gray-600">
                In the <span className="font-medium text-gray-900">Settings → Booking Page</span> section, Bookzi provides a copyable booking URL and a QR code image. This is the exact flow used for sharing patient booking access with patients.
              </p>
              <p className="mt-2 text-gray-600">
                The QR code can be downloaded and printed or shared digitally. The app specifically notes that patients can book without installing any app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">8. Test a patient booking</h2>
              <p className="mt-2 text-gray-600">
                Open the public booking page in a browser, choose a doctor and service, pick a date and available slot, then enter the patient name and phone number. After booking, check the clinic dashboard under <span className="font-medium text-gray-900">Appointments</span> to confirm the appointment appears.
              </p>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-xl font-semibold text-gray-900">Go-live checklist</h2>
              <div className="mt-4 space-y-3">
                {tasks.map((task, index) => {
                  const isChecked = checked.includes(index);

                  return (
                    <button
                      key={task}
                      type="button"
                      onClick={() => toggleTask(index)}
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-left text-sm text-gray-700 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={isChecked ? 'font-medium text-gray-900 line-through decoration-2' : 'font-medium text-gray-700'}>
                        {task}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpGettingStartedPage;
