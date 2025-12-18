import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: December 18, 2025</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Bookzi. We are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our WhatsApp-based 
              appointment booking system and related services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Name, email address, phone number, clinic name, and address</li>
              <li><strong>Professional Information:</strong> Medical qualifications, specialization, consultation types, and working hours</li>
              <li><strong>Patient Information:</strong> Names, phone numbers, appointment details, and communication history</li>
              <li><strong>Payment Information:</strong> Billing details and subscription information (processed through secure payment providers)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-4">2.2 Information Automatically Collected</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (features accessed, time spent, interaction patterns)</li>
              <li>WhatsApp message metadata (timestamp, delivery status)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>To provide and maintain our booking system services</li>
              <li>To facilitate appointment scheduling via WhatsApp</li>
              <li>To send automated appointment reminders and notifications</li>
              <li>To process payments and manage subscriptions</li>
              <li>To improve our AI assistant and user experience</li>
              <li>To provide customer support and respond to inquiries</li>
              <li>To comply with legal obligations and protect against fraud</li>
              <li>To send administrative information and service updates</li>
            </ul>
          </section>

          {/* WhatsApp Integration */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. WhatsApp Integration</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Bookzi integrates with WhatsApp Business API to facilitate appointment bookings. When patients interact with your 
              clinic via WhatsApp:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Messages are processed through WhatsApp's secure infrastructure</li>
              <li>Our AI assistant analyzes message content to extract appointment details</li>
              <li>Message history is stored securely for service delivery and improvement</li>
              <li>WhatsApp's Terms of Service and Privacy Policy also apply</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication with JWT tokens</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and multi-tenant data isolation</li>
              <li>Secure cloud infrastructure with regular backups</li>
              <li>Employee training on data protection practices</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, 
              we cannot guarantee absolute security.
            </p>
          </section>

          {/* Data Sharing and Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> WhatsApp Business API, cloud hosting, payment processors, and analytics tools</li>
              <li><strong>AI Services:</strong> OpenAI for natural language processing (anonymized where possible)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> For any other purpose with your explicit permission</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to provide services and comply with legal obligations. 
              Specifically:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-3">
              <li>Account data: Until account deletion + 90 days for backup purposes</li>
              <li>Appointment history: 3 years for medical record compliance</li>
              <li>Message logs: 1 year for service improvement</li>
              <li>Payment records: 7 years for tax and accounting purposes</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> Request copies of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Withdraw Consent:</strong> Revoke consent for data processing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, contact us at <a href="mailto:admin@bookzi.in" className="text-blue-600 hover:underline">admin@bookzi.in</a>
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies to enhance user experience, analyze usage, and remember preferences. 
              You can control cookie settings through your browser, but disabling cookies may limit functionality.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Bookzi is not intended for children under 18. We do not knowingly collect personal information from children. 
              If you believe a child has provided information, please contact us immediately.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be processed in countries outside your residence. We ensure appropriate safeguards are in 
              place, including standard contractual clauses and compliance with data protection regulations.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy periodically. Significant changes will be notified via email or prominent notice 
              on our platform. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Bookzi</strong></p>
              <p className="text-gray-700">Email: <a href="mailto:admin@bookzi.in" className="text-blue-600 hover:underline">admin@bookzi.in</a></p>
              <p className="text-gray-700 mt-2">Response time: Within 48 hours</p>
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Regulatory Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              Bookzi complies with applicable data protection regulations including GDPR, CCPA, and India's Digital Personal 
              Data Protection Act. We are committed to maintaining the highest standards of data privacy and security.
            </p>
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

export default PrivacyPolicyPage;
