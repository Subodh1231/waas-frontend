import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Bookzi</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: December 18, 2025</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Agreement */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using Bookzi's WhatsApp-based appointment booking system ("Service"), you agree to be bound by these 
              Terms of Service. If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Bookzi provides a SaaS platform that enables healthcare clinics to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Accept patient appointments via WhatsApp</li>
              <li>Manage schedules and availability</li>
              <li>Send automated appointment reminders</li>
              <li>Utilize AI-powered appointment assistance</li>
              <li>Manage patient information and communications</li>
            </ul>
          </section>

          {/* Trial and Subscription */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Free Trial and Subscription</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Free Trial:</strong> New users receive a 30-day free trial. No credit card is required to start the trial. 
              The trial includes full access to all features.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Subscription:</strong> After the trial period, continued use requires a paid subscription. We will notify 
              you before the trial ends. Subscriptions auto-renew unless cancelled.
            </p>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Accounts and Responsibilities</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining account security and confidentiality</li>
              <li>You are responsible for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>One account per clinic; sharing credentials is prohibited</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You agree NOT to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Send spam, unsolicited messages, or marketing without consent</li>
              <li>Violate any WhatsApp Business policies or regulations</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems to access the Service (except our API)</li>
              <li>Resell or redistribute the Service without permission</li>
              <li>Violate patient privacy or HIPAA regulations</li>
            </ul>
          </section>

          {/* WhatsApp Integration */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. WhatsApp Business Integration</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Use of WhatsApp integration is subject to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>WhatsApp Business Terms of Service</li>
              <li>WhatsApp Business API guidelines and policies</li>
              <li>Meta's Commerce and Business Policies</li>
              <li>Maintaining WhatsApp Business account approval</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You are responsible for compliance with WhatsApp policies. Violations may result in WhatsApp account suspension.
            </p>
          </section>

          {/* Data and Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of the Service is governed by our Privacy Policy. You acknowledge that patient data will be processed 
              according to the Privacy Policy. You are responsible for obtaining necessary patient consents for data collection 
              and processing.
            </p>
          </section>

          {/* Medical Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Medical Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              Bookzi is an appointment scheduling tool and does NOT provide medical advice, diagnosis, or treatment. The Service 
              does not replace professional medical judgment. Healthcare providers are solely responsible for patient care decisions, 
              diagnoses, and treatments.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Our Rights:</strong> The Service, including software, designs, logos, and content, is owned by Bookzi and 
              protected by intellectual property laws. You receive a limited license to use the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Your Data:</strong> You retain ownership of your data. You grant us a license to process your data to 
              provide the Service.
            </p>
          </section>

          {/* Payments and Refunds */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Payments and Refunds</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Subscription fees are billed monthly or annually in advance</li>
              <li>All fees are in Indian Rupees (INR) unless otherwise stated</li>
              <li>Price changes require 30 days notice</li>
              <li>Refunds are provided at our discretion for service issues</li>
              <li>No refunds for partial months or unused portions</li>
              <li>Failed payments may result in service suspension</li>
            </ul>
          </section>

          {/* Cancellation */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Cancellation and Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>By You:</strong> Cancel anytime from your account settings. Access continues until the end of the billing period.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>By Us:</strong> We may suspend or terminate accounts for violations of these Terms, non-payment, or illegal 
              activity. Upon termination, you lose access to your account and data.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive for 99.9% uptime but do not guarantee uninterrupted service. The Service may be unavailable due to 
              maintenance, updates, or technical issues. We are not liable for service interruptions or data loss.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>The Service is provided "AS IS" without warranties of any kind</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Our liability is limited to the amount you paid in the last 12 months</li>
              <li>We are not liable for third-party services (WhatsApp, payment processors)</li>
              <li>We are not liable for patient care, medical decisions, or outcomes</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold Bookzi harmless from claims arising from: (a) your use of the Service, (b) your 
              violation of these Terms, (c) your violation of third-party rights, including patient privacy, or (d) your medical 
              practice and patient care.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms at any time. Material changes will be notified via email or in-app notice at least 30 days 
              before taking effect. Continued use after changes constitutes acceptance.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Governing Law and Disputes</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by Indian law. Disputes will be resolved through arbitration in Bangalore, India, under 
              the Arbitration and Conciliation Act, 1996. The arbitration language is English.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions about these Terms, contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Bookzi</strong></p>
              <p className="text-gray-700">Email: <a href="mailto:admin@bookzi.in" className="text-blue-600 hover:underline">admin@bookzi.in</a></p>
            </div>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
