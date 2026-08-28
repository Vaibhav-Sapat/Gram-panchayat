export type UserRole = 'citizen' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export type ServiceType = 'birth' | 'death';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_verification'
  | 'correction_required'
  | 'resubmitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'certificate_available';

export interface BirthDetails {
  childName: string;
  dateOfBirth: string;
  timeOfBirth: string;
  gender: string;
  placeOfBirth: string;
  birthAddress: string;
  fatherName: string;
  motherName: string;
  fatherIdNumber: string;
  motherIdNumber: string;
  parentsMobile: string;
  permanentAddress: string;
}

export interface DeathDetails {
  deceasedName: string;
  dateOfDeath: string;
  timeOfDeath: string;
  placeOfDeath: string;
  ageAtDeath: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  relationDetails: string;
  hospitalName: string;
  doctorName: string;
  additionalInfo: string;
}

export interface DocumentFile {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  fileDataUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  isMandatory: boolean;
}

export interface Certificate {
  id: string;
  applicationId: string;
  certificateNumber: string;
  issuedAt: string;
  issuedBy: string;
  fileDataUrl?: string;
}

export interface StatusHistoryEntry {
  id: string;
  applicationId: string;
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedBy: string;
  changedByName: string;
  remarks: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  applicationId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  applicationId?: string;
  timestamp: string;
  details: string;
}

export interface Application {
  id: string;
  applicationNumber: string;
  userId: string;
  serviceType: ServiceType;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  remarks: string;
  correctionReason: string;
  rejectionReason: string;
  birthDetails?: BirthDetails;
  deathDetails?: DeathDetails;
  documents: DocumentFile[];
  certificate?: Certificate;
  statusHistory: StatusHistoryEntry[];
}

export interface ApplicantInfo {
  name: string;
  relationship: string;
  mobile: string;
  email: string;
  address: string;
}

export interface DocumentConfig {
  id: string;
  serviceType: ServiceType;
  documentType: string;
  label: string;
  isMandatory: boolean;
  description: string;
}

export interface AppState {
  currentUser: User | null;
  currentPage: string;
  pageParams: Record<string, string>;
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  language: 'en' | 'hi' | 'mr';
}
