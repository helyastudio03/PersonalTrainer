import { NavLink, Outlet } from 'react-router-dom';

const linkBase =
  'px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap';
const linkInactive = 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';
const linkActive = 'bg-indigo-600 text-white';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/programmes', label: 'Programmes' },
  { to: '/musculation', label: 'Musculation' },
  { to: '/course', label: 'Course à pied' },
  { to: '/progression', label: 'Progression' },
  { to: '/records', label: 'Records' },
];

export default function Layout() {
  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
            🏋️ Personal Trainer
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
