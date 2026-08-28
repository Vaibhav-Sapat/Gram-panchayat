import { useState, useCallback, useEffect } from 'react';
import type { User } from './types';
import type { Lang } from './i18n/translations';
import { Toast } from './components/shared';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import CitizenDashboard from './pages/CitizenDashboard';
import BirthApplication from './pages/BirthApplication';
import DeathApplication from './pages/DeathApplication';
import ApplicationSuccess from './pages/ApplicationSuccess';
import TrackApplication from './pages/TrackApplication';
import StaffDashboard from './pages/StaffDashboard';
import StaffReview from './pages/StaffReview';
import AdminPanel from './pages/AdminPanel';
import { initializeStore, store } from './data/store';
import { ADMIN_EMAIL, auth, db, isFirebaseConfigured } from './firebase';
import { getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Toast { message: string; type: 'success' | 'error' | 'info' | 'warning' }

function ServicesPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)] mb-3">Available Services</h1>
        <p className="text-[var(--muted-foreground)]">Select a service to proceed with your application.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('birth-application')}
          className="bg-white rounded-2xl border border-[var(--border)] p-8 hover:shadow-lg transition-all text-left group"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-5 text-blue-600 group-hover:scale-110 transition-transform">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--foreground)] mb-2">Birth Certificate</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">Apply for an official birth certificate for a newborn child.</p>
          <span className="text-sm font-semibold text-blue-600 flex items-center gap-1">Apply Now →</span>
        </button>
        <button
          onClick={() => onNavigate('death-application')}
          className="bg-white rounded-2xl border border-[var(--border)] p-8 hover:shadow-lg transition-all text-left group"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-5 text-purple-600 group-hover:scale-110 transition-transform">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--foreground)] mb-2">Death Certificate</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">Apply for an official death certificate for a deceased person.</p>
          <span className="text-sm font-semibold text-purple-600 flex items-center gap-1">Apply Now →</span>
        </button>
      </div>
    </div>
  );
}

function SimpleInfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-6">{title}</h1>
      <div className="bg-white rounded-xl border border-[var(--border)] p-6">{children}</div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<Lang>('en');
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    void initializeStore();
  }, []);

  const navigate = useCallback((page: string, params: Record<string, string> = {}) => {
    // Redirect based on role if trying to access protected pages
    const citizenOnly = ['citizen-dashboard', 'birth-application', 'death-application', 'application-success', 'submit-correction'];
    const staffOnly = ['staff-dashboard', 'staff-review'];
    const adminOnly = ['admin-dashboard'];

    if (citizenOnly.includes(page) && (!currentUser || currentUser.role !== 'citizen')) {
      setCurrentPage('login'); setPageParams({}); return;
    }
    if (staffOnly.includes(page) && (!currentUser || currentUser.role !== 'staff')) {
      setCurrentPage('login'); setPageParams({}); return;
    }
    if (adminOnly.includes(page) && (!currentUser || currentUser.role !== 'admin')) {
      setCurrentPage('login'); setPageParams({}); return;
    }

    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentUser]);

  const showToast = useCallback((message: string, type: Toast['type']) => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    void getRedirectResult(auth).then(async credential => {
      if (!credential) return;
      const profileRef = doc(db, 'users', credential.user.uid);
      const profile = await getDoc(profileRef);
      const data = profile.data();
      const user: User = {
        id: credential.user.uid,
        name: data?.name || data?.fullName || credential.user.displayName || credential.user.email || 'Citizen',
        mobile: data?.mobile || '',
        email: credential.user.email || '',
        passwordHash: '',
        role: credential.user.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'citizen',
        createdAt: data?.createdAt || new Date().toISOString(),
        isActive: data?.isActive !== false,
      };
      const { passwordHash: _passwordHash, ...profileData } = user;
      await setDoc(profileRef, profileData, { merge: true });
      if (!user.isActive) {
        showToast('This account is inactive.', 'error');
        return;
      }
      store.addAuditLog({ userId: user.id, userName: user.name, action: 'USER_LOGIN', timestamp: new Date().toISOString(), details: 'Signed in with Google' });
      setCurrentUser(user);
      const dashboards: Record<string, string> = { citizen: 'citizen-dashboard', staff: 'staff-dashboard', admin: 'admin-dashboard' };
      setCurrentPage(dashboards[user.role] || 'home');
      showToast(`Welcome back, ${user.name}!`, 'success');
    }).catch(() => showToast('Google sign-in failed. Please try again.', 'error'));
  }, [showToast]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Navigate to role-appropriate dashboard
    const dashboards: Record<string, string> = { citizen: 'citizen-dashboard', staff: 'staff-dashboard', admin: 'admin-dashboard' };
    navigate(dashboards[user.role] || 'home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('home');
    showToast('You have been logged out.', 'info');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage language={language} onNavigate={navigate} />;

      case 'services':
        return <ServicesPage onNavigate={navigate} />;

      case 'login':
        return <LoginPage language={language} onNavigate={navigate} onLogin={handleLogin} showToast={showToast} />;

      case 'register':
        return <RegisterPage language={language} onNavigate={navigate} onLogin={handleLogin} showToast={showToast} />;

      case 'citizen-dashboard':
        return currentUser ? <CitizenDashboard currentUser={currentUser} onNavigate={navigate} showToast={showToast} /> : null;

      case 'birth-application':
        if (!currentUser) { navigate('login'); return null; }
        return <BirthApplication currentUser={currentUser} onNavigate={navigate} showToast={showToast} />;

      case 'death-application':
        if (!currentUser) { navigate('login'); return null; }
        return <DeathApplication currentUser={currentUser} onNavigate={navigate} showToast={showToast} />;

      case 'application-success':
        if (!currentUser) { navigate('login'); return null; }
        return <ApplicationSuccess applicationNumber={pageParams.appNum || ''} serviceType={pageParams.service || 'birth'} currentUser={currentUser} onNavigate={navigate} />;

      case 'track':
        return <TrackApplication initialAppNum={pageParams.appNum} onNavigate={navigate} showToast={showToast} />;

      case 'staff-dashboard':
        return currentUser ? <StaffDashboard currentUser={currentUser} onNavigate={navigate} /> : null;

      case 'staff-review':
        return currentUser ? <StaffReview appId={pageParams.appId || ''} currentUser={currentUser} onNavigate={navigate} showToast={showToast} /> : null;

      case 'admin-dashboard':
        return currentUser ? <AdminPanel currentUser={currentUser} onNavigate={navigate} showToast={showToast} /> : null;

      case 'help':
        return (
          <SimpleInfoPage title="Help & Support">
            <div className="space-y-4 text-sm text-[var(--foreground)]">
              <div><h3 className="font-semibold mb-1">How to apply for a certificate?</h3><p className="text-[var(--muted-foreground)]">Register or login, then select the service you need (Birth or Death Certificate). Follow the multi-step form to fill in all details and upload required documents.</p></div>
              <div><h3 className="font-semibold mb-1">How to track my application?</h3><p className="text-[var(--muted-foreground)]">Use the "Track Application" page with your Application ID and registered mobile number to check the current status.</p></div>
              <div><h3 className="font-semibold mb-1">What documents are required?</h3><p className="text-[var(--muted-foreground)]">Documents required vary by service. Mandatory documents are marked with a "Required" label during the application process.</p></div>
              <div><h3 className="font-semibold mb-1">Contact Panchayat Office</h3><p className="text-[var(--muted-foreground)]">Mon–Fri, 10:00 AM – 5:00 PM | helpdesk@grampanchayat.gov.in</p></div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700"><strong>Note:</strong> This is a demonstration portal. For official services, please contact your local Gram Panchayat office.</p>
              </div>
            </div>
          </SimpleInfoPage>
        );

      case 'contact':
        return (
          <SimpleInfoPage title="Contact Us">
            <div className="space-y-4 text-sm text-[var(--foreground)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Office Address', value: 'Gram Panchayat Office, Village Road, District - 412220' },
                  { label: 'Phone', value: '+91 20 1234 5678' },
                  { label: 'Email', value: 'helpdesk@grampanchayat.gov.in' },
                  { label: 'Office Hours', value: 'Monday to Friday, 10:00 AM – 5:00 PM' },
                ].map(item => (
                  <div key={item.label} className="bg-[var(--muted)] rounded-lg p-4">
                    <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </SimpleInfoPage>
        );

      default:
        return (
          <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <p className="font-display text-6xl font-bold text-[var(--border)] mb-4">404</p>
            <h1 className="font-display text-xl font-bold text-[var(--foreground)] mb-2">Page not found</h1>
            <p className="text-[var(--muted-foreground)] mb-6">The page you're looking for doesn't exist.</p>
            <button onClick={() => navigate('home')} className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90">Go Home</button>
          </div>
        );
    }
  };

  const showHeader = !['login', 'register', 'application-success'].includes(currentPage);

  return (
    <div className="min-h-screen bg-[var(--background)]" style={{ fontFamily: 'var(--font-sans)' }}>
      {showHeader && (
        <Header
          currentUser={currentUser}
          currentPage={currentPage}
          language={language}
          onNavigate={navigate}
          onLogout={handleLogout}
          onLanguageChange={setLanguage}
        />
      )}

      <main>{renderPage()}</main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
