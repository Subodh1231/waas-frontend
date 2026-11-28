import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import axios from 'axios';
import {
  getDoctorProfessionalProfile,
  saveDoctorProfessionalProfile,
  type DoctorProfessionalProfileRequest,
} from '../lib/clinical';
import { getApiErrorMessage } from '../lib/api';

const emptyProfile: DoctorProfessionalProfileRequest = {
  registeredName: '',
  qualifications: '',
  registrationNumber: '',
  registrationCouncil: '',
  specialty: '',
  practitionerCategory: 'MEDICAL_DOCTOR',
  practiceAddress: '',
  practicePinCode: '',
  emergencyContactNumber: '',
  doctorAttestationAccepted: false,
};

const DoctorProfessionalProfilePage = () => {
  const [profile, setProfile] = useState<DoctorProfessionalProfileRequest>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    getDoctorProfessionalProfile()
      .then((current) => {
        if (!active) return;
        setProfile({
          registeredName: current.registeredName,
          qualifications: current.qualifications,
          registrationNumber: current.registrationNumber,
          registrationCouncil: current.registrationCouncil,
          specialty: current.specialty || '',
          practitionerCategory: current.practitionerCategory,
          practiceAddress: current.practiceAddress,
          practicePinCode: current.practicePinCode,
          emergencyContactNumber: current.emergencyContactNumber,
          doctorAttestationAccepted: false,
        });
      })
      .catch((requestError: unknown) => {
        if (active && !(axios.isAxiosError(requestError) && requestError.response?.status === 404)) {
          setError(getApiErrorMessage(requestError, 'Could not load the professional profile.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const update = <K extends keyof DoctorProfessionalProfileRequest>(
    key: K,
    value: DoctorProfessionalProfileRequest[K],
  ) => setProfile((current) => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await saveDoctorProfessionalProfile(profile);
      setProfile({
        registeredName: saved.registeredName,
        qualifications: saved.qualifications,
        registrationNumber: saved.registrationNumber,
        registrationCouncil: saved.registrationCouncil,
        specialty: saved.specialty || '',
        practitionerCategory: saved.practitionerCategory,
        practiceAddress: saved.practiceAddress,
        practicePinCode: saved.practicePinCode,
        emergencyContactNumber: saved.emergencyContactNumber,
        doctorAttestationAccepted: false,
      });
      setNotice('Professional details saved as doctor-attested information. They have not been independently verified.');
    } catch (saveError: unknown) {
      setError(getApiErrorMessage(saveError, 'Could not save the professional profile.'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div className="h-full overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link to="/appointments" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to appointments
        </Link>
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Doctor professional profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            These details are included in newly prepared prescriptions. Bookzi records your attestation but does not verify credentials.
          </p>
        </header>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
        {loading ? <p className="text-sm text-gray-600">Loading professional profile…</p> : (
          <form onSubmit={save} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Registered name *
                <input required maxLength={200} value={profile.registeredName} onChange={(event) => update('registeredName', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Practitioner category *
                <select value={profile.practitionerCategory} onChange={(event) => update('practitionerCategory', event.target.value as DoctorProfessionalProfileRequest['practitionerCategory'])} className={inputClass}>
                  <option value="DENTIST">Dentist</option>
                  <option value="MEDICAL_DOCTOR">Medical doctor</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Qualifications *
                <input required maxLength={500} value={profile.qualifications} onChange={(event) => update('qualifications', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Specialty
                <input maxLength={200} value={profile.specialty || ''} onChange={(event) => update('specialty', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Registration number *
                <input required maxLength={100} value={profile.registrationNumber} onChange={(event) => update('registrationNumber', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Registration council *
                <input required maxLength={200} value={profile.registrationCouncil} onChange={(event) => update('registrationCouncil', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                Practice address *
                <textarea required maxLength={2000} rows={3} value={profile.practiceAddress} onChange={(event) => update('practiceAddress', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Practice PIN code *
                <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={profile.practicePinCode} onChange={(event) => update('practicePinCode', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Emergency contact number *
                <input required type="tel" maxLength={20} value={profile.emergencyContactNumber} onChange={(event) => update('emergencyContactNumber', event.target.value)} className={inputClass} />
              </label>
            </div>
            <label className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
              <input
                type="checkbox"
                required
                checked={profile.doctorAttestationAccepted}
                onChange={(event) => update('doctorAttestationAccepted', event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>I confirm these are my professional details and attest to their accuracy. Bookzi has not independently verified them.</span>
            </label>
            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <Save className="h-4 w-4" aria-hidden="true" /> {saving ? 'Saving…' : 'Save professional profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorProfessionalProfilePage;
