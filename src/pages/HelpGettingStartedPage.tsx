import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Circle, CheckCircle2 } from 'lucide-react';

const tasks = [
  'Clinic profile complete',
  'At least one active doctor or provider added',
  'At least one bookable service added',
  'Availability configured for a provider',
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
            Create your account, verify your email, then complete the setup checklist from your dashboard whenever you are ready.
          </p>

          <div className="mt-8 space-y-8">
            <section id="setup">
              <h2 className="text-xl font-semibold text-gray-900">1. Create your account</h2>
              <p className="mt-2 text-gray-600">
                Choose <span className="font-medium text-gray-900">Get Started Free</span>, enter your clinic name, email and password, and verify your email. You’ll go straight to the Bookzi dashboard; clinic setup is not a blocking wizard.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">2. Complete your clinic profile</h2>
              <p className="mt-2 text-gray-600">
                From the dashboard checklist, choose <span className="font-medium text-gray-900">Complete clinic profile</span>. Your clinic name, phone, address and specialization are required before patients can book. Logo and other branding are optional.
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
              <h2 className="text-xl font-semibold text-gray-900">3. Add a provider</h2>
              <p className="mt-2 text-gray-600">
                Choose <span className="font-medium text-gray-900">Add your first doctor</span> in the checklist. Add at least one active doctor, nurse or therapist who will take appointments. You can add qualifications and other details later.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Provider name</li>
                <li>Provider is active</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">4. Add a service</h2>
              <p className="mt-2 text-gray-600">
                Add at least one active, online-bookable service with a duration. Price is optional if it is not required by your clinic. Use the Services page to manage services later.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>Service name</li>
                <li>Duration</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">5. Set provider availability</h2>
              <p className="mt-2 text-gray-600">
                In Settings → Team & Staff, choose <span className="font-medium text-gray-900">Set Availability</span> for a provider and add at least one valid weekly time slot. Availability is provider-specific.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">6. Go live and test booking</h2>
              <p className="mt-2 text-gray-600">
                When all four checklist items are complete, Bookzi marks the clinic ready and enables the public booking page. Use <span className="font-medium text-gray-900">Make a Test Booking</span> from the dashboard to try the real patient flow.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">7. Share your booking link or QR code</h2>
              <p className="mt-2 text-gray-600">
                After your clinic is ready, open Settings → Booking Page to copy the link, download the QR code or create a booking poster. These sharing tools stay unavailable until the required clinic, provider, service and availability details are in place.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Optional setup</h2>
              <p className="mt-2 text-gray-600">
                WhatsApp, reminders, payment details, logo and additional staff are optional and do not block online booking. You can configure them later in Settings.
              </p>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-xl font-semibold text-gray-900">Go-live essentials</h2>
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
