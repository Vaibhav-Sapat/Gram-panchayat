import { useState } from 'react';
import type { User } from '../types';
import type { Lang } from '../i18n/translations';
import translations from '../i18n/translations';
import { Icons } from './shared';
import { store } from '../data/store';

interface HeaderProps {
  currentUser: User | null;
  currentPage: string;
  language: Lang;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onLogout: () => void;
  onLanguageChange: (lang: Lang) => void;
}

export default function Header({ currentUser, currentPage, language, onNavigate, onLogout, onLanguageChange }: HeaderProps) {
  const t = translations[language];
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = currentUser ? store.getNotificationsByUser(currentUser.id) : [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navLinks = [
    { label: t.home, page: 'home' },
    { label: t.services, page: 'services' },
    { label: t.track, page: 'track' },
    { label: t.help, page: 'help' },
    { label: t.contact, page: 'contact' },
  ];

  const roleDashboard: Record<string, string> = {
    citizen: 'citizen-dashboard',
    staff: 'staff-dashboard',
    admin: 'admin-dashboard',
  };

  return (
    <header className="bg-[var(--primary)] text-white shadow-lg sticky top-0 z-40">
      {/* Top bar */}
      <div className="border-b border-white/10 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs opacity-80">
            <span>Government of India</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Digital India Initiative</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-70">Language:</span>
            {(['en', 'hi', 'mr'] as Lang[]).map(lang => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`text-xs px-2 py-0.5 rounded transition-all ${language === lang ? 'bg-white text-[var(--primary)] font-semibold' : 'opacity-70 hover:opacity-100'}`}
              >
                {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div className="hidden sm:block">
              <p className="font-display font-bold text-sm leading-tight">{t.appName}</p>
              <p className="text-xs opacity-70 leading-tight">{t.tagline}</p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.page}
                onClick={() => onNavigate(link.page)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === link.page ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
                    className="relative w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all"
                  >
                    <Icons.bell />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[var(--accent)] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[var(--border)] z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                        <p className="font-semibold text-[var(--foreground)] text-sm">Notifications</p>
                        {unreadCount > 0 && (
                          <button onClick={() => { store.markAllRead(currentUser.id); setNotifOpen(false); }} className="text-xs text-[var(--primary)] font-medium hover:underline">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-[var(--muted-foreground)] text-center py-6">No notifications</p>
                        ) : (
                          notifications.slice(0, 10).map(n => (
                            <div
                              key={n.id}
                              onClick={() => { store.markNotificationRead(n.id); setNotifOpen(false); }}
                              className={`px-4 py-3 border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-[var(--muted)] transition-colors ${!n.isRead ? 'bg-blue-50' : ''}`}
                            >
                              <p className="text-xs text-[var(--foreground)] leading-snug">{n.message}</p>
                              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                                {new Date(n.createdAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {currentUser.name[0]}
                    </div>
                    <span className="text-sm font-medium hidden sm:block max-w-24 truncate">{currentUser.name.split(' ')[0]}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-[var(--border)] z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]">
                        <p className="font-semibold text-[var(--foreground)] text-sm truncate">{currentUser.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 capitalize">{currentUser.role}</p>
                      </div>
                      <button
                        onClick={() => { onNavigate(roleDashboard[currentUser.role]); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                      >
                        <Icons.home /> Dashboard
                      </button>
                      <button
                        onClick={() => { onLogout(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-[var(--border)]"
                      >
                        <Icons.logout /> {t.logout}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => onNavigate('login')} className="hidden sm:block text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">
                  {t.login}
                </button>
                <button onClick={() => onNavigate('register')} className="text-sm font-semibold px-4 py-1.5 bg-[var(--accent)] hover:opacity-90 rounded-lg transition-all">
                  {t.register}
                </button>
              </>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all ml-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-white/20">
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <button
                  key={link.page}
                  onClick={() => { onNavigate(link.page); setMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
                >
                  {link.label}
                </button>
              ))}
              {!currentUser && (
                <button onClick={() => { onNavigate('login'); setMenuOpen(false); }} className="text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10">
                  {t.login}
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
