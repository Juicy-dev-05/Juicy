import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronDown, ChevronUp, FileText, Check, MessageSquareCode, CircleHelp, MessageSquare } from 'lucide-react';
import { Ticket, TicketStatus, ChatMessage } from '../types';
import SupportChatDrawer from './SupportChatDrawer';

// Premium high-fidelity pill status badges mimicking premium loader styles with interactive hover states
function StatusPill({ status }: { status: TicketStatus }) {
  if (status === 'Recebido') {
    return (
      <motion.div
        whileHover={{ scale: 1.04, y: -1, borderColor: '#a78bfa' }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3.5 md:py-1.5 bg-[#13111c]/95 border border-[#8b5cf6]/25 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-shadow duration-300 cursor-default"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 rotate-[-15deg] shrink-0">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        <span className="font-sans text-[10px] md:text-[11px] font-semibold text-[#a78bfa] tracking-tight leading-none hidden min-[400px]:inline">
          Recebido
        </span>
      </motion.div>
    );
  }

  if (status === 'Em análise') {
    return (
      <motion.div
        whileHover={{ scale: 1.04, y: -1, borderColor: '#dec44e' }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3.5 md:py-1.5 bg-[#18160e]/95 border border-[#a18833]/30 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none hover:shadow-[0_0_15px_rgba(222,196,78,0.25)] transition-shadow duration-300 cursor-default"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#dec44e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m21 21-4.3-4.3"></path>
          <path d="m11 8-2 3h4l-2 3" strokeWidth="2.5"></path>
        </svg>
        <span className="font-sans text-[10px] md:text-[11px] font-semibold text-[#dec44e] tracking-tight leading-none hidden min-[400px]:inline">
          Análise
        </span>
      </motion.div>
    );
  }

  if (status === 'Respondido') {
    return (
      <motion.div
        whileHover={{ scale: 1.04, y: -1, borderColor: '#4FA3FF' }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3.5 md:py-1.5 bg-[#0a1120]/95 border border-[#3b82f6]/25 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none hover:shadow-[0_0_15px_rgba(84,104,255,0.3)] transition-shadow duration-300 cursor-default"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#4FA3FF" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3.5" className="w-3.5 h-3.5 animate-spin shrink-0" style={{ animationDuration: '3.5s' }}>
          <circle cx="12" cy="12" r="9"></circle>
        </svg>
        <span className="font-sans text-[10px] md:text-[11px] font-semibold text-[#4FA3FF] tracking-tight leading-none hidden min-[400px]:inline">
          Respondido
        </span>
      </motion.div>
    );
  }

  // Finalizado
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -1, borderColor: '#3ce07e' }}
      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
      className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3.5 md:py-1.5 bg-[#0a180f]/95 border border-[#10b981]/25 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none hover:shadow-[0_0_15px_rgba(60,224,126,0.3)] transition-shadow duration-300 cursor-default"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#3ce07e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="16 10 11 15 8 12"></polyline>
      </svg>
      <span className="font-sans text-[10px] md:text-[11px] font-semibold text-[#3ce07e] tracking-tight leading-none hidden min-[400px]:inline">
        Finalizado
      </span>
    </motion.div>
  );
}

interface SupportStatusProps {
  tickets: Ticket[];
  onUpdateChat?: (ticketId: string, updatedMessages: ChatMessage[]) => void;
}

export default function SupportStatus({ tickets, onUpdateChat }: SupportStatusProps) {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [activeChatTicket, setActiveChatTicket] = useState<Ticket | null>(null);

  // Keep chat data fresh when parent updates
  const curChatTicket = activeChatTicket 
    ? tickets.find(t => t.id === activeChatTicket.id) || activeChatTicket 
    : null;

  const toggleExpand = (id: string) => {
    setExpandedTicketId(expandedTicketId === id ? null : id);
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'Recebido':
        return 'text-neutral-400 border-neutral-800 bg-neutral-950';
      case 'Em análise':
        return 'text-amber-400 border-amber-950/40 bg-amber-500/5';
      case 'Respondido':
        return 'text-brand-blue border-brand-blue-glow bg-brand-blue/5';
      case 'Finalizado':
        return 'text-emerald-400 border-emerald-950/40 bg-emerald-500/5';
    }
  };

  // Helper to draw the elegant discrete timeline
  const renderStatusTimeline = (currentStatus: TicketStatus) => {
    const statuses: TicketStatus[] = ['Recebido', 'Em análise', 'Respondido', 'Finalizado'];
    const currentIndex = statuses.indexOf(currentStatus);

    return (
      <div className="grid grid-cols-4 gap-1 md:gap-2 pt-6 pb-2">
        {statuses.map((stepName, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div key={stepName} className="flex flex-col space-y-3 relative min-w-0">
              {/* Connector Line */}
              {idx < 3 && (
                <div 
                  className={`absolute left-1/2 right-[-50%] top-2.5 h-[1px] transition-colors duration-1000 ${
                    idx < currentIndex ? 'bg-brand-blue' : 'bg-neutral-800'
                  }`} 
                  style={{ width: '100%', zIndex: 0 }}
                />
              )}

              {/* Status Indicator Bullet */}
              <div className="flex justify-center relative z-10">
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-700 ${
                    isCurrent 
                      ? 'border-brand-blue bg-black text-brand-blue shadow-[0_0_8px_var(--color-brand-blue-glow)] scale-110' 
                      : isPast 
                        ? 'border-brand-blue bg-brand-blue text-white' 
                        : 'border-neutral-900 bg-black text-neutral-600'
                  }`}
                >
                  {isPast ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-brand-blue' : 'bg-neutral-800'}`} />
                  )}
                </div>
              </div>

              {/* Text label */}
              <div className="text-center px-0.5 min-w-0">
                <p className={`font-sans text-[7.5px] min-[360px]:text-[8.5px] min-[420px]:text-[10px] md:text-[11px] uppercase tracking-wider font-bold transition-colors duration-500 leading-tight break-words ${
                  isCurrent 
                    ? 'text-[#4FA3FF]' 
                    : isPast 
                      ? 'text-neutral-200' 
                      : 'text-neutral-600'
                }`}>
                  {stepName === 'Em análise' ? (
                    <>
                      <span className="block sm:hidden">Análise</span>
                      <span className="hidden sm:block">Em análise</span>
                    </>
                  ) : stepName}
                </p>
                <p className="text-[9px] font-mono text-neutral-600 mt-0.5 hidden sm:block">
                  {isCurrent ? 'Status Atual' : isPast ? 'Concluído' : 'Aguardando'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="support-status-comp" className="space-y-8">
      <div className="space-y-2">
        <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
          Status da Solicitação
        </h3>
        <p className="font-sans text-sm text-neutral-400">
          Acompanhe o andamento dos seus envios ativos para a nossa equipe.
        </p>
      </div>

      {tickets.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-neutral-900 bg-black p-12 rounded-xl text-center flex flex-col items-center justify-center gap-4 py-16"
        >
          <div className="w-10 h-10 rounded-full border border-neutral-900 flex items-center justify-center text-neutral-600 bg-neutral-950">
            <CircleHelp className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-sm font-medium text-neutral-300">Nenhuma solicitação aberta</h4>
            <p className="font-sans text-xs text-neutral-500 max-w-sm">
              Quando você enviar um chamado para ajuda, ele aparecerá aqui com as atualizações de progresso.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicketId === ticket.id;

            return (
              <div 
                id={`ticket-row-${ticket.id}`}
                key={ticket.id}
                className={`border rounded-xl transition-all duration-300 ${
                  isExpanded ? 'border-neutral-800 bg-neutral-950/35' : 'border-neutral-900 bg-black hover:border-neutral-800'
                }`}
              >
                {/* Header view */}
                <div 
                  onClick={() => toggleExpand(ticket.id)}
                  className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer select-none"
                >
                  <div className="space-y-2.5 min-w-0 flex-1 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2.5">
                      {ticket.serverName && (
                        <span className="whitespace-nowrap font-sans text-[9px] md:text-[9.5px] font-semibold text-white py-0.5 px-1.5 bg-neutral-950 border border-neutral-850 rounded-full">
                          {ticket.serverName}
                        </span>
                      )}
                      <span className="whitespace-nowrap font-mono text-[8px] md:text-[9px] uppercase tracking-widest text-neutral-500 py-0.5 px-1.5 bg-neutral-950 border border-neutral-900 rounded-full">
                        {ticket.category}
                      </span>
                      <span className="whitespace-nowrap font-sans text-[10px] md:text-xs text-neutral-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="truncate">{ticket.createdAt}</span>
                      </span>
                    </div>

                    <h4 className="font-display text-xs md:text-sm font-semibold text-white tracking-tight break-words whitespace-normal leading-snug">
                      {ticket.subject}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-3 shrink-0 border-t border-neutral-900/30 sm:border-t-0 pt-3.5 sm:pt-0 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 md:gap-2.5">
                      {ticket.status === 'Respondido' && (
                        <motion.div
                          whileHover={{ scale: 1.04, y: -1, borderColor: '#4FA3FF' }}
                          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0a1120]/95 border border-[#3b82f6]/25 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none hover:shadow-[0_0_15px_rgba(84,104,255,0.3)] transition-shadow duration-300 cursor-default"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="#4FA3FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0 animate-pulse">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span className="font-sans text-[10px] md:text-[11px] font-semibold text-[#4FA3FF] tracking-tight leading-none">
                            Chat
                          </span>
                        </motion.div>
                      )}

                      {ticket.status === 'Finalizado' && (
                        <motion.div
                          whileHover={{ scale: 1.04, y: -1, borderColor: '#a3a3a3' }}
                          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#18181b]/95 border border-neutral-800 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow duration-300 cursor-default"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span className="font-sans text-[10px] md:text-[11px] font-semibold text-[#a3a3a3] tracking-tight leading-none">
                            Histórico
                          </span>
                        </motion.div>
                      )}

                      {/* Premium loader style capsule status pill */}
                      <StatusPill status={ticket.status} />
                    </div>

                    <div className="text-neutral-500 pl-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4.5 h-4.5" />
                      ) : (
                        <ChevronDown className="w-4.5 h-4.5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded State (Details & Timeline) */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-neutral-900/50"
                    >
                      <div className="p-6 space-y-6">
                        {/* Timeline display bar */}
                        <div className="bg-black/40 border border-neutral-950 p-5 rounded-lg">
                          {renderStatusTimeline(ticket.status)}
                        </div>

                        {/* User Message Box */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Sua Mensagem</p>
                          <div className="bg-neutral-950/60 border border-neutral-900/40 p-4 rounded-lg">
                            <p className="font-sans text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                              {ticket.message}
                            </p>
                            
                            {ticket.fileName && (
                              <div className="mt-3 pt-3 border-t border-neutral-900/40 flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Anexo: {ticket.fileName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Team Response Box */}
                        {(ticket.status === 'Respondido' || ticket.status === 'Finalizado') && ticket.replyMessage && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-mono uppercase tracking-widest text-[#5468FF] font-bold">Resposta do Analista Juicy</p>
                              <span className="text-[9px] font-sans text-neutral-500 italic">Atualizado recentemente</span>
                            </div>
                            <div className="bg-brand-blue/[1.5%] border border-brand-blue/15 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <p className="font-sans text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap flex-1">
                                {ticket.replyMessage}
                              </p>
                              {(ticket.status === 'Respondido' || ticket.status === 'Finalizado') && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveChatTicket(ticket);
                                  }}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0004C8] hover:bg-[#1116ed] text-white text-xs font-bold rounded-xl shrink-0 transition-all duration-300 shadow-[0_4px_12px_rgba(0,4,200,0.2)] cursor-pointer outline-none active:scale-[0.98]"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{ticket.status === 'Finalizado' ? 'Ver Histórico' : 'Abrir Chat'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Support Chat Drawer */}
      {curChatTicket && (
        <SupportChatDrawer
          isOpen={activeChatTicket !== null}
          onClose={() => setActiveChatTicket(null)}
          ticket={curChatTicket}
          onUpdateChat={onUpdateChat}
        />
      )}
    </div>
  );
}
