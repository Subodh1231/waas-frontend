import { Link } from 'react-router-dom';
import { ChevronLeft, Copy, QrCode, Share2 } from 'lucide-react';

const HelpPatientBookingPage = () => {
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
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Patient booking</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Patient Booking & QR Guide</h1>
          <p className="mt-3 text-gray-600">
            Every clinic can share a public booking page so patients can book without calling the reception desk. The current Bookzi app supports this through a clinic-specific URL and QR code.
          </p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">What the public booking page is</h2>
              <p className="mt-2 text-gray-600">
                Bookzi creates a public clinic page for each clinic using a slug. Patients can open this page directly in a browser to choose a doctor, service, date, and available time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Where to find the booking URL</h2>
              <p className="mt-2 text-gray-600">
                In the app, open <span className="font-medium text-gray-900">Settings → Booking Page</span>. Bookzi displays the clinic URL and the QR code that can be copied or downloaded.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">How patients use it</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-600">
                <li>Open the clinic booking page.</li>
                <li>Select a doctor.</li>
                <li>Choose a service.</li>
                <li>Select a date and available slot.</li>
                <li>Enter name and phone number.</li>
                <li>Submit the booking request.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">How the QR code works</h2>
              <p className="mt-2 text-gray-600">
                Scanning the QR code opens the clinic’s public booking page directly. This is helpful for reception desks, waiting rooms, prescriptions, or places where patients can quickly access booking without typing a link.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Recommended places to display it</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  'Reception desk',
                  'Clinic entrance',
                  'Waiting room',
                  'Prescription',
                  'Visiting card',
                  'Invoice',
                  'Website',
                  'Instagram or social posts',
                  'Google Business profile link',
                  'WhatsApp messages sent manually by the clinic',
                ].map((place) => (
                  <div key={place} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {place}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Patient journey</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">QR / booking URL</span>
                <span className="text-gray-400">→</span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Clinic page</span>
                <span className="text-gray-400">→</span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Doctor / service</span>
                <span className="text-gray-400">→</span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Date</span>
                <span className="text-gray-400">→</span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Available slot</span>
                <span className="text-gray-400">→</span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Patient info</span>
                <span className="text-gray-400">→</span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Confirmation</span>
                <span className="text-gray-400">→</span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Receptionist dashboard</span>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center gap-3">
                <QrCode className="h-5 w-5 text-blue-700" />
                <h2 className="text-lg font-semibold text-blue-900">No app installation required</h2>
              </div>
              <p className="mt-2 text-sm text-blue-900/80">
                In the current app, patients can use the public booking page directly in a browser without any Bookzi app installation. This is the exact messaging used in the clinic settings flow.
              </p>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Simple actions for clinic teams</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 border border-gray-200">
                  <Copy className="h-4 w-4" />
                  Copy URL
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 border border-gray-200">
                  <QrCode className="h-4 w-4" />
                  Download QR
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 border border-gray-200">
                  <Share2 className="h-4 w-4" />
                  Share link
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPatientBookingPage;
