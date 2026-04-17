import { LayoutDashboard, Receipt, ScrollText, Settings2, ShieldCheck, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { Badge } from '../common/Badge';
import { cn } from '../../lib/utils';

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: Wallet },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: ScrollText },
  { to: '/profile', label: 'Profile', icon: Settings2 },
  { to: '/admin-secret', label: 'Admin', icon: ShieldCheck },
];

interface SidebarProps {
  companyName?: string;
  onNavigate?: () => void;
}

export const Sidebar = ({ companyName, onNavigate }: SidebarProps) => {
  return (
    <aside className="flex h-full flex-col gap-8 px-5 py-6">
      <div className="space-y-4">
        <div>
          <p className="premium-label">Ledger Premium</p>
          <h2 className="mt-3 text-xl uppercase tracking-[0.32em] text-white">Accounting OS</h2>
        </div>
        <Badge>{companyName ?? 'Secure Workspace'}</Badge>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm uppercase tracking-[0.18em] text-white/55 transition hover:bg-white/[0.06] hover:text-white',
                  isActive && 'bg-white/[0.08] text-white',
                )
              }
              onClick={onNavigate}
              to={item.to}
            >
              <span className="flex items-center gap-3">
                <Icon size={16} />
                {item.label}
              </span>
              <span className="h-2 w-2 rounded-full bg-accent/70 opacity-0 transition group-[.active]:opacity-100" />
            </NavLink>
          );
        })}
      </nav>

      <div className="premium-panel space-y-3 p-4">
        <p className="premium-label">Security</p>
        <p className="text-sm leading-7 text-white/55">
          Session cookies, role-based access and CSRF-aware API calls are enabled by default.
        </p>
      </div>
    </aside>
  );
};