import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Star } from 'lucide-react';
import { getClinicFeedback, type ClinicFeedbackPage as ClinicFeedbackData } from '../lib/api';

const PAGE_SIZE = 20;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

const FeedbackPage = () => {
  const [data, setData] = useState<ClinicFeedbackData | null>(null);
  const [providerId, setProviderId] = useState('');
  const [rating, setRating] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getClinicFeedback({
      providerId: providerId || undefined,
      rating: rating ? Number(rating) : undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then((result) => { if (active) setData(result); })
      .catch((requestError: any) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load patient feedback.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [providerId, rating, from, to, page]);

  const hasSubmittedFeedback = (data?.totalResponses || 0) > 0;
  const hasActiveFilters = Boolean(providerId || rating || from || to);

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/appointments" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
          <ChevronLeft className="h-4 w-4" />Appointments
        </Link>
        <header className="mt-4 border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-gray-900">Patient Feedback</h1>
          <p className="mt-1 text-sm text-gray-600">Feedback received from completed appointments</p>
        </header>

        <section className="grid gap-4 border-b border-gray-200 py-5 sm:grid-cols-2" aria-label="Feedback summary">
          <div>
            <p className="text-sm font-medium text-gray-500">Average rating</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900">{hasSubmittedFeedback ? data?.averageRating?.toFixed(1) : '—'}</span>
              {hasSubmittedFeedback && <Star className="h-5 w-5 fill-amber-400 text-amber-500" aria-hidden="true" />}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total responses</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{data?.totalResponses ?? '—'}</p>
          </div>
        </section>

        <section className="flex flex-col gap-3 border-b border-gray-200 py-4 sm:flex-row sm:items-end" aria-label="Filter feedback">
          <label className="flex-1 text-sm font-medium text-gray-700">
            Provider
            <select value={providerId} onChange={(event) => { setProviderId(event.target.value); setPage(0); }} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-800">
              <option value="">All providers</option>
              {(data?.providers || []).map((provider) => <option key={provider.providerId} value={provider.providerId}>{provider.providerName}</option>)}
            </select>
          </label>
          <label className="flex-1 text-sm font-medium text-gray-700">
            Rating
            <select value={rating} onChange={(event) => { setRating(event.target.value); setPage(0); }} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-800">
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}
            </select>
          </label>
          <label className="flex-1 text-sm font-medium text-gray-700">
            Submitted from
            <input type="date" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); setPage(0); }} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-800" />
          </label>
          <label className="flex-1 text-sm font-medium text-gray-700">
            Through
            <input type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(0); }} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-800" />
          </label>
        </section>

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-label="Loading feedback" /></div>
        ) : !hasSubmittedFeedback ? (
          <div className="py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">{hasActiveFilters ? 'No responses match these filters' : 'No patient feedback yet'}</h2>
            <p className="mt-2 text-sm text-gray-600">{hasActiveFilters ? 'Adjust or clear the filters to see other responses.' : 'Feedback will appear here after patients respond to post-appointment feedback requests.'}</p>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-600">No responses match these filters.</div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {(data?.items || []).map((item) => (
                <article key={item.appointmentId} className="py-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <Link to={`/patients/${item.patientId}`} className="font-semibold text-blue-700 hover:underline">{item.patientName || 'Patient'}</Link>
                      <p className="mt-1 text-sm text-gray-600">{item.providerName || 'Provider'} · {item.serviceName || 'Visit'}</p>
                    </div>
                    <div className="shrink-0 text-sm text-gray-500">
                      <p>Visit: {formatDate(item.appointmentAt)}</p>
                      <p className="mt-1">Submitted: {formatDate(item.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < item.rating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} aria-hidden="true" />)}
                    <span className="ml-1 text-sm font-medium text-gray-700">{item.rating}/5</span>
                  </div>
                  {item.comment && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">“{item.comment}”</p>}
                </article>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 py-4 text-sm text-gray-600">
              <span>Page {page + 1} of {Math.max(data?.totalPages || 1, 1)}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} aria-label="Previous page" className="rounded border border-gray-300 bg-white p-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" disabled={page + 1 >= (data?.totalPages || 0)} onClick={() => setPage((current) => current + 1)} aria-label="Next page" className="rounded border border-gray-300 bg-white p-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
