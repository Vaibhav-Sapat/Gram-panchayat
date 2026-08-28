import type { Lang } from '../i18n/translations';
import translations from '../i18n/translations';
import { Card, DemoBanner } from '../components/shared';

interface HomePageProps {
  language: Lang;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function HomePage({ language, onNavigate }: HomePageProps) {
  const t = translations[language];

  const steps = [t.step1, t.step2, t.step3, t.step4, t.step5, t.step6];

  const services = [
    {
      type: 'birth',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 11c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z"/>
          <path d="M5.2 18.4C5.85 17.25 7.6 16.5 12 16.5s6.15.75 6.8 1.9"/>
          <path d="M22 12A10 10 0 1112 2a10 10 0 0110 10z"/>
          <path d="M12 6v2M12 10v2"/>
        </svg>
      ),
      label: t.birthCertificate,
      desc: t.birthDesc,
      color: 'var(--primary)',
      bg: '#e8edf5',
      page: 'birth-application',
    },
    {
      type: 'death',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      label: t.deathCertificate,
      desc: t.deathDesc,
      color: '#6b21a8',
      bg: '#f5f3ff',
      page: 'death-application',
    },
  ];

  return (
    <div>
      <DemoBanner />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #2d5a9e 60%, #1a3560 100%)',
          minHeight: '520px',
        }}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-5">
          <div style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            width: '100%',
            height: '100%',
          }} />
        </div>

        {/* India flag colors accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Online Services Available
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              {t.heroTitle}
            </h1>
            <p className="text-lg opacity-85 mb-8 max-w-lg leading-relaxed">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              <button
                onClick={() => onNavigate('services')}
                className="bg-[var(--accent)] hover:opacity-90 text-white font-semibold px-8 py-3 rounded-xl text-base transition-all shadow-lg"
              >
                {t.applyOnline}
              </button>
              <button
                onClick={() => onNavigate('track')}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl text-base transition-all backdrop-blur-sm"
              >
                {t.trackApplication}
              </button>
            </div>
          </div>

          <div className="flex-shrink-0 hidden lg:block">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 bg-white/10 rounded-3xl rotate-6" />
              <div className="absolute inset-0 bg-white/10 rounded-3xl -rotate-3" />
              <div className="absolute inset-0 bg-white/15 rounded-3xl flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-20 h-20 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <path d="M8 21h8M12 17v4"/>
                      <path d="M7 8h10M7 11h6"/>
                    </svg>
                  </div>
                  <p className="font-display font-bold text-xl">Gram Panchayat</p>
                  <p className="text-sm opacity-70 mt-1">Digital Services Portal</p>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                    <div><p className="font-bold text-lg">500+</p><p className="opacity-70 text-xs">Applications</p></div>
                    <div className="w-px h-8 bg-white/30" />
                    <div><p className="font-bold text-lg">98%</p><p className="opacity-70 text-xs">Satisfaction</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">Available Services</h2>
          <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">Choose the certificate you need to apply for. All applications are processed online.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {services.map(svc => (
            <Card key={svc.type} className="p-8 hover:shadow-lg transition-all cursor-pointer group" onClick={() => onNavigate(svc.page)}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110" style={{ background: svc.bg, color: svc.color }}>
                {svc.icon}
              </div>
              <h3 className="font-display font-bold text-xl text-[var(--foreground)] mb-2">{svc.label}</h3>
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-5">{svc.desc}</p>
              <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: svc.color }}>
                Apply Online
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[var(--secondary)] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">{t.howItWorks}</h2>
            <p className="text-[var(--muted-foreground)]">Simple steps to get your certificate</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-1/2 w-full h-px bg-[var(--border)]" style={{ zIndex: 0 }} />
                )}
                <div className="relative z-10 w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-display font-bold text-sm mb-3">
                  {i + 1}
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Track CTA */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div
          className="rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: 'linear-gradient(135deg, #1b3a6b 0%, #2d5a9e 100%)' }}
        >
          <div className="text-white text-center sm:text-left">
            <h3 className="font-display text-2xl font-bold mb-2">Already Applied?</h3>
            <p className="opacity-80 text-sm">Track the status of your application with your Application ID.</p>
          </div>
          <button
            onClick={() => onNavigate('track')}
            className="bg-white text-[var(--primary)] font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 transition-all flex-shrink-0 shadow-lg"
          >
            Track Application →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--primary)] text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-display font-bold text-lg mb-2">{t.appName}</p>
              <p className="text-sm opacity-70 leading-relaxed">{t.tagline}</p>
            </div>
            <div>
              <p className="font-semibold mb-3">Quick Links</p>
              <div className="flex flex-col gap-1.5">
                {[t.home, t.services, t.track, t.help].map(l => (
                  <span key={l} className="text-sm opacity-70 hover:opacity-100 cursor-pointer transition-opacity">{l}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold mb-3">Contact</p>
              <div className="text-sm opacity-70 flex flex-col gap-1.5">
                <p>Gram Panchayat Office</p>
                <p>Mon–Fri, 10:00 AM – 5:00 PM</p>
                <p>helpdesk@grampanchayat.gov.in</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs opacity-60">{t.copyright}</p>
            <p className="text-xs opacity-60">{t.disclaimer}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
