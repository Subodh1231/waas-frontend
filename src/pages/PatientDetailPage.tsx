import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FileText, Phone, UserRound } from 'lucide-react';
import {
  getPatient,
  getPatientAppointments,
  getPatientInvoices,
  type PatientAppointmentHistoryItem,
  type PatientInvoiceSummary,
  type PatientRecord,
} from '../lib/api';

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      getPatient(patientId),
      getPatientAppointments(patientId),
      getPatientInvoices(patientId),
    ])
      .then(([patientData, appointmentData, invoiceData]) => {
        if (!active) return;
        setPatient(patientData);
        setAppointments(appointmentData);
        setInvoices(invoiceData);
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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading patient…</div>;
  if (error || !patient) {
    return <div className="p-6 sm:p-8"><Link to="/patients" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"><ArrowLeft className="h-4 w-4" />Back to patients</Link><p className="mt-6 text-gray-700">{error || 'Patient not found.'}</p></div>;
  }

  const name = patient.name?.trim() || 'Patient';

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/patients" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Back to patients</Link>

        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700"><UserRound className="h-6 w-6" /></div>
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold text-gray-900">{name}</h1>
                <p className="mt-1 text-sm text-gray-700">{patient.phoneNumber || 'No phone number'}</p>
                {patient.email && <p className="mt-1 break-all text-sm text-gray-500">{patient.email}</p>}
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
                <thead><tr className="border-b text-xs uppercase tracking-wide text-gray-500"><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Doctor</th><th className="py-3 pr-4">Service</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Invoice</th><th className="py-3">Action</th></tr></thead>
                <tbody>{completedAppointments.map((appointment) => <tr key={appointment.id} className="border-b border-gray-100"><td className="py-3 pr-4 text-gray-700">{appointment.startTime ? new Date(appointment.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td><td className="py-3 pr-4 text-gray-700">{appointment.providerName || '—'}</td><td className="py-3 pr-4 text-gray-700">{appointment.serviceName || '—'}</td><td className="py-3 pr-4"><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">Completed</span></td><td className="py-3 pr-4">{appointment.invoiceId ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appointment.invoiceStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : appointment.invoicePaymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{appointment.invoiceStatus === 'CANCELLED' ? 'Invoice cancelled' : `Invoice · ${appointment.invoicePaymentStatus || 'UNPAID'}`}</span> : <span className="text-xs text-gray-500">Not generated</span>}</td><td className="py-3">{appointment.invoiceId ? <Link to={`/invoices/${appointment.invoiceId}`} className="whitespace-nowrap font-medium text-blue-600 hover:underline">View Invoice</Link> : <Link to={`/invoices?appointmentId=${appointment.id}`} className="whitespace-nowrap font-medium text-blue-600 hover:underline">Generate Invoice</Link>}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-violet-600" /><h2 className="text-lg font-semibold text-gray-900">Invoices</h2></div><span className="text-sm text-gray-500">{invoices.length}</span></div>
          {invoices.length === 0 ? (
            <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No invoices yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead><tr className="border-b text-xs uppercase tracking-wide text-gray-500"><th className="py-3 pr-4">Invoice #</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Doctor</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Payment</th><th className="py-3">Document</th></tr></thead>
                <tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b border-gray-100"><td className="py-3 pr-4 font-medium text-blue-700">{invoice.invoiceNumber}</td><td className="py-3 pr-4 text-gray-700">{invoice.invoiceDate}</td><td className="py-3 pr-4 text-gray-700">{invoice.providerName || '—'}</td><td className="py-3 pr-4 font-medium text-gray-900">{currency(invoice.totalAmount, invoice.currency)}</td><td className="py-3 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${invoice.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{invoice.status === 'CANCELLED' ? 'Cancelled' : invoice.paymentStatus}</span></td><td className="py-3"><Link className="font-medium text-blue-600 hover:underline" to={`/invoices/${invoice.id}`}>View / Print</Link></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PatientDetailPage;
