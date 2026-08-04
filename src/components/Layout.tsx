import { NavLink, Outlet } from 'react-router-dom';

const linkBase =
  'px-3 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors whitespace-nowrap';
const linkInactive = 'text-ash-200/70 hover:text-ash-100 hover:bg-white/5';
const linkActive = 'bg-ember-600 text-ash-200 shadow-[0_0_12px_rgba(242,84,31,0.55)]';

const navItems = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/programmes', label: 'Programmes' },
  { to: '/musculation', label: 'Séances' },
  { to: '/progression', label: 'Progression' },
  { to: '/records', label: 'Records' },
];

export default function Layout() {
  return (
    <div className="min-h-svh bg-ash-950 text-ash-200">
      <header className="sticky top-0 z-10 relative overflow-hidden bg-gradient-to-b from-ash-950 via-ash-900 to-ash-950">
        <svg
          className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 800 100"
        >
          <defs>
            <radialGradient id="glow1" cx="50%" cy="0%" r="80%">
              <stop offset="0%" stopColor="#f2541f" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#f2541f" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="800" height="100" fill="url(#glow1)" />
        </svg>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 relative">
          <h1 className="text-xl font-black uppercase flame-text shrink-0 flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path
                d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1.5 1.5 2 3.5 2 5a6 6 0 1 1-12 0c0-4 3-5 3-8 0-1.5-1-2.5 3-4Z"
                fill="url(#flameGrad)"
              />
              <defs>
                <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffb347" />
                  <stop offset="60%" stopColor="#f2541f" />
                  <stop offset="100%" stopColor="#8f240f" />
                </linearGradient>
              </defs>
            </svg>
            Plus Lourd Que Toi
          </h1>
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="chrome-rule" />
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
