import { type ReactNode, useEffect, useRef } from 'react';
import type { ApplicationStatus } from '../types';

// ── Status Badge ──────────────────────────────────────────────────────────────
const statusConfig: Record<ApplicationStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft:                 { label: 'Draft',               bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  submitted:             { label: 'Submitted',           bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  under_verification:    { label: 'Under Verification',  bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  correction_required:   { label: 'Correction Required', bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  resubmitted:           { label: 'Resubmitted',         bg: '#ede9fe', text: '#5b21b6', dot: '#8b5cf6' },
  under_review:          { label: 'Under Review',        bg: '#fef9c3', text: '#713f12', dot: '#eab308' },
  approved:              { label: 'Approved',            bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  rejected:              { label: 'Rejected',            bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  certificate_available: { label: 'Certificate Ready',  bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = statusConfig[status];
  return (
    <span style={{ background: cfg.bg, color: cfg.text }} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
      {cfg.label}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, maxWidth = '540px' }: {
  title: string; children: ReactNode; onClose: () => void; maxWidth?: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 bg-white z-10">
          <h3 className="font-display text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
const toastStyles = {
  success: { bg: '#dcfce7', border: '#86efac', text: '#166534', icon: '✓' },
  error:   { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', icon: '✕' },
  info:    { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', icon: 'ℹ' },
  warning: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', icon: '⚠' },
};

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info' | 'warning'; onClose: () => void }) {
  const s = toastStyles[type];
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm animate-slide-in"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <span className="text-base font-bold mt-0.5 flex-shrink-0">{s.icon}</span>
      <p className="text-sm font-medium leading-snug flex-1">{message}</p>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 ml-2 flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────────
export function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto scrollbar-hide">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all"
              style={{
                background: i < currentStep ? 'var(--primary)' : i === currentStep ? 'var(--primary)' : 'white',
                borderColor: i <= currentStep ? 'var(--primary)' : 'var(--border)',
                color: i <= currentStep ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className="text-xs mt-1 text-center font-medium hidden sm:block" style={{ color: i <= currentStep ? 'var(--primary)' : 'var(--muted-foreground)', maxWidth: '80px' }}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-1" style={{ background: i < currentStep ? 'var(--primary)' : 'var(--border)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Timeline ─────────────────────────────────────────────────────────────────
const timelineDotColors: Record<ApplicationStatus, string> = {
  draft: '#9ca3af', submitted: '#3b82f6', under_verification: '#f59e0b',
  correction_required: '#ef4444', resubmitted: '#8b5cf6', under_review: '#eab308',
  approved: '#22c55e', rejected: '#ef4444', certificate_available: '#10b981',
};

export function Timeline({ entries }: { entries: Array<{ status: ApplicationStatus; timestamp: string; changedByName: string; remarks: string }> }) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border)]" />
      {entries.map((entry, i) => (
        <div key={i} className="relative mb-6 last:mb-0">
          <div
            className="absolute -left-5 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: timelineDotColors[entry.status] }}
          />
          <div>
            <StatusBadge status={entry.status} />
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="text-xs text-[var(--muted-foreground)]">
                {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' '}
                {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">by {entry.changedByName}</span>
            </div>
            {entry.remarks && (
              <p className="mt-1 text-sm text-[var(--foreground)] bg-[var(--muted)] px-3 py-2 rounded-lg">{entry.remarks}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────────
export function FormField({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--foreground)] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all resize-none ${className}`}
      {...props}
    />
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-[var(--border)] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
const btnStyles: Record<BtnVariant, string> = {
  primary: 'bg-[var(--primary)] text-white hover:opacity-90',
  secondary: 'bg-[var(--secondary)] text-[var(--primary)] hover:bg-[var(--border)]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-[var(--primary)] hover:bg-[var(--secondary)] border border-[var(--primary)]',
  success: 'bg-green-600 text-white hover:bg-green-700',
};

export function Button({ variant = 'primary', className = '', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${btnStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color = 'var(--primary)', icon }: {
  label: string; value: number | string; color?: string; icon?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-5 flex items-center gap-4">
      {icon && (
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
          <span style={{ color }}>{icon}</span>
        </div>
      )}
      <div>
        <p className="text-2xl font-display font-bold" style={{ color }}>{value}</p>
        <p className="text-xs font-medium text-[var(--muted-foreground)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Document Upload ───────────────────────────────────────────────────────────
export function DocumentUploadField({ label, isMandatory, description, fileName, onUpload, error }: {
  label: string; isMandatory: boolean; description: string;
  fileName?: string; onUpload: (file: File) => void; error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) { alert('Only PDF, JPG, PNG files are allowed'); return; }
    onUpload(file);
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-4 transition-colors cursor-pointer hover:border-[var(--primary)] ${error ? 'border-red-400 bg-red-50' : fileName ? 'border-green-400 bg-green-50' : 'border-[var(--border)] bg-[var(--muted)]'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); }}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFile(e.target.files)} />
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${fileName ? 'bg-green-100' : 'bg-white'}`}>
            {fileName
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
              {isMandatory && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">Required</span>}
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{description}</p>
            {fileName
              ? <p className="text-xs text-green-700 font-medium mt-1 truncate">✓ {fileName}</p>
              : <p className="text-xs text-[var(--muted-foreground)] mt-1">Click to upload or drag & drop • PDF, JPG, PNG • Max 5MB</p>
            }
          </div>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-4 text-[var(--muted-foreground)]">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-[var(--foreground)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-xs">{description}</p>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="font-display text-xl font-bold text-[var(--foreground)]">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
export function InfoGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-[var(--muted)] rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">{item.label}</p>
          <p className="text-sm font-medium text-[var(--foreground)]">{item.value || '—'}</p>
        </div>
      ))}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ headers, children, className = '' }: { headers: string[]; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-[var(--border)] ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--muted)] border-b border-[var(--border)]">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-white">{children}</tbody>
      </table>
    </div>
  );
}

// ── Demo Banner ───────────────────────────────────────────────────────────────
export function DemoBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
      <p className="text-xs text-amber-800 font-medium">
        <span className="bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded mr-2">DEMO</span>
        This is a prototype for demonstration purposes only. Certificates generated here are NOT legally valid.
      </p>
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );
}

// ── Icon helpers ──────────────────────────────────────────────────────────────
export const Icons = {
  birth: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  death: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a9 9 0 000-18 9 9 0 000 18z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>,
  doc: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  user: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
};
