import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <Card className="max-w-xl space-y-6 text-center">
        <p className="premium-label">404</p>
        <h1 className="text-3xl uppercase tracking-[0.18em] text-white">Page introuvable</h1>
        <p className="text-sm leading-7 text-white/55">La page demandee n existe pas dans le plan de routes actuel de Ledger Premium.</p>
        <Button onClick={() => window.location.assign('/')}>Retour a l accueil</Button>
      </Card>
    </div>
  );
}