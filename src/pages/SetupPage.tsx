import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, setOnboardingStatus } from '../lib/auth';
import api, { createStaff } from '../lib/api';

interface ClinicProfile {
  phone: string;
  address: string;
  specialization: string;
}

interface DoctorDetails {
  doctorName: string;
  qualifications: string;
  photoUrl?: string;
}

interface DoctorsList {
  doctors: DoctorDetails[];
}

interface ConsultationType {
  name: string;
  price: number;
  duration: number;
}

interface WorkingHour {
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface WorkingHours {
  [day: string]: WorkingHour;
}

interface WhatsAppSetup {
  whatsappPhoneNumber?: string;
  whatsappConnected: boolean;
  skipWhatsapp: boolean;
}

const SetupPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step data
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>({
    phone: '',
    address: '',
    specialization: ''
  });

  const [doctorDetails, setDoctorDetails] = useState<DoctorsList>({
    doctors: [{ doctorName: '', qualifications: '', photoUrl: '' }]
  });

  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([
    { name: 'In-Person', price: 500, duration: 30 },
  ]);

  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { startTime: '09:00', endTime: '17:00', isActive: true },
    tuesday: { startTime: '09:00', endTime: '17:00', isActive: true },
    wednesday: { startTime: '09:00', endTime: '17:00', isActive: true },
    thursday: { startTime: '09:00', endTime: '17:00', isActive: true },
    friday: { startTime: '09:00', endTime: '17:00', isActive: true },
    saturday: { startTime: '09:00', endTime: '13:00', isActive: true },
    sunday: { startTime: '', endTime: '', isActive: false },
  });

  const [whatsappSetup, setWhatsAppSetup] = useState<WhatsAppSetup>({
    whatsappPhoneNumber: '',
    whatsappConnected: false,
    skipWhatsapp: false
  });

  // Check if user is authenticated
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSaveStep = async (stepNumber: number, endpoint: string, payload: any) => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post(`/api/onboarding/${endpoint}`, payload);

      // Update localStorage with current onboarding status
      if (response.data.status) {
        setOnboardingStatus(response.data.status);
      }

      // Mark step as completed
      if (!completedSteps.includes(stepNumber)) {
        setCompletedSteps([...completedSteps, stepNumber]);
      }

      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    let success = false;

    switch (currentStep) {
      case 1:
        // Validate clinic profile
        if (!clinicProfile.phone || !clinicProfile.address || !clinicProfile.specialization) {
          setError('Please fill in all required fields');
          return;
        }
        success = await handleSaveStep(1, 'clinic-profile', clinicProfile);
        break;
      case 2:
        // Validate doctor details and create staff members
        const validDoctors = doctorDetails.doctors.filter(d => d.doctorName && d.qualifications);
        if (validDoctors.length === 0) {
          setError('Please add at least one doctor with name and qualifications');
          return;
        }
        
        try {
          // Create all staff members
          for (const doctor of validDoctors) {
            await createStaff({
              name: doctor.doctorName,
              role: 'DOCTOR',
              qualifications: doctor.qualifications,
              isActive: true
            });
          }
          
          // Save to old onboarding endpoint for backward compatibility (use first doctor)
          success = await handleSaveStep(2, 'doctor-details', validDoctors[0]);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to create doctor profiles');
          return;
        }
        break;
      case 3:
        // Validate consultation types
        if (consultationTypes.length === 0) {
          setError('Please add at least one consultation type');
          return;
        }
        success = await handleSaveStep(3, 'consultation-types', { consultationTypes });
        break;
      case 4:
        // Validate working hours
        const hasActiveDay = Object.values(workingHours).some(h => h.isActive);
        if (!hasActiveDay) {
          setError('Please select at least one working day');
          return;
        }
        success = await handleSaveStep(4, 'working-hours', { workingHours });
        break;
      case 5:
        // WhatsApp setup is optional
        success = await handleSaveStep(5, 'whatsapp', whatsappSetup);
        break;
    }

    if (success && currentStep < 5) {
      setCurrentStep(currentStep + 1);
      setError('');
    } else if (success && currentStep === 5) {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/onboarding/complete');
      // Update localStorage with completed status
      if (response.data.status === 'COMPLETED') {
        setOnboardingStatus('COMPLETED');
      }
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to complete setup';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipForNow = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      // Call skip API for current step
      await api.post(`/api/onboarding/skip-step?stepNumber=${currentStep}`);

      // Mark step as completed so we can move forward
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }

      // Move to next step or complete if on last step
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        // If skipping step 5 (WhatsApp), complete onboarding
        await completeOnboarding();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to skip step';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Clinic Profile', description: 'Basic clinic information' },
    { number: 2, title: 'Doctor Details', description: 'Your professional information' },
    { number: 3, title: 'Consultation Types', description: 'Services you offer' },
    { number: 4, title: 'Working Hours', description: 'Your availability' },
    { number: 5, title: 'WhatsApp (Optional)', description: 'Connect your WhatsApp' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Clinic Setup</h1>
          <p className="text-gray-600">Let's get your clinic ready to accept appointments</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step.number
                        ? 'bg-blue-600 text-white'
                        : completedSteps.includes(step.number)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {completedSteps.includes(step.number) ? (
                      <span>✓</span>
                    ) : (
                      step.number
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center hidden sm:block">
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    completedSteps.includes(step.number) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step 1: Clinic Profile */}
          {currentStep === 1 && (
            <ClinicProfileStep
              data={clinicProfile}
              onChange={setClinicProfile}
            />
          )}

          {/* Step 2: Doctor Details */}
          {currentStep === 2 && (
            <DoctorDetailsStep
              data={doctorDetails}
              onChange={setDoctorDetails}
            />
          )}

          {/* Step 3: Consultation Types */}
          {currentStep === 3 && (
            <ConsultationTypesStep
              data={consultationTypes}
              onChange={setConsultationTypes}
            />
          )}

          {/* Step 4: Working Hours */}
          {currentStep === 4 && (
            <WorkingHoursStep
              data={workingHours}
              onChange={setWorkingHours}
            />
          )}

          {/* Step 5: WhatsApp Setup */}
          {currentStep === 5 && (
            <WhatsAppSetupStep
              data={whatsappSetup}
              onChange={setWhatsAppSetup}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-semibold ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Back
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleSkipForNow}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-semibold"
              >
                Skip for now
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : currentStep === 5 ? (
                  'Complete Setup'
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const ClinicProfileStep = ({
  data,
  onChange
}: {
  data: ClinicProfile;
  onChange: (data: ClinicProfile) => void;
}) => {
  const specializations = [
    'General Medicine', 'Dermatology', 'Dental', 'Pediatrics', 
    'Physiotherapy', 'ENT', 'Ophthalmology', 'Orthopedics',
    'Gynecology', 'Cardiology'
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Clinic Profile</h2>
      <p className="text-gray-600 mb-6">Tell us about your clinic</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinic Address *
          </label>
          <textarea
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="Street, City, State, PIN"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialization *
          </label>
          <select
            value={data.specialization}
            onChange={(e) => onChange({ ...data, specialization: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select specialization</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const DoctorDetailsStep = ({
  data,
  onChange
}: {
  data: DoctorsList;
  onChange: (data: DoctorsList) => void;
}) => {
  const addDoctor = () => {
    onChange({
      doctors: [...data.doctors, { doctorName: '', qualifications: '', photoUrl: '' }]
    });
  };

  const removeDoctor = (index: number) => {
    if (data.doctors.length === 1) return; // Keep at least one
    const newDoctors = data.doctors.filter((_, i) => i !== index);
    onChange({ doctors: newDoctors });
  };

  const updateDoctor = (index: number, field: keyof DoctorDetails, value: string) => {
    const newDoctors = [...data.doctors];
    newDoctors[index] = { ...newDoctors[index], [field]: value };
    onChange({ doctors: newDoctors });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add Doctors</h2>
          <p className="text-gray-600 mt-1">Add all doctors who will provide consultations</p>
        </div>
        <button
          type="button"
          onClick={addDoctor}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Add Another Doctor
        </button>
      </div>

      <div className="space-y-6">
        {data.doctors.map((doctor, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
            {data.doctors.length > 1 && (
              <button
                type="button"
                onClick={() => removeDoctor(index)}
                className="absolute top-4 right-4 text-red-600 hover:text-red-700 text-sm"
              >
                ✕ Remove
              </button>
            )}
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Doctor {index + 1}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  value={doctor.doctorName}
                  onChange={(e) => updateDoctor(index, 'doctorName', e.target.value)}
                  placeholder="Dr. John Smith"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualifications *
                </label>
                <input
                  type="text"
                  value={doctor.qualifications}
                  onChange={(e) => updateDoctor(index, 'qualifications', e.target.value)}
                  placeholder="MBBS, MD (Medicine)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> You can add more doctors later from Settings → Team & Staff
        </p>
      </div>
    </div>
  );
};

const ConsultationTypesStep = ({
  data,
  onChange
}: {
  data: ConsultationType[];
  onChange: (data: ConsultationType[]) => void;
}) => {
  const addType = () => {
    onChange([...data, { name: '', price: 0, duration: 30 }]);
  };

  const removeType = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateType = (index: number, field: keyof ConsultationType, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Consultation Types</h2>
      <p className="text-gray-600 mb-4">Define the services your clinic offers</p>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Quick Setup:</strong> These services will be available for all doctors. 
          You can assign services to specific doctors later in Settings → Team & Staff.
        </p>
      </div>

      <div className="space-y-4">
        {data.map((type, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={type.name}
                onChange={(e) => updateType(index, 'name', e.target.value)}
                placeholder="Type (e.g., In-Person)"
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="number"
                value={type.price}
                onChange={(e) => updateType(index, 'price', parseInt(e.target.value))}
                placeholder="Price (₹)"
                className="px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={type.duration}
                  onChange={(e) => updateType(index, 'duration', parseInt(e.target.value))}
                  placeholder="Minutes"
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={() => removeType(index)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <button
          onClick={addType}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
        >
          + Add Consultation Type
        </button>
      </div>
    </div>
  );
};

const WorkingHoursStep = ({
  data,
  onChange
}: {
  data: WorkingHours;
  onChange: (data: WorkingHours) => void;
}) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const updateDay = (day: string, field: keyof WorkingHour, value: any) => {
    onChange({
      ...data,
      [day]: { ...data[day], [field]: value }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Working Hours</h2>
      <p className="text-gray-600 mb-4">Set your clinic's general operating hours</p>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Quick Setup:</strong> These are default clinic hours. 
          You can set individual schedules for each doctor later in Settings → Team & Staff.
        </p>
      </div>

      <div className="space-y-3">
        {days.map((day) => (
          <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
            <input
              type="checkbox"
              checked={data[day].isActive}
              onChange={(e) => updateDay(day, 'isActive', e.target.checked)}
              className="w-5 h-5"
            />
            <span className="w-24 font-medium capitalize">{day}</span>
            {data[day].isActive && (
              <>
                <input
                  type="time"
                  value={data[day].startTime}
                  onChange={(e) => updateDay(day, 'startTime', e.target.value)}
                  className="px-3 py-2 border rounded"
                />
                <span>to</span>
                <input
                  type="time"
                  value={data[day].endTime}
                  onChange={(e) => updateDay(day, 'endTime', e.target.value)}
                  className="px-3 py-2 border rounded"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const WhatsAppSetupStep = ({
  data,
  onChange
}: {
  data: WhatsAppSetup;
  onChange: (data: WhatsAppSetup) => void;
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Setup (Optional)</h2>
      <p className="text-gray-600 mb-6">Connect WhatsApp to automate appointment confirmations</p>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            You can skip this for now and configure WhatsApp later from Settings
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.skipWhatsapp}
              onChange={(e) => onChange({ ...data, skipWhatsapp: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-gray-700">Skip WhatsApp setup</span>
          </label>
        </div>

        {!data.skipWhatsapp && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Phone Number
              </label>
              <input
                type="tel"
                value={data.whatsappPhoneNumber || ''}
                onChange={(e) => onChange({ ...data, whatsappPhoneNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SetupPage;
