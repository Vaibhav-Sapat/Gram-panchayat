import { useState } from 'react';
import type { User } from '../types';
import { store } from '../data/store';
import { Card, StatCard, Table, SectionHeader, Button, Modal, FormField, Input } from '../components/shared';

interface Props {
  currentUser: User;
  onNavigate: (page: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type Tab = 'overview' | 'staff' | 'documents' | 'audit';

export default function AdminPanel({ currentUser, onNavigate, showToast }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', mobile: '', email: '', password: 'staff123' });
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = store.getStats();
  const allApps = store.getApplications();
  const allUsers = store.getUsers();
  const staffUsers = allUsers.filter(u => u.role === 'staff');
  const citizenUsers = allUsers.filter(u => u.role === 'citizen');
  const docConfigs = store.getDocumentConfigs();
  const auditLogs = store.getAuditLogs().slice().reverse();

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.mobile) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    const existing = store.getUserByEmail(newStaff.email);
    if (existing) { showToast('Email already exists.', 'error'); return; }

    const user = store.registerUser(newStaff.name, newStaff.mobile, newStaff.email, newStaff.password);
    // Hack to set role to staff
    const users = store.getUsers();
    const u = users.find(u => u.id === user.id);
    if (u) { (u as any).role = 'staff'; }

    store.addAuditLog({ userId: currentUser.id, userName: currentUser.name, action: 'STAFF_ADD', timestamp: new Date().toISOString(), details: `Staff member ${newStaff.name} added` });
    setAddStaffModal(false);
    setNewStaff({ name: '', mobile: '', email: '', password: 'staff123' });
    setRefreshKey(k => k + 1);
    showToast('Staff member added successfully.', 'success');
  };

  const handleToggleUser = (userId: string, isActive: boolean) => {
    store.updateUserStatus(userId, !isActive);
    setRefreshKey(k => k + 1);
    showToast(`User ${!isActive ? 'activated' : 'deactivated'} successfully.`, 'success');
  };

  const handleToggleDocConfig = (configId: string, isMandatory: boolean) => {
    store.updateDocumentConfig(configId, !isMandatory);
    setRefreshKey(k => k + 1);
    showToast('Document requirement updated.', 'success');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'staff', label: 'Staff Management' },
    { id: 'documents', label: 'Document Config' },
    { id: 'audit', label: 'Audit Logs' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" key={refreshKey}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">Admin Panel</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">System administration and configuration.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-100 text-amber-800 rounded-lg px-3 py-1.5">
          <span className="text-xs font-bold">ADMIN</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--muted)] rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white shadow-sm text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Applications" value={stats.total} color="var(--primary)" />
            <StatCard label="Birth Certificates" value={stats.birth} color="#2563eb" />
            <StatCard label="Death Certificates" value={stats.death} color="#7c3aed" />
            <StatCard label="Certificates Issued" value={stats.certificate_available} color="#16a34a" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Pending Verification" value={stats.submitted + stats.under_verification} color="#d97706" />
            <StatCard label="Correction Required" value={stats.correction_required} color="#dc2626" />
            <StatCard label="Total Users" value={allUsers.length} color="#0891b2" />
          </div>

          <Card className="p-5">
            <SectionHeader title="Recent Applications" />
            <Table headers={['Application ID', 'Service', 'Date', 'Status']}>
              {allApps.slice(0, 10).map(app => (
                <tr key={app.id} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--primary)]">{app.applicationNumber}</td>
                  <td className="px-4 py-3 text-sm capitalize">{app.serviceType}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{new Date(app.submittedAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      app.status === 'certificate_available' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{app.status.replace(/_/g, ' ')}</span>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* Staff Management */}
      {tab === 'staff' && (
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <SectionHeader
              title="Staff Members"
              subtitle={`${staffUsers.length} staff member${staffUsers.length !== 1 ? 's' : ''}`}
              action={
                <Button onClick={() => setAddStaffModal(true)} className="text-sm">+ Add Staff</Button>
              }
            />
            <Table headers={['Name', 'Email', 'Mobile', 'Status', 'Action']}>
              {staffUsers.map(u => (
                <tr key={u.id} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3 font-medium text-sm">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{u.email}</td>
                  <td className="px-4 py-3 text-sm">{u.mobile}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleUser(u.id, u.isActive)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Citizens" subtitle={`${citizenUsers.length} registered citizen${citizenUsers.length !== 1 ? 's' : ''}`} />
            <Table headers={['Name', 'Email', 'Mobile', 'Registered', 'Status']}>
              {citizenUsers.map(u => (
                <tr key={u.id} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3 font-medium text-sm">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{u.email}</td>
                  <td className="px-4 py-3 text-sm">{u.mobile}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* Document Config */}
      {tab === 'documents' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['birth', 'death'] as const).map(serviceType => (
              <Card key={serviceType} className="p-5">
                <SectionHeader title={`${serviceType === 'birth' ? 'Birth' : 'Death'} Certificate Documents`} />
                <div className="flex flex-col gap-3">
                  {docConfigs.filter(d => d.serviceType === serviceType).map(cfg => (
                    <div key={cfg.id} className="flex items-start gap-3 p-3 bg-[var(--muted)] rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{cfg.label}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{cfg.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cfg.isMandatory ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {cfg.isMandatory ? 'Mandatory' : 'Optional'}
                        </span>
                        <button
                          onClick={() => handleToggleDocConfig(cfg.id, cfg.isMandatory)}
                          className="text-xs text-[var(--primary)] hover:underline font-medium"
                        >
                          Make {cfg.isMandatory ? 'Optional' : 'Mandatory'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">About Document Configuration</p>
            <p className="text-xs text-blue-700">Changes made here take effect for new applications immediately. Mandatory documents will require citizens to upload them before they can submit their application.</p>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      {tab === 'audit' && (
        <Card className="p-5">
          <SectionHeader title="Audit Logs" subtitle={`${auditLogs.length} log entries`} />
          <Table headers={['Timestamp', 'User', 'Action', 'Application', 'Details']}>
            {auditLogs.slice(0, 50).map(log => (
              <tr key={log.id} className="hover:bg-[var(--muted)] transition-colors">
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] whitespace-nowrap font-mono">
                  {new Date(log.timestamp).toLocaleDateString('en-IN')} {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{log.userName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-[var(--muted)] px-2 py-1 rounded text-[var(--foreground)]">{log.action}</span>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-[var(--primary)]">{log.applicationId ? log.applicationId.slice(0, 8) + '…' : '—'}</td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{log.details}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {/* Add Staff Modal */}
      {addStaffModal && (
        <Modal title="Add Staff Member" onClose={() => setAddStaffModal(false)}>
          <div className="flex flex-col gap-4">
            <FormField label="Full Name" required>
              <Input value={newStaff.name} onChange={e => setNewStaff(s => ({ ...s, name: e.target.value }))} placeholder="Staff member's name" />
            </FormField>
            <FormField label="Mobile Number" required>
              <Input type="tel" value={newStaff.mobile} onChange={e => setNewStaff(s => ({ ...s, mobile: e.target.value }))} placeholder="10-digit mobile" maxLength={10} />
            </FormField>
            <FormField label="Email Address" required>
              <Input type="email" value={newStaff.email} onChange={e => setNewStaff(s => ({ ...s, email: e.target.value }))} placeholder="staff@example.com" />
            </FormField>
            <FormField label="Initial Password">
              <Input value={newStaff.password} onChange={e => setNewStaff(s => ({ ...s, password: e.target.value }))} placeholder="Temporary password" />
            </FormField>
            <div className="flex gap-3 mt-2">
              <Button variant="ghost" onClick={() => setAddStaffModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddStaff} className="flex-1">Add Staff Member</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
