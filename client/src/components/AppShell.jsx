import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';

export default function AppShell({ title, nav, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 sm:flex">
        <div className="mb-6 px-2">
          <div className="text-lg font-bold text-indigo-700">HR System</div>
          <div className="text-xs text-slate-500">{title}</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="secondary" onClick={onLogout} className="mt-4 w-full">
          Sign out
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="font-semibold text-slate-700">{title}</div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {user?.email} · <span className="uppercase">{user?.employeeId}</span>
            </span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold uppercase text-indigo-700">
              {user?.role}
            </span>
            <Button variant="secondary" onClick={onLogout} className="sm:hidden">
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
