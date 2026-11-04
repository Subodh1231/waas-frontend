import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FileText, Phone, UserRound } from 'lucide-react';
import {
  getPatient,
  getPatientAppointments,
  getPatientInvoices,
  getPatientFeedbackDeliveryStatus,
  getPatientFeedbackSubmissions,
  type PatientAppointmentHistoryItem,
  type PatientInvoiceSummary,
  type ClinicFeedbackItem,
  type PatientFeedbackDeliveryStatus,
  type PatientRecord,
} from '../lib/api';
import { updatePatientEmail, sendAppointmentFeedbackEmail, sendInvoiceEmail } from '../lib/api';
import SendOperationalEmailModal from '../components/SendOperationalEmailModal';

const currency = (amount: number | string, code: string) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: code }).format(Number(amount));
  } catch {
    return `${code} ${Number(amount).toFixed(2)}`;
  }
};

const statusLabel = (appointment: PatientAppointmentHistoryItem) => {
  const statuses = [appointment.appointmentStatus, appointment.status]
    .filter((status): status is string => Boolean(status))
    .map((status) => status.toUpperCase());
  const terminal = ['CANCELLED', 'NO_SHOW', 'COMPLETED'].find((status) => statuses.includes(status));
  return terminal || appointment.appointmentStatus || appointment.status || 'Unknown';
};

const PatientDetailPage = () => {
  const { patientId = '' } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [appointments, setAppointments] = useState<PatientAppointmentHistoryItem[]>([]);
  const [invoices, setInvoices] = useState<PatientInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailEditing, setEmailEditing] = useState(false);
  const [feedbackDeliveries, setFeedbackDeliveries] = useState<PatientFeedbackDeliveryStatus[]>([]);
  const [submittedFeedback, setSubmittedFeedback] = useState<ClinicFeedbackItem[]>([]);
  const [emailDraft, setEmailDraft] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailDialog, setEmailDialog] = useState<{ type: 'feedback' | 'invoice'; id: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      getPatient(patientId),
      getPatientAppointments(patientId),
      getPatientInvoices(patientId),
      getPatientFeedbackDeliveryStatus(patientId),
      getPatientFeedbackSubmissions(patientId).catch(() => [] as ClinicFeedbackItem[]),
    ])
      .then(([patientData, appointmentData, invoiceData, feedbackDeliveryData, feedbackData]) => {
        if (!active) return;
        setPatient(patientData);
        setAppointments(appointmentData);
        setInvoices(invoiceData);
        setFeedbackDeliveries(feedbackDeliveryData);
        setSubmittedFeedback(feedbackData);
      })
      .catch((requestError: any) => {
        if (active) setError(requestError.response?.status === 404
          ? 'Patient not found.'
          : 'Could not load this patient record. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [patientId]);

  const { upcomingAppointment, completedAppointments } = useMemo(() => {
    const now = Date.now();
    const eligible = appointments.filter((appointment) => {
      const statuses = [appointment.status, appointment.appointmentStatus]
        .filter((status): status is string => Boolean(status))
        .map((status) => status.toUpperCase());
      const hasEligibleStatus = statuses.some((status) => status === 'PENDING' || status === 'CONFIRMED');
      const isTerminal = statuses.some((status) => ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status));
      return hasEligibleStatus && !isTerminal
        && appointment.startTime
        && new Date(appointment.startTime).getTime() > now;
    });
    const completed = appointments.filter((appointment) => {
      const statuses = [appointment.status, appointment.appointmentStatus]
        .filter((status): status is string => Boolean(status))
        .map((status) => status.toUpperCase());
      return statuses.includes('COMPLETED') && !statuses.includes('CANCELLED') && !statuses.includes('NO_SHOW');
    });
    return {
      upcomingAppointment: eligible.sort((a, b) => new Date(a.startTime || '').getTime() - new Date(b.startTime || '').getTime())[0],
      completedAppointments: completed,
    };
  }, [appointments]);

  const saveEmail = async () => {
    const currentPatient = patient;
    if (!currentPatient) return;
    setSavingEmail(true);
    setError('');
    try {
      const updated = await updatePatientEmail(currentPatient.id, emailDraft.trim());
      setPatient(updated);
      setEmailEditing(false);
      setNotice('Patient email saved.');
    } catch (saveError: any) {
      setError(saveError.response?.data?.message || 'Could not save this email address.');
    } finally {
      setSavingEmail(false);
    }
  };

  const sendOperationalEmail = async (recipient: string, updateProfile: boolean) => {
    if (!emailDialog) return;
    const currentPatient = patient;
    if (!currentPatient) return;
    setSendingEmail(true);
    try {
      const result = emailDialog.type === 'invoice'
        ? await sendInvoiceEmail(emailDialog.id, recipient, updateProfile)
        : await sendAppointmentFeedbackEmail(emailDialog.id, recipient, updateProfile);
      if (updateProfile) setPatient(await getPatient(currentPatient.id));
      if (emailDialog.type === 'feedback') {
        setFeedbackDeliveries(await getPatientFeedbackDeliveryStatus(currentPatient.id));
      }
      setNotice(result.status === 'SENT' ? 'Email sent.' : result.status === 'SKIPPED' ? 'Email was not sent because email delivery is disabled.' : 'Email queued for delivery.');
      setEmailDialog(null);
    } catch (sendError: any) {
      throw new Error(sendError.response?.data?.message || 'Could not queue the email.');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading patient…</div>;
  if (error || !patient) {
    return <div className="p-6 sm:p-8"><Link to="/patients" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"><ArrowLeft className="h-4 w-4" />Back to patients</Link><p className="mt-6 text-gray-700">{error || 'Patient not found.'}</p></div>;
  }

  const name = patient.name?.trim() || 'Patient';
  const feedbackByAppointment = new Map<string, PatientFeedbackDeliveryStatus>();
  feedbackDeliveries.forEach((status) => {
    if (!feedbackByAppointment.has(status.appointmentId)) feedbackByAppointment.set(status.appointmentId, status);
  });
  const submissionByAppointment = new Map(submittedFeedback.map((item) => [item.appointmentId, item]));

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/patients" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Back to patients</Link>
        {notice && <p role="status" className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700"><UserRound className="h-6 w-6" /></div>
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold text-gray-900">{name}</h1>
                <p className="mt-1 text-sm text-gray-700">{patient.phoneNumber || 'No phone number'}</p>
                {patient.email && <p className="mt-1 break-all text-sm text-gray-500">{patient.email}</p>}
                <button type="button" onClick={() => { setEmailDraft(patient.email || ''); setEmailEditing((current) => !current); }} className="mt-2 text-sm font-medium text-blue-600 hover:underline">{patient.email ? 'Edit email' : 'Add email'}</button>
                {emailEditing && <div className="mt-3 flex max-w-md flex-col gap-2 sm:flex-row"><input type="email" value={emailDraft} onChange={(event) => setEmailDraft(event.target.value)} placeholder="patient@example.com" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" /><button type="button" onClick={() => void saveEmail()} disabled={savingEmail} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingEmail ? 'Saving…' : 'Save email'}</button><button type="button" onClick={() => setEmailEditing(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">Cancel</button></div>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate(`/appointments?patientId=${patient.id}`)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><CalendarDays className="h-4 w-4" />New Appointment</button>
              {patient.phoneNumber && <a href={`tel:${patient.phoneNumber}`} aria-label={`Call ${name}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Phone className="h-4 w-4" />Call</a>}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-600" /><h2 className="text-lg font-semibold text-gray-900">Upcoming appointment</h2></div>
          {upcomingAppointment ? (
            <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl bg-blue-50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-gray-900">{new Date(upcomingAppointment.startTime!).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                <p className="mt-1 text-sm text-gray-700">{upcomingAppointment.providerName || 'Provider'} · {upcomingAppointment.serviceName}</p>
              </div>
              <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-800">{statusLabel(upcomingAppointment)}</span>
            </div>
          ) : <p className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No upcoming appointment.</p>}
        </section>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-gray-900">Appointment history</h2><span className="text-sm text-gray-500">{completedAppointments.length} completed visit{completedAppointments.length === 1 ? '' : 's'}</span></div>
          {completedAppointments.length === 0 ? (
            <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No completed visits yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr className="border-b text-xs uppercase tracking-wide text-gray-500"><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Doctor</th><th className="py-3 pr-4">Service</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Invoice</th><th className="py-3 pr-4">Document</th><th className="py-3">Actions</th></tr></thead>
                <tbody>{completedAppointments.map((appointment) => <tr key={appointment.id} className="border-b border-gray-100"><td className="py-3 pr-4 text-gray-700">{appointment.startTime ? new Date(appointment.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td><td className="py-3 pr-4 text-gray-700">{appointment.providerName || '—'}</td><td className="py-3 pr-4 text-gray-700">{appointment.serviceName || '—'}</td><td className="py-3 pr-4"><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">Completed</span></td><td className="py-3 pr-4">{appointment.invoiceId ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appointment.invoiceStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : appointment.invoicePaymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{appointment.invoiceStatus === 'CANCELLED' ? 'Invoice cancelled' : `Invoice · ${appointment.invoicePaymentStatus || 'UNPAID'}`}</span> : <span className="text-xs text-gray-500">Not generated</span>}</td><td className="py-3">{appointment.invoiceId ? <Link to={`/invoices/${appointment.invoiceId}`} className="whitespace-nowrap font-medium text-blue-600 hover:underline">View Invoice</Link> : <div className="flex flex-col items-start gap-1"><span className="text-xs text-gray-500">Not generated</span><Link to={`/invoices?appointmentId=${appointment.id}`} className="whitespace-nowrap font-medium text-blue-600 hover:underline">Generate Invoice</Link></div>}</td><td className="py-3">{appointment.invoiceId ? <div className="flex flex-wrap gap-2"><Link to={`/invoices/${appointment.invoiceId}`} className="whitespace-nowrap font-medium text-blue-600 hover:underline">View</Link><button type="button" onClick={() => setEmailDialog({ type: 'invoice', id: appointment.invoiceId! })} className="whitespace-nowrap font-medium text-gray-700 hover:text-blue-700">Email</button></div> : <button type="button" onClick={() => setEmailDialog({ type: 'feedback', id: appointment.id })} className="whitespace-nowrap font-medium text-blue-600 hover:underline">Send feedback request</button>}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-violet-600" /><h2 className="text-lg font-semibold text-gray-900">Invoices</h2></div><span className="text-sm text-gray-500">{invoices.length}</span></div>
          {invoices.length === 0 ? <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No invoices yet.</p> : (
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="border-b text-xs uppercase tracking-wide text-gray-500"><th className="py-3 pr-4">Invoice #</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Payment</th><th className="py-3">Document</th></tr></thead>
              <tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b border-gray-100"><td className="py-3 pr-4 font-medium text-blue-700">{invoice.invoiceNumber}</td><td className="py-3 pr-4 text-gray-700">{invoice.invoiceDate}</td><td className="py-3 pr-4 font-medium text-gray-900">{currency(invoice.totalAmount, invoice.currency)}</td><td className="py-3 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${invoice.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{invoice.status === 'CANCELLED' ? 'Cancelled' : invoice.paymentStatus}</span></td><td className="py-3"><Link className="font-medium text-blue-600 hover:underline" to={`/invoices/${invoice.id}`}>View / Print</Link></td></tr>)}</tbody>
            </table></div>
          )}
        </section>
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div><h2 className="text-lg font-semibold text-gray-900">Feedback follow-up</h2><p className="mt-1 text-sm text-gray-600">Feedback requests are optional. Email is only sent after staff confirms the recipient.</p></div>
          {completedAppointments.length === 0 ? <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Feedback requests become available after a visit is completed.</p> : (
            <div className="mt-4 divide-y divide-gray-100">{completedAppointments.map((appointment) => {
              const delivery = feedbackByAppointment.get(appointment.id);
              const submission = submissionByAppointment.get(appointment.id);
              const stateLabel = submission ? 'Submitted' : !delivery ? 'Not queued' : delivery.status === 'SKIPPED_NO_EMAIL' ? 'Not sent · no email' : delivery.status === 'SENT' ? `Sent${delivery.sentAt ? ` · ${new Date(delivery.sentAt).toLocaleString()}` : ''}` : delivery.status === 'PENDING' || delivery.status === 'PROCESSING' ? 'Queued' : delivery.status === 'FAILED' ? 'Failed' : delivery.status === 'CANCELLED' ? 'Cancelled' : delivery.status;
              return (
                <div key={appointment.id} className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{appointment.startTime ? new Date(appointment.startTime).toLocaleDateString() : 'Completed visit'} · {appointment.providerName || 'Provider'}</p>
                    <p className="mt-1 text-xs text-gray-500">Feedback request: {stateLabel}</p>
                    {submission && <div className="mt-2 text-sm text-gray-700"><p className="font-medium text-amber-600">{'★'.repeat(submission.rating)}{'☆'.repeat(5 - submission.rating)}</p>{submission.comment && <p className="mt-1 whitespace-pre-wrap">“{submission.comment}”</p>}<p className="mt-1 text-xs text-gray-500">Submitted {new Date(submission.submittedAt).toLocaleString()}</p></div>}
                  </div>
                  {!submission && <button type="button" onClick={() => setEmailDialog({ type: 'feedback', id: appointment.id })} className="w-fit rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{patient.email ? (delivery?.status === 'SENT' ? 'Resend request' : 'Send request') : 'Add email and send'}</button>}
                </div>
              );
            })}</div>
          )}
        </section>
        {emailDialog && <SendOperationalEmailModal title={emailDialog.type === 'invoice' ? 'Email invoice' : 'Send feedback request'} description={emailDialog.type === 'invoice' ? 'Confirm the recipient. The invoice PDF will be attached.' : 'Confirm the recipient for the patient feedback link.'} initialEmail={patient.email} submitting={sendingEmail} onClose={() => setEmailDialog(null)} onSubmit={sendOperationalEmail} />}
      </div>
    </div>
  );
};

export default PatientDetailPage;
