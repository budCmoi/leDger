import { useEffect } from 'react';

import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency } from '../lib/utils';
import { adminApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export default function AdminPage() {
  const overview = useAppStore((state) => state.adminOverview);
  const users = useAppStore((state) => state.adminUsers);
  const transactions = useAppStore((state) => state.adminTransactions);
  const user = useAppStore((state) => state.user);
  const setAdminData = useAppStore((state) => state.setAdminData);

  useEffect(() => {
    const loadAdminData = async () => {
      const [overviewResponse, usersResponse, transactionsResponse] = await Promise.all([
        adminApi.getOverview(),
        adminApi.listUsers(),
        adminApi.listTransactions(),
      ]);

      setAdminData({
        overview: overviewResponse,
        users: usersResponse,
        transactions: transactionsResponse,
      });
    };

    void loadAdminData();
  }, [setAdminData]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Delete this user and all accounting data?')) {
      return;
    }

    await adminApi.deleteUser(userId);
    const [overviewResponse, usersResponse, transactionsResponse] = await Promise.all([
      adminApi.getOverview(),
      adminApi.listUsers(),
      adminApi.listTransactions(),
    ]);
    setAdminData({ overview: overviewResponse, users: usersResponse, transactions: transactionsResponse });
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          description="Private operational layer for platform-wide monitoring, user governance and finance supervision."
          eyebrow="Restricted route"
          title="Admin control"
        />

        {overview ? (
          <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
            <StatCard currency={user?.currency} label="Users" tone="neutral" value={overview.stats.users} />
            <StatCard currency={user?.currency} label="Transactions" tone="neutral" value={overview.stats.transactions} />
            <StatCard currency={user?.currency} label="Invoices" tone="neutral" value={overview.stats.invoices} />
            <StatCard currency={user?.currency} label="Revenue" tone="positive" value={overview.stats.revenue} />
            <StatCard currency={user?.currency} label="Expenses" tone="negative" value={overview.stats.expenses} />
            <StatCard currency={user?.currency} label="Profit" tone="neutral" value={overview.stats.profit} />
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <div className="space-y-2">
              <p className="premium-label">Users</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">Workspace accounts</h2>
            </div>
            <div className="mt-6 space-y-3">
              {users.map((workspaceUser) => (
                <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4" key={workspaceUser.id}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-white">{workspaceUser.name}</p>
                      <p className="mt-1 text-xs text-white/45">{workspaceUser.email}</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">{workspaceUser.role}</p>
                  </div>
                  <Button onClick={() => void handleDeleteUser(workspaceUser.id)} variant="ghost">
                    Delete user
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="space-y-2">
              <p className="premium-label">Platform transactions</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">Cross-account activity</h2>
            </div>
            <div className="mt-6 space-y-3">
              {transactions.slice(0, 12).map((transaction) => (
                <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4" key={transaction.id}>
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-white">{transaction.title}</p>
                    <p className="mt-1 text-xs text-white/45">{transaction.category}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white">{formatCurrency(transaction.amount, transaction.currency)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}