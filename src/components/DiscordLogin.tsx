import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, LogIn, ShieldCheck, X, Loader2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

const heroBackgroundUrl = new URL('../../assets/beautiful-shot-snowy-mountain-sunset.jpg', import.meta.url).href;

const DiscordIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    viewBox="0 0 127.14 96.36" 
    fill="currentColor" 
    className={className}
  >
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.4-5c1-.74,2-1.52,2.94-2.32a75.14,75.14,0,0,0,64.84,0c.95.8,1.92,1.58,2.94,2.32a68.43,68.43,0,0,1-10.4,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.81,49.19,123.4,26.47,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
  </svg>
);

interface DiscordLoginProps {
  authClient: SupabaseClient | null;
  authError: string | null;
  isAuthLoading: boolean;
}

export default function DiscordLogin({ authClient, authError, isAuthLoading }: DiscordLoginProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Authorization Prompt, 2: Logging in Spinner / Sincronizando
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleStartLogin = () => {
    setStep(1);
    setIsModalOpen(true);
  };

  const handleConfirmAuth = async () => {
    if (!authClient) {
      setLoginError('Autenticação Supabase indisponível.');
      return;
    }

    setStep(2);
    setLoginError(null);

    const { error } = await authClient.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
        scopes: 'identify email guilds',
        queryParams: {
          prompt: 'consent',
        },
      },
    });

    if (error) {
      setLoginError(error.message);
      setStep(1);
    }
  };

  const buttonDisabled = isAuthLoading || !authClient;

  const authFeedback = authError || loginError;

  const handleClose = () => {
    setIsModalOpen(false);
    setStep(1);
    setLoginError(null);
  };

  return (
    <div id="discord-login-screen" className="min-h-screen flex flex-col items-center px-6 relative overflow-hidden">
      <img
        src={heroBackgroundUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[50%_66%] pointer-events-none scale-[1.02]"
      />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,10,28,0.72)_0%,rgba(15,26,52,0.24)_35%,rgba(2,4,12,0.48)_62%,rgba(0,0,0,0.92)_100%)] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/55 to-transparent pointer-events-none" />

      <motion.div
        key="welcome-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex min-h-screen w-full max-w-4xl flex-col items-center justify-center text-center py-12"
      >
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-light tracking-[-0.03em] leading-[1.08] text-white/72 max-w-3xl">
          Onde o suporte humano
          <span className="block text-white font-normal">encontra precisão digital.</span>
        </h1>
        <p className="mt-28 sm:mt-36 max-w-lg font-sans text-xs sm:text-sm text-white/62 leading-relaxed">
          Resolva cargos, acessos e solicitações da comunidade com uma central integrada ao Discord.
        </p>

        <button
          id="btn-discord-login"
          onClick={handleStartLogin}
          disabled={isAuthLoading}
          className="group relative mt-6 h-12 px-7 bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-700 disabled:text-neutral-300 font-sans font-medium text-xs rounded-full transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,255,255,0.18)] outline-none focus:ring-2 focus:ring-white/50 cursor-pointer disabled:cursor-wait font-bold"
        >
          {isAuthLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4 text-black transition-transform duration-300 group-hover:translate-x-0.5" />
          )}
          <span>{isAuthLoading ? 'Carregando Supabase' : 'Entrar com Discord'}</span>
        </button>

        <p className="mt-3 text-[10px] text-white/38 font-sans">
          Ao continuar, você concorda com nossos Termos e Diretrizes de Privacidade.
        </p>
      </motion.div>

      {/* DEDICATED OVERLAY DIALOG MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop Fade & Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-zoom-out"
            />

            {/* Modal Card Element matching the mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[440px] bg-[#141416] border border-[#232326] p-6 md:p-8 rounded-3xl overflow-hidden z-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] flex flex-col"
            >
              {/* Mockup secure browser representation replaced with modern rounded badge header */}
              <div className="flex items-start justify-between mb-5">
                <div className="space-y-4">
                  {/* Rounded square badge containing user add icon mirroring mockup */}
                  <div className="w-12 h-12 rounded-xl bg-[#202022] border border-[#2d2d30] flex items-center justify-center shrink-0 shadow-lg text-[#5468FF]">
                    <DiscordIcon className="w-6 h-6 text-white" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans text-md font-bold tracking-tight text-white">
                      Autorizar Conexão
                    </h3>
                    <p className="font-sans text-[12px] text-neutral-400 font-normal leading-relaxed">
                      Sincronize sua conta com a Juicy Comunidade.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full border border-[#2d2d31] hover:border-neutral-700 bg-transparent flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer outline-none shrink-0"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {step === 1 ? (
                <div id="oauth-prompt" className="space-y-5">
                  {/* Top Premium App Card mimicking Discord connection */}
                  <div className="flex items-center justify-between bg-[#1a1a1c]/80 p-3 rounded-xl border border-[#232326]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#0004C8] flex items-center justify-center rounded-lg text-white font-display font-black shadow-[0_0_15px_rgba(0,4,200,0.25)]">
                        J
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-tight leading-none">Juicy Suporte</h4>
                        <p className="text-[9px] text-[#5468FF] font-sans uppercase tracking-wider mt-1.5 font-bold">Aplicativo Autorizado</p>
                      </div>
                    </div>
                    <DiscordIcon className="w-4 h-4 text-neutral-450" />
                  </div>

                  {/* List of Permissions, styled identically to the mockup list */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-sans font-bold text-neutral-500 uppercase tracking-widest leading-none">
                      Solicitação de permissão:
                    </div>

                    {/* Permission Item 1 */}
                    <div className="flex items-start justify-between p-2.5 rounded-xl bg-[#18181b]/40 border border-[#232326]/40">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Circular Avatar / Badge representation */}
                        <div className="w-8 h-8 rounded-full bg-[#1e1e20] border border-[#2d2d30] flex items-center justify-center shrink-0 text-white">
                          <LogIn className="w-4 h-4 text-neutral-300" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-sans text-xs font-bold text-white tracking-tight">
                            Identidade Pública
                          </h4>
                          <span className="font-sans text-[10px] text-neutral-450 leading-relaxed block">
                            Permite ler suas informações públicas de perfil do Discord.
                          </span>
                        </div>
                      </div>

                      {/* Pill Badge representing chosen level */}
                      <span className="shrink-0 inline-flex items-center text-[9px] font-sans font-bold uppercase tracking-wider bg-neutral-900 border border-[#232326] text-neutral-450 px-2 py-1 rounded-md leading-none h-5">
                        Ler
                      </span>
                    </div>

                    {/* Permission Item 2 */}
                    <div className="flex items-start justify-between p-2.5 rounded-xl bg-[#18181b]/40 border border-[#232326]/40">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#1e1e20] border border-[#2d2d30] flex items-center justify-center shrink-0 text-white">
                          <ShieldCheck className="w-4 h-4 text-neutral-300" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-sans text-xs font-bold text-white tracking-tight">
                            Sincronizar Comunidades
                          </h4>
                          <span className="font-sans text-[10px] text-neutral-450 leading-relaxed block">
                            Irá exibir apenas as suas fotos, nomes e descrições dos servidores Discord Juicy integrados.
                          </span>
                        </div>
                      </div>

                      <span className="shrink-0 inline-flex items-center text-[9px] font-sans font-bold uppercase tracking-wider bg-[#0004C8]/10 border border-[#0004C8]/20 text-[#5468FF] px-2 py-1 rounded-md leading-none h-5">
                        Privado
                      </span>
                    </div>
                  </div>

                  {/* Sincere helper privacy label */}
                  <div className="bg-[#18181b]/50 p-3.5 border border-[#232326] rounded-2xl flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#0004C8] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                      A Juicy Comunidade preserva sua privacidade. Não coletamos senhas, dados de canais privados ou contatos externos.
                    </p>
                  </div>

                  {authFeedback && (
                    <div className="bg-red-500/5 p-3.5 border border-red-950/50 rounded-2xl">
                      <p className="text-[11px] text-red-400 leading-relaxed font-sans">
                        {authFeedback}
                      </p>
                    </div>
                  )}

                  {/* Operational Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[#232326]">
                    <button
                      id="btn-oauth-cancel"
                      onClick={handleClose}
                      className="flex-1 h-11 border border-[#232326] hover:border-[#2f2f32] hover:bg-[#18181a] text-neutral-400 hover:text-white font-sans text-xs font-bold rounded-full transition-all outline-none cursor-pointer active:scale-[0.98]"
                    >
                      Cancelar
                    </button>
                    <button
                      id="btn-oauth-accept"
                      onClick={handleConfirmAuth}
                      disabled={buttonDisabled}
                      className="button-pill group flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="button-text gap-2">
                        <span>{isAuthLoading ? 'Carregando...' : 'Autorizar'}</span>
                        {!isAuthLoading && (
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div id="oauth-loading" className="py-12 flex flex-col items-center justify-center space-y-5">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#232326] bg-[#18181b]/50">
                    <div className="absolute inset-1 rounded-full border-2 border-[#0004C8]/20 border-t-[#5468FF] animate-spin" />
                    <div className="font-display font-black text-[11px] text-white">
                      J
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-200 font-bold font-sans">Sincronizando com Juicy Comunidade...</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
