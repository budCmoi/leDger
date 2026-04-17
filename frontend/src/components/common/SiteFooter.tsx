import { Github, Instagram, Linkedin } from 'lucide-react';

export const SiteFooter = () => {
  return (
    <footer className="border-t border-white/10 px-6 py-10 text-sm text-white/50 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="premium-label">Ledger Premium</p>
          <p>Precision for modern finance operators.</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 uppercase tracking-[0.2em] text-white/60">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com" rel="noreferrer" target="_blank">
            <Github size={16} />
          </a>
          <a href="https://linkedin.com" rel="noreferrer" target="_blank">
            <Linkedin size={16} />
          </a>
          <a href="https://instagram.com" rel="noreferrer" target="_blank">
            <Instagram size={16} />
          </a>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl border-t border-white/5 pt-6 text-xs uppercase tracking-[0.22em] text-white/35">
        Copyright {new Date().getFullYear()} Ledger Premium. All rights reserved.
      </div>
    </footer>
  );
};