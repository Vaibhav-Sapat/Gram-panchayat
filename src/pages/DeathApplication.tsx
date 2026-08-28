import { useState } from 'react';
import type { User, DeathDetails, DocumentFile, ApplicationStatus } from '../types';
import { store } from '../data/store';
import {
  StepIndicator, FormField, Input, Select, Textarea, Button,
  DocumentUploadField, Card, SectionHeader,
} from '../components/shared';

interface Props {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const STEPS = ['Deceased Details', 'Death Information', 'Applicant Details', 'Documents', 'Review & Submit'];

interface ApplicantDetails { name: string; relationship: string; mobile: string; email: string; address: string; }

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => resolve((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  });
}

export default function DeathApplication({ currentUser, onNavigate, showToast }: Props) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [death, setDeath] = useState<DeathDetails>({
    deceasedName: '', dateOfDeath: '', timeOfDeath: '', placeOfDeath: '',
    ageAtDeath: '', dateOfBirth: '', gender: '', address: '',
    relationDetails: '', hospitalName: '', doctorName: '', additionalInfo: '',
  });

  const [applicant, setApplicant] = useState<ApplicantDetails>({
    name: currentUser.name, relationship: '', mobile: '', email: currentUser.email, address: '',
  });

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { file: File; dataUrl: string }>>({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const docConfigs = store.getDocumentConfigsByService('death');

  const setD = (field: keyof DeathDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDeath(d => ({ ...d, [field]: e.target.value }));
  const setA = (field: keyof ApplicantDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setApplicant(a => ({ ...a, [field]: e.target.value }));

  const validateStep0 = () => {
    const e: Record<string, string> = {};
    if (!death.deceasedName.trim()) e.deceasedName = "Please enter the deceased person's full name.";
    if (!death.dateOfDeath) e.dateOfDeath = 'Please enter the date of death.';
    if (!death.gender) e.gender = 'Please select gender.';
    if (!death.address.trim()) e.address = 'Please enter the address.';
    return e;
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!death.placeOfDeath.trim()) e.placeOfDeath = 'Please enter the place of death.';
    return e;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!applicant.name.trim()) e.aName = 'Please enter applicant name.';
    if (!applicant.relationship.trim()) e.relationship = 'Please enter relationship with deceased.';
    if (!applicant.mobile.trim()) e.mobile = 'Please enter mobile number.';
    else if (!/^[6-9]\d{9}$/.test(applicant.mobile)) e.mobile = 'Invalid mobile number.';
    if (!applicant.email.trim()) e.email = 'Please enter email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email)) e.email = 'Invalid email address.';
    if (!applicant.address.trim()) e.address = 'Please enter address.';
    return e;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    docConfigs.filter(d => d.isMandatory).forEach(d => {
      if (!uploadedDocs[d.documentType]) e[d.documentType] = `Please upload ${d.label}.`;
    });
    return e;
  };

  const nextStep = () => {
    let errs: Record<string, string> = {};
    if (step === 0) errs = validateStep0();
    else if (step === 1) errs = validateStep1();
    else if (step === 2) errs = validateStep2();
    else if (step === 3) errs = validateStep3();
    setErrors(errs);
    if (!Object.keys(errs).length) setStep(s => s + 1);
  };

  const handleFileUpload = async (docType: string, file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    setUploadedDocs(prev => ({ ...prev, [docType]: { file, dataUrl } }));
    setErrors(prev => { const e = { ...prev }; delete e[docType]; return e; });
  };

  const handleSubmit = () => {
    if (!agreed) { showToast('Please confirm that the information provided is correct.', 'error'); return; }
    setSubmitting(true);

    const docs: Omit<DocumentFile, 'id'>[] = Object.entries(uploadedDocs).map(([docType, { file, dataUrl }]) => {
      const cfg = docConfigs.find(d => d.documentType === docType);
      return {
        applicationId: '',
        documentType: docType,
        fileName: file.name,
        fileSize: file.size,
        fileDataUrl: dataUrl,
        verificationStatus: 'pending' as const,
        uploadedAt: new Date().toISOString(),
        isMandatory: cfg?.isMandatory ?? false,
      };
    });

    setTimeout(() => {
      const app = store.createApplication({
        userId: currentUser.id,
        serviceType: 'death',
        status: 'submitted' as ApplicationStatus,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        remarks: '',
        correctionReason: '',
        rejectionReason: '',
        deathDetails: death,
        documents: docs,
        statusHistory: [{
          id: Math.random().toString(36).slice(2),
          applicationId: '',
          oldStatus: null,
          newStatus: 'submitted',
          changedBy: currentUser.id,
          changedByName: currentUser.name,
          remarks: 'Application submitted by citizen',
          timestamp: new Date().toISOString(),
        }],
      });

      store.addNotification({
        userId: currentUser.id,
        applicationId: app.id,
        message: `Your Death Certificate application ${app.applicationNumber} has been submitted successfully.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'info',
      });

      store.addAuditLog({ userId: currentUser.id, userName: currentUser.name, action: 'APPLICATION_SUBMIT', applicationId: app.id, timestamp: new Date().toISOString(), details: 'Death certificate application submitted' });

      setSubmitting(false);
      onNavigate('application-success', { appNum: app.applicationNumber, service: 'death' });
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => onNavigate('citizen-dashboard')} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 mb-4">
          ← Back to Dashboard
        </button>
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">Death Certificate Application</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">Fill in all required details to submit your application.</p>
      </div>

      <StepIndicator steps={STEPS} currentStep={step} />

      <Card className="p-6">
        {step === 0 && (
          <div>
            <SectionHeader title="Deceased Person Details" subtitle="Enter the details of the deceased person." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Full Name of Deceased" error={errors.deceasedName} required>
                  <Input value={death.deceasedName} onChange={setD('deceasedName')} placeholder="Full name as per records" />
                </FormField>
              </div>
              <FormField label="Date of Death" error={errors.dateOfDeath} required>
                <Input type="date" value={death.dateOfDeath} onChange={setD('dateOfDeath')} max={new Date().toISOString().split('T')[0]} />
              </FormField>
              <FormField label="Time of Death">
                <Input type="time" value={death.timeOfDeath} onChange={setD('timeOfDeath')} />
              </FormField>
              <FormField label="Age at Death">
                <Input type="number" min="0" max="150" value={death.ageAtDeath} onChange={setD('ageAtDeath')} placeholder="Age in years" />
              </FormField>
              <FormField label="Date of Birth (if known)">
                <Input type="date" value={death.dateOfBirth} onChange={setD('dateOfBirth')} />
              </FormField>
              <FormField label="Gender" error={errors.gender} required>
                <Select value={death.gender} onChange={setD('gender')}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Permanent Address" error={errors.address} required>
                  <Textarea value={death.address} onChange={setD('address')} rows={2} placeholder="Full address of the deceased" />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField label="Father's / Husband's / Wife's Name">
                  <Input value={death.relationDetails} onChange={setD('relationDetails')} placeholder="Name and relationship" />
                </FormField>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <SectionHeader title="Death Information" subtitle="Provide additional information about the circumstances of death." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Place of Death" error={errors.placeOfDeath} required>
                  <Input value={death.placeOfDeath} onChange={setD('placeOfDeath')} placeholder="Hospital name / Home / etc." />
                </FormField>
              </div>
              <FormField label="Hospital / Medical Facility (if applicable)">
                <Input value={death.hospitalName} onChange={setD('hospitalName')} placeholder="Name of hospital" />
              </FormField>
              <FormField label="Attending Doctor / Medical Officer">
                <Input value={death.doctorName} onChange={setD('doctorName')} placeholder="Dr. Name" />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Additional Information">
                  <Textarea value={death.additionalInfo} onChange={setD('additionalInfo')} rows={3} placeholder="Any other relevant information required by the authority" />
                </FormField>
              </div>
              <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">Please do not include sensitive medical information beyond what is necessary. Only provide information as required by the local authority.</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <SectionHeader title="Applicant Details" subtitle="Enter your details as the person making this application." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Applicant Name" error={errors.aName} required>
                <Input value={applicant.name} onChange={setA('name')} placeholder="Your full name" />
              </FormField>
              <FormField label="Relationship with Deceased" error={errors.relationship} required>
                <Input value={applicant.relationship} onChange={setA('relationship')} placeholder="Son / Daughter / Spouse / etc." />
              </FormField>
              <FormField label="Mobile Number" error={errors.mobile} required>
                <Input type="tel" value={applicant.mobile} onChange={setA('mobile')} placeholder="10-digit mobile" maxLength={10} />
              </FormField>
              <FormField label="Email Address" error={errors.email} required>
                <Input type="email" value={applicant.email} onChange={setA('email')} placeholder="email@example.com" />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Applicant's Address" error={errors.address} required>
                  <Textarea value={applicant.address} onChange={setA('address')} rows={2} placeholder="Your full address" />
                </FormField>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <SectionHeader title="Upload Documents" subtitle="Upload the required supporting documents. PDF, JPG, PNG only (max 5MB each)." />
            <div className="flex flex-col gap-4">
              {docConfigs.map(cfg => (
                <DocumentUploadField
                  key={cfg.id}
                  label={cfg.label}
                  isMandatory={cfg.isMandatory}
                  description={cfg.description}
                  fileName={uploadedDocs[cfg.documentType]?.file.name}
                  onUpload={file => handleFileUpload(cfg.documentType, file)}
                  error={errors[cfg.documentType]}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <SectionHeader title="Review & Submit" subtitle="Please review all details before submitting." />
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">Deceased Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Name', death.deceasedName], ['Date of Death', death.dateOfDeath],
                    ['Gender', death.gender], ['Place of Death', death.placeOfDeath],
                    ['Age', death.ageAtDeath || '—'], ['Address', death.address],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-[var(--muted)] rounded-lg px-3 py-2">
                      <p className="text-xs text-[var(--muted-foreground)]">{l}</p>
                      <p className="text-sm font-medium text-[var(--foreground)] mt-0.5">{v || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">Uploaded Documents</p>
                <div className="flex flex-col gap-2">
                  {docConfigs.map(cfg => (
                    <div key={cfg.id} className="flex items-center gap-3 bg-[var(--muted)] rounded-lg px-3 py-2">
                      <span className={uploadedDocs[cfg.documentType] ? 'text-green-600' : 'text-gray-400'}>
                        {uploadedDocs[cfg.documentType] ? '✓' : '○'}
                      </span>
                      <span className="text-sm flex-1">{cfg.label}</span>
                      {uploadedDocs[cfg.documentType] && (
                        <span className="text-xs text-[var(--muted-foreground)] truncate max-w-32">{uploadedDocs[cfg.documentType].file.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer bg-blue-50 border border-blue-200 rounded-xl p-4">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--primary)]" />
                <p className="text-sm text-[var(--foreground)]">
                  I confirm that the information provided by me is correct and complete. I understand that providing false information may result in rejection.
                </p>
              </label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={() => step === 0 ? onNavigate('citizen-dashboard') : setStep(s => s - 1)}>
            {step === 0 ? 'Cancel' : '← Previous'}
          </Button>
          {step < 4 ? (
            <Button onClick={nextStep}>Next →</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !agreed} variant="success">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
