import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Check,
  ClipboardCheck,
  Clock3,
  QrCode,
  Stethoscope,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur w-full">
        <div className="w-full px-4 sm:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Bookzi</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <a href="#how-it-works" className="hidden px-3 py-2 text-gray-700 hover:text-gray-900 font-medium md:inline-flex">
                How it works
              </a>
              <a href="#features" className="hidden px-3 py-2 text-gray-700 hover:text-gray-900 font-medium md:inline-flex">
                Features
              </a>
              <a href="#faq" className="hidden px-3 py-2 text-gray-700 hover:text-gray-900 font-medium lg:inline-flex">
                FAQ
              </a>
              <button
                onClick={() => navigate('/help')}
                className="hidden px-3 py-2 text-gray-700 hover:text-gray-900 font-medium sm:inline-flex"
              >
                Help
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/onboarding')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors sm:px-6"
              >
                Start free pilot
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full px-4 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <QrCode className="h-4 w-4" />
              DIGITAL FRONT DESK FOR CLINICS
            </p>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Give your clinic a simple <span className="text-blue-600">digital front desk.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600 sm:mt-6 sm:text-lg sm:leading-8">
              Patients book through your clinic’s page or QR code. Your receptionist handles online,
              phone, and walk-in appointments in the same Bookzi workflow.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <button
                onClick={() => navigate('/onboarding')}
                className="rounded-lg bg-blue-600 px-7 py-4 text-center text-lg font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
              >
                Start your free pilot
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-7 py-4 text-center text-lg font-semibold text-gray-700 transition-colors hover:border-gray-400"
              >
                See how it works <ArrowRight className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Pilot basis · Email verification required
            </p>
          </div>

          {/* Illustrative preview of both real booking paths; sample details are not a live clinic. */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-100 to-indigo-100 blur-xl" />
            <div className="relative rounded-[1.75rem] border border-gray-200 bg-white p-4 shadow-2xl sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Your clinic gets</p>
                  <p className="mt-1 font-semibold text-gray-900">A booking page + QR code</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Illustrative preview</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Stethoscope className="h-4 w-4 text-blue-600" /> Patient booking page
                  </div>
                  <p className="mt-3 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-medium text-blue-800">bookzi.in/c/your-clinic</p>
                  <div className="mt-3 space-y-2 text-xs text-gray-700">
                    <p className="rounded-md bg-white px-3 py-2">Choose doctor and service</p>
                    <p className="rounded-md bg-white px-3 py-2">Select a date and available slot</p>
                    <p className="rounded-md bg-white px-3 py-2">Enter name and phone</p>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Patients book in a browser—no app installation.</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-3">
                  <QRCodeSVG value="https://bookzi.in/c/your-clinic" size={112} level="M" aria-label="Illustrative QR code for a sample clinic URL" />
                  <p className="mt-2 text-center text-xs font-semibold text-gray-800">Scan to book</p>
                  <p className="mt-1 text-center text-[10px] leading-4 text-gray-500">Example QR—not a live clinic</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Calendar className="h-4 w-4 text-indigo-600" /> Receptionist appointment view
                  </div>
                  <span className="text-xs text-gray-500">Shared Bookzi workflow</span>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                  <span className="text-gray-800">Patient · Online booking</span><span className="font-medium text-green-700">Confirmed</span>
                  <span className="text-gray-800">Patient · Phone / walk-in</span><span className="font-medium text-blue-700">Added by staff</span>
                </div>
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-gray-500">Bookzi checks appointment availability when a booking is created. Sample URL and appointment details shown for illustration.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two entry paths meet in the same appointment workflow. */}
      <section className="w-full px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">One clinic · one appointment workflow</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">Patients book online. Your receptionist stays in control.</h2>
            <p className="mt-4 text-gray-600">Both routes create appointments in the same Bookzi system, which checks the selected provider’s schedule for time conflicts.</p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <QrCode className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Patient booking</h3>
              </div>
              <p className="mt-4 leading-7 text-gray-600">Scan QR or open link <span className="mx-1 text-blue-500">→</span> choose doctor and service <span className="mx-1 text-blue-500">→</span> choose date and available slot <span className="mx-1 text-blue-500">→</span> enter name and phone</p>
            </article>
            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-indigo-600" />
                <h3 className="text-xl font-semibold text-gray-900">Receptionist booking</h3>
              </div>
              <p className="mt-4 leading-7 text-gray-600">Phone call or walk-in <span className="mx-1 text-indigo-500">→</span> find or add patient <span className="mx-1 text-indigo-500">→</span> choose doctor, service, and time <span className="mx-1 text-indigo-500">→</span> create appointment</p>
            </article>
          </div>
          <div className="mx-auto mt-6 max-w-xl rounded-xl bg-blue-600 px-5 py-4 text-center font-semibold text-white">
            One appointment system · availability checked when appointments are created
          </div>
        </div>
      </section>

      {/* Demonstrate the actual clinic setup and patient-to-clinic journey. */}
      <section id="how-it-works" className="w-full scroll-mt-8 bg-white px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Simple clinic booking flow</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">Set up, share, manage</h2>
            <p className="mt-4 text-gray-600">A practical path from clinic setup to a patient booking in your appointment workspace.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { number: '01', title: 'Set up your clinic', text: 'Create your account, verify your email, then add clinic details, doctors, consultation services, and working hours.', icon: Stethoscope },
              { number: '02', title: 'Share your page', text: 'Find your clinic-specific booking URL in Settings. Copy the link or download its QR code to share with patients.', icon: QrCode },
              { number: '03', title: 'Manage appointments', text: 'Patients submit their details and see a booking confirmation. The appointment is added to the same Bookzi workflow your team uses.', icon: Calendar },
            ].map(({ number, title, text, icon: Icon }) => (
              <article key={number} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Icon className="h-6 w-6" /></div>
                  <span className="text-3xl font-bold text-blue-100">{number}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 leading-7 text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <article className="rounded-2xl border border-blue-100 bg-blue-50 p-7 sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><Stethoscope className="h-6 w-6" /></div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900">Your clinic gets its own booking page</h2>
            <p className="mt-3 leading-7 text-gray-700">
              Give patients one simple place to see your clinic details, doctors, services, and available appointments—without installing another app.
            </p>
            <div className="mt-5 rounded-xl border border-blue-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Example clinic booking URL</p>
              <p className="mt-2 break-all font-semibold text-blue-700">bookzi.in/c/dr-sharma-dental</p>
              <p className="mt-2 text-xs text-gray-500">Example format only—not a live clinic page.</p>
            </div>
            <p className="mt-4 text-sm text-gray-600">It’s a clinic booking page, not a replacement for a full clinic website.</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <div className="mx-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <QRCodeSVG value="https://bookzi.in/c/dr-sharma-dental" size={156} level="M" aria-label="Illustrative QR code for a sample clinic booking URL" />
                <p className="mt-2 text-center text-xs font-semibold text-gray-800">Scan to book</p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">QR code for your clinic page</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">Put your booking link where your patients already are.</h2>
                <p className="mt-3 leading-7 text-gray-600">
                  Download the QR code from Settings → Booking Page, or share your clinic link. Scanning opens the clinic page; patients choose a slot and submit their details.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium text-gray-700">
                  {['Reception desk', 'Prescription', 'Visiting card', 'WhatsApp', 'Website', 'Social media'].map((place) => (
                    <span key={place} className="rounded-full bg-gray-100 px-3 py-2">{place}</span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-gray-500">Illustrative QR—encodes the sample URL above, not a live clinic.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="w-full px-4 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">For your front desk</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Your receptionist stays in control.</h2>
            <p className="mt-4 leading-7 text-gray-600">Bookzi doesn’t replace your receptionist. It gives your team a place to create appointments for calls and walk-ins, see online bookings, and keep the clinic schedule organized.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              'View appointments in calendar or list views',
              'Create appointments for phone calls and walk-ins',
              'Find patients by name, phone, or email',
              'Update appointment status or cancel with a reason',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                <Check className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Current product capabilities, phrased as specific clinic tasks. */}
      <section id="features" className="w-full bg-white px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">The day-to-day essentials</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">Keep the online booking path connected to the work your clinic team already does.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 md:col-span-3">
              <Calendar className="h-7 w-7 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Get patients booked—and manage every appointment</h3>
              <p className="mt-2 text-gray-600">Online bookings and appointments created by reception for phone calls or walk-ins appear in the same Bookzi appointment workflow. Bookzi checks for existing provider-time conflicts when an appointment is created.</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-white p-6">
              <Users className="h-7 w-7 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Find patient records</h3>
              <p className="mt-2 text-gray-600">Search patient records by name, phone, or email and review appointment-related information.</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-white p-6 md:col-span-2">
              <ClipboardCheck className="h-7 w-7 text-green-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Set up doctors, services, and schedules</h3>
              <p className="mt-2 text-gray-600">Configure doctors, bookable services, service durations, and working hours that determine the availability shown to patients.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="w-full bg-blue-50 px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Who it’s for</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">Built for appointment-driven clinics</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">Bookzi is intended for clinics that coordinate appointments with a small team—such as dental, dermatology, and physiotherapy practices.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {['Dental clinics', 'Dermatology clinics', 'Physiotherapy clinics', 'Small multi-doctor clinics'].map((clinicType) => (
              <span key={clinicType} className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-gray-700">{clinicType}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="w-full scroll-mt-8 px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Common questions</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Before you get started</h2>
          </div>
          <div className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white px-5 sm:px-7">
            {[
              { question: 'Does a patient need to install an app?', answer: 'No. Patients open the clinic booking page in a web browser from the clinic link or QR code.' },
              { question: 'Does my clinic get its own booking page?', answer: 'After clinic setup, the clinic has a clinic-specific URL. The page can show clinic details, doctors, and services enabled for online booking.' },
              { question: 'What does a patient do to book?', answer: 'The patient chooses a doctor, service, date, and available slot, then enters their name and phone number. The page displays a booking confirmation after submission.' },
              { question: 'What happens if a patient calls the clinic instead?', answer: 'Your receptionist can create the appointment directly in Bookzi. Online, phone, and walk-in appointments are managed in the same appointment workflow.' },
              { question: 'Does Bookzi check for overlapping appointments?', answer: 'When an appointment is created, Bookzi checks existing appointments for a time conflict with that provider. This check applies to online and receptionist-created bookings.' },
              { question: 'Can multiple doctors use Bookzi?', answer: 'The clinic setup and public booking flow support multiple doctors. Each doctor needs the relevant details and availability configured.' },
              { question: 'Can I cancel an appointment?', answer: 'Clinic staff can cancel eligible appointments from appointment details and provide a cancellation reason. Patient self-cancellation is not part of the current public booking flow.' },
              { question: 'How do I get the clinic QR code?', answer: 'Open Settings → Booking Page to copy the clinic URL or download the QR code image.' },
            ].map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 marker:hidden">
                  <span className="flex items-center justify-between gap-4">{question}<span className="text-xl text-blue-600 transition-transform group-open:rotate-45">+</span></span>
                </summary>
                <p className="mt-3 max-w-3xl leading-7 text-gray-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Pilot CTA */}
      <section className="w-full px-4 py-16 sm:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-7 text-center text-white sm:p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to give your clinic a simpler way to manage appointments?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90 sm:text-xl">
            Start your free pilot and get your clinic booking page + QR code.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-lg transition-colors shadow-lg"
          >
            Start Your Free Pilot
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 w-full">
        <div className="w-full px-4 py-8 sm:px-8">
          <div className="text-center text-gray-600">
            <p className="text-lg font-semibold text-gray-800 mb-2">Need Help?</p>
            <p className="mb-2">
              Contact us at{' '}
              <a 
                href="mailto:admin@bookzi.in" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                admin@bookzi.in
              </a>
            </p>
            <p className="text-sm text-gray-500 mb-4">Questions about getting started? Contact the Bookzi team.</p>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="font-medium text-gray-800">© {new Date().getFullYear()} Bookzi. All rights reserved.</p>
              <p className="text-sm mt-2">Online clinic booking · Appointment management · Patient records</p>
              <div className="mt-4 space-x-4">
                <button
                  onClick={() => navigate('/privacy-policy')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Privacy Policy
                </button>
                <span className="text-gray-400">·</span>
                <button
                  onClick={() => navigate('/terms')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
