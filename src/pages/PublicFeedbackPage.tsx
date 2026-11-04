import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { getPublicFeedbackInfo, submitPublicFeedback, type PublicFeedbackInfo } from '../lib/api';

const PublicFeedbackPage = () => {
  const { token = '' } = useParams<{ token: string }>();
  const [info, setInfo] = useState<PublicFeedbackInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getPublicFeedbackInfo(token)
      .then((data) => { if (active) setInfo(data); })
      .catch((requestError: any) => { if (active) setError(requestError.response?.data?.message || 'This feedback link is invalid or has expired.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitPublicFeedback(token, rating, comment.trim() || undefined);
      setSubmitted(true);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Could not submit feedback. This link may have expired or already been used.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {loading ? <div className="py-10 text-center text-gray-500"><Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" /><p className="mt-3">Loading feedback form…</p></div> : submitted ? (
          <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-green-600" /><h1 className="mt-4 text-2xl font-bold text-gray-900">Thank you for your feedback</h1><p className="mt-2 text-gray-600">Your response has been sent to {info?.clinicName}.</p></div>
        ) : info ? (
          <form onSubmit={submit}>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Patient feedback</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">How was your visit?</h1>
            <p className="mt-2 text-gray-600">Your feedback helps {info.clinicName} improve. This link can be used once.</p>
            {info.doctorName && <p className="mt-2 text-sm text-gray-500">Doctor: {info.doctorName}</p>}
            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-gray-700">Your rating</legend>
              <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Rating from 1 to 5 stars">
                {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value === 1 ? '' : 's'}`} onClick={() => setRating(value)} className={`rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${value <= rating ? 'text-amber-500' : 'text-gray-300'}`}><Star className="h-8 w-8 fill-current" /></button>)}
              </div>
            </fieldset>
            <label className="mt-5 block text-sm font-medium text-gray-700">Comment (optional)<textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Tell the clinic about your experience" /></label>
            {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit feedback'}</button>
            <p className="mt-4 text-center text-xs text-gray-400">Powered by Bookzi</p>
          </form>
        ) : <div className="py-8 text-center"><h1 className="text-xl font-bold text-gray-900">Feedback link unavailable</h1><p className="mt-2 text-gray-600">{error}</p></div>}
      </section>
    </main>
  );
};

export default PublicFeedbackPage;
