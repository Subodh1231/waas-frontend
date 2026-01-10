import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Clock, User, Calendar, FileText } from 'lucide-react';
import {
  createAppointment,
  checkAvailability,
  getDoctors,
  searchPatients,
  type CreateAppointmentRequest,
  type Staff,
  type PatientSearchResult,
  type AvailabilityCheckResponse,
  type ServiceItem,
} from '../lib/api';
import api from '../lib/api';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
  defaultTime?: string;
  defaultProvider?: string;
}

export default function AddAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  defaultTime,
  defaultProvider,
}: AddAppointmentModalProps) {
  // Form state
  const [phone, setPhone] = useState('');
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');

  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [providerId, setProviderId] = useState('');
  const [providerName, setProviderName] = useState(defaultProvider || '');
  const [providers, setProviders] = useState<Staff[]>([]);

  const [date, setDate] = useState(
    defaultDate ? defaultDate.toISOString().split('T')[0] : ''
  );
  const [time, setTime] = useState(defaultTime || '');
  const [notes, setNotes] = useState('');

  // UI state
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityCheckResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load providers on mount
  useEffect(() => {
    if (isOpen) {
      loadProviders();
      loadServices();
    }
  }, [isOpen]);

  // Patient search with debounce
  useEffect(() => {
    if (phone.length < 3) {
      setPatient(null);
      return;
    }

    const timer = setTimeout(() => {
      searchForPatient(phone);
    }, 500);

    return () => clearTimeout(timer);
  }, [phone]);

  // Check availability when time/provider changes
  useEffect(() => {
    if (date && time && providerName && serviceId) {
      checkSlotAvailability();
    }
  }, [date, time, providerName, serviceId]);

  const loadProviders = async () => {
    try {
      const doctors = await getDoctors();
      setProviders(doctors);
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/api/services');
      setServices(response.data);
    } catch (err) {
      console.error('Failed to load services:', err);
      // Fallback to empty array
      setServices([]);
    }
  };

  const searchForPatient = async (phoneNumber: string) => {
    setSearchingPatient(true);
    try {
      const results = await searchPatients(phoneNumber);
      if (results && results.length > 0) {
        const foundPatient = results[0];
        setPatient(foundPatient);
        setPatientName(foundPatient.name);
        setPatientEmail(foundPatient.email || '');
      } else {
        setPatient(null);
        setPatientName('');
        setPatientEmail('');
      }
    } catch (err) {
      console.error('Patient search failed:', err);
      setPatient(null);
    } finally {
      setSearchingPatient(false);
    }
  };

  const checkSlotAvailability = async () => {
    if (!date || !time || !providerName || !serviceId) return;

    const selectedService = services.find((s) => s.id === serviceId);
    if (!selectedService) return;

    const startTime = `${date}T${time}:00+05:30`; // IST timezone

    setCheckingAvailability(true);
    try {
      const result = await checkAvailability(
        providerName,
        startTime,
        selectedService.durationMinutes || 30
      );
      setAvailability(result);
    } catch (err) {
      console.error('Availability check failed:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!patient && !patientName) {
      setError('Please enter patient name for new patient');
      return;
    }

    if (!serviceId) {
      setError('Please select a service');
      return;
    }

    if (!providerName) {
      setError('Please select a provider');
      return;
    }

    if (!date || !time) {
      setError('Please select date and time');
      return;
    }

    if (availability && !availability.available) {
      setError('Selected slot is not available. Please choose a different time.');
      return;
    }

    const selectedService = services.find((s) => s.id === serviceId);
    const startTime = `${date}T${time}:00+05:30`;

    const request: CreateAppointmentRequest = {
      patient: {
        phone,
        name: patient?.name || patientName,
        email: patient?.email || patientEmail || undefined,
      },
      serviceId,
      providerName,
      providerId: providerId || undefined,
      startTime,
      durationMinutes: selectedService?.durationMinutes,
      notes: notes || undefined,
      source: 'MANUAL',
    };

    setSubmitting(true);
    try {
      await createAppointment(request);
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create appointment';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setPatient(null);
    setPatientName('');
    setPatientEmail('');
    setServiceId('');
    setProviderId('');
    setProviderName('');
    setDate('');
    setTime('');
    setNotes('');
    setAvailability(null);
    setError('');
  };

  const handleSuggestedSlot = (suggestedTime: string) => {
    const dateTime = new Date(suggestedTime);
    setDate(dateTime.toISOString().split('T')[0]);
    setTime(dateTime.toTimeString().substring(0, 5));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Patient Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Patient Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {searchingPatient && (
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            )}
            {patient && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Found: {patient.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(`/customers?search=${patient.phone}`, '_blank')}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    View History →
                  </button>
                </div>
                {patient.totalAppointments > 0 && (
                  <p className="text-sm text-green-700 mt-1">
                    {patient.totalAppointments} previous appointment{patient.totalAppointments !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
            {!patient && phone.length >= 10 && !searchingPatient && (
              <p className="text-sm text-gray-600 mt-2">
                ℹ️ New patient - details will be saved
              </p>
            )}
          </div>

          {/* Patient Name (for new patients) */}
          {!patient && phone.length >= 10 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required={!patient}
              />
            </div>
          )}

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service *
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.durationMinutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor/Provider *
            </label>
            
            {providers.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Setup Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="mb-3">
                        You need to add at least one doctor/provider before creating appointments.
                      </p>
                      <div className="flex gap-3">
                        <a
                          href="/setup"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          onClick={onClose}
                        >
                          Complete Setup Wizard
                        </a>
                        <a
                          href="/settings"
                          className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-800 bg-white hover:bg-yellow-50"
                          onClick={onClose}
                        >
                          Go to Settings
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={providerName}
                onChange={(e) => {
                  const selected = providers.find((p) => p.name === e.target.value);
                  setProviderName(e.target.value);
                  setProviderId(selected?.id || '');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.name}>
                    {provider.name} - {provider.specialization || provider.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min={date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              {date === new Date().toISOString().split('T')[0] && (
                <p className="text-xs text-gray-500 mt-1">Cannot book appointments in the past</p>
              )}
            </div>
          </div>

          {/* Availability Check */}
          {checkingAvailability && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">Checking availability...</p>
            </div>
          )}

          {availability && !availability.available && (
            <div className="p-4 bg-yellow-50 border border-yellow-400 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">
                    Slot Conflict Detected
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    {availability.message}
                  </p>
                  {availability.suggestions && availability.suggestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-yellow-900 mb-2">
                        Suggested times:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availability.suggestions.slice(0, 3).map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSuggestedSlot(slot.startTime)}
                            className="px-3 py-1.5 bg-white border border-yellow-300 rounded-lg text-sm text-yellow-900 hover:bg-yellow-100 transition"
                          >
                            {new Date(slot.startTime).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {availability && availability.available && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-medium">Slot is available!</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (availability !== null && !availability.available)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
