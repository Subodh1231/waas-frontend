import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, MapPin, Calendar, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import {
  getPublicClinic,
  getPublicSlots,
  createPublicBooking,
  type PublicClinic,
  type PublicDoctor,
  type PublicService,
  type PublicBookingConfirmation,
} from '../lib/api';

const todayISO = () => new Date().toISOString().split('T')[0];

const PublicClinicPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [clinic, setClinic] = useState<PublicClinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<PublicDoctor | null>(null);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<string[]>([]);
  const [scheduleConfigured, setScheduleConfigured] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<PublicBookingConfirmation | null>(null);

  useEffect(() => {
    if (!slug) return;
    getPublicClinic(slug)
      .then((data) => {
        setClinic(data);
        if (data.doctors.length === 1) setSelectedDoctor(data.doctors[0]);
        if (data.services.length === 1) setSelectedService(data.services[0]);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug || !selectedDoctor) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot(null);
    getPublicSlots(slug, selectedDoctor.id, date)
      .then((data) => {
        setSlots(data.slots);
        setScheduleConfigured(data.scheduleConfigured !== false);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [slug, selectedDoctor, date]);

  // Services visible for the selected doctor: clinic-wide (no providerId) + doctor-specific
  const availableServices = clinic
    ? clinic.services.filter(
        (s) => !selectedDoctor || !s.providerId || s.providerId === selectedDoctor.id
      )
    : [];

  const handleDoctorSelect = (doctor: PublicDoctor) => {
    setSelectedDoctor(doctor);
    if (selectedService && selectedService.providerId && selectedService.providerId !== doctor.id) {
      setSelectedService(null);
    }
  };

  const handleConfirm = async () => {
    if (!slug || !selectedDoctor || !selectedService || !selectedSlot) return;
    if (!patientName.trim() || !patientPhone.trim()) {
      setError('Please enter your name and phone number');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await createPublicBooking(slug, {
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        date,
        time: selectedSlot.slice(0, 5),
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
      });
      setConfirmation(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not book this slot. Please try another time.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic not found</h1>
          <p className="text-gray-600">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-1">Appointment Confirmed</h1>
          <p className="text-gray-600 mb-6">{confirmation.clinicName}</p>
          <div className="text-left bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <p><span className="text-gray-500">Doctor:</span> <span className="font-medium">{confirmation.doctorName}</span></p>
            <p><span className="text-gray-500">Service:</span> <span className="font-medium">{confirmation.serviceName}</span></p>
            <p><span className="text-gray-500">Date:</span> <span className="font-medium">{confirmation.date}</span></p>
            <p><span className="text-gray-500">Time:</span> <span className="font-medium">{confirmation.time}</span></p>
          </div>
        </div>
      </div>
    );
  }

  const canBook = selectedDoctor && selectedService && selectedSlot;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clinic header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          {clinic.logoUrl ? (
            <img src={clinic.logoUrl} alt={clinic.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              {clinic.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{clinic.name}</h1>
            {clinic.specialization && <p className="text-sm text-gray-500">{clinic.specialization}</p>}
            <div className="flex gap-4 mt-1 text-xs text-gray-500">
              {clinic.address && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{clinic.address}</span>
              )}
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`} className="flex items-center gap-1 text-blue-600">
                  <Phone className="w-3 h-3" />{clinic.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {clinic.doctors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            Online booking isn't set up for this clinic yet. Please call {clinic.phone || 'the clinic'} to book an appointment.
          </div>
        ) : (
          <>
            {/* Doctor selection */}
            <section className="bg-white rounded-lg shadow p-5">
              <h2 className="font-semibold text-gray-900 mb-3">1. Choose a doctor</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clinic.doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className={`text-left px-4 py-4 rounded-lg border transition-colors ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{doctor.name}</p>
                    {doctor.qualifications && <p className="text-xs text-gray-500">{doctor.qualifications}</p>}
                  </button>
                ))}
              </div>
            </section>

            {/* Service selection */}
            <section className="bg-white rounded-lg shadow p-5">
              <h2 className="font-semibold text-gray-900 mb-3">2. Choose a service</h2>
              {!selectedDoctor ? (
                <p className="text-sm text-gray-500">Select a doctor first to see their services.</p>
              ) : availableServices.length === 0 ? (
                <p className="text-sm text-gray-500">No services are bookable online with {selectedDoctor.name}.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`text-left px-4 py-4 rounded-lg border transition-colors ${
                        selectedService?.id === service.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500">
                        {service.durationMinutes ? `${service.durationMinutes} min` : ''}
                        {service.price ? ` · ₹${service.price}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Date & slot selection */}
            <section className="bg-white rounded-lg shadow p-5">
              <h2 className="font-semibold text-gray-900 mb-3">3. Choose date & time</h2>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={date}
                  min={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!selectedDoctor ? (
                <p className="text-sm text-gray-500">Select a doctor to see available times.</p>
              ) : slotsLoading ? (
                <p className="text-sm text-gray-500">Loading available times...</p>
              ) : !scheduleConfigured ? (
                <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {selectedDoctor.name} isn't set up for online booking yet.
                  {clinic.phone && (
                    <> Please call <a href={`tel:${clinic.phone}`} className="text-blue-600 font-medium">{clinic.phone}</a> to book.</>
                  )}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500">No slots available on this date. Try another date.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-2 py-3 rounded-lg border text-sm flex items-center justify-center gap-1 transition-colors ${
                        selectedSlot === slot
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {slot.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Patient details */}
            {canBook && (
              <section className="bg-white rounded-lg shadow p-5">
                <h2 className="font-semibold text-gray-900 mb-3">4. Your details</h2>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-gray-700">
                  <span className="font-medium">{selectedDoctor?.name}</span> · {selectedService?.name} · {date} at {selectedSlot?.slice(0, 5)}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full name"
                    autoComplete="name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Phone number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </section>
            )}
          </>
        )}
      </div>

      <footer className="py-6 text-center text-xs text-gray-400">
        Powered by Bookzi
      </footer>
    </div>
  );
};

export default PublicClinicPage;
