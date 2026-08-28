import type {
  User,
  Application,
  Notification,
  AuditLog,
  DocumentConfig,
  DocumentFile,
  StatusHistoryEntry,
  ApplicationStatus,
} from '../types';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

// Simple in-memory store with localStorage persistence
const STORAGE_KEY = 'gp_portal_data';

interface StoreData {
  users: User[];
  applications: Application[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  documentConfigs: DocumentConfig[];
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function generateAppNumber(serviceType: 'birth' | 'death'): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900000) + 100000);
  return `GP-${serviceType.toUpperCase()}-${year}-${seq}`;
}

const defaultDocConfigs: DocumentConfig[] = [
  { id: 'b1', serviceType: 'birth', documentType: 'hospital_birth_report', label: 'Hospital / Birth Report', isMandatory: true, description: 'Certificate or report from hospital confirming birth' },
  { id: 'b2', serviceType: 'birth', documentType: 'parent_id_proof', label: 'Parent Identity Proof', isMandatory: true, description: 'Aadhaar / Voter ID / Passport of either parent' },
  { id: 'b3', serviceType: 'birth', documentType: 'address_proof', label: 'Address Proof', isMandatory: true, description: 'Utility bill / Ration card / Bank passbook' },
  { id: 'b4', serviceType: 'birth', documentType: 'discharge_document', label: 'Hospital Discharge Summary', isMandatory: false, description: 'Discharge summary if birth occurred in hospital' },
  { id: 'b5', serviceType: 'birth', documentType: 'other_document', label: 'Other Supporting Document', isMandatory: false, description: 'Any other document required by authority' },
  { id: 'd1', serviceType: 'death', documentType: 'medical_death_report', label: 'Medical / Death Report', isMandatory: true, description: 'Death certificate or report from hospital / doctor' },
  { id: 'd2', serviceType: 'death', documentType: 'applicant_id_proof', label: 'Applicant Identity Proof', isMandatory: true, description: 'Aadhaar / Voter ID / Passport of applicant' },
  { id: 'd3', serviceType: 'death', documentType: 'deceased_document', label: 'Deceased Person\'s Identity Document', isMandatory: false, description: 'Any identity document of the deceased' },
  { id: 'd4', serviceType: 'death', documentType: 'address_proof', label: 'Address Proof', isMandatory: true, description: 'Utility bill / Ration card confirming address' },
  { id: 'd5', serviceType: 'death', documentType: 'other_document', label: 'Other Supporting Document', isMandatory: false, description: 'Any other document required by authority' },
];

function createDemoData(): StoreData {
  const now = new Date().toISOString();
  const d = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

  const users: User[] = [
    { id: 'u1', name: 'Ramesh Kumar', mobile: '9876543210', email: 'citizen@demo.local', passwordHash: 'demo123', role: 'citizen', createdAt: d(30), isActive: true },
    { id: 'u2', name: 'Sunita Devi', mobile: '9876543211', email: 'citizen2@demo.local', passwordHash: 'demo123', role: 'citizen', createdAt: d(25), isActive: true },
    { id: 'u3', name: 'Rajesh Patil', mobile: '9876500001', email: 'staff@demo.local', passwordHash: 'demo123', role: 'staff', createdAt: d(60), isActive: true },
    { id: 'u4', name: 'Anita Sharma', mobile: '9876500002', email: 'admin@demo.local', passwordHash: 'demo123', role: 'admin', createdAt: d(90), isActive: true },
  ];

  const birthHistory: StatusHistoryEntry[] = [
    { id: 'sh1', applicationId: 'app1', oldStatus: null, newStatus: 'submitted', changedBy: 'u1', changedByName: 'Ramesh Kumar', remarks: 'Application submitted by citizen', timestamp: d(5) },
    { id: 'sh2', applicationId: 'app1', oldStatus: 'submitted', newStatus: 'under_verification', changedBy: 'u3', changedByName: 'Rajesh Patil', remarks: 'Documents under verification', timestamp: d(4) },
    { id: 'sh3', applicationId: 'app1', oldStatus: 'under_verification', newStatus: 'approved', changedBy: 'u3', changedByName: 'Rajesh Patil', remarks: 'All documents verified. Application approved.', timestamp: d(3) },
    { id: 'sh4', applicationId: 'app1', oldStatus: 'approved', newStatus: 'certificate_available', changedBy: 'u3', changedByName: 'Rajesh Patil', remarks: 'Certificate issued and uploaded', timestamp: d(2) },
  ];

  const deathHistory: StatusHistoryEntry[] = [
    { id: 'sh5', applicationId: 'app2', oldStatus: null, newStatus: 'submitted', changedBy: 'u2', changedByName: 'Sunita Devi', remarks: 'Application submitted by citizen', timestamp: d(8) },
    { id: 'sh6', applicationId: 'app2', oldStatus: 'submitted', newStatus: 'under_verification', changedBy: 'u3', changedByName: 'Rajesh Patil', remarks: 'Documents received and under verification', timestamp: d(7) },
    { id: 'sh7', applicationId: 'app2', oldStatus: 'under_verification', newStatus: 'correction_required', changedBy: 'u3', changedByName: 'Rajesh Patil', remarks: 'Please upload a clearer copy of the medical death certificate. The current document is not legible.', timestamp: d(6) },
    { id: 'sh8', applicationId: 'app2', oldStatus: 'correction_required', newStatus: 'resubmitted', changedBy: 'u2', changedByName: 'Sunita Devi', remarks: 'Uploaded corrected document', timestamp: d(4) },
    { id: 'sh9', applicationId: 'app2', oldStatus: 'resubmitted', newStatus: 'under_review', changedBy: 'u3', changedByName: 'Rajesh Patil', remarks: 'Application under final review', timestamp: d(3) },
  ];

  const pendingHistory: StatusHistoryEntry[] = [
    { id: 'sh10', applicationId: 'app3', oldStatus: null, newStatus: 'submitted', changedBy: 'u1', changedByName: 'Ramesh Kumar', remarks: 'Application submitted', timestamp: d(1) },
  ];

  const rejectedHistory: StatusHistoryEntry[] = [
    { id: 'sh11', applicationId: 'app4', oldStatus: null, newStatus: 'submitted', changedBy: 'u1', changedByName: 'Ramesh Kumar', remarks: 'Application submitted', timestamp: d(15) },
    { id: 'sh12', applicationId: 'app4', oldStatus: 'submitted', newStatus: 'under_verification', changedBy: 'u3', changedByName: 'Rajesh Patil', remarks: 'Documents under verification', timestamp: d(14) },
    { id: 'sh13', applicationId: 'app4', oldStatus: 'under_verification', newStatus: 'rejected', changedBy: 'u3', changedByName: 'Rajesh Patil', remarks: 'Application rejected: Insufficient proof of birth location. The hospital documents provided do not match the stated place of birth.', timestamp: d(13) },
  ];

  const applications: Application[] = [
    {
      id: 'app1',
      applicationNumber: 'GP-BIRTH-2026-100234',
      userId: 'u1',
      serviceType: 'birth',
      status: 'certificate_available',
      submittedAt: d(5),
      updatedAt: d(2),
      remarks: 'All documents verified.',
      correctionReason: '',
      rejectionReason: '',
      birthDetails: {
        childName: 'Arjun Kumar',
        dateOfBirth: '2026-07-15',
        timeOfBirth: '09:30',
        gender: 'male',
        placeOfBirth: 'City Hospital, Pune',
        birthAddress: 'Ward No. 5, Village Ranjangaon, Dist. Pune',
        fatherName: 'Ramesh Kumar',
        motherName: 'Priya Kumar',
        fatherIdNumber: 'AADHAAR-1234-5678-9012',
        motherIdNumber: 'AADHAAR-9876-5432-1098',
        parentsMobile: '9876543210',
        permanentAddress: 'House No. 12, Main Road, Ranjangaon, Pune - 412220',
      },
      documents: [
        { id: 'doc1', applicationId: 'app1', documentType: 'hospital_birth_report', fileName: 'birth_report.pdf', fileSize: 204800, fileDataUrl: '', verificationStatus: 'verified', uploadedAt: d(5), isMandatory: true },
        { id: 'doc2', applicationId: 'app1', documentType: 'parent_id_proof', fileName: 'aadhaar_father.pdf', fileSize: 153600, fileDataUrl: '', verificationStatus: 'verified', uploadedAt: d(5), isMandatory: true },
        { id: 'doc3', applicationId: 'app1', documentType: 'address_proof', fileName: 'address_proof.pdf', fileSize: 102400, fileDataUrl: '', verificationStatus: 'verified', uploadedAt: d(5), isMandatory: true },
      ],
      certificate: {
        id: 'cert1',
        applicationId: 'app1',
        certificateNumber: 'PUN/BIRTH/2026/001234',
        issuedAt: d(2),
        issuedBy: 'Rajesh Patil',
      },
      statusHistory: birthHistory,
    },
    {
      id: 'app2',
      applicationNumber: 'GP-DEATH-2026-200891',
      userId: 'u2',
      serviceType: 'death',
      status: 'under_review',
      submittedAt: d(8),
      updatedAt: d(3),
      remarks: 'Application under final review',
      correctionReason: 'Please upload a clearer copy of the medical death certificate.',
      rejectionReason: '',
      deathDetails: {
        deceasedName: 'Mohan Devi',
        dateOfDeath: '2026-08-01',
        timeOfDeath: '14:20',
        placeOfDeath: 'Home',
        ageAtDeath: '72',
        dateOfBirth: '1954-03-10',
        gender: 'female',
        address: 'House No. 45, Gandhi Nagar, Nashik',
        relationDetails: 'Husband: Vijay Devi',
        hospitalName: 'N/A',
        doctorName: 'Dr. Prakash Kulkarni',
        additionalInfo: 'Death due to natural causes',
      },
      documents: [
        { id: 'doc4', applicationId: 'app2', documentType: 'medical_death_report', fileName: 'death_certificate.pdf', fileSize: 307200, fileDataUrl: '', verificationStatus: 'verified', uploadedAt: d(4), isMandatory: true },
        { id: 'doc5', applicationId: 'app2', documentType: 'applicant_id_proof', fileName: 'sunita_aadhaar.pdf', fileSize: 153600, fileDataUrl: '', verificationStatus: 'verified', uploadedAt: d(8), isMandatory: true },
        { id: 'doc6', applicationId: 'app2', documentType: 'address_proof', fileName: 'address_doc.pdf', fileSize: 102400, fileDataUrl: '', verificationStatus: 'pending', uploadedAt: d(8), isMandatory: true },
      ],
      statusHistory: deathHistory,
    },
    {
      id: 'app3',
      applicationNumber: 'GP-BIRTH-2026-300567',
      userId: 'u1',
      serviceType: 'birth',
      status: 'submitted',
      submittedAt: d(1),
      updatedAt: d(1),
      remarks: '',
      correctionReason: '',
      rejectionReason: '',
      birthDetails: {
        childName: 'Kavya Kumar',
        dateOfBirth: '2026-08-10',
        timeOfBirth: '06:15',
        gender: 'female',
        placeOfBirth: 'District Hospital, Pune',
        birthAddress: 'Ward No. 3, Village Ranjangaon',
        fatherName: 'Ramesh Kumar',
        motherName: 'Priya Kumar',
        fatherIdNumber: 'AADHAAR-1234-5678-9012',
        motherIdNumber: 'AADHAAR-9876-5432-1098',
        parentsMobile: '9876543210',
        permanentAddress: 'House No. 12, Main Road, Ranjangaon, Pune - 412220',
      },
      documents: [
        { id: 'doc7', applicationId: 'app3', documentType: 'hospital_birth_report', fileName: 'kavya_birth.pdf', fileSize: 204800, fileDataUrl: '', verificationStatus: 'pending', uploadedAt: d(1), isMandatory: true },
        { id: 'doc8', applicationId: 'app3', documentType: 'parent_id_proof', fileName: 'parent_id.pdf', fileSize: 153600, fileDataUrl: '', verificationStatus: 'pending', uploadedAt: d(1), isMandatory: true },
        { id: 'doc9', applicationId: 'app3', documentType: 'address_proof', fileName: 'addr.pdf', fileSize: 102400, fileDataUrl: '', verificationStatus: 'pending', uploadedAt: d(1), isMandatory: true },
      ],
      statusHistory: pendingHistory,
    },
    {
      id: 'app4',
      applicationNumber: 'GP-BIRTH-2026-400123',
      userId: 'u1',
      serviceType: 'birth',
      status: 'rejected',
      submittedAt: d(15),
      updatedAt: d(13),
      remarks: '',
      correctionReason: '',
      rejectionReason: 'Insufficient proof of birth location. The hospital documents provided do not match the stated place of birth.',
      birthDetails: {
        childName: 'Test Child',
        dateOfBirth: '2026-07-28',
        timeOfBirth: '11:00',
        gender: 'male',
        placeOfBirth: 'PHC Ranjangaon',
        birthAddress: 'PHC Ranjangaon, Pune',
        fatherName: 'Ramesh Kumar',
        motherName: 'Priya Kumar',
        fatherIdNumber: '',
        motherIdNumber: '',
        parentsMobile: '9876543210',
        permanentAddress: 'House No. 12, Main Road, Ranjangaon, Pune',
      },
      documents: [],
      statusHistory: rejectedHistory,
    },
  ];

  const notifications: Notification[] = [
    { id: 'n1', userId: 'u1', applicationId: 'app1', message: 'Your Birth Certificate application GP-BIRTH-2026-100234 has been approved.', isRead: false, createdAt: d(3), type: 'success' },
    { id: 'n2', userId: 'u1', applicationId: 'app1', message: 'Certificate is now available for download. Application GP-BIRTH-2026-100234.', isRead: false, createdAt: d(2), type: 'success' },
    { id: 'n3', userId: 'u1', applicationId: 'app3', message: 'Your Birth Certificate application GP-BIRTH-2026-300567 has been submitted successfully.', isRead: true, createdAt: d(1), type: 'info' },
    { id: 'n4', userId: 'u1', applicationId: 'app4', message: 'Your Birth Certificate application GP-BIRTH-2026-400123 has been rejected. Reason: Insufficient proof of birth location.', isRead: true, createdAt: d(13), type: 'error' },
    { id: 'n5', userId: 'u2', applicationId: 'app2', message: 'Correction required for your Death Certificate application GP-DEATH-2026-200891. Please upload a clearer copy of the medical death certificate.', isRead: false, createdAt: d(6), type: 'warning' },
    { id: 'n6', userId: 'u2', applicationId: 'app2', message: 'Your Death Certificate application GP-DEATH-2026-200891 is now under final review.', isRead: true, createdAt: d(3), type: 'info' },
  ];

  const auditLogs: AuditLog[] = [
    { id: 'al1', userId: 'u1', userName: 'Ramesh Kumar', action: 'APPLICATION_SUBMIT', applicationId: 'app1', timestamp: d(5), details: 'Birth certificate application submitted' },
    { id: 'al2', userId: 'u3', userName: 'Rajesh Patil', action: 'STATUS_CHANGE', applicationId: 'app1', timestamp: d(4), details: 'Status changed to Under Verification' },
    { id: 'al3', userId: 'u3', userName: 'Rajesh Patil', action: 'APPLICATION_APPROVE', applicationId: 'app1', timestamp: d(3), details: 'Application approved' },
    { id: 'al4', userId: 'u3', userName: 'Rajesh Patil', action: 'CERTIFICATE_UPLOAD', applicationId: 'app1', timestamp: d(2), details: 'Certificate uploaded' },
    { id: 'al5', userId: 'u2', userName: 'Sunita Devi', action: 'APPLICATION_SUBMIT', applicationId: 'app2', timestamp: d(8), details: 'Death certificate application submitted' },
    { id: 'al6', userId: 'u3', userName: 'Rajesh Patil', action: 'CORRECTION_REQUEST', applicationId: 'app2', timestamp: d(6), details: 'Correction requested from citizen' },
    { id: 'al7', userId: 'u1', userName: 'Ramesh Kumar', action: 'USER_LOGIN', timestamp: now, details: 'User logged in' },
  ];

  return { users, applications, notifications, auditLogs, documentConfigs: defaultDocConfigs };
}

// Initialize store
let storeData: StoreData = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return createDemoData();
})();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
  } catch { /* ignore */ }
  void persistStoreData();
}

const collectionNames: (keyof StoreData)[] = ['users', 'applications', 'notifications', 'auditLogs', 'documentConfigs'];

function withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).filter(([, entry]) => entry !== undefined).map(([key, entry]) => [key, withoutUndefined(entry)]),
    );
  }
  return value;
}

async function persistStoreData() {
  try {
    await Promise.all(collectionNames.flatMap(name =>
      storeData[name].map(item => setDoc(doc(db, name, item.id), withoutUndefined(item) as Record<string, unknown>)),
    ));
  } catch (error) {
    console.error('Firebase write failed. Check Firestore rules and configuration.', error);
  }
}

export async function initializeStore() {
  try {
    const snapshots = await Promise.all(collectionNames.map(name => getDocs(collection(db, name))));
    const hasRemoteData = snapshots.some(snapshot => !snapshot.empty);

    if (hasRemoteData) {
      snapshots.forEach((snapshot, index) => {
        const name = collectionNames[index];
        storeData[name] = snapshot.docs.map(item => item.data()) as StoreData[typeof name];
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
    } else {
      await persistStoreData();
    }
  } catch (error) {
    console.error('Firebase read failed. Check Firestore rules and configuration.', error);
  }
}

export const store = {
  // Users
  getUsers: () => storeData.users,
  getUserById: (id: string) => storeData.users.find(u => u.id === id),
  getUserByEmail: (email: string) => storeData.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  authenticateUser: (email: string, password: string) => {
    const user = storeData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.passwordHash === password && user.isActive) return user;
    return null;
  },
  registerUser: (name: string, mobile: string, email: string, password: string, id = generateId()): User => {
    const user: User = {
      id,
      name,
      mobile,
      email,
      passwordHash: password,
      role: 'citizen',
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    storeData.users.push(user);
    save();
    return user;
  },
  updateUserStatus: (userId: string, isActive: boolean) => {
    const user = storeData.users.find(u => u.id === userId);
    if (user) { user.isActive = isActive; save(); }
  },

  // Applications
  getApplications: () => storeData.applications,
  getApplicationById: (id: string) => storeData.applications.find(a => a.id === id),
  getApplicationByNumber: (num: string) => storeData.applications.find(a => a.applicationNumber === num),
  getApplicationsByUser: (userId: string) => storeData.applications.filter(a => a.userId === userId),
  createApplication: (app: Omit<Application, 'id' | 'applicationNumber'>) => {
    const newApp: Application = {
      ...app,
      id: generateId(),
      applicationNumber: generateAppNumber(app.serviceType),
    };
    storeData.applications.push(newApp);
    save();
    return newApp;
  },
  updateApplicationStatus: (appId: string, newStatus: ApplicationStatus, changedBy: User, remarks: string) => {
    const app = storeData.applications.find(a => a.id === appId);
    if (!app) return;
    const oldStatus = app.status;
    app.status = newStatus;
    app.updatedAt = new Date().toISOString();
    if (remarks && newStatus === 'correction_required') app.correctionReason = remarks;
    if (remarks && newStatus === 'rejected') app.rejectionReason = remarks;
    if (remarks) app.remarks = remarks;
    const entry: StatusHistoryEntry = {
      id: generateId(),
      applicationId: appId,
      oldStatus,
      newStatus,
      changedBy: changedBy.id,
      changedByName: changedBy.name,
      remarks,
      timestamp: new Date().toISOString(),
    };
    app.statusHistory.push(entry);
    save();
    return app;
  },
  addCertificate: (appId: string, certNumber: string, issuedBy: string) => {
    const app = storeData.applications.find(a => a.id === appId);
    if (!app) return;
    app.certificate = {
      id: generateId(),
      applicationId: appId,
      certificateNumber: certNumber,
      issuedAt: new Date().toISOString(),
      issuedBy,
    };
    app.status = 'certificate_available';
    app.updatedAt = new Date().toISOString();
    const entry: StatusHistoryEntry = {
      id: generateId(),
      applicationId: appId,
      oldStatus: 'approved',
      newStatus: 'certificate_available',
      changedBy: 'system',
      changedByName: issuedBy,
      remarks: `Certificate ${certNumber} issued`,
      timestamp: new Date().toISOString(),
    };
    app.statusHistory.push(entry);
    save();
    return app;
  },
  addDocument: (appId: string, doc: Omit<DocumentFile, 'id'>) => {
    const app = storeData.applications.find(a => a.id === appId);
    if (!app) return;
    const newDoc = { ...doc, id: generateId() };
    app.documents.push(newDoc);
    save();
    return newDoc;
  },
  updateDocumentVerification: (docId: string, status: 'verified' | 'rejected') => {
    for (const app of storeData.applications) {
      const doc = app.documents.find(d => d.id === docId);
      if (doc) { doc.verificationStatus = status; save(); return; }
    }
  },

  // Notifications
  getNotificationsByUser: (userId: string) => storeData.notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  addNotification: (notification: Omit<Notification, 'id'>) => {
    const n = { ...notification, id: generateId() };
    storeData.notifications.push(n);
    save();
    return n;
  },
  markNotificationRead: (notifId: string) => {
    const n = storeData.notifications.find(n => n.id === notifId);
    if (n) { n.isRead = true; save(); }
  },
  markAllRead: (userId: string) => {
    storeData.notifications.filter(n => n.userId === userId).forEach(n => { n.isRead = true; });
    save();
  },

  // Audit logs
  getAuditLogs: () => storeData.auditLogs,
  addAuditLog: (log: Omit<AuditLog, 'id'>) => {
    const l = { ...log, id: generateId() };
    storeData.auditLogs.push(l);
    save();
  },

  // Document configs
  getDocumentConfigs: () => storeData.documentConfigs,
  getDocumentConfigsByService: (serviceType: 'birth' | 'death') => storeData.documentConfigs.filter(d => d.serviceType === serviceType),
  updateDocumentConfig: (id: string, isMandatory: boolean) => {
    const cfg = storeData.documentConfigs.find(d => d.id === id);
    if (cfg) { cfg.isMandatory = isMandatory; save(); }
  },

  // Stats
  getStats: () => {
    const apps = storeData.applications;
    return {
      total: apps.length,
      submitted: apps.filter(a => a.status === 'submitted').length,
      under_verification: apps.filter(a => a.status === 'under_verification').length,
      correction_required: apps.filter(a => a.status === 'correction_required').length,
      resubmitted: apps.filter(a => a.status === 'resubmitted').length,
      under_review: apps.filter(a => a.status === 'under_review').length,
      approved: apps.filter(a => ['approved', 'certificate_available'].includes(a.status)).length,
      rejected: apps.filter(a => a.status === 'rejected').length,
      birth: apps.filter(a => a.serviceType === 'birth').length,
      death: apps.filter(a => a.serviceType === 'death').length,
      certificate_available: apps.filter(a => a.status === 'certificate_available').length,
    };
  },

  resetToDemo: () => {
    storeData = createDemoData();
    save();
  },
};
