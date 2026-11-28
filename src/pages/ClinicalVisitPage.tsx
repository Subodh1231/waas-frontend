import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardPlus, Download, FileText, Plus, Save, ShieldAlert, Trash2 } from 'lucide-react';
import {
  attestSignedPrescriptionCopy,
  confirmPhysicalHandover,
  createEmptyMedicationItem,
  createPrescriptionDraft,
  createPrescriptionReplacement,
  downloadClinicalPdf,
  finalizeClinicalVisit,
  getClinicalVisit,
  getPatientClinicalHistory,
  getVisitPrescriptions,
  preparePrescription,
  reviewPrescription,
  updateClinicalVisit,
  updatePrescriptionDraft,
  uploadSignedPrescriptionCopy,
  type ClinicalHistoryItem,
  type ClinicalMedicationItem,
  type ClinicalPrescription,
  type ClinicalPrescriptionStatus,
  type ClinicalVisit,
  type ClinicalVisitDraft,
  type PrescriptionReview,
} from '../lib/clinical';
import api, { getApiErrorMessage as getGeneralApiErrorMessage } from '../lib/api';

const EMPTY_VISIT_DRAFT: ClinicalVisitDraft = {
  version: 0,
  chiefComplaint: '',
  historyOfPresentIllness: '',
  relevantMedicalHistory: '',
  allergyInformation: '',
  examinationFindings: '',
  assessmentOrDiagnosis: '',
  treatmentPerformed: '',
  investigationsOrRecommendations: '',
  patientAdvice: '',
  followUpDate: null,
};

const toVisitDraft = (visit: ClinicalVisit): ClinicalVisitDraft => ({
  version: visit.version,
  chiefComplaint: visit.chiefComplaint || '',
  historyOfPresentIllness: visit.historyOfPresentIllness || '',
  relevantMedicalHistory: visit.relevantMedicalHistory || '',
  allergyInformation: visit.allergyInformation || '',
  examinationFindings: visit.examinationFindings || '',
  assessmentOrDiagnosis: visit.assessmentOrDiagnosis || '',
  treatmentPerformed: visit.treatmentPerformed || '',
  investigationsOrRecommendations: visit.investigationsOrRecommendations || '',
  patientAdvice: visit.patientAdvice || '',
  followUpDate: visit.followUpDate,
});

const isSignedFlow = (status: ClinicalPrescriptionStatus) =>
  status !== 'DRAFT' && status !== 'SUPERSEDED';

const ClinicalVisitPage = () => {
  const { visitId = '' } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<ClinicalVisit | null>(null);
  const [draft, setDraft] = useState<ClinicalVisitDraft>(EMPTY_VISIT_DRAFT);
  const [prescription, setPrescription] = useState<ClinicalPrescription | null>(null);
  const [prescriptionVersions, setPrescriptionVersions] = useState<ClinicalPrescription[]>([]);
  const [medications, setMedications] = useState<ClinicalMedicationItem[]>([]);
  const [history, setHistory] = useState<ClinicalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingVisit, setSavingVisit] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [review, setReview] = useState<PrescriptionReview | null>(null);
  const [attestationPassword, setAttestationPassword] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [addendumReason, setAddendumReason] = useState('');
  const [addendumContent, setAddendumContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [currentVisit, prescriptions] = await Promise.all([
        getClinicalVisit(visitId),
        getVisitPrescriptions(visitId),
      ]);
      setVisit(currentVisit);
      setDraft(toVisitDraft(currentVisit));
      const currentPrescription = prescriptions.find((item) => item.status !== 'SUPERSEDED') || null;
      setPrescription(currentPrescription);
      setPrescriptionVersions(prescriptions.filter((item) => item.status === 'SUPERSEDED'));
      setMedications(currentPrescription?.items || []);
      try {
        setHistory(await getPatientClinicalHistory(currentVisit.patientId));
        setHistoryError('');
      } catch (historyRequestError: unknown) {
        setHistoryError(getGeneralApiErrorMessage(historyRequestError, 'Could not load previous clinical visits.'));
      }
    } catch (requestError: unknown) {
      setError(getGeneralApiErrorMessage(requestError, 'Could not load this clinical visit.'));
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateNote = (key: keyof Omit<ClinicalVisitDraft, 'version'>, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const persistVisit = async () => {
    if (!visit) throw new Error('Clinical visit is not loaded.');
    const updated = await updateClinicalVisit(visit.id, draft);
    setVisit(updated);
    setDraft(toVisitDraft(updated));
    return updated;
  };

  const saveVisit = async () => {
    setSavingVisit(true);
    setError('');
    setNotice('');
    try {
      await persistVisit();
      setNotice('Clinical note saved as a draft.');
    } catch (saveError: unknown) {
      setError(getGeneralApiErrorMessage(saveError, 'Could not save this clinical note.'));
    } finally {
      setSavingVisit(false);
    }
  };

  const finalizeVisit = async () => {
    if (!visit) return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const saved = await persistVisit();
      const finalized = await finalizeClinicalVisit(visit.id, saved.version);
      setVisit(finalized);
      setDraft(toVisitDraft(finalized));
      setNotice('Visit finalized. The note is now immutable; use an addendum for corrections.');
    } catch (finalizeError: unknown) {
      setError(getGeneralApiErrorMessage(finalizeError, 'Could not finalize this visit.'));
    } finally {
      setWorking(false);
    }
  };

  const savePrescription = async () => {
    if (!prescription) return null;
    setSavingPrescription(true);
    setError('');
    setNotice('');
    try {
      const saved = await updatePrescriptionDraft(prescription.id, { ...prescription, items: medications });
      setPrescription(saved);
      setMedications(saved.items);
      setReview(null);
      setNotice('Prescription draft saved.');
      return saved;
    } catch (saveError: unknown) {
      setError(getGeneralApiErrorMessage(saveError, 'Could not save the prescription draft.'));
      return null;
    } finally {
      setSavingPrescription(false);
    }
  };

  const addPrescription = async () => {
    if (!visit) return;
    setWorking(true);
    setError('');
    try {
      const created = await createPrescriptionDraft(visit.id);
      setPrescription(created);
      setMedications(created.items);
      setNotice('Prescription draft created. Enter only the instructions intended by the prescriber.');
    } catch (createError: unknown) {
      setError(getGeneralApiErrorMessage(createError, 'Could not create a prescription draft.'));
    } finally {
      setWorking(false);
    }
  };

  const checkPrescription = async () => {
    const saved = await savePrescription();
    if (!saved) return;
    try {
      const result = await reviewPrescription(saved.id);
      setReview(result);
      if (!result.readyToPrepare) setNotice('Review the missing items before preparing the PDF.');
    } catch (reviewError: unknown) {
      setError(getGeneralApiErrorMessage(reviewError, 'Could not review the prescription.'));
    }
  };

  const prepare = async () => {
    if (!prescription) return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const prepared = await preparePrescription(prescription.id);
      setPrescription(prepared);
      setNotice('Finalized prescription PDF saved. This is the unsigned copy for physical signature.');
      setReview(null);
    } catch (prepareError: unknown) {
      setError(getGeneralApiErrorMessage(prepareError, 'Could not prepare the prescription PDF.'));
    } finally {
      setWorking(false);
    }
  };

  const openPdf = async (path: string, downloadName: string) => {
    const pdfWindow = window.open('about:blank', '_blank');
    setError('');
    try {
      const blob = await downloadClinicalPdf(path);
      const objectUrl = window.URL.createObjectURL(blob);
      if (pdfWindow) {
        pdfWindow.location.href = objectUrl;
      } else {
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = downloadName;
        anchor.click();
      }
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    } catch (downloadError: unknown) {
      pdfWindow?.close();
      setError(getGeneralApiErrorMessage(downloadError, 'Could not open the prescription PDF.'));
    }
  };

  const confirmHandover = async () => {
    if (!prescription || !attestationPassword) return;
    setWorking(true);
    setError('');
    try {
      const updated = await confirmPhysicalHandover(prescription.id, attestationPassword);
      setPrescription(updated);
      setAttestationPassword('');
      setNotice('Physical signature and handover attested.');
    } catch (attestationError: unknown) {
      setError(getGeneralApiErrorMessage(attestationError, 'Could not confirm physical handover.'));
    } finally {
      setWorking(false);
    }
  };

  const uploadSignedCopy = async (file?: File) => {
    if (!prescription || !file) return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const updated = await uploadSignedPrescriptionCopy(prescription.id, file);
      setPrescription(updated);
      setNotice('Signed copy uploaded and sanitized. It is not available for download until you attest to it.');
    } catch (uploadError: unknown) {
      setError(getGeneralApiErrorMessage(uploadError, 'Could not upload this signed copy.'));
    } finally {
      setWorking(false);
    }
  };

  const attestSignedCopy = async () => {
    if (!prescription || !attestationPassword) return;
    setWorking(true);
    setError('');
    try {
      const updated = await attestSignedPrescriptionCopy(prescription.id, attestationPassword);
      setPrescription(updated);
      setAttestationPassword('');
      setNotice('Signed copy attestation saved. This is not a cryptographic signature or legal verification.');
    } catch (attestationError: unknown) {
      setError(getGeneralApiErrorMessage(attestationError, 'Could not attest to this signed copy.'));
    } finally {
      setWorking(false);
    }
  };

  const createReplacement = async () => {
    if (!prescription || !correctionReason.trim()) return;
    setWorking(true);
    setError('');
    try {
      const replacement = await createPrescriptionReplacement(prescription.id, correctionReason.trim());
      setPrescription(replacement);
      setPrescriptionVersions((current) => [
        { ...prescription, status: 'SUPERSEDED' },
        ...current.filter((item) => item.id !== prescription.id),
      ]);
      setMedications(replacement.items);
      setCorrectionReason('');
      setReview(null);
      setNotice('Replacement draft created. The previous finalized prescription remains preserved.');
    } catch (replacementError: unknown) {
      setError(getGeneralApiErrorMessage(replacementError, 'Could not create a replacement prescription.'));
    } finally {
      setWorking(false);
    }
  };

  const addAddendum = async () => {
    if (!visit || !addendumReason.trim() || !addendumContent.trim()) return;
    setWorking(true);
    setError('');
    try {
      await api.post(`/api/clinical/visits/${visit.id}/addenda`, {
        reason: addendumReason.trim(),
        content: addendumContent.trim(),
      });
      setAddendumReason('');
      setAddendumContent('');
      await load();
      setNotice('Addendum added without changing the finalized visit note.');
    } catch (addendumError: unknown) {
      setError(getGeneralApiErrorMessage(addendumError, 'Could not add this correction.'));
    } finally {
      setWorking(false);
    }
  };

  const fieldClass = 'mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50';
  const isDraft = visit?.status === 'DRAFT';
  const canEditPrescription = prescription?.status === 'DRAFT';
  const prescriptionTitle = useMemo(() => prescription
    ? `Prescription v${prescription.versionNumber} · ${prescription.status.replaceAll('_', ' ').toLowerCase()}`
    : '', [prescription]);

  return (
    <div className="h-full overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/appointments" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to appointments
          </Link>
          <Link to="/clinical/profile" className="min-h-11 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700">
            Doctor professional profile
          </Link>
        </div>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
        {loading ? <p className="text-sm text-gray-600">Loading clinical visit…</p> : visit && (
          <>
            <header className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Clinical visit · {visit.status}</p>
                  <h1 className="mt-1 text-2xl font-bold text-gray-900">{visit.patientName}</h1>
                  <p className="mt-1 text-sm text-gray-600">{visit.patientPhone} · {new Date(visit.encounterAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-gray-600">Provider: {visit.providerName}</p>
                </div>
                <p className="max-w-md rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                  Clinical records are sensitive. Enter information only as determined by the treating doctor. Bookzi does not provide diagnosis or prescribing guidance.
                </p>
              </div>
            </header>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Clinical note</h2>
                <p className="mt-1 text-sm text-gray-600">Drafts can be edited. Finalized notes cannot be changed; append an attributed addendum if needed.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ['chiefComplaint', 'Chief complaint'],
                  ['historyOfPresentIllness', 'History of present illness'],
                  ['relevantMedicalHistory', 'Relevant medical history'],
                  ['allergyInformation', 'Allergy information'],
                  ['examinationFindings', 'Examination findings'],
                  ['assessmentOrDiagnosis', 'Assessment / diagnosis'],
                  ['treatmentPerformed', 'Treatment performed'],
                  ['investigationsOrRecommendations', 'Investigations / recommendations'],
                  ['patientAdvice', 'Patient advice'],
                ] as const).map(([field, label]) => (
                  <label key={field} className="text-sm font-medium text-gray-700">
                    {label}
                    <textarea
                      rows={field === 'chiefComplaint' || field === 'allergyInformation' ? 2 : 3}
                      value={draft[field]}
                      onChange={(event) => updateNote(field, event.target.value)}
                      disabled={!isDraft}
                      className={fieldClass}
                    />
                  </label>
                ))}
                <label className="text-sm font-medium text-gray-700">
                  Follow-up date
                  <input type="date" value={draft.followUpDate || ''} onChange={(event) => setDraft((current) => ({ ...current, followUpDate: event.target.value || null }))} disabled={!isDraft} className={fieldClass} />
                </label>
              </div>
              {isDraft && (
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={saveVisit} disabled={savingVisit || working} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 disabled:opacity-60">
                    <Save className="h-4 w-4" aria-hidden="true" /> {savingVisit ? 'Saving…' : 'Save draft'}
                  </button>
                  <button type="button" onClick={finalizeVisit} disabled={working || savingVisit} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {working ? 'Finalizing…' : 'Finalize visit'}
                  </button>
                </div>
              )}
              {visit.status === 'FINALIZED' && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold text-gray-900">Append-only addendum</h3>
                  {visit.addenda.map((addendum) => (
                    <article key={addendum.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm font-semibold text-gray-800">{addendum.reason}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{addendum.content}</p>
                      <p className="mt-2 text-xs text-gray-500">Added {new Date(addendum.createdAt).toLocaleString()}</p>
                    </article>
                  ))}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-gray-700">
                      Correction reason
                      <input value={addendumReason} onChange={(event) => setAddendumReason(event.target.value)} maxLength={1000} className={fieldClass} />
                    </label>
                    <label className="text-sm font-medium text-gray-700">
                      Addendum content
                      <textarea value={addendumContent} onChange={(event) => setAddendumContent(event.target.value)} rows={2} maxLength={20000} className={fieldClass} />
                    </label>
                  </div>
                  <button type="button" onClick={addAddendum} disabled={working || !addendumReason.trim() || !addendumContent.trim()} className="min-h-11 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 disabled:opacity-60">
                    Add correction
                  </button>
                </div>
              )}
            </section>

            {visit.status === 'FINALIZED' && (
              <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Prescription</h2>
                    <p className="mt-1 text-sm text-gray-600">Medication values are entered by the doctor; none are suggested or filled in automatically.</p>
                  </div>
                  {!prescription && (
                    <button type="button" onClick={addPrescription} disabled={working} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> Create draft
                    </button>
                  )}
                </div>

                {prescription && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                      <div>
                        <h3 className="font-semibold capitalize text-gray-900">{prescriptionTitle}</h3>
                        {prescription.correctionReason && <p className="mt-1 text-sm text-amber-800">Replacement reason: {prescription.correctionReason}</p>}
                      </div>
                      {prescription.preparedDocumentAvailable && (
                        <button type="button" onClick={() => void openPdf(`/api/prescriptions/${prescription.id}/documents/prepared`, `prescription-${prescription.id}.pdf`)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800">
                          <Download className="h-4 w-4" aria-hidden="true" /> Open finalized PDF to print
                        </button>
                      )}
                    </div>

                    {canEditPrescription && (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="text-sm font-medium text-gray-700">
                            Patient age at prescription
                            <input type="number" min={0} max={130} value={prescription.patientAge ?? ''} onChange={(event) => setPrescription((current) => current ? { ...current, patientAge: event.target.value ? Number(event.target.value) : null } : current)} className={fieldClass} />
                          </label>
                          <label className="text-sm font-medium text-gray-700">
                            Patient gender
                            <input maxLength={40} value={prescription.patientGender || ''} onChange={(event) => setPrescription((current) => current ? { ...current, patientGender: event.target.value } : current)} className={fieldClass} />
                          </label>
                        </div>
                        <div className="space-y-4">
                          {medications.map((item, index) => (
                            <div key={item.id || `medication-${index}`} className="rounded-lg border border-gray-200 p-3 sm:p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="font-semibold text-gray-800">Medicine {index + 1}</h4>
                                <button type="button" onClick={() => setMedications((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove medicine ${index + 1}`} className="flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-red-700">
                                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                                </button>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {([
                                  ['medicineName', 'Medicine name'],
                                  ['strength', 'Strength'],
                                  ['dosageForm', 'Dosage form'],
                                  ['dose', 'Dose'],
                                  ['route', 'Route'],
                                  ['frequency', 'Frequency'],
                                  ['duration', 'Duration'],
                                  ['quantity', 'Quantity'],
                                  ['timingInstructions', 'Timing instructions'],
                                  ['patientInstructions', 'Patient instructions'],
                                ] as const).map(([field, label]) => (
                                  <label key={field} className="text-sm font-medium text-gray-700">
                                    {label}{field === 'medicineName' ? ' *' : ''}
                                    <input
                                      required={field === 'medicineName'}
                                      value={item[field] || ''}
                                      maxLength={field === 'patientInstructions' ? 2000 : 300}
                                      onChange={(event) => setMedications((current) => current.map((entry, itemIndex) =>
                                        itemIndex === index ? { ...entry, [field]: event.target.value } : entry))}
                                      className={fieldClass}
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={() => setMedications((current) => [...current, createEmptyMedicationItem()])} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800">
                            <Plus className="h-4 w-4" aria-hidden="true" /> Add medicine
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={() => void savePrescription()} disabled={savingPrescription || working} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 disabled:opacity-60">
                            <Save className="h-4 w-4" aria-hidden="true" /> {savingPrescription ? 'Saving…' : 'Save prescription draft'}
                          </button>
                          <button type="button" onClick={() => void checkPrescription()} disabled={savingPrescription || working} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                            Review before preparing
                          </button>
                        </div>
                        {review && (
                          <div className={`rounded-lg p-3 text-sm ${review.readyToPrepare ? 'border border-green-200 bg-green-50 text-green-900' : 'border border-amber-200 bg-amber-50 text-amber-950'}`}>
                            <p className="font-semibold">{review.readyToPrepare ? 'Ready for doctor review' : 'Complete these items before preparation'}</p>
                            {!review.readyToPrepare && <ul className="mt-2 list-disc space-y-1 pl-5">{review.missingRequirements.map((item) => <li key={item}>{item}</li>)}</ul>}
                            {review.readyToPrepare && (
                              <button type="button" onClick={prepare} disabled={working} className="mt-3 min-h-11 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60">
                                {working ? 'Preparing…' : 'Prepare and store finalized PDF'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isSignedFlow(prescription.status) && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                          <p>The prepared PDF is unsigned and must be physically signed by the doctor. Uploaded scans are sanitized and remain private. Attestation is not a digital signature or independent legal verification.</p>
                        </div>
                        {(prescription.status === 'PREPARED_FOR_SIGNATURE') && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Current password for physical handover attestation
                              <input type="password" autoComplete="current-password" value={attestationPassword} onChange={(event) => setAttestationPassword(event.target.value)} className={fieldClass} />
                            </label>
                            <button type="button" onClick={confirmHandover} disabled={working || !attestationPassword} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 disabled:opacity-60">
                              Confirm physically signed and handed over
                            </button>
                          </div>
                        )}
                        {prescription.status !== 'SIGNED_COPY_ATTESTED' && (
                          <label className="block text-sm font-medium text-gray-700">
                            Upload physically signed scan (PDF, max 5 MB, up to 2 pages)
                            <input type="file" accept="application/pdf,.pdf" disabled={working} onChange={(event) => void uploadSignedCopy(event.target.files?.[0])} className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700`} />
                          </label>
                        )}
                        {prescription.status === 'SIGNED_COPY_UPLOADED' && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Current password to attest this is the matching physically signed copy
                              <input type="password" autoComplete="current-password" value={attestationPassword} onChange={(event) => setAttestationPassword(event.target.value)} className={fieldClass} />
                            </label>
                            <button type="button" onClick={attestSignedCopy} disabled={working || !attestationPassword} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                              Attest signed copy
                            </button>
                          </div>
                        )}
                        {prescription.signedCopyAvailable && (
                          <button type="button" onClick={() => void openPdf(`/api/prescriptions/${prescription.id}/documents/signed-copy`, `prescription-${prescription.id}-signed.pdf`)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800">
                            <FileText className="h-4 w-4" aria-hidden="true" /> Open attested signed copy
                          </button>
                        )}
                        <div className="grid gap-3 border-t pt-4 sm:grid-cols-[1fr_auto]">
                          <label className="text-sm font-medium text-gray-700">
                            Correction reason for replacement
                            <input value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} maxLength={1000} className={fieldClass} />
                          </label>
                          <button type="button" onClick={createReplacement} disabled={working || !correctionReason.trim()} className="mt-auto min-h-11 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-60">
                            Create replacement version
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {prescriptionVersions.length > 0 && (
              <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Previous prescription versions</h2>
                  <p className="mt-1 text-sm text-gray-600">Superseded records remain unchanged. Available documents open from their stored snapshots.</p>
                </div>
                <ul className="divide-y divide-gray-100">
                  {prescriptionVersions.map((version) => (
                    <li key={version.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium text-gray-800">Version {version.versionNumber} · superseded</p>
                        <p className="text-sm text-gray-600">Created {new Date(version.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {version.preparedDocumentAvailable && (
                          <button type="button" onClick={() => void openPdf(`/api/prescriptions/${version.id}/documents/prepared`, `prescription-${version.id}.pdf`)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800">
                            <Download className="h-4 w-4" aria-hidden="true" /> Finalized PDF
                          </button>
                        )}
                        {version.signedCopyAvailable && (
                          <button type="button" onClick={() => void openPdf(`/api/prescriptions/${version.id}/documents/signed-copy`, `prescription-${version.id}-signed.pdf`)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800">
                            <FileText className="h-4 w-4" aria-hidden="true" /> Attested signed copy
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your previous clinical visits</h2>
                <p className="mt-1 text-sm text-gray-600">Only records for this doctor/provider are shown.</p>
              </div>
              {historyError && <p role="alert" className="text-sm text-amber-800">{historyError}</p>}
              {history.length === 0 && !historyError ? <p className="text-sm text-gray-600">No earlier visits found.</p> : (
                <ul className="divide-y divide-gray-100">
                  {history.filter((item) => item.id !== visit.id).map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{new Date(item.encounterAt).toLocaleDateString()} · {item.status.toLowerCase()}</p>
                        <p className="text-sm text-gray-600">{item.chiefComplaint || 'Clinical note'}</p>
                      </div>
                      <button type="button" onClick={() => navigate(`/clinical/visits/${item.id}`)} className="min-h-10 px-3 text-sm font-semibold text-blue-700">
                        View visit
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ClinicalVisitPage;
