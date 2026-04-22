import { motion } from 'framer-motion';
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SiteFooter } from '../components/common/SiteFooter';
import { useAppStore } from '../store/useAppStore';

const showcaseMetrics = [
  { label: 'Stock visibility', value: '24/7' },
  { label: 'Protected admin access', value: 'RBAC' },
  { label: 'Firebase authentication', value: 'Email/Password' },
];

const features = [
  'Live cash overview with premium charting',
  'Transactions, invoices and downloadable reports',
  'Role-based admin panel behind a private route',
  'Firebase Auth, JWT cookies, CSRF-aware requests and sanitization',
];

export default function LandingPage() {
  const authStatus = useAppStore((state) => state.authStatus);
  const navigate = useNavigate();

  const handlePrimaryAction = () => {
    navigate(authStatus === 'authenticated' ? '/dashboard' : '/login');
  };

  return (
    <div className="premium-shell overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pt-8 md:px-10">
        <header className="flex items-center justify-between py-6">
          <div>
            <p className="premium-label">Ledger Premium</p>
            <p className="mt-2 text-lg uppercase tracking-[0.28em] text-white">Restaurant Operations</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge>Black / White / Yellow</Badge>
            <Button onClick={handlePrimaryAction}>
              {authStatus === 'authenticated' ? 'Open workspace' : 'Open sign in'}
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <section className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 24 }} transition={{ duration: 0.7 }}>
              <Badge>Plateforme de gestion restauration</Badge>
              <h1 className="mt-6 max-w-4xl text-4xl uppercase leading-[1.1] tracking-[0.16em] text-white md:text-6xl">
                Stock, achats, sorties et journal quotidien pour les operations cuisine.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 md:text-base">
                Ledger Premium fuses modern financial tooling, Firebase-authenticated access and a showroom-caliber interface inspired by fashion houses and award-winning digital brands.
              </p>
              <p className="mt-4 max-w-2xl text-xs uppercase tracking-[0.24em] text-white/40">
                Sign in and sign up run through Firebase Auth while workspace data remains stored in MongoDB.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button onClick={() => navigate('/login')}>
                  Go to sign in
                  <ArrowRight size={16} />
                </Button>
                <Button onClick={() => window.location.assign('#about')} variant="secondary">
                  Voir le perimetre
                </Button>
              </div>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="premium-panel relative overflow-hidden p-6 md:p-8"
              initial={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/20 blur-3xl" />
              <div className="space-y-6">
                <div>
                  <p className="premium-label">Poste de pilotage</p>
                  <h2 className="mt-3 text-2xl uppercase tracking-[0.18em] text-white">Construit pour le terrain</h2>
                </div>
                <div className="space-y-3 text-sm leading-7 text-white/60">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mt-14 grid gap-5 md:grid-cols-3">
            {showcaseMetrics.map((metric, index) => (
              <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} key={metric.label} transition={{ delay: index * 0.08 + 0.35, duration: 0.55 }}>
                <Card>
                  <p className="premium-label">{metric.label}</p>
                  <p className="mt-5 text-3xl uppercase tracking-[0.18em] text-white">{metric.value}</p>
                </Card>
              </motion.div>
            ))}
          </section>

          <section className="mt-20 grid gap-6 lg:grid-cols-3" id="about">
            <Card className="space-y-4">
              <Sparkles className="text-accent" size={18} />
              <h3 className="text-xl uppercase tracking-[0.16em] text-white">Vue operationnelle</h3>
              <p className="text-sm leading-7 text-white/58">
                Ecrans orientes action avec formulaires directs, listes utiles et retours visuels immediats sur desktop comme sur tablette.
              </p>
            </Card>
            <Card className="space-y-4">
              <ShieldCheck className="text-accent4" size={18} />
              <h3 className="text-xl uppercase tracking-[0.16em] text-white">Production security</h3>
              <p className="text-sm leading-7 text-white/58">
                Cookies JWT, protection CSRF, validation stricte, roles utilisateur/admin et historique d actions centralise.
              </p>
            </Card>
            <Card className="space-y-4">
              <LockKeyhole className="text-accent3" size={18} />
              <h3 className="text-xl uppercase tracking-[0.16em] text-white">Architecture evolutive</h3>
              <p className="text-sm leading-7 text-white/58">
                Frontend React/Vite, backend Express, Prisma et PostgreSQL avec un socle propre pour pousser vers Railway, Vercel ou VPS.
              </p>
            </Card>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}