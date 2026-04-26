import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { LogOut, Menu as MenuIcon, Search } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../common/Button';
import { firebaseAuthService } from '../../services/firebase-auth';
import { useAppStore } from '../../store/useAppStore';

const titleMap: Record<string, string> = {
  '/dashboard': 'Cockpit restauration',
  '/products': 'Inventaire',
  '/products/new': 'Nouveau produit',
  '/purchase-invoices': 'Factures d entree',
  '/outputs': 'Sorties de service',
  '/journal': 'Journal quotidien',
  '/admin': 'Console admin',
};

interface TopbarProps {
  onOpenNavigation: () => void;
}

export const Topbar = ({ onOpenNavigation }: TopbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const clearSession = useAppStore((state) => state.clearSession);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await firebaseAuthService.logout();
    } finally {
      clearSession();
      navigate('/', { replace: true });
      setLoggingOut(false);
    }
  };

  return (
    <header className="border border-white/10 bg-black/30 px-6 py-5 backdrop-blur-xl md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button className="border border-white/10 p-3 text-white/70 lg:hidden" onClick={onOpenNavigation}>
            <MenuIcon size={18} />
          </button>
          <div>
            <p className="premium-label">{location.pathname.replace('/', '') || 'overview'}</p>
            <h1 className="text-xl uppercase tracking-[0.22em] text-white">{titleMap[location.pathname] ?? 'Restaurant Ops'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 border border-white/10 bg-white/[0.04] px-4 py-3 text-white/45 md:flex">
            <Search size={14} />
            <span className="text-xs uppercase tracking-[0.18em]">Saisie et supervision operationnelle</span>
          </div>

          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-3 border border-white/10 bg-white/[0.04] px-4 py-2 text-left text-white/80">
              <div className="flex h-10 w-10 items-center justify-center bg-accent text-paper">
                {user?.name?.slice(0, 1) ?? 'L'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm uppercase tracking-[0.15em] text-white">{user?.name ?? 'Workspace'}</p>
                <p className="text-xs text-white/45">{user?.identifier ?? user?.companyName ?? 'Restaurant Ops'}</p>
              </div>
            </MenuButton>
            <MenuItems anchor="bottom end" className="premium-panel mt-3 w-56 p-2 outline-none">
              <MenuItem>
                <button className="w-full px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white" onClick={() => navigate('/profile')}>
                  Profile settings
                </button>
              </MenuItem>
              <MenuItem>
                <Button className="mt-2 justify-start px-4 py-3 text-left text-sm" disabled={loggingOut} fullWidth onClick={handleLogout} variant="ghost">
                  <LogOut size={15} />
                  {loggingOut ? 'Closing session' : 'Log out'}
                </Button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  );
};