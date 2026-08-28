import { useState } from 'react';
import type { Lang } from '../i18n/translations';
import { store } from '../data/store';
import type { User } from '../types';
import { Card, FormField, Input, Button } from '../components/shared';
import { ADMIN_EMAIL, auth, db } from '../firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginPageProps {
  language: Lang;
  onNavigate: (page: string) => void;
  onLogin: (user: User) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function LoginPage({ language, onNavigate, onLogin, showToast }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email address.';
    if (!password) e.password = 'Please enter your password.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await getDoc(doc(db, 'users', credential.user.uid));
      const data = profile.data();
      const user: User = data ? {
        id: credential.user.uid,
        name: data.name || data.fullName || credential.user.displayName || email,
        mobile: data.mobile || '',
        email: credential.user.email || email,
        passwordHash: '',
        role: credential.user.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'citizen',
        createdAt: data.createdAt || new Date().toISOString(),
        isActive: data.isActive !== false,
      } : {
        id: credential.user.uid,
        name: credential.user.displayName || email,
        mobile: '',
        email: credential.user.email || email,
        passwordHash: '',
        role: credential.user.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'citizen',
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      if (user.isActive) {
        store.addAuditLog({ userId: user.id, userName: user.name, action: 'USER_LOGIN', timestamp: new Date().toISOString(), details: 'User logged in' });
        onLogin(user);
        showToast(`Welcome back, ${user.name}!`, 'success');
      } else {
        showToast('This account is inactive.', 'error');
      }
    } catch {
      showToast('Invalid email or password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({});
    try {
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch {
      showToast('Google sign-in was cancelled or failed. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-[var(--primary)] rounded-2xl flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">Sign In</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Access your Gram Panchayat Portal account</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="Email Address" error={errors.email} required>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </FormField>
            <FormField label="Password" error={errors.password} required>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </FormField>
            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="flex items-center gap-3 my-5 text-xs text-[var(--muted-foreground)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span>OR</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" />
              <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.75Z" />
              <path fill="#FBBC05" d="M6.53 13.84a5.86 5.86 0 0 1 0-3.68V7.63H3.29a9.75 9.75 0 0 0 0 8.74l3.24-2.53Z" />
              <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.21 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.38l3.24 2.53C7.3 7.85 9.46 6.13 12 6.13Z" />
            </svg>
            Continue with Google
          </button>
        </Card>

        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('register')} className="text-[var(--primary)] font-semibold hover:underline">Register here</button>
        </p>
        <p className="text-center mt-3">
          <button onClick={() => onNavigate('home')} className="text-xs text-[var(--muted-foreground)] hover:underline">← Back to Home</button>
        </p>
      </div>
    </div>
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
interface RegisterPageProps {
  language: Lang;
  onNavigate: (page: string) => void;
  onLogin: (user: User) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function RegisterPage({ language, onNavigate, onLogin, showToast }: RegisterPageProps) {
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your full name.';
    if (!form.mobile.trim()) e.mobile = 'Please enter your mobile number.';
    else if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Invalid mobile number. Must be 10 digits starting with 6-9.';
    if (!form.email.trim()) e.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address.';
    else if (form.email.trim().toLowerCase() === ADMIN_EMAIL) e.email = 'This email is reserved for the administrator.';
    if (!form.password) e.password = 'Please enter a password.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const existing = store.getUserByEmail(form.email);
    if (existing) { setErrors({ email: 'An account with this email already exists.' }); return; }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const user = store.registerUser(form.name, form.mobile, form.email.trim(), '', credential.user.uid);
      await setDoc(doc(db, 'users', credential.user.uid), {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isActive: user.isActive,
      });
      store.addAuditLog({ userId: user.id, userName: user.name, action: 'USER_REGISTER', timestamp: new Date().toISOString(), details: 'New citizen registered' });
      onLogin(user);
      showToast('Registration successful! Welcome to the portal.', 'success');
    } catch {
      showToast('Registration failed. Check Firebase Authentication and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-[var(--primary)] rounded-2xl flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">Create Account</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Register to access citizen services</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="Full Name" error={errors.name} required>
              <Input value={form.name} onChange={set('name')} placeholder="As per identity document" />
            </FormField>
            <FormField label="Mobile Number" error={errors.mobile} required>
              <Input type="tel" value={form.mobile} onChange={set('mobile')} placeholder="10-digit mobile number" maxLength={10} />
            </FormField>
            <FormField label="Email Address" error={errors.email} required>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </FormField>
            <FormField label="Password" error={errors.password} required>
              <Input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" />
            </FormField>
            <FormField label="Confirm Password" error={errors.confirmPassword} required>
              <Input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" />
            </FormField>

            <div className="bg-[var(--muted)] rounded-lg px-4 py-3 text-xs text-[var(--muted-foreground)]">
              By registering, you confirm that the information provided is accurate and you agree to use this portal for legitimate administrative purposes only.
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-[var(--primary)] font-semibold hover:underline">Sign in</button>
        </p>
        <p className="text-center mt-3">
          <button onClick={() => onNavigate('home')} className="text-xs text-[var(--muted-foreground)] hover:underline">← Back to Home</button>
        </p>
      </div>
    </div>
  );
}
