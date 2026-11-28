import api from './api';

export const clinicalFeatureEnabled = import.meta.env.VITE_CLINICAL_FEATURES_ENABLED === 'true';

export type ClinicalVisitStatus = 'DRAFT' | 'FINALIZED';
export type ClinicalPrescriptionStatus =
  | 'DRAFT'
  | 'PREPARED_FOR_SIGNATURE'
  | 'PHYSICALLY_SIGNED_HANDED_OVER'
  | 'SIGNED_COPY_UPLOADED'
  | 'SIGNED_COPY_ATTESTED'
  | 'SUPERSEDED';

export interface DoctorProfessionalProfile {
  providerId: string;
  registeredName: string;
  qualifications: string;
  registrationNumber: string;
  registrationCouncil: string;
  specialty: string | null;
  practitionerCategory: 'DENTIST' | 'MEDICAL_DOCTOR' | 'OTHER';
  practiceAddress: string;
  practicePinCode: string;
  emergencyContactNumber: string;
  credentialStatus: 'DOCTOR_ATTESTED_NOT_VERIFIED';
  credentialAttestedAt: string;
}

export interface DoctorProfessionalProfileRequest extends Omit<DoctorProfessionalProfile,
  'providerId' | 'credentialStatus' | 'credentialAttestedAt'> {
  doctorAttestationAccepted: boolean;
}

export interface ClinicalVisit {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientDateOfBirth: string | null;
  patientGender: string | null;
  providerName: string;
  encounterAt: string;
  status: ClinicalVisitStatus;
  chiefComplaint: string | null;
  historyOfPresentIllness: string | null;
  relevantMedicalHistory: string | null;
  allergyInformation: string | null;
  examinationFindings: string | null;
  assessmentOrDiagnosis: string | null;
  treatmentPerformed: string | null;
  investigationsOrRecommendations: string | null;
  patientAdvice: string | null;
  followUpDate: string | null;
  doctorUserId: string;
  finalizedAt: string | null;
  version: number;
  addenda: ClinicalVisitAddendum[];
}

export interface ClinicalVisitAddendum {
  id: string;
  reason: string;
  content: string;
  authorUserId: string;
  createdAt: string;
}

export interface ClinicalVisitDraft {
  version: number;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  relevantMedicalHistory: string;
  allergyInformation: string;
  examinationFindings: string;
  assessmentOrDiagnosis: string;
  treatmentPerformed: string;
  investigationsOrRecommendations: string;
  patientAdvice: string;
  followUpDate: string | null;
}

export interface ClinicalMedicationItem {
  id?: string;
  position?: number;
  medicineName: string;
  strength: string | null;
  dosageForm: string | null;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  timingInstructions: string | null;
  patientInstructions: string | null;
}

export interface ClinicalPrescription {
  id: string;
  visitId: string;
  status: ClinicalPrescriptionStatus;
  versionNumber: number;
  supersedesPrescriptionId: string | null;
  correctionReason: string | null;
  patientAge: number | null;
  patientGender: string | null;
  createdAt: string;
  preparedAt: string | null;
  preparedDocumentAvailable: boolean;
  signedCopyAvailable: boolean;
  version: number;
  items: ClinicalMedicationItem[];
}

export interface PrescriptionReview {
  readyToPrepare: boolean;
  missingRequirements: string[];
}

export interface ClinicalHistoryItem {
  id: string;
  appointmentId: string;
  encounterAt: string;
  status: ClinicalVisitStatus;
  providerName: string;
  chiefComplaint: string | null;
  hasPrescription: boolean;
  latestPrescriptionStatus: ClinicalPrescriptionStatus | null;
}

const emptyMedicationItem = (): ClinicalMedicationItem => ({
  medicineName: '',
  strength: '',
  dosageForm: '',
  dose: '',
  route: '',
  frequency: '',
  duration: '',
  quantity: '',
  timingInstructions: '',
  patientInstructions: '',
});

export const createEmptyMedicationItem = emptyMedicationItem;

export const startOrResumeClinicalVisit = async (appointmentId: string): Promise<ClinicalVisit> => {
  const response = await api.post<ClinicalVisit>(`/api/clinical/appointments/${appointmentId}/visits`);
  return response.data;
};

export const getClinicalVisit = async (visitId: string): Promise<ClinicalVisit> => {
  const response = await api.get<ClinicalVisit>(`/api/clinical/visits/${visitId}`);
  return response.data;
};

export const updateClinicalVisit = async (
  visitId: string,
  request: ClinicalVisitDraft,
): Promise<ClinicalVisit> => {
  const response = await api.put<ClinicalVisit>(`/api/clinical/visits/${visitId}`, request);
  return response.data;
};

export const finalizeClinicalVisit = async (visitId: string, version: number): Promise<ClinicalVisit> => {
  const response = await api.post<ClinicalVisit>(`/api/clinical/visits/${visitId}/finalize`, { version });
  return response.data;
};

export const getVisitPrescriptions = async (visitId: string): Promise<ClinicalPrescription[]> => {
  const response = await api.get<ClinicalPrescription[]>(`/api/clinical/visits/${visitId}/prescriptions`);
  return response.data;
};

export const createPrescriptionDraft = async (visitId: string): Promise<ClinicalPrescription> => {
  const response = await api.post<ClinicalPrescription>(`/api/clinical/visits/${visitId}/prescriptions`, {});
  return response.data;
};

export const updatePrescriptionDraft = async (
  prescriptionId: string,
  prescription: ClinicalPrescription,
): Promise<ClinicalPrescription> => {
  const response = await api.put<ClinicalPrescription>(`/api/prescriptions/${prescriptionId}`, {
    version: prescription.version,
    patientAge: prescription.patientAge,
    patientGender: prescription.patientGender,
    items: prescription.items.map((item) => ({
      medicineName: item.medicineName,
      strength: item.strength,
      dosageForm: item.dosageForm,
      dose: item.dose,
      route: item.route,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      timingInstructions: item.timingInstructions,
      patientInstructions: item.patientInstructions,
    })),
  });
  return response.data;
};

export const reviewPrescription = async (prescriptionId: string): Promise<PrescriptionReview> => {
  const response = await api.get<PrescriptionReview>(`/api/prescriptions/${prescriptionId}/review`);
  return response.data;
};

export const preparePrescription = async (prescriptionId: string): Promise<ClinicalPrescription> => {
  const response = await api.post<ClinicalPrescription>(`/api/prescriptions/${prescriptionId}/prepare`);
  return response.data;
};

export const confirmPhysicalHandover = async (
  prescriptionId: string,
  currentPassword: string,
): Promise<ClinicalPrescription> => {
  const response = await api.post<ClinicalPrescription>(`/api/prescriptions/${prescriptionId}/physical-handover`, {
    currentPassword,
    physicallySignedAndHandedOver: true,
  });
  return response.data;
};

export const uploadSignedPrescriptionCopy = async (
  prescriptionId: string,
  file: File,
): Promise<ClinicalPrescription> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ClinicalPrescription>(
    `/api/prescriptions/${prescriptionId}/signed-copy`,
    formData,
  );
  return response.data;
};

export const attestSignedPrescriptionCopy = async (
  prescriptionId: string,
  currentPassword: string,
): Promise<ClinicalPrescription> => {
  const response = await api.post<ClinicalPrescription>(
    `/api/prescriptions/${prescriptionId}/signed-copy/attest`,
    { currentPassword, matchingPhysicallySignedCopy: true },
  );
  return response.data;
};

export const createPrescriptionReplacement = async (
  prescriptionId: string,
  correctionReason: string,
): Promise<ClinicalPrescription> => {
  const response = await api.post<ClinicalPrescription>(`/api/prescriptions/${prescriptionId}/replacement`, {
    correctionReason,
  });
  return response.data;
};

export const getDoctorProfessionalProfile = async (): Promise<DoctorProfessionalProfile> => {
  const response = await api.get<DoctorProfessionalProfile>('/api/clinical/profile');
  return response.data;
};

export const saveDoctorProfessionalProfile = async (
  profile: DoctorProfessionalProfileRequest,
): Promise<DoctorProfessionalProfile> => {
  const response = await api.put<DoctorProfessionalProfile>('/api/clinical/profile', profile);
  return response.data;
};

export const downloadClinicalPdf = async (path: string): Promise<Blob> => {
  const response = await api.get<Blob>(path, { responseType: 'blob' });
  return response.data;
};

export const getPatientClinicalHistory = async (patientId: string): Promise<ClinicalHistoryItem[]> => {
  const response = await api.get<{ content: ClinicalHistoryItem[] }>(
    `/api/clinical/patients/${patientId}/history`,
  );
  return response.data.content;
};
