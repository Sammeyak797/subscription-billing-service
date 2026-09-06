import { BarChart3, Users, CreditCard } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-800 bg-slate-900 p-5">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-600 p-2">
              <CreditCard size={20} />
            </div>

            <div>
              <h1 className="font-semibold">Billing Service</h1>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          </div>

          <nav className="space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <BarChart3 size={18} />
              Dashboard
            </NavLink>

            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Users size={18} />
              Customers
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-8">
            <div>
              <p className="text-sm text-slate-400">Subscription & Billing</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              API Online
            </div>
          </header>

          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
