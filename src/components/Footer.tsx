import React, { useState } from 'react';
import { ExternalLink, Globe, Instagram, MessageSquare, Shield, Twitter, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type LegalModalType = 'terms' | 'privacy';

const DISCORD_LINKS = [
  {
    label: 'Termos de Serviço do Discord',
    href: 'https://discord.com/terms',
  },
  {
    label: 'Política de Privacidade do Discord',
    href: 'https://discord.com/privacy',
  },
  {
    label: 'Diretrizes da Comunidade do Discord',
    href: 'https://discord.com/guidelines',
  },
  {
    label: 'Central de Políticas do Discord',
    href: 'https://discord.com/safety/policy',
  },
  {
    label: 'Documentação para Desenvolvedores Discord',
    href: 'https://discord.com/developers/docs',
  },
];

const modalCopy = {
  terms: {
    title: 'Termos de Uso',
    eyebrow: 'Juicy Comunidade',
    intro:
      'Ao usar a Central de Suporte da Juicy Comunidade, você concorda em utilizar este ambiente de forma responsável, respeitando as regras da comunidade, a legislação aplicável e os termos das plataformas integradas.',
    sections: [
      {
        title: 'Uso da central',
        body:
          'A central existe para atendimento, acompanhamento de solicitações, dúvidas, recuperação de acesso, cargos, eventos e assuntos relacionados à comunidade. Não use o suporte para spam, abuso, fraude, assédio, engenharia social ou envio de conteúdo ilegal.',
      },
      {
        title: 'Conta e autenticação',
        body:
          'O acesso pode usar autenticação via Discord/Supabase. Você é responsável por manter sua conta segura e por informar dados corretos ao abrir chamados. A equipe pode recusar ou encerrar atendimentos com informações falsas, ofensivas ou insuficientes.',
      },
      {
        title: 'Conteúdo enviado',
        body:
          'Mensagens, anexos e evidências enviados em chamados devem pertencer a você ou ter autorização de uso. Você não deve enviar dados sensíveis de terceiros, senhas, tokens, documentos desnecessários ou informações privadas que não sejam relevantes ao atendimento.',
      },
      {
        title: 'Regras do Discord',
        body:
          'Como a comunidade opera com integração Discord, também se aplicam os Termos de Serviço, Política de Privacidade, Diretrizes da Comunidade e demais políticas oficiais do Discord.',
      },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    eyebrow: 'Dados e segurança',
    intro:
      'Esta política resume como a Juicy Comunidade trata dados usados na Central de Suporte. O objetivo é coletar apenas o necessário para autenticar, identificar solicitações e responder aos chamados.',
    sections: [
      {
        title: 'Dados coletados',
        body:
          'Podemos processar dados públicos do perfil Discord, como nome, avatar, identificador, e-mail quando disponibilizado pelo provedor, além de conteúdo dos chamados, categoria, servidor selecionado, mensagens e nomes de anexos enviados.',
      },
      {
        title: 'Finalidade de uso',
        body:
          'Os dados são usados para autenticação, triagem de suporte, prevenção de abuso, resposta aos chamados, histórico de atendimento e notificações administrativas, como webhooks internos de suporte quando configurados.',
      },
      {
        title: 'Compartilhamento',
        body:
          'Os dados podem trafegar por serviços necessários ao funcionamento da central, como Supabase, Discord OAuth e Discord Webhooks. Não vendemos dados pessoais. O compartilhamento ocorre apenas para operar a central, cumprir obrigações legais ou proteger a comunidade.',
      },
      {
        title: 'Cuidados do usuário',
        body:
          'Evite enviar senhas, tokens, chaves privadas, documentos completos ou dados sensíveis que não sejam indispensáveis. Caso precise remover ou corrigir dados de um chamado, entre em contato pelo canal oficial de suporte.',
      },
    ],
  },
};

export default function Footer() {
  const [activeModal, setActiveModal] = useState<LegalModalType | null>(null);
  const modal = activeModal ? modalCopy[activeModal] : null;

  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (activeModal) {
      html.classList.add('modal-scroll-lock');
      body.classList.add('modal-scroll-lock');
    } else {
      html.classList.remove('modal-scroll-lock');
      body.classList.remove('modal-scroll-lock');
    }

    return () => {
      html.classList.remove('modal-scroll-lock');
      body.classList.remove('modal-scroll-lock');
    };
  }, [activeModal]);

  return (
    <footer id="juicy-footer" className="w-full border-t border-neutral-900 bg-black pt-16 pb-12 mt-24 relative overflow-hidden">
      {/* Absolute background subtle ambient flow */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Main Grid structure reminiscent of 9elements editorial layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 gap-x-8 pb-12 border-b border-neutral-950">
          
          {/* Brand block */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-blue flex items-center justify-center rounded text-xs font-display font-black tracking-widest text-white">
                J
              </div>
              <span className="font-display font-bold text-sm tracking-widest text-white uppercase">
                JUICY COMUNIDADE
              </span>
            </div>
            
            <div className="space-y-1 text-xs text-neutral-400 font-sans leading-relaxed">
              <p className="text-white font-medium">São Paulo, BR — Digital Hub</p>
              <p className="text-neutral-500 hover:text-neutral-300 transition-colors">suporte@juicycomunidade.com.br</p>
              <p className="text-neutral-500">Desenvolvido exclusivo para membros</p>
            </div>
          </div>

          {/* Social column */}
          <div className="md:col-span-5 space-y-4 md:text-right">
            <span className="font-sans text-xs font-semibold text-white tracking-wider block">
              Juicy Cyber Security
            </span>
            <p className="text-[11px] font-sans text-neutral-500 leading-relaxed max-w-xs md:ml-auto">
              Autenticado via canais integrados de criptografia e conformidade GDPR.
            </p>
            
            {/* Elegant tiny monochrome circles row */}
            <div className="flex items-center gap-3 pt-2 md:justify-end">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-neutral-900 bg-neutral-950/40 hover:bg-white hover:text-black hover:border-white text-neutral-400 flex items-center justify-center transition-all duration-300">
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-neutral-900 bg-neutral-950/40 hover:bg-white hover:text-black hover:border-white text-neutral-400 flex items-center justify-center transition-all duration-300">
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-neutral-900 bg-neutral-950/40 hover:bg-white hover:text-black hover:border-white text-neutral-400 flex items-center justify-center transition-all duration-300">
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-neutral-900 bg-neutral-950/40 hover:bg-white hover:text-black hover:border-white text-neutral-400 flex items-center justify-center transition-all duration-300">
                <Globe className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Lower row with legal notice exactly mimicking the image */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-sans text-neutral-500">
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Termos de Uso
            </button>
            <span className="text-neutral-800">•</span>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Política de Privacidade
            </button>
            <span className="text-neutral-800">•</span>
            <span>Segurança de Dados</span>
          </div>
          
          <div className="text-[11px] font-sans text-neutral-500">
            © {new Date().getFullYear()} Juicy Comunidade. Todos os direitos reservados.
          </div>
        </div>

      </div>

      <AnimatePresence>
        {modal && (
          <div className="legal-modal-root fixed inset-0 z-120 flex items-center justify-center overflow-hidden p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-zoom-out"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="legal-modal-panel relative z-10 flex w-full max-w-[520px] h-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[88dvh] flex-col overflow-hidden rounded-3xl border border-[#232326] bg-[#141416] p-5 shadow-[0_30px_70px_rgba(0,0,0,0.85)] sm:p-6 md:p-8"
            >
              <div className="flex items-start justify-between mb-5 shrink-0">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#202022] border border-[#2d2d30] flex items-center justify-center shrink-0 shadow-lg text-[#5468FF]">
                    <Shield className="w-6 h-6 text-white" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans text-md font-bold tracking-tight text-white">
                      {modal.title}
                    </h3>
                    <p className="font-sans text-[12px] text-neutral-400 font-normal leading-relaxed">
                      {modal.eyebrow}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full border border-[#2d2d31] hover:border-neutral-700 bg-transparent flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer outline-none shrink-0"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="legal-modal-scroll space-y-5 overflow-y-auto overscroll-contain pr-0 sm:pr-1">
                <div className="flex items-center justify-between bg-[#1a1a1c]/80 p-3 rounded-xl border border-[#232326]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-[#0004C8] flex items-center justify-center rounded-lg text-white font-display font-black shadow-[0_0_15px_rgba(0,4,200,0.25)] shrink-0">
                      J
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white tracking-tight leading-none truncate">Juicy Comunidade</h4>
                      <p className="text-[9px] text-[#5468FF] font-sans uppercase tracking-wider mt-1.5 font-bold">Documento legal</p>
                    </div>
                  </div>
                  <Shield className="w-4 h-4 text-neutral-450 shrink-0" />
                </div>

                <div className="bg-[#18181b]/50 p-3.5 border border-[#232326] rounded-2xl flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-[#0004C8] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                    {modal.intro}
                  </p>
                </div>

                <div className="space-y-3">
                  {modal.sections.map((section) => (
                    <section key={section.title} className="flex items-start justify-between p-2.5 rounded-xl bg-[#18181b]/40 border border-[#232326]/40 gap-3">
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-sans text-xs font-bold text-white tracking-tight">
                          {section.title}
                        </h4>
                        <p className="font-sans text-[10px] text-neutral-450 leading-relaxed">
                          {section.body}
                        </p>
                      </div>
                    </section>
                  ))}
                </div>

                <div className="bg-[#18181b]/50 p-3.5 border border-[#232326] rounded-2xl space-y-3">
                  <div className="text-[10px] font-sans font-bold text-neutral-500 uppercase tracking-widest leading-none">
                    Documentos oficiais do Discord
                  </div>
                  <div className="space-y-2">
                    {DISCORD_LINKS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 rounded-xl border border-[#232326]/60 bg-[#18181b]/50 px-3 py-2.5 text-[11px] text-neutral-400 transition-colors hover:border-[#0004C8]/40 hover:text-white"
                      >
                        <span className="font-sans font-bold">{link.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-neutral-600 transition-colors group-hover:text-[#5468FF]" />
                      </a>
                    ))}
                  </div>
                </div>

                <p className="border-t border-[#232326] pt-4 font-sans text-[10px] leading-relaxed text-neutral-600">
                  Este conteúdo é um resumo operacional da Juicy Comunidade e não substitui os documentos oficiais das plataformas integradas nem orientação jurídica específica.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}
