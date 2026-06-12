import { useEffect, useRef } from 'react';
import { Home } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound() {
  const homeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    homeButtonRef.current?.focus();
  }, []);

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <section className="not-found-arcade relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,4,200,0.18),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0004C8]/10 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-3xl"
      >
        <div className="space-y-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0004C8] shadow-[0_0_14px_rgba(0,4,200,0.9)]" />
            Erro 404
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight leading-none">
              F<span className="not-found-star" aria-hidden="true">*</span>CK
              <span className="block text-neutral-500">404</span>
            </h1>
            <p className="max-w-md mx-auto font-sans text-sm sm:text-base text-neutral-400 leading-relaxed">
              O endereço que você tentou acessar não existe ou foi movido dentro da central Juicy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              ref={homeButtonRef}
              type="button"
              onClick={goHome}
              onKeyDown={(event) => {
                if (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  goHome();
                }
              }}
              className="arcade-home-button group h-12 px-6 rounded-full bg-white text-black font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-[0.98] transition-all"
            >
              <Home className="w-4 h-4" />
              Voltar ao início
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
