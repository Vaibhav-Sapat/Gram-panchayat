import { useState } from 'react';
import type { User } from '../types';
import { store } from '../data/store';
import {
  Card, StatusBadge, Timeline, Button, Modal, FormField,
  Textarea, Input, InfoGrid, SectionHeader, Icons,
} from '../components/shared';

interface Props {
  appId: string;
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type ModalType = 'approve' | 'reject' | 'correction' | 'certificate' | null;

const docTypeLabels: Record<string, string> = {
  hospital_birth_report: 'Hospital / Birth Report',
  parent_id_proof: 'Parent Identity Proof',
  address_proof: 'Address Proof',
  discharge_document: 'Hospital Discharge Summary',
  other_document: 'Other Document',
  medical_death_report: 'Medical / Death Report',
  applicant_id_proof: 'Applicant Identity Proof',
  deceased_document: "Deceased Person's Document",
};

export default function StaffReview({ appId, currentUser, onNavigate, showToast }: Props) {
  const [modal, setModal] = useState<ModalType>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const app = store.getApplicationById(appId);
  const owner = app ? store.getUserById(app.userId) : null;

  if (!app || !owner) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-[var(--muted-foreground)]">Application not found.</p>
        <button onClick={() => onNavigate('staff-dashboard')} className="mt-4 text-[var(--primary)] hover:underline text-sm">← Back to Dashboard</button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: 'under_verification' | 'under_review' | 'approved' | 'rejected' | 'correction_required', extraRemarks?: string) => {
    setLoading(true);
    setTimeout(() => {
      store.updateApplicationStatus(app.id, newStatus, currentUser, extraRemarks || remarks);

      // Notifications
      const notifMessages: Record<string, string> = {
        under_verification: `Your ${app.serviceType} certificate application ${app.applicationNumber} is now under verification.`,
        under_review: `Your ${app.serviceType} certificate application ${app.applicationNumber} is under final review.`,
        approved: `Your ${app.serviceType} certificate application ${app.applicationNumber} has been approved.`,
        rejected: `Your ${app.serviceType} certificate application ${app.applicationNumber} has been rejected. Reason: ${extraRemarks}`,
        correction_required: `Correction required for your application ${app.applicationNumber}: ${extraRemarks}`,
      };

      const notifTypes: Record<string, 'info' | 'success' | 'error' | 'warning'> = {
        under_verification: 'info', under_review: 'info', approved: 'success', rejected: 'error', correction_required: 'warning',
      };

      store.addNotification({
        userId: owner.id,
        applicationId: app.id,
        message: notifMessages[newStatus],
        isRead: false,
        createdAt: new Date().toISOString(),
        type: notifTypes[newStatus],
      });

      store.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: `STATUS_CHANGE_${newStatus.toUpperCase()}`,
        applicationId: app.id,
        timestamp: new Date().toISOString(),
        details: `Status changed to ${newStatus}`,
      });

      setLoading(false);
      setModal(null);
      setRemarks('');
      setCorrectionReason('');
      setRejectionReason('');
      setRefreshKey(k => k + 1);
      showToast('Application status updated successfully.', 'success');
    }, 600);
  };

  const handleIssueCertificate = () => {
    if (!certNumber.trim()) { showToast('Please enter a certificate number.', 'error'); return; }
    setLoading(true);
    setTimeout(() => {
      store.addCertificate(app.id, certNumber, currentUser.name);
      store.addNotification({
        userId: owner.id,
        applicationId: app.id,
        message: `Your ${app.serviceType} certificate (No: ${certNumber}) is now available for download. Application: ${app.applicationNumber}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'success',
      });
      store.addAuditLog({ userId: currentUser.id, userName: currentUser.name, action: 'CERTIFICATE_ISSUE', applicationId: app.id, timestamp: new Date().toISOString(), details: `Certificate ${certNumber} issued` });
      setLoading(false);
      setModal(null);
      setCertNumber('');
      setRefreshKey(k => k + 1);
      showToast('Certificate issued and notified to citizen.', 'success');
    }, 600);
  };

  const handleVerifyDoc = (docId: string, status: 'verified' | 'rejected') => {
    store.updateDocumentVerification(docId, status);
    setRefreshKey(k => k + 1);
    showToast(`Document marked as ${status}.`, 'success');
  };

  // Re-fetch after updates
  const currentApp = store.getApplicationById(appId)!;

  const birthInfo = currentApp.birthDetails ? [
    { label: "Child's Name", value: currentApp.birthDetails.childName },
    { label: 'Date of Birth', value: currentApp.birthDetails.dateOfBirth },
    { label: 'Time of Birth', value: currentApp.birthDetails.timeOfBirth || '—' },
    { label: 'Gender', value: currentApp.birthDetails.gender },
    { label: 'Place of Birth', value: currentApp.birthDetails.placeOfBirth },
    { label: "Father's Name", value: currentApp.birthDetails.fatherName },
    { label: "Mother's Name", value: currentApp.birthDetails.motherName },
    { label: 'Parents Mobile', value: currentApp.birthDetails.parentsMobile },
    { label: 'Birth Address', value: currentApp.birthDetails.birthAddress },
    { label: 'Permanent Address', value: currentApp.birthDetails.permanentAddress },
  ] : [];

  const deathInfo = currentApp.deathDetails ? [
    { label: 'Deceased Name', value: currentApp.deathDetails.deceasedName },
    { label: 'Date of Death', value: currentApp.deathDetails.dateOfDeath },
    { label: 'Time of Death', value: currentApp.deathDetails.timeOfDeath || '—' },
    { label: 'Gender', value: currentApp.deathDetails.gender },
    { label: 'Place of Death', value: currentApp.deathDetails.placeOfDeath },
    { label: 'Age at Death', value: currentApp.deathDetails.ageAtDeath || '—' },
    { label: 'Hospital', value: currentApp.deathDetails.hospitalName || '—' },
    { label: 'Doctor', value: currentApp.deathDetails.doctorName || '—' },
    { label: 'Address', value: currentApp.deathDetails.address },
    { label: 'Relation Details', value: currentApp.deathDetails.relationDetails || '—' },
  ] : [];

  const canVerify = ['submitted', 'resubmitted'].includes(currentApp.status);
  const canRequestCorrection = ['submitted', 'under_verification', 'resubmitted'].includes(currentApp.status);
  const canApprove = ['under_verification', 'under_review'].includes(currentApp.status);
  const canReject = !['rejected', 'certificate_available'].includes(currentApp.status);
  const canIssueCert = currentApp.status === 'approved';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" key={refreshKey}>
      {/* Back */}
      <button onClick={() => onNavigate('staff-dashboard')} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 mb-6">
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--foreground)]">Application Review</h1>
          <p className="font-mono text-sm text-[var(--primary)] font-semibold mt-0.5">{currentApp.applicationNumber}</p>
        </div>
        <StatusBadge status={currentApp.status} />
      </div>

      <div className="flex flex-col gap-6">
        {/* Action Buttons */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-[var(--foreground)] mb-3">Actions</p>
          <div className="flex flex-wrap gap-2">
            {canVerify && (
              <Button variant="secondary" onClick={() => handleStatusChange('under_verification', 'Documents received and under verification')}>
                Start Verification
              </Button>
            )}
            {canRequestCorrection && (
              <button
                onClick={() => setModal('correction')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
              >
                Request Correction
              </button>
            )}
            {canApprove && (
              <Button variant="success" onClick={() => setModal('approve')}>
                Approve Application
              </Button>
            )}
            {canReject && (
              <Button variant="danger" onClick={() => setModal('reject')}>
                Reject Application
              </Button>
            )}
            {canIssueCert && (
              <Button onClick={() => setModal('certificate')}>
                Mark Certificate Ready
              </Button>
            )}
          </div>

          {currentApp.status === 'certificate_available' && currentApp.certificate && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-green-700 font-semibold">Certificate Ready</span>
              <span className="font-mono text-green-700">— {currentApp.certificate.certificateNumber}</span>
              <span className="text-green-600 ml-1">· {new Date(currentApp.certificate.issuedAt).toLocaleDateString('en-IN')}</span>
            </div>
          )}

          {currentApp.status === 'rejected' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
              <span className="text-red-700 font-semibold">Rejected: </span>
              <span className="text-red-600">{currentApp.rejectionReason}</span>
            </div>
          )}
        </Card>

        {/* Applicant Info */}
        <Card className="p-5">
          <SectionHeader title="Applicant Information" />
          <InfoGrid items={[
            { label: 'Name', value: owner.name },
            { label: 'Mobile', value: owner.mobile },
            { label: 'Email', value: owner.email },
            { label: 'Service', value: `${currentApp.serviceType.charAt(0).toUpperCase() + currentApp.serviceType.slice(1)} Certificate` },
          ]} />
        </Card>

        {/* Certificate Details */}
        <Card className="p-5">
          <SectionHeader title={currentApp.serviceType === 'birth' ? 'Birth Details' : 'Death Details'} />
          <InfoGrid items={currentApp.serviceType === 'birth' ? birthInfo : deathInfo} />
        </Card>

        {/* Documents */}
        <Card className="p-5">
          <SectionHeader title="Uploaded Documents" subtitle={`${currentApp.documents.length} document${currentApp.documents.length !== 1 ? 's' : ''} uploaded`} />
          {currentApp.documents.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No documents uploaded.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {currentApp.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between gap-3 bg-[var(--muted)] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icons.doc />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">{docTypeLabels[doc.documentType] || doc.documentType}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{doc.fileName} · {(doc.fileSize / 1024).toFixed(0)}KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      doc.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                      doc.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {doc.verificationStatus.charAt(0).toUpperCase() + doc.verificationStatus.slice(1)}
                    </span>
                    {doc.verificationStatus === 'pending' && (
                      <>
                        <button onClick={() => handleVerifyDoc(doc.id, 'verified')} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors">
                          Verify
                        </button>
                        <button onClick={() => handleVerifyDoc(doc.id, 'rejected')} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors">
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* History */}
        <Card className="p-5">
          <SectionHeader title="Application Timeline" />
          <Timeline entries={currentApp.statusHistory.map(h => ({
            status: h.newStatus,
            timestamp: h.timestamp,
            changedByName: h.changedByName,
            remarks: h.remarks,
          }))} />
        </Card>
      </div>

      {/* Modals */}
      {modal === 'approve' && (
        <Modal title="Approve Application" onClose={() => setModal(null)}>
          <p className="text-sm text-[var(--foreground)] mb-4">
            Are you sure you want to approve application <strong className="font-mono">{currentApp.applicationNumber}</strong>?
          </p>
          <FormField label="Remarks (optional)">
            <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Add any remarks..." />
          </FormField>
          <div className="flex gap-3 mt-5">
            <Button variant="ghost" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
            <Button variant="success" onClick={() => handleStatusChange('approved', remarks || 'Application approved')} disabled={loading} className="flex-1">
              {loading ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </div>
        </Modal>
      )}

      {modal === 'reject' && (
        <Modal title="Reject Application" onClose={() => setModal(null)}>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">Please provide a reason for rejection. This will be visible to the applicant.</p>
          <FormField label="Rejection Reason" required>
            <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} placeholder="Explain clearly why this application is being rejected..." />
          </FormField>
          <div className="flex gap-3 mt-5">
            <Button variant="ghost" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => { if (!rejectionReason.trim()) { showToast('Rejection reason is required.', 'error'); return; } handleStatusChange('rejected', rejectionReason); }} disabled={loading} className="flex-1">
              {loading ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </div>
        </Modal>
      )}

      {modal === 'correction' && (
        <Modal title="Request Correction" onClose={() => setModal(null)}>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">Specify what needs to be corrected. The citizen will be notified.</p>
          <FormField label="Correction Instructions" required>
            <Textarea value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} rows={4} placeholder="E.g., Please upload a clearer copy of the identity document..." />
          </FormField>
          <div className="flex gap-3 mt-5">
            <Button variant="ghost" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
            <button
              onClick={() => { if (!correctionReason.trim()) { showToast('Please enter correction instructions.', 'error'); return; } handleStatusChange('correction_required', correctionReason); }}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send to Citizen'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'certificate' && (
        <Modal title="Mark Certificate as Ready" onClose={() => setModal(null)}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-700">
            This will notify the citizen that their certificate is ready for collection at the Panchayat office. No digital certificate will be generated.
          </div>
          <FormField label="Certificate Number" required>
            <Input value={certNumber} onChange={e => setCertNumber(e.target.value)} placeholder="E.g., PUN/BIRTH/2026/001234" />
          </FormField>
          <div className="mt-4 flex gap-3">
            <Button variant="ghost" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
            <Button onClick={handleIssueCertificate} disabled={loading} className="flex-1">
              {loading ? 'Updating...' : 'Mark as Ready'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
