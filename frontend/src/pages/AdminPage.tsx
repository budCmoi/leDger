import { startTransition, useState } from 'react';

import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { Badge } from '../components/common/Badge';
import { formatDate } from '../lib/utils';
import { adminApi, bootstrapApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export default function AdminPage() {
  const users = useAppStore((state) => state.adminUsers);
  const auditLogs = useAppStore((state) => state.auditLogs);
  const setRestaurantBootstrap = useAppStore((state) => state.setRestaurantBootstrap);
  const [busy, setBusy] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const refreshWorkspace = async () => {
    startTransition(() => {
      void bootstrapApi.loadRestaurantWorkspace().then((payload) => {
        setRestaurantBootstrap(payload);
      });
    });
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);

    try {
      await adminApi.createUser({
        identifier,
        fullName,
        password,
        role,
      });
      await refreshWorkspace();
      setIdentifier('');
      setFullName('');
      setPassword('');
      setRole('user');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          description="Gestion des comptes equipe et lecture de la trace d actions sur les produits, sorties et factures d entree."
          eyebrow="Admin"
          title="Utilisateurs et traceabilite"
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <div className="space-y-2">
              <p className="premium-label">Comptes</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">Equipe active</h2>
            </div>
            <div className="mt-6 space-y-3">
              {users.map((workspaceUser) => (
                <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4" key={workspaceUser.id}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-white">{workspaceUser.name}</p>
                      <p className="mt-1 text-xs text-white/45">{workspaceUser.identifier ?? workspaceUser.email}</p>
                    </div>
                    <Badge>{workspaceUser.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="space-y-2">
              <p className="premium-label">Nouveau compte</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">Ajouter un utilisateur</h2>
            </div>
            <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreateUser(event)}>
              <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setFullName(event.target.value)} placeholder="Nom complet" value={fullName} />
              <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setIdentifier(event.target.value)} placeholder="Identifiant" value={identifier} />
              <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe" type="password" value={password} />
              <select className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setRole(event.target.value as 'user' | 'admin')} value={role}>
                <option value="user">Utilisateur</option>
                <option value="admin">Admin</option>
              </select>
              <Button disabled={busy} type="submit">
                Creer le compte
              </Button>
            </form>
          </Card>
        </div>

        <Card>
          <div className="space-y-2">
            <p className="premium-label">Audit trail</p>
            <h2 className="text-xl uppercase tracking-[0.16em] text-white">Dernieres actions</h2>
          </div>
          <div className="mt-6 space-y-3">
            {auditLogs.map((log) => (
              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4" key={log.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-white">{log.description}</p>
                    <p className="mt-1 text-xs text-white/45">{log.actor.name} • {formatDate(log.createdAt, 'dd MMM yyyy HH:mm')}</p>
                  </div>
                  <Badge>{log.entityType}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}