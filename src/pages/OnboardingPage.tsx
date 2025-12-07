import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Step interfaces
interface ClinicDetails {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialization: string;
  phone: string;
  address: string;
}

interface DoctorDetails {
  name: string;
  qualifications: string;
  photoUrl?: string;
}

interface ConsultationType {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface WorkingHours {
  [key: string]: { startTime: string; endTime: string; isActive: boolean };
}

interface WhatsAppSetup {
  phoneNumber: string;
  isConnected: boolean;
}

interface OnboardingData {
  clinic: ClinicDetails;
  doctor: DoctorDetails;
  consultationTypes: ConsultationType[];
  workingHours: WorkingHours;
  whatsapp: WhatsAppSetup;
  currentStep: number;
}

const STORAGE_KEY = 'bookzi_onboarding_progress';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load saved progress from localStorage
  const loadProgress = (): OnboardingData => {
    const defaultData: OnboardingData = {
      clinic: { name: '', email: '', password: '', confirmPassword: '', specialization: '', phone: '', address: '' },
      doctor: { name: '', qualifications: '' },
      consultationTypes: [],
      workingHours: {
        monday: { startTime: '09:00', endTime: '17:00', isActive: true },
        tuesday: { startTime: '09:00', endTime: '17:00', isActive: true },
        wednesday: { startTime: '09:00', endTime: '17:00', isActive: true },
        thursday: { startTime: '09:00', endTime: '17:00', isActive: true },
        friday: { startTime: '09:00', endTime: '17:00', isActive: true },
        saturday: { startTime: '09:00', endTime: '13:00', isActive: true },
        sunday: { startTime: '', endTime: '', isActive: false },
      },
      whatsapp: { phoneNumber: '', isConnected: false },
      currentStep: 1,
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const cachedData = JSON.parse(saved);
        
        // Merge cached data with defaults, ensuring workingHours have correct isActive values
        // If cached working hours have all isActive:false, it's old data - use defaults instead
        const workingHoursNeedsFix = cachedData.workingHours && 
          Object.entries(cachedData.workingHours).every(([day, hours]: [string, any]) => 
            day === 'sunday' || !hours.isActive
          );
        
        return {
          ...defaultData,
          ...cachedData,
          workingHours: workingHoursNeedsFix ? defaultData.workingHours : {
            ...defaultData.workingHours,
            ...cachedData.workingHours
          }
        };
      } catch (e) {
        console.error('Failed to parse cached onboarding data:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    return defaultData;
  };

  const [data, setData] = useState<OnboardingData>(loadProgress);

  // Save progress to localStorage whenever data changes
  useEffect(() => {
    const dataToSave = { ...data, currentStep };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [data, currentStep]);

  // Load saved step on mount
  useEffect(() => {
    const saved = loadProgress();
    if (saved.currentStep) {
      setCurrentStep(saved.currentStep);
    }
  }, []);

  const updateClinic = (clinic: Partial<ClinicDetails>) => {
    setData((prev) => ({ ...prev, clinic: { ...prev.clinic, ...clinic } }));
  };

  const updateDoctor = (doctor: Partial<DoctorDetails>) => {
    setData((prev) => ({ ...prev, doctor: { ...prev.doctor, ...doctor } }));
  };

  const updateConsultationTypes = (types: ConsultationType[]) => {
    setData((prev) => ({ ...prev, consultationTypes: types }));
  };

  const updateWorkingHours = (hours: WorkingHours) => {
    setData((prev) => ({ ...prev, workingHours: hours }));
  };

  const updateWhatsApp = (whatsapp: Partial<WhatsAppSetup>) => {
    setData((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, ...whatsapp } }));
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!data.clinic.name || !data.clinic.email || !data.clinic.password) {
        setError('Please fill in all required fields in Step 1');
        setIsSubmitting(false);
        setCurrentStep(1);
        return;
      }

      if (data.clinic.password !== data.clinic.confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        setCurrentStep(1);
        return;
      }

      if (!data.doctor.name || !data.doctor.qualifications) {
        setError('Please fill in all required fields in Step 2');
        setIsSubmitting(false);
        setCurrentStep(2);
        return;
      }

      if (data.consultationTypes.length === 0) {
        setError('Please add at least one consultation type in Step 3');
        setIsSubmitting(false);
        setCurrentStep(3);
        return;
      }

      // Prepare registration payload
      const payload = {
        clinicName: data.clinic.name,
        email: data.clinic.email,
        password: data.clinic.password,
        specialization: data.clinic.specialization,
        phone: data.clinic.phone,
        address: data.clinic.address,
        doctorName: data.doctor.name,
        qualifications: data.doctor.qualifications,
        photoUrl: data.doctor.photoUrl,
        consultationTypes: data.consultationTypes,
        workingHours: data.workingHours,
        whatsappPhoneNumber: data.whatsapp.phoneNumber,
        whatsappConnected: data.whatsapp.isConnected,
      };

      // Call registration API
      const response = await axios.post(`${API_BASE_URL}/api/auth/register-tenant`, payload);

      // Save token and user info
      const { token, userId, tenantId, role, email } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('tenantId', tenantId);
      localStorage.setItem('role', role);
      localStorage.setItem('email', email);

      // Initialize WhatsApp with Bookzi number (auto-assign)
      try {
        await axios.post(
          `${API_BASE_URL}/api/whatsapp/config/initialize`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log('✅ WhatsApp initialized with Bookzi number');
      } catch (whatsappError) {
        console.error('⚠️ WhatsApp initialization failed (non-critical):', whatsappError);
        // Continue even if WhatsApp fails - they can set it up later
      }

      // Clear onboarding progress
      localStorage.removeItem(STORAGE_KEY);

      // Show success screen
      setIsComplete(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Progress percentage
  const progress = ((currentStep - 1) / 5) * 100;

  // Celebration screen
  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
        <div className="text-center max-w-md">
          <div className="mb-8 flex justify-center">
            <CheckCircle className="h-24 w-24 text-green-500 animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Congratulations!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your clinic is now ready to accept appointments via WhatsApp!
          </p>
          <button
            onClick={goToDashboard}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Bookzi! Let's set up your clinic
          </h1>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of 6</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {[
              'Clinic',
              'Doctor',
              'Services',
              'Hours',
              'WhatsApp',
              'Test',
            ].map((label, index) => (
              <div
                key={label}
                className={`flex flex-col items-center ${
                  index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                    index + 1 < currentStep
                      ? 'bg-blue-600 text-white'
                      : index + 1 === currentStep
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1 < currentStep ? '✓' : index + 1}
                </div>
                <span className="text-xs hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {currentStep === 1 && (
            <Step1ClinicDetails data={data.clinic} onUpdate={updateClinic} />
          )}
          {currentStep === 2 && (
            <Step2DoctorDetails data={data.doctor} onUpdate={updateDoctor} />
          )}
          {currentStep === 3 && (
            <Step3ConsultationTypes
              data={data.consultationTypes}
              specialization={data.clinic.specialization}
              onUpdate={updateConsultationTypes}
            />
          )}
          {currentStep === 4 && (
            <Step4WorkingHours data={data.workingHours} onUpdate={updateWorkingHours} />
          )}
          {currentStep === 5 && (
            <Step5WhatsAppSetup data={data.whatsapp} onUpdate={updateWhatsApp} />
          )}
          {currentStep === 6 && <Step6TestBooking data={data} />}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-semibold ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Back
            </button>
            
            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg font-semibold ${
                  isSubmitting
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 1: Clinic Details
const Step1ClinicDetails = ({
  data,
  onUpdate,
}: {
  data: ClinicDetails;
  onUpdate: (data: Partial<ClinicDetails>) => void;
}) => {
  const specializations = [
    'General Medicine',
    'Dermatology',
    'Dental',
    'Pediatrics',
    'Physiotherapy',
    'ENT',
    'Ophthalmology',
    'Orthopedics',
    'Gynecology',
    'Cardiology',
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
      <p className="text-gray-600 mb-6">Create your clinic account and setup</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clinic Name *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Dr. Sharma's Clinic"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">You'll use this to log in</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={data.password}
              onChange={(e) => onUpdate({ password: e.target.value })}
              placeholder="Min 6 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={data.confirmPassword}
              onChange={(e) => onUpdate({ confirmPassword: e.target.value })}
              placeholder="Re-enter password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {data.password && data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="text-sm text-red-600">Passwords do not match</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specialization *
          </label>
          <select
            value={data.specialization}
            onChange={(e) => onUpdate({ specialization: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select specialization</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <textarea
            value={data.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            placeholder="Street, Area, City, State - PIN"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

// Step 2: Doctor Details
const Step2DoctorDetails = ({
  data,
  onUpdate,
}: {
  data: DoctorDetails;
  onUpdate: (data: Partial<DoctorDetails>) => void;
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Details</h2>
      <p className="text-gray-600 mb-6">Tell us about yourself</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doctor Name *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Dr. Rajesh Sharma"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qualifications *
          </label>
          <input
            type="text"
            value={data.qualifications}
            onChange={(e) => onUpdate({ qualifications: e.target.value })}
            placeholder="e.g., MBBS, MD (Dermatology)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Photo (Optional)
          </label>
          <div className="flex items-center space-x-4">
            {data.photoUrl && (
              <img
                src={data.photoUrl}
                alt="Doctor"
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                // TODO: Upload to server and get URL
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  onUpdate({ photoUrl: url });
                }
              }}
              className="text-sm text-gray-600"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This will be shown to patients when they book appointments
          </p>
        </div>
      </div>
    </div>
  );
};

// Step 3: Consultation Types
const Step3ConsultationTypes = ({
  data,
  specialization,
  onUpdate,
}: {
  data: ConsultationType[];
  specialization: string;
  onUpdate: (types: ConsultationType[]) => void;
}) => {
  // Predefined consultation types based on specialization
  const getDefaultTypes = (spec: string): ConsultationType[] => {
    const defaults: { [key: string]: ConsultationType[] } = {
      Dermatology: [
        { id: '1', name: 'Skin Consultation', price: 500, duration: 30 },
        { id: '2', name: 'Acne Treatment', price: 800, duration: 45 },
        { id: '3', name: 'Hair Fall Treatment', price: 1000, duration: 45 },
      ],
      Dental: [
        { id: '1', name: 'Check-up', price: 300, duration: 30 },
        { id: '2', name: 'Root Canal', price: 3000, duration: 60 },
        { id: '3', name: 'Teeth Cleaning', price: 800, duration: 30 },
        { id: '4', name: 'Braces Consultation', price: 500, duration: 45 },
      ],
      'General Medicine': [
        { id: '1', name: 'General Consultation', price: 500, duration: 30 },
        { id: '2', name: 'Follow-up Visit', price: 300, duration: 15 },
      ],
      Pediatrics: [
        { id: '1', name: 'Child Consultation', price: 600, duration: 30 },
        { id: '2', name: 'Vaccination', price: 200, duration: 15 },
      ],
    };
    return defaults[spec] || [
      { id: '1', name: 'General Consultation', price: 500, duration: 30 },
      { id: '2', name: 'Follow-up Visit', price: 300, duration: 15 },
    ];
  };

  // Initialize with defaults if empty
  useEffect(() => {
    if (data.length === 0 && specialization) {
      onUpdate(getDefaultTypes(specialization));
    }
  }, [specialization]);

  const addType = () => {
    const newType: ConsultationType = {
      id: Date.now().toString(),
      name: '',
      price: 500,
      duration: 30,
    };
    onUpdate([...data, newType]);
  };

  const updateType = (id: string, updates: Partial<ConsultationType>) => {
    onUpdate(
      data.map((type) => (type.id === id ? { ...type, ...updates } : type))
    );
  };

  const removeType = (id: string) => {
    onUpdate(data.filter((type) => type.id !== id));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Consultation Types</h2>
      <p className="text-gray-600 mb-6">
        Define the types of consultations you offer
      </p>

      <div className="space-y-4">
        {data.map((type) => (
          <div
            key={type.id}
            className="p-4 border border-gray-200 rounded-lg flex items-start space-x-4"
          >
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={type.name}
                onChange={(e) => updateType(type.id, { name: e.target.value })}
                placeholder="Service name"
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={type.price}
                onChange={(e) =>
                  updateType(type.id, { price: parseInt(e.target.value) })
                }
                placeholder="Price (₹)"
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={type.duration}
                onChange={(e) =>
                  updateType(type.id, { duration: parseInt(e.target.value) })
                }
                placeholder="Duration (mins)"
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={() => removeType(type.id)}
              className="text-red-600 hover:text-red-700 mt-2"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          onClick={addType}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          + Add Consultation Type
        </button>
      </div>
    </div>
  );
};

// Step 4: Working Hours
const Step4WorkingHours = ({
  data,
  onUpdate,
}: {
  data: WorkingHours;
  onUpdate: (hours: WorkingHours) => void;
}) => {
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const dayLabels: { [key: string]: string } = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  // Initialize with defaults if any day has missing data  
  useEffect(() => {
    let needsUpdate = false;
    const updatedHours = { ...data };
    
    days.forEach(day => {
      // Check if day data exists and has valid isActive value
      if (!data[day] || typeof data[day].isActive !== 'boolean') {
        needsUpdate = true;
        const isWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day);
        updatedHours[day] = {
          startTime: isWeekday || day === 'saturday' ? '09:00' : '',
          endTime: isWeekday ? '17:00' : day === 'saturday' ? '13:00' : '',
          isActive: day !== 'sunday'
        };
      }
    });
    
    if (needsUpdate) {
      console.log('Initializing working hours with defaults:', updatedHours);
      onUpdate(updatedHours);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDay = (
    day: string,
    updates: Partial<{ startTime: string; endTime: string; isActive: boolean }>
  ) => {
    onUpdate({
      ...data,
      [day]: { ...data[day], ...updates },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Working Hours</h2>
      <p className="text-gray-600 mb-6">Set your clinic's working hours</p>

      <div className="space-y-3">
        {days.map((day) => (
          <div
            key={day}
            className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg"
          >
            <div className="w-32">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data[day].isActive}
                  onChange={(e) => updateDay(day, { isActive: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium text-gray-700">
                  {dayLabels[day]}
                </span>
              </label>
            </div>

            {data[day].isActive && (
              <>
                <input
                  type="time"
                  value={data[day].startTime}
                  onChange={(e) => updateDay(day, { startTime: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={data[day].endTime}
                  onChange={(e) => updateDay(day, { endTime: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </>
            )}

            {!data[day].isActive && (
              <span className="text-gray-400 italic">Closed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Step 5: WhatsApp Setup
const Step5WhatsAppSetup = ({
  data,
  onUpdate,
}: {
  data: WhatsAppSetup;
  onUpdate: (data: Partial<WhatsAppSetup>) => void;
}) => {
  const [showManualSetup, setShowManualSetup] = useState(false);

  const handleGetBookziNumber = () => {
    // Mark as selected - actual initialization happens at Step 6 completion
    onUpdate({ phoneNumber: 'BOOKZI_PROVIDED', isConnected: true });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Setup</h2>
      <p className="text-gray-600 mb-6">
        Get your WhatsApp number instantly - we'll provide one for you!
      </p>

      {!showManualSetup ? (
        <div className="space-y-6">
          {/* Recommended: Auto-assign Bookzi number */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
                  ⚡
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  Recommended: Get Free Bookzi Number
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Start immediately with a WhatsApp number provided by Bookzi. No setup needed!
                </p>
                <ul className="space-y-2 text-sm text-blue-700 mb-4">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Instant activation - ready in seconds</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>30-day free trial included</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Switch to your own number anytime</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>₹3,499/month after trial (includes number)</span>
                  </li>
                </ul>
                <button
                  onClick={handleGetBookziNumber}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Continue with Free Bookzi Number →
                </button>
                <p className="text-xs text-blue-600 text-center mt-2">
                  Your number will be assigned when you complete onboarding
                </p>
              </div>
            </div>
          </div>

          {/* Alternative: Manual setup */}
          <div className="text-center">
            <button
              onClick={() => setShowManualSetup(true)}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Already have a WhatsApp Business number? Click here to configure it
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Manual setup form */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">📱</span>
              Use Your Own WhatsApp Business Number
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              You'll need to configure this in <strong>Settings → WhatsApp</strong> after completing onboarding.
              It takes 30-45 minutes to set up with Meta Business Suite.
            </p>
            
            <div className="border-t border-blue-300 pt-3 mt-3">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                📖 Need help with setup?
              </p>
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 underline font-medium"
              >
                View Complete Setup Guide →
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Business Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={data.phoneNumber === 'BOOKZI_PROVIDED' ? '' : data.phoneNumber}
                onChange={(e) => onUpdate({ phoneNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.isConnected}
                onChange={(e) => onUpdate({ isConnected: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm text-gray-700">
                I will configure WhatsApp in Settings after onboarding
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> With your own number, you'll pay only ₹2,999/month (save ₹500).
                Complete the setup in Settings → WhatsApp after onboarding.
              </p>
            </div>

            <button
              onClick={() => setShowManualSetup(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to recommended option
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Step 6: Test Booking
const Step6TestBooking = ({ data }: { data: OnboardingData }) => {
  const [testSent, setTestSent] = useState(false);

  const sendTestMessage = () => {
    // TODO: Implement actual test message sending
    console.log('Sending test message to:', data.whatsapp.phoneNumber);
    setTestSent(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Booking</h2>
      <p className="text-gray-600 mb-6">
        Let's test your setup with a sample booking
      </p>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-green-900 mb-4">✅ Setup Summary:</h3>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Clinic:</span>{' '}
            <span className="text-gray-600">{data.clinic.name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Specialization:</span>{' '}
            <span className="text-gray-600">{data.clinic.specialization}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Doctor:</span>{' '}
            <span className="text-gray-600">{data.doctor.name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Services:</span>{' '}
            <span className="text-gray-600">
              {data.consultationTypes.length} consultation types
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">WhatsApp:</span>{' '}
            <span className="text-gray-600">
              {data.whatsapp.isConnected ? '✓ Connected' : '⚠ Not connected'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Send a test message to your WhatsApp number to verify everything is
          working:
        </p>

        <button
          onClick={sendTestMessage}
          disabled={!data.whatsapp.isConnected || testSent}
          className={`w-full py-3 rounded-lg font-semibold ${
            !data.whatsapp.isConnected || testSent
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {testSent ? '✓ Test Message Sent!' : '📱 Send Test Message'}
        </button>

        {testSent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Check your WhatsApp! You should receive a test booking message.
              Reply to it to test the AI assistant.
            </p>
          </div>
        )}

        {!data.whatsapp.isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>WhatsApp not connected.</strong> You can skip the test for
              now and configure WhatsApp later from Settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
