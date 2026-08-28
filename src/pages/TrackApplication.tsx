import { useState } from 'react';
import type { Application } from '../types';
import { store } from '../data/store';
import { Card, StatusBadge, Timeline, FormField, Input, Button } from '../components/shared';

interface Props {
  initialAppNum?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function TrackApplication({ initialAppNum = '', onNavigate, showToast }: Props) {
  const [appNum, setAppNum] = useState(initialAppNum);
  const [mobile, setMobile] = useState('');
  const [app, setApp] = useState<Application | null>(null);
  const [searched, setSearched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSearch = () => {
    const e: Record<string, string> = {};
    if (!appNum.trim()) e.appNum = 'Please enter your Application ID.';
    if (!mobile.trim()) e.mobile = 'Please enter your registered mobile number.';
    else if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = 'Invalid mobile number.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const found = store.getApplicationByNumber(appNum.trim());
    setSearched(true);

    if (!found) {
      setApp(null);
      showToast('Application not found. Please check your Application ID.', 'error');
      return;
    }

    const owner = store.getUserById(found.userId);
    if (!owner || owner.mobile !== mobile) {
      setApp(null);
      showToast('Mobile number does not match. Please verify your details.', 'error');
      return;
    }

    setApp(found);
  };

  const statusSteps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_verification', label: 'Under Verification' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'certificate_available', label: 'Certificate Ready' },
  ];

  const getCurrentStep = (status: string) => {
    if (status === 'rejected') return -1;
    if (status === 'correction_required' || status === 'resubmitted') return 1;
    return statusSteps.findIndex(s => s.key === status);
  };

  const handleDownload = () => {
    showToast('Certificate download started (demo).', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 mx-auto bg-[var(--primary)] rounded-2xl flex items-center justify-center mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">Track Your Application</h1>
        <p className="text-[var(--muted-foreground)] text-sm">Enter your Application ID and registered mobile number to track your application status.</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Application ID" error={errors.appNum} required>
            <Input
              value={appNum}
              onChange={e => setAppNum(e.target.value.toUpperCase())}
              placeholder="GP-BIRTH-2026-000001"
              className="font-mono"
            />
          </FormField>
          <FormField label="Registered Mobile Number" error={errors.mobile} required>
            <Input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </FormField>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSearch} className="flex items-center gap-2">
            <Icons.search /> Search Application
          </Button>
        </div>
      </Card>

      {searched && !app && (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="font-semibold text-[var(--foreground)]">Application Not Found</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Please check your Application ID and mobile number, then try again.</p>
        </Card>
      )}

      {app && (
        <div className="flex flex-col gap-6">
          {/* Status Overview */}
          <Card className="overflow-hidden">
            <div className="bg-[var(--primary)] px-6 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm opacity-80">{app.serviceType === 'birth' ? 'Birth' : 'Death'} Certificate Application</p>
                  <p className="font-mono font-bold text-lg mt-0.5">{app.applicationNumber}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            </div>

            <div className="p-6">
              {/* Progress bar for normal flow */}
              {app.status !== 'rejected' && (
                <div className="mb-6">
                  <div className="flex items-center gap-0 mb-4 overflow-x-auto scrollbar-hide">
                    {statusSteps.map((s, i) => {
                      const currentIdx = getCurrentStep(app.status);
                      const isDone = i < currentIdx;
                      const isCurrent = i === currentIdx;
                      const isCorrectionFlow = app.status === 'correction_required' || app.status === 'resubmitted';

                      return (
                        <div key={s.key} className="flex items-center flex-1 min-w-0">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                              style={{
                                background: isDone ? '#16a34a' : isCurrent ? (isCorrectionFlow && i === 1 ? '#d97706' : 'var(--primary)') : 'white',
                                borderColor: isDone ? '#16a34a' : isCurrent ? (isCorrectionFlow && i === 1 ? '#d97706' : 'var(--primary)') : 'var(--border)',
                                color: isDone || isCurrent ? 'white' : 'var(--muted-foreground)',
                              }}
                            >
                              {isDone ? '✓' : i + 1}
                            </div>
                            <span className="text-[10px] mt-1 text-center font-medium hidden sm:block" style={{ maxWidth: '72px', color: isDone || isCurrent ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                              {isCorrectionFlow && i === 1 ? 'Correction' : s.label}
                            </span>
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className="flex-1 h-0.5 mx-1" style={{ background: isDone ? '#16a34a' : 'var(--border)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {app.status === 'correction_required' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                      <p className="font-semibold text-amber-800 mb-1">Correction Required</p>
                      <p className="text-amber-700">{app.correctionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {app.status === 'rejected' && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <p className="font-semibold text-red-700">Application Rejected</p>
                  </div>
                  <p className="text-sm text-red-600">{app.rejectionReason}</p>
                </div>
              )}

              {/* Application Details */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                  <p className="text-xs text-[var(--muted-foreground)]">Service</p>
                  <p className="text-sm font-semibold capitalize">{app.serviceType} Certificate</p>
                </div>
                <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                  <p className="text-xs text-[var(--muted-foreground)]">Submitted</p>
                  <p className="text-sm font-semibold">{new Date(app.submittedAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                  <p className="text-xs text-[var(--muted-foreground)]">Last Updated</p>
                  <p className="text-sm font-semibold">{new Date(app.updatedAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                  <p className="text-xs text-[var(--muted-foreground)]">Documents</p>
                  <p className="text-sm font-semibold">{app.documents.length} Uploaded</p>
                </div>
              </div>

              {app.status === 'certificate_available' && app.certificate && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="font-semibold text-green-800">Certificate is Ready</p>
                  </div>
                  <p className="text-sm text-green-700">Certificate No: <span className="font-mono font-bold">{app.certificate.certificateNumber}</span></p>
                  <p className="text-sm text-green-700 mt-1">Ready since: {new Date(app.certificate.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <div className="mt-3 p-3 bg-green-100 rounded-lg text-xs text-green-800">
                    Please visit the <strong>Gram Panchayat office</strong> with your Application ID to collect your physical certificate.
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t border-[var(--border)] pt-5">
                <p className="text-sm font-semibold text-[var(--foreground)] mb-4">Application Timeline</p>
                <Timeline entries={app.statusHistory.map(h => ({
                  status: h.newStatus,
                  timestamp: h.timestamp,
                  changedByName: h.changedByName,
                  remarks: h.remarks,
                }))} />
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Button variant="ghost" onClick={() => { setApp(null); setSearched(false); setAppNum(''); setMobile(''); }}>
              Track Another Application
            </Button>
          </div>
        </div>
      )}

      {/* Help note */}
      <div className="mt-8 bg-[var(--muted)] rounded-xl p-4 text-center">
        <p className="text-xs text-[var(--muted-foreground)]">
          For assistance, contact the Panchayat office. Bring your Application ID for faster service.
        </p>
      </div>
    </div>
  );
}
