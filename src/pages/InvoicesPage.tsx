import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Printer, Search, X } from 'lucide-react';
import {
  cancelInvoice,
  createInvoice,
  getInvoice,
  getInvoiceDraft,
  getInvoiceForAppointment,
  getInvoicePdf,
  searchInvoices,
  updateInvoicePayment,
  sendInvoiceEmail,
  getInvoiceEmailSuggestion,
  type CreateInvoiceRequest,
  type Invoice,
  type InvoiceDraft,
  type InvoiceItemInput,
  type ServiceItem,
} from '../lib/api';
import api from '../lib/api';
import SendOperationalEmailModal from '../components/SendOperationalEmailModal';

type EditableLine = InvoiceItemInput & { rowId: string };

const currencySymbol = (currency: string) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 })
      .formatToParts(0).find((part) => part.type === 'currency')?.value || currency;
  } catch {
    return currency;
  }
};

const money = (value: string | number, currency: string) => {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const InvoiceStatus = ({ value }: { value: string }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
    value === 'PAID' ? 'bg-green-100 text-green-800' : value === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
  }`}>
    {value}
  </span>
);

const InvoicesPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('appointmentId');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState('');
  const [invoicePdfReady, setInvoicePdfReady] = useState(false);
  const invoicePdfFrameRef = useRef<HTMLIFrameElement>(null);
  const [detailPaymentMethod, setDetailPaymentMethod] = useState('CASH');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [invoiceEmailSuggestion, setInvoiceEmailSuggestion] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [discount, setDiscount] = useState('0.00');
  const [tax, setTax] = useState('0.00');
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PAID'>('UNPAID');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isComposer = Boolean(appointmentId) && !invoiceId;

  useEffect(() => {
    let cancelled = false;
    let pdfObjectUrl = '';
    const load = async () => {
      setLoading(true);
      setError('');
      setInvoice(null);
      setInvoicePdfUrl('');
      setInvoicePdfReady(false);
      try {
        if (invoiceId) {
          const [result, pdf] = await Promise.all([getInvoice(invoiceId), getInvoicePdf(invoiceId)]);
          if (!cancelled) {
            setInvoice(result);
            setDetailPaymentMethod(result.paymentMethod || 'CASH');
            pdfObjectUrl = URL.createObjectURL(pdf);
            setInvoicePdfUrl(pdfObjectUrl);
          }
          return;
        }
        if (appointmentId) {
          try {
            const result = await getInvoiceDraft(appointmentId);
            if (cancelled) return;
            setDraft(result);
            setLines([{
              rowId: crypto.randomUUID(),
              serviceId: result.serviceId || undefined,
              description: result.serviceName || 'Consultation',
              quantity: '1',
              unitPrice: String(result.servicePrice ?? '0.00'),
            }]);
          } catch (draftError: any) {
            if (draftError.response?.status === 409) {
              const existing = await getInvoiceForAppointment(appointmentId);
              if (!cancelled) navigate(`/invoices/${existing.id}`, { replace: true });
              return;
            }
            throw draftError;
          }
          const serviceResponse = await api.get<ServiceItem[]>('/api/services');
          if (!cancelled) setServices(serviceResponse.data || []);
          return;
        }
        const result = await searchInvoices(search);
        if (!cancelled) setInvoices(result);
      } catch (loadError: any) {
        if (!cancelled) setError(loadError.response?.data?.message || 'Could not load invoice information.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
    };
  }, [invoiceId, appointmentId, navigate]);

  useEffect(() => {
    if (invoiceId || appointmentId) return;
    const timer = window.setTimeout(async () => {
      try {
        setInvoices(await searchInvoices(search));
      } catch {
        setError('Could not search invoices.');
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, invoiceId, appointmentId]);

  const subtotal = useMemo(() => lines.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0
  ), [lines]);
  const total = Math.max(0, subtotal - Number(discount || 0)) + Number(tax || 0);

  const updateLine = (rowId: string, update: Partial<EditableLine>) => {
    setLines((current) => current.map((line) => line.rowId === rowId ? { ...line, ...update } : line));
  };

  const selectService = (rowId: string, serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    updateLine(rowId, service
      ? { serviceId: service.id, description: service.name, unitPrice: String(service.price ?? 0) }
      : { serviceId: undefined, description: '', unitPrice: '0.00' });
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!appointmentId || lines.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const request: CreateInvoiceRequest = {
        items: lines.map(({ rowId: _rowId, ...line }) => line),
        discountAmount: discount || '0',
        taxAmount: tax || '0',
        paymentStatus,
        paymentMethod: paymentStatus === 'PAID' ? paymentMethod as CreateInvoiceRequest['paymentMethod'] : undefined,
        notes: notes.trim() || undefined,
      };
      const result = await createInvoice(appointmentId, request);
      navigate(`/invoices/${result.id}`, { replace: true });
    } catch (createError: any) {
      setError(createError.response?.data?.message || 'Could not generate invoice. Please review the details and retry.');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentChange = async (status: 'UNPAID' | 'PAID', method?: string) => {
    if (!invoice) return;
    try {
      const updated = await updateInvoicePayment(invoice.id, status, method);
      setInvoice(updated);
    } catch (updateError: any) {
      setError(updateError.response?.data?.message || 'Could not update payment status.');
    }
  };

  const handleCancel = async () => {
    if (!invoice || !window.confirm('Cancel this issued invoice? Its number and invoice record will be retained.')) return;
    try {
      setInvoice(await cancelInvoice(invoice.id));
    } catch (cancelError: any) {
      setError(cancelError.response?.data?.message || 'Could not cancel invoice.');
    }
  };

  const handleSendInvoiceEmail = async (recipient: string, updatePatientEmail: boolean) => {
    if (!invoice) return;
    setSendingEmail(true);
    setError('');
    try {
      const result = await sendInvoiceEmail(invoice.id, recipient, updatePatientEmail);
      setNotice(result.status === 'SKIPPED'
        ? 'Email delivery is disabled; the invoice was not sent.'
        : 'Invoice email queued for delivery.');
      setShowEmailDialog(false);
    } catch (sendError: any) {
      throw new Error(sendError.response?.data?.message || 'Could not queue the invoice email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const openInvoiceEmailDialog = async () => {
    if (!invoice) return;
    try {
      setInvoiceEmailSuggestion(await getInvoiceEmailSuggestion(invoice.id));
    } catch {
      setInvoiceEmailSuggestion('');
    }
    setShowEmailDialog(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading invoices…</div>;
  }

  if (isComposer) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 px-4 py-6 pb-24 sm:px-8 lg:pb-8">
        <div className="mx-auto max-w-4xl">
          <Link to="/appointments" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Back to appointments</Link>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Appointment receipt</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Review invoice details</h1>
            {draft && <p className="mt-2 text-gray-600">{draft.patientName} · {draft.providerName || 'Provider'} · {draft.appointmentDate}</p>}
            {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {draft && (
              <form className="mt-6 space-y-6" onSubmit={handleCreate}>
                <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                  <div><span className="text-gray-500">Clinic</span><p className="font-medium text-gray-900">{draft.clinicName}</p></div>
                  <div><span className="text-gray-500">Patient</span><p className="font-medium text-gray-900">{draft.patientName} {draft.patientPhone && `· ${draft.patientPhone}`}</p></div>
                  <div><span className="text-gray-500">Doctor</span><p className="font-medium text-gray-900">{draft.providerName || '—'}</p></div>
                  <div><span className="text-gray-500">Appointment date</span><p className="font-medium text-gray-900">{draft.appointmentDate}</p></div>
                </div>

                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-900">Items</h2>
                    <button type="button" onClick={() => setLines((current) => [...current, { rowId: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '0.00' }])} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Plus className="h-4 w-4" />Add item</button>
                  </div>
                  <div className="space-y-3">
                    {lines.map((line, index) => (
                      <div key={line.rowId} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_110px_140px_auto]">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
                            <input required maxLength={500} value={line.description} onChange={(event) => updateLine(line.rowId, { description: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Consultation or procedure" />
                            {services.length > 0 && <select value={line.serviceId || ''} onChange={(event) => selectService(line.rowId, event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600"><option value="">Free-text item / keep entered description</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {money(service.price || 0, draft.currency)}</option>)}</select>}
                          </div>
                          <div><label className="mb-1 block text-xs font-medium text-gray-500">Quantity</label><input required type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => updateLine(line.rowId, { quantity: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                          <div><label className="mb-1 block text-xs font-medium text-gray-500">Unit price ({currencySymbol(draft.currency)})</label><input required type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => updateLine(line.rowId, { unitPrice: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                          <div className="flex items-end justify-between gap-2 sm:justify-end"><span className="pb-2 text-sm font-semibold text-gray-900">{money(Number(line.quantity || 0) * Number(line.unitPrice || 0), draft.currency)}</span>{lines.length > 1 && <button type="button" aria-label={`Remove item ${index + 1}`} onClick={() => setLines((current) => current.filter((entry) => entry.rowId !== line.rowId))} className="mb-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label className="mb-1 block text-sm font-medium text-gray-700">Payment status</label><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as 'UNPAID' | 'PAID')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5"><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option></select></div>
                      {paymentStatus === 'PAID' && <div><label className="mb-1 block text-sm font-medium text-gray-700">Payment method</label><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank transfer</option><option value="OTHER">Other</option></select></div>}
                    </div>
                    <div><label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label><textarea rows={3} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5" placeholder="Additional information for the patient" /></div>
                  </div>
                  <div className="h-fit rounded-xl bg-gray-50 p-4">
                    <div className="flex justify-between py-1.5 text-sm text-gray-600"><span>Subtotal</span><span>{money(subtotal, draft.currency)}</span></div>
                    <label className="mt-2 flex items-center justify-between gap-3 py-1.5 text-sm text-gray-600"><span>Discount</span><input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} className="w-28 rounded border border-gray-300 px-2 py-1 text-right" /></label>
                    <label className="flex items-center justify-between gap-3 py-1.5 text-sm text-gray-600"><span>Tax amount (optional)</span><input type="number" min="0" step="0.01" value={tax} onChange={(event) => setTax(event.target.value)} className="w-28 rounded border border-gray-300 px-2 py-1 text-right" /></label>
                    <div className="mt-2 flex justify-between border-t border-gray-200 pt-3 font-bold text-gray-900"><span>Total</span><span>{money(total, draft.currency)}</span></div>
                    <p className="mt-3 text-xs leading-5 text-gray-500">Tax is an amount only. This is not a GST tax calculation or GST-compliant tax invoice.</p>
                  </div>
                </div>
                <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-5 sm:flex-row">
                  <button type="button" onClick={() => navigate('/appointments')} className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving || !lines.length} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Generating…' : 'Generate invoice'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (invoiceId && !invoice) {
    return (
      <div className="p-8">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"><ArrowLeft className="h-4 w-4" />Back to invoices</Link>
        <p className="mt-6 text-gray-700">{error || 'Invoice not found.'}</p>
      </div>
    );
  }

  if (invoiceId && invoice) {
    return (
      <div className="h-full overflow-y-auto bg-gray-100 px-4 py-6 pb-24 sm:px-8 lg:pb-8">
        <div className="invoice-actions mx-auto mb-4 flex max-w-4xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Invoices</Link>
          <div className="flex flex-wrap gap-2">
            {invoice.status === 'ISSUED' && <button onClick={() => void openInvoiceEmailDialog()} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Email Invoice</button>}
            {invoice.status === 'ISSUED' && <>
              <select aria-label="Invoice payment method" value={detailPaymentMethod} onChange={(event) => setDetailPaymentMethod(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank transfer</option><option value="OTHER">Other</option>
              </select>
              <button onClick={() => void handlePaymentChange(invoice.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID', detailPaymentMethod)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700">Mark {invoice.paymentStatus === 'PAID' ? 'unpaid' : 'paid'}</button>
            </>}
            {invoice.status === 'ISSUED' && <button onClick={() => void handleCancel()} className="min-h-11 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700">Cancel invoice</button>}
            <button
              onClick={() => invoicePdfFrameRef.current?.contentWindow?.print()}
              disabled={!invoicePdfReady}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />Print finalized PDF
            </button>
            {invoicePdfUrl && <a href={invoicePdfUrl} download={`${invoice.invoiceNumber}.pdf`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Download PDF</a>}
          </div>
        </div>
        {notice && <div className="invoice-actions mx-auto mb-4 max-w-4xl rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
        {error && <div className="invoice-actions mx-auto mb-4 max-w-4xl rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <section className="invoice-actions mx-auto max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-gray-900">Finalized invoice PDF</h2>
            <p className="text-xs text-gray-500">This issue-time PDF is unchanged by later payment updates.</p>
          </div>
          {invoicePdfUrl ? (
            <iframe
              ref={invoicePdfFrameRef}
              src={invoicePdfUrl}
              title={`Finalized invoice ${invoice.invoiceNumber}`}
              onLoad={() => setInvoicePdfReady(true)}
              className="h-[70vh] min-h-[32rem] w-full"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-gray-500">Loading finalized PDF…</div>
          )}
        </section>
        {showEmailDialog && <SendOperationalEmailModal title="Email invoice" description="Confirm or edit the recipient. The invoice PDF will be attached." initialEmail={invoiceEmailSuggestion} submitting={sendingEmail} onClose={() => setShowEmailDialog(false)} onSubmit={handleSendInvoiceEmail} />}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 px-4 py-6 pb-24 sm:px-8 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Clinic billing</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Invoices</h1><p className="mt-2 text-gray-600">Find and print invoices generated from completed appointments.</p></div>
          <label className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice, patient, or phone" className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm" /></label>
        </div>
        {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.3fr_1.2fr_1fr_1.1fr_1fr_1fr] gap-3 border-b bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid"><span>Invoice #</span><span>Patient</span><span>Date</span><span>Doctor</span><span>Amount</span><span>Payment</span></div>
          {invoices.length === 0 ? <div className="p-10 text-center"><FileText className="mx-auto h-10 w-10 text-gray-300" /><h2 className="mt-3 font-semibold text-gray-900">No invoices found</h2><p className="mt-1 text-sm text-gray-500">Invoices appear here after you generate them from completed appointments.</p></div> : invoices.map((item) => <Link key={item.id} to={`/invoices/${item.id}`} className="grid gap-2 border-b border-gray-100 px-5 py-4 transition hover:bg-blue-50 md:grid-cols-[1.3fr_1.2fr_1fr_1.1fr_1fr_1fr] md:items-center md:gap-3"><span className="font-semibold text-blue-700">{item.invoiceNumber}</span><span className="text-sm text-gray-900">{item.patientName}<small className="block text-gray-500">{item.patientPhone}</small></span><span className="text-sm text-gray-600">{item.invoiceDate}</span><span className="text-sm text-gray-600">{item.providerName || '—'}</span><span className="text-sm font-semibold text-gray-900">{money(item.totalAmount, item.currency)}</span><span><InvoiceStatus value={item.status === 'CANCELLED' ? 'CANCELLED' : item.paymentStatus} /></span></Link>)}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
