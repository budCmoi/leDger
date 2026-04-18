import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SiteFooter } from '../components/common/SiteFooter';
import { isFirebaseClientConfigured } from '../lib/firebase';
import { firebaseAuthService } from '../services/firebase-auth';
import { useAppStore } from '../store/useAppStore';

const signInSchema = z.object({
  email: z.string().trim().email('Entre une adresse email valide.'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres.'),
});

const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(2, 'Entre ton nom complet.').max(80, 'Le nom est trop long.'),
  companyName: z.string().trim().min(2, 'Entre le nom de la societe.').max(120, 'Le nom de la societe est trop long.'),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/60';

const errorClassName = 'text-xs uppercase tracking-[0.18em] text-rose-200/90';

const resolveNextPath = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return '/dashboard';
  }

  return value;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const authStatus = useAppStore((state) => state.authStatus);
  const bootstrapped = useAppStore((state) => state.bootstrapped);
  const setAuthSession = useAppStore((state) => state.setAuthSession);
  const setDashboard = useAppStore((state) => state.setDashboard);
  const setTransactions = useAppStore((state) => state.setTransactions);
  const setInvoices = useAppStore((state) => state.setInvoices);
  const [searchParams] = useSearchParams();
  const nextPath = resolveNextPath(searchParams.get('next'));
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      password: '',
    },
  });

  const applyBootstrap = (payload: Awaited<ReturnType<typeof firebaseAuthService.signIn>>) => {
    setAuthSession(payload.session);
    setDashboard(payload.dashboard);
    setTransactions(payload.transactions);
    setInvoices(payload.invoices);
  };

  const handleModeChange = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setAuthErrorMessage(null);
  };

  const handleSignIn = signInForm.handleSubmit(async (values) => {
    setBusy(true);
    setAuthErrorMessage(null);

    try {
      const payload = await firebaseAuthService.signIn(values.email, values.password);
      applyBootstrap(payload);
      navigate(nextPath, { replace: true });
    } catch (error) {
      setAuthErrorMessage(firebaseAuthService.getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  });

  const handleSignUp = signUpForm.handleSubmit(async (values) => {
    setBusy(true);
    setAuthErrorMessage(null);

    try {
      const payload = await firebaseAuthService.signUp(values);
      applyBootstrap(payload);
      navigate(nextPath, { replace: true });
    } catch (error) {
      setAuthErrorMessage(firebaseAuthService.getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  });

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setAuthErrorMessage(null);

    try {
      const payload = await firebaseAuthService.signInWithGoogle();
      applyBootstrap(payload);
      navigate(nextPath, { replace: true });
    } catch (error) {
      const message = firebaseAuthService.getErrorMessage(error);
      if (!message.includes('popup-closed-by-user')) {
        setAuthErrorMessage(message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (bootstrapped && authStatus === 'authenticated') {
    return <Navigate replace to={nextPath} />;
  }

  const firebaseConfigMessage = !isFirebaseClientConfigured
    ? 'Ajoute les variables VITE_FIREBASE_* dans le frontend pour activer la connexion et l inscription.'
    : null;

  return (
    <div className="premium-shell overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pt-8 md:px-10">
        <header className="flex items-center justify-between py-6">
          <div>
            <p className="premium-label">Ledger Premium</p>
            <p className="mt-2 text-lg uppercase tracking-[0.28em] text-white">Secure sign in</p>
          </div>
          <Button onClick={() => navigate('/')} variant="secondary">
            <ArrowLeft size={16} />
            Back home
          </Button>
        </header>

        <main className="flex flex-1 items-center py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.6 }}>
              <Badge>Firebase email and password</Badge>
              <h1 className="mt-6 max-w-3xl text-4xl uppercase leading-[1.1] tracking-[0.16em] text-white md:text-6xl">
                Secure access, real account creation and MongoDB-backed workspace data.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 md:text-base">
                This route now handles email and password sign in through Firebase Auth, while the backend verifies the Firebase token, issues the application session and persists the user profile in MongoDB.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-white/45">
                <span className="rounded-full border border-white/10 px-4 py-2">Email and password forms</span>
                <span className="rounded-full border border-white/10 px-4 py-2">Firebase verified identity</span>
                <span className="rounded-full border border-white/10 px-4 py-2">MongoDB-backed session data</span>
              </div>
            </motion.div>

            <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: 24 }} transition={{ delay: 0.15, duration: 0.65 }}>
              <Card className="space-y-8 p-7 md:p-9">
                <div className="space-y-3">
                  <p className="premium-label">Authentication</p>
                  <h2 className="text-2xl uppercase tracking-[0.18em] text-white">Create a session</h2>
                  <p className="text-sm leading-7 text-white/58">
                    Choose whether to log into an existing workspace or create a new account. Once Firebase validates the identity, the API creates or updates the user in MongoDB and returns the protected app session.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-2">
                  <button
                    className={`rounded-[1.1rem] px-4 py-3 text-sm uppercase tracking-[0.18em] transition ${
                      mode === 'signin' ? 'bg-white text-paper' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                    }`}
                    onClick={() => handleModeChange('signin')}
                    type="button"
                  >
                    Sign in
                  </button>
                  <button
                    className={`rounded-[1.1rem] px-4 py-3 text-sm uppercase tracking-[0.18em] transition ${
                      mode === 'signup' ? 'bg-white text-paper' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                    }`}
                    onClick={() => handleModeChange('signup')}
                    type="button"
                  >
                    Sign up
                  </button>
                </div>

                {firebaseConfigMessage ? (
                  <div className="rounded-[1.5rem] border border-amber-300/30 bg-amber-400/10 px-5 py-4 text-sm leading-7 text-amber-100">
                    {firebaseConfigMessage}
                  </div>
                ) : null}

                {authErrorMessage ? (
                  <div className="rounded-[1.5rem] border border-rose-300/30 bg-rose-400/10 px-5 py-4 text-sm leading-7 text-rose-100">
                    {authErrorMessage}
                  </div>
                ) : null}

                {mode === 'signin' ? (
                  <form className="space-y-4" onSubmit={handleSignIn}>
                    <div className="space-y-2">
                      <input
                        autoComplete="email"
                        className={inputClassName}
                        placeholder="Email"
                        {...signInForm.register('email')}
                      />
                      {signInForm.formState.errors.email ? <p className={errorClassName}>{signInForm.formState.errors.email.message}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <input
                        autoComplete="current-password"
                        className={inputClassName}
                        placeholder="Password"
                        type="password"
                        {...signInForm.register('password')}
                      />
                      {signInForm.formState.errors.password ? <p className={errorClassName}>{signInForm.formState.errors.password.message}</p> : null}
                    </div>

                    <Button className="w-full justify-between" disabled={busy || !isFirebaseClientConfigured} type="submit">
                      <span>{busy ? 'Opening workspace' : 'Sign in'}</span>
                      <ArrowRight size={16} />
                    </Button>
                  </form>
                ) : (
                  <form className="space-y-4" onSubmit={handleSignUp}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <input className={inputClassName} placeholder="Full name" {...signUpForm.register('name')} />
                        {signUpForm.formState.errors.name ? <p className={errorClassName}>{signUpForm.formState.errors.name.message}</p> : null}
                      </div>
                      <div className="space-y-2">
                        <input className={inputClassName} placeholder="Company name" {...signUpForm.register('companyName')} />
                        {signUpForm.formState.errors.companyName ? <p className={errorClassName}>{signUpForm.formState.errors.companyName.message}</p> : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input autoComplete="email" className={inputClassName} placeholder="Email" {...signUpForm.register('email')} />
                      {signUpForm.formState.errors.email ? <p className={errorClassName}>{signUpForm.formState.errors.email.message}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <input
                        autoComplete="new-password"
                        className={inputClassName}
                        placeholder="Password"
                        type="password"
                        {...signUpForm.register('password')}
                      />
                      {signUpForm.formState.errors.password ? <p className={errorClassName}>{signUpForm.formState.errors.password.message}</p> : null}
                    </div>

                    <Button className="w-full justify-between" disabled={busy || !isFirebaseClientConfigured} type="submit">
                      <span>{busy ? 'Creating workspace' : 'Create account'}</span>
                      <ArrowRight size={16} />
                    </Button>
                  </form>
                )}

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-xs uppercase tracking-widest text-white/30">or</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
                  disabled={busy || !isFirebaseClientConfigured}
                  onClick={handleGoogleSignIn}
                  type="button"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                    <ShieldCheck className="text-accent4" size={18} />
                    <p className="mt-4 text-sm uppercase tracking-[0.16em] text-white">Private routes</p>
                    <p className="mt-2 text-sm leading-7 text-white/52">
                      If you were trying to open a protected page, the app will restore your intended destination after the session is created.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                    <LockKeyhole className="text-accent3" size={18} />
                    <p className="mt-4 text-sm uppercase tracking-[0.16em] text-white">MongoDB sync</p>
                    <p className="mt-2 text-sm leading-7 text-white/52">
                      Every successful Firebase authentication is mirrored in the MongoDB user collection before the dashboard data is loaded.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-white/58">
                  <div className="flex items-center gap-3 text-white">
                    <Sparkles className="text-accent" size={16} />
                    <span className="text-xs uppercase tracking-[0.2em]">Session design</span>
                  </div>
                  <p className="mt-3">
                    Firebase authenticates the identity. The Express API verifies the token, issues the protected app cookies and serves MongoDB-backed workspace data.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}