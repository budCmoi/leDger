import { Dialog, DialogPanel } from '@headlessui/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { SiteFooter } from '../components/common/SiteFooter';
import { Sidebar } from '../components/navigation/Sidebar';
import { Topbar } from '../components/navigation/Topbar';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useAppStore } from '../store/useAppStore';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAppStore((state) => state.user);

  useRealtimeSync();

  return (
    <div className="premium-shell">
      <div className="mx-auto flex min-h-screen max-w-[1700px] gap-6 px-4 py-4 md:px-6">
        <div className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[320px] shrink-0 overflow-hidden lg:block">
          <div className="premium-panel h-full overflow-y-auto">
            <Sidebar companyName={user?.companyName} />
          </div>
        </div>

        <Dialog className="relative z-50 lg:hidden" open={mobileOpen} onClose={setMobileOpen}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex p-4">
            <DialogPanel className="premium-panel h-full w-full max-w-[320px] overflow-hidden">
              <div className="flex justify-end p-4 pb-0">
                <button className="rounded-full border border-white/10 p-2 text-white/70" onClick={() => setMobileOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <Sidebar companyName={user?.companyName || 'Operations restauration'} onNavigate={() => setMobileOpen(false)} />
            </DialogPanel>
          </div>
        </Dialog>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="sticky top-4 z-20">
            <Topbar onOpenNavigation={() => setMobileOpen(true)} />
          </div>
          <div className="premium-panel overflow-hidden">
            <main className="px-6 py-6 md:px-8 md:py-8">
              <Outlet />
            </main>
          </div>
          <div className="mt-auto">
            <SiteFooter />
          </div>
        </div>
      </div>
    </div>
  );
};