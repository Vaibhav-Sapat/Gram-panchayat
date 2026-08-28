import { useState } from 'react';
import type { User } from '../types';
import { store } from '../data/store';
import {
  Card, StatusBadge, StatCard, Button, Table, SectionHeader,
  EmptyState, Icons, Timeline, Modal,
} from '../components/shared';

interface Props {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function CitizenDashboard({ currentUser, onNavigate, showToast }: Props) {
  const [historyAppId, setHistoryAppId] = useState<string | null>(null);

  const apps = store.getApplicationsByUser(currentUser.id);
  const notifications = store.getNotificationsByUser(currentUser.id);
  const unread = notifications.filter(n => !n.isRead);

  const historyApp = historyAppId ? store.getApplicationById(historyAppId) : null;

  const stats = {
    total: apps.length,
    pending: apps.filter(a => ['submitted', 'under_verification', 'under_review', 'resubmitted'].includes(a.status)).length,
    correction: apps.filter(a => a.status === 'correction_required').length,
    approved: apps.filter(a => ['approved', 'certificate_available'].includes(a.status)).length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">Welcome, {currentUser.name}</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">Manage your certificate applications from your dashboard.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('birth-application')} className="text-sm">
            + Birth Certificate
          </Button>
          <Button variant="ghost" onClick={() => onNavigate('death-application')} className="text-sm">
            + Death Certificate
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {unread.length > 0 && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                <Icons.bell /> {unread.length} New Notification{unread.length > 1 ? 's' : ''}
              </p>
              <button onClick={() => { store.markAllRead(currentUser.id); showToast('All notifications marked as read.', 'info'); }} className="text-xs text-blue-600 font-medium hover:underline">
                Mark all read
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {unread.slice(0, 3).map(n => (
                <div key={n.id} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-blue-100">
                  <span className="text-sm mt-0.5">
                    {n.type === 'success' ? '✓' : n.type === 'error' ? '✕' : n.type === 'warning' ? '⚠' : 'ℹ'}
                  </span>
                  <p className="text-xs text-[var(--foreground)] leading-snug">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Applications" value={stats.total} icon={<Icons.doc />} />
        <StatCard label="Pending" value={stats.pending} color="#d97706" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        <StatCard label="Correction Needed" value={stats.correction} color="#dc2626" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} />
        <StatCard label="Approved" value={stats.approved} color="#16a34a" icon={<Icons.check />} />
        <StatCard label="Rejected" value={stats.rejected} color="#dc2626" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>} />
      </div>

      {/* Applications Table */}
      <Card>
        <div className="p-5 border-b border-[var(--border)]">
          <SectionHeader title="My Applications" subtitle={`${apps.length} total application${apps.length !== 1 ? 's' : ''}`} />
        </div>

        {apps.length === 0 ? (
          <EmptyState
            icon={<Icons.doc />}
            title="No applications yet"
            description="You haven't submitted any applications. Click the button above to get started."
          />
        ) : (
          <Table headers={['Application ID', 'Type', 'Date', 'Status', 'Actions']}>
            {apps.map(app => (
              <tr key={app.id} className="hover:bg-[var(--muted)] transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-[var(--primary)]">{app.applicationNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${app.serviceType === 'birth' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {app.serviceType === 'birth' ? '👶 Birth' : '📄 Death'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => onNavigate('track', { appNum: app.applicationNumber })}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline px-2 py-1 rounded hover:bg-[var(--secondary)] transition-colors"
                    >
                      <Icons.eye /> Track
                    </button>
                    <button
                      onClick={() => setHistoryAppId(app.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-2 py-1 rounded hover:bg-[var(--secondary)] transition-colors"
                    >
                      History
                    </button>
                    {app.status === 'correction_required' && (
                      <button
                        onClick={() => onNavigate('submit-correction', { appId: app.id })}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                      >
                        <Icons.edit /> Correct
                      </button>
                    )}
                    {app.status === 'certificate_available' && app.certificate && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Certificate Ready
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="text-xs text-red-600 px-2 py-1" title={app.rejectionReason}>View Reason</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* History Modal */}
      {historyApp && (
        <Modal title={`Application History — ${historyApp.applicationNumber}`} onClose={() => setHistoryAppId(null)}>
          {historyApp.status === 'rejected' && historyApp.rejectionReason && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-600">{historyApp.rejectionReason}</p>
            </div>
          )}
          {historyApp.status === 'correction_required' && historyApp.correctionReason && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-700 mb-1">Correction Required</p>
              <p className="text-sm text-amber-600">{historyApp.correctionReason}</p>
            </div>
          )}
          <Timeline entries={historyApp.statusHistory.map(h => ({
            status: h.newStatus,
            timestamp: h.timestamp,
            changedByName: h.changedByName,
            remarks: h.remarks,
          }))} />
        </Modal>
      )}
    </div>
  );
}
