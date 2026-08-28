import { useState } from 'react';
import type { User, Application } from '../types';
import { store } from '../data/store';
import { Card, StatusBadge, StatCard, Table, SectionHeader, EmptyState, Icons, Button } from '../components/shared';

interface Props {
  currentUser: User;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function StaffDashboard({ currentUser, onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = store.getStats();
  const allApps = store.getApplications();

  const filtered = allApps.filter(app => {
    if (filterService !== 'all' && app.serviceType !== filterService) return false;
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const owner = store.getUserById(app.userId);
      const ownerMatch = owner?.name.toLowerCase().includes(q) || owner?.mobile.includes(q);
      if (!app.applicationNumber.toLowerCase().includes(q) && !ownerMatch) return false;
    }
    return true;
  }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const statCards = [
    { label: 'Total', value: stats.total, color: 'var(--primary)' },
    { label: 'New / Submitted', value: stats.submitted, color: '#2563eb' },
    { label: 'Under Verification', value: stats.under_verification, color: '#d97706' },
    { label: 'Correction Pending', value: stats.correction_required + stats.resubmitted, color: '#7c3aed' },
    { label: 'Approved', value: stats.approved, color: '#16a34a' },
    { label: 'Rejected', value: stats.rejected, color: '#dc2626' },
  ];

  const getOwnerName = (app: Application) => store.getUserById(app.userId)?.name || 'Unknown';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">Staff Dashboard</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">Welcome, {currentUser.name} — Review and manage certificate applications.</p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--muted)] rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-[var(--foreground)]">Panchayat Staff</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      {/* Applications */}
      <Card>
        <div className="p-5 border-b border-[var(--border)]">
          <SectionHeader title="All Applications" subtitle={`${filtered.length} application${filtered.length !== 1 ? 's' : ''} found`} />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><Icons.search /></span>
              <input
                className="w-full pl-9 pr-3 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Search by Application ID, name, or mobile..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
            >
              <option value="all">All Services</option>
              <option value="birth">Birth Certificate</option>
              <option value="death">Death Certificate</option>
            </select>
            <select
              className="px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_verification">Under Verification</option>
              <option value="correction_required">Correction Required</option>
              <option value="resubmitted">Resubmitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="certificate_available">Certificate Available</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Icons.doc />} title="No applications found" description="Try adjusting the search or filters." />
        ) : (
          <Table headers={['Application ID', 'Applicant', 'Service', 'Submitted', 'Status', 'Action']}>
            {filtered.map(app => (
              <tr key={app.id} className="hover:bg-[var(--muted)] transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-[var(--primary)]">{app.applicationNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[var(--foreground)]">{getOwnerName(app)}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{store.getUserById(app.userId)?.mobile}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${app.serviceType === 'birth' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {app.serviceType === 'birth' ? 'Birth' : 'Death'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                <td className="px-4 py-3">
                  <Button
                    variant="secondary"
                    className="text-xs py-1.5"
                    onClick={() => onNavigate('staff-review', { appId: app.id })}
                  >
                    <Icons.eye /> Review
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
