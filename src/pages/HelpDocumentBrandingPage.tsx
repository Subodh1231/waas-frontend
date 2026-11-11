import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const HelpDocumentBrandingPage = () => (
  <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
    <article className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <Link to="/help" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" />Help Center
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Invoices</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Document branding</h1>
        </div>
      </div>

      <div className="mt-6 space-y-5 text-sm leading-6 text-gray-700">
        <p>Clinic owners and authorized staff can add a clinic seal and billing signature in Settings → Document Branding.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Upload a PNG or JPEG image. Each image must be no larger than 2 MB.</li>
          <li>Review the private preview, then enable the seal or billing signature you want on invoices.</li>
          <li>Save the preferences. They apply only to invoices issued from that point onward.</li>
          <li>Open an invoice to preview, print, or download its finalized PDF. Email uses that same stored PDF.</li>
        </ol>
        <section className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h2 className="font-semibold text-blue-900">Previously issued invoices</h2>
          <p className="mt-1 text-blue-900">
            Replacing or removing an image never changes an issued invoice. Existing invoices created before this feature
            continue using the backward-compatible PDF rendering path.
          </p>
        </section>
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Billing signature only</h2>
          <p className="mt-1 text-amber-900">
            The signature is a visual image for billing documents; it is not a cryptographic or legally recognized digital
            signature. It is not used for prescriptions.
          </p>
        </section>
        <p>
          Assets are stored privately in the clinic database. Each finalized invoice PDF has an 8 MB storage limit;
          database backups include these images and PDFs.
        </p>
      </div>

      <Link to="/settings?section=documents" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
        Open Document Branding settings
      </Link>
    </article>
  </main>
);

export default HelpDocumentBrandingPage;
