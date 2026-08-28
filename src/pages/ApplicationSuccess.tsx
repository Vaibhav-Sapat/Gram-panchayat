import { useState } from 'react';
import { Button, Icons } from '../components/shared';
import type { User } from '../types';

interface Props {
  applicationNumber: string;
  serviceType: string;
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function ApplicationSuccess({ applicationNumber, serviceType, onNavigate }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(applicationNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">Application Submitted!</h1>
          <p className="text-[var(--muted-foreground)]">Your application has been received and is being processed.</p>
        </div>

        {/* Application ID card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden mb-6">
          <div className="bg-[var(--primary)] px-6 py-4 text-white text-center">
            <p className="text-sm opacity-80 mb-1">{serviceType === 'birth' ? 'Birth' : 'Death'} Certificate Application</p>
            <p className="font-display font-bold text-xl">Application Submitted</p>
          </div>

          <div className="p-6">
            <div className="bg-[var(--muted)] rounded-xl p-4 text-center mb-4">
              <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">YOUR APPLICATION ID</p>
              <p className="font-mono font-bold text-xl text-[var(--primary)] tracking-wide">{applicationNumber}</p>
              <button
                onClick={handleCopy}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] font-medium transition-colors"
              >
                <Icons.copy />
                {copied ? 'Copied!' : 'Copy Application ID'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                <p className="text-xs text-[var(--muted-foreground)]">Submission Date</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                <p className="text-xs text-[var(--muted-foreground)]">Current Status</p>
                <p className="text-sm font-semibold text-blue-600">Submitted</p>
              </div>
              <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                <p className="text-xs text-[var(--muted-foreground)]">Service Type</p>
                <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{serviceType} Certificate</p>
              </div>
              <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                <p className="text-xs text-[var(--muted-foreground)]">Expected Time</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">7–10 Working Days</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
              <p className="text-xs font-semibold text-amber-800 mb-1">Important</p>
              <p className="text-xs text-amber-700">Please save your Application ID. You will need it to track the status of your application.</p>
            </div>

            {/* Status timeline preview */}
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-3">What happens next?</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Application Received', done: true },
                  { label: 'Document Verification by Staff', done: false },
                  { label: 'Application Review', done: false },
                  { label: 'Approval & Certificate Ready Notification', done: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${s.done ? 'bg-green-500 text-white' : 'bg-[var(--border)] text-[var(--muted-foreground)]'}`}>
                      {s.done ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs ${s.done ? 'text-green-700 font-semibold' : 'text-[var(--muted-foreground)]'}`}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onNavigate('track', { appNum: applicationNumber })}
            className="flex-1"
          >
            Track Application
          </Button>
          <Button
            variant="ghost"
            onClick={() => onNavigate('citizen-dashboard')}
            className="flex-1"
          >
            Go to Dashboard
          </Button>
        </div>

        <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
          You will receive notifications about your application status.
        </p>
      </div>
    </div>
  );
}
