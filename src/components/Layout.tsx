import { NavLink, Outlet } from 'react-router-dom';

const linkBase =
  'px-3 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-colors whitespace-nowrap border border-transparent';
const linkInactive =
  'text-gray-300 hover:text-gray-100 hover:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800';
const linkActive =
  'bg-gradient-to-b from-indigo-500 to-indigo-700 text-gray-100 border-black/30 shadow-[2px_2px_0_rgba(0,0,0,0.5)]';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/programmes', label: 'Programmes' },
  { to: '/musculation', label: 'Musculation' },
  { to: '/progression', label: 'Progression' },
  { to: '/records', label: 'Records' },
];

export default function Layout() {
  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950 text-gray-100">
      <header className="relative border-b-2 border-indigo-600 bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-[0_2px_0_rgba(0,0,0,0.5)]">
        <div className="h-1 bg-gradient-to-r from-indigo-700 via-indigo-400 to-indigo-700" />
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <h1 className="text-lg font-bold shrink-0 bg-gradient-to-b from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
            🔥 Personal Trainer 💪
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
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
