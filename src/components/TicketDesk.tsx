import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCheck, Clock, FileText, MessageSquare, Search, Send, ShieldCheck, X } from 'lucide-react';
import { ChatMessage, Ticket, TicketStatus } from '../types';

interface TicketDeskProps {
  tickets: Ticket[];
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const STATUS_OPTIONS: TicketStatus[] = ['Recebido', 'Em análise', 'Respondido', 'Finalizado'];

const buildThread = (ticket: Ticket): ChatMessage[] => {
  if (ticket.chatHistory && ticket.chatHistory.length > 0) {
    return ticket.chatHistory;
  }

  const messages: ChatMessage[] = [
    {
      id: `${ticket.id}-initial`,
      sender: 'user',
      text: ticket.message,
      timestamp: ticket.createdAt,
    },
  ];

  if (ticket.replyMessage) {
    messages.push({
      id: `${ticket.id}-reply`,
      sender: 'support',
      text: ticket.replyMessage,
      timestamp: 'Atendimento',
    });
  }

  return messages;
};

export default function TicketDesk({ tickets, onUpdateTicket }: TicketDeskProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== 'Finalizado'),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return openTickets;
    }

    return openTickets.filter((ticket) => (
      ticket.subject.toLowerCase().includes(query) ||
      ticket.message.toLowerCase().includes(query) ||
      ticket.category.toLowerCase().includes(query) ||
      String(ticket.serverName || '').toLowerCase().includes(query)
    ));
  }, [openTickets, searchQuery]);

  const currentTicket = activeTicket
    ? tickets.find((ticket) => ticket.id === activeTicket.id) || activeTicket
    : null;
  const thread = currentTicket ? buildThread(currentTicket) : [];

  React.useEffect(() => {
    if (!currentTicket) {
      setReplyText('');
    }
  }, [currentTicket?.id]);

  const handleOpenTicket = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setReplyText('');
  };

  const handleSendReply = () => {
    if (!currentTicket || !replyText.trim()) {
      return;
    }

    const supportMessage: ChatMessage = {
      id: `staff-${Date.now()}`,
      sender: 'support',
      text: replyText.trim(),
      timestamp: 'Agora',
    };
    const nextThread = [...thread, supportMessage];

    onUpdateTicket(currentTicket.id, {
      chatHistory: nextThread,
      replyMessage: replyText.trim(),
      status: currentTicket.status === 'Finalizado' ? 'Finalizado' : 'Respondido',
    });
    setReplyText('');
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
            Atendimento de Tickets
          </h3>
          <p className="font-sans text-sm text-neutral-400">
            Abra um chamado para responder no mesmo chat lateral usado pelo membro.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 min-w-full md:min-w-[360px]">
          <div className="rounded-xl border border-neutral-900 bg-black px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Abertos</p>
            <p className="text-lg font-display text-white">{openTickets.length}</p>
          </div>
          <div className="rounded-xl border border-neutral-900 bg-black px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Analise</p>
            <p className="text-lg font-display text-white">{tickets.filter((ticket) => ticket.status === 'Em análise').length}</p>
          </div>
          <div className="rounded-xl border border-neutral-900 bg-black px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Resp.</p>
            <p className="text-lg font-display text-white">{tickets.filter((ticket) => ticket.status === 'Respondido').length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-900 bg-black overflow-hidden">
        <div className="border-b border-neutral-950 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar ticket aberto..."
              className="w-full rounded-xl border border-neutral-900 bg-neutral-950 px-4 py-2.5 pl-10 text-xs text-white placeholder-neutral-600 outline-none transition-all focus:border-[#0004C8]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-3">
          {filteredTickets.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-neutral-500">
              Nenhum ticket aberto encontrado.
            </div>
          ) : filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => handleOpenTicket(ticket)}
              className="rounded-xl border border-neutral-900 bg-neutral-950/45 p-4 text-left transition-all hover:border-[#0004C8]/60 hover:bg-[#0004C8]/5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#5468FF]">
                  {ticket.category}
                </span>
                <span className="rounded-full border border-neutral-900 bg-black px-2 py-0.5 text-[9px] text-neutral-500">
                  {ticket.status}
                </span>
              </div>
              <h4 className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-white">
                {ticket.subject}
              </h4>
              <p className="mt-2 truncate text-[11px] text-neutral-500">
                {ticket.serverName || 'Comunidade nao informada'} / {ticket.createdAt}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <MessageSquare className="h-3.5 w-3.5 text-[#5468FF]" />
                Abrir chat lateral
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {currentTicket && (
          <div className="fixed inset-0 z-105 flex justify-end overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTicket(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-full md:max-w-md h-full bg-black border-l-0 md:border-l border-neutral-900 flex flex-col z-20 shadow-[0_10px_35px_rgba(0,0,0,0.9)]"
            >
              <div className="p-5 border-b border-neutral-950 bg-black">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${currentTicket.status === 'Finalizado' ? 'bg-neutral-600' : 'bg-[#0004C8] animate-pulse'}`} />
                    <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">
                      Chat de Staff
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTicket(null)}
                    className="w-7 h-7 rounded-full border border-neutral-900 hover:border-neutral-700 bg-transparent flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer outline-none"
                    title="Fechar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 rounded-xl border border-neutral-900 bg-black p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-block w-fit text-[9px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#0004C8]/10 text-[#5468FF] border border-[#0004C8]/15">
                      {currentTicket.category}
                    </span>
                    <select
                      value={currentTicket.status}
                      onChange={(event) => onUpdateTicket(currentTicket.id, { status: event.target.value as TicketStatus })}
                      className="h-7 rounded-lg border border-neutral-900 bg-neutral-950 px-2 text-[10px] font-bold text-white outline-none focus:border-[#0004C8]"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <h3 className="font-sans text-sm font-bold text-white tracking-tight leading-snug">
                    {currentTicket.subject}
                  </h3>
                  {currentTicket.serverName && (
                    <p className="font-sans text-[11px] text-neutral-500">
                      Comunidade: <span className="text-neutral-300 font-bold">{currentTicket.serverName}</span>
                    </p>
                  )}
                  {currentTicket.fileName && (
                    <p className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                      <FileText className="h-3.5 w-3.5" />
                      {currentTicket.fileName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-neutral-900 bg-black">
                {thread.map((message) => {
                  const isStaff = message.sender === 'support' || message.sender === 'ai';

                  return (
                    <div key={message.id} className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-sans font-bold text-neutral-500">
                          {isStaff ? 'Staff Juicy' : 'Membro'}
                        </span>
                        <span className="text-[9px] font-sans text-neutral-600">
                          {message.timestamp}
                        </span>
                      </div>

                      <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed font-sans shadow-[0_4px_12px_rgba(0,0,0,0.35)] ${
                        isStaff
                          ? 'bg-[#0004C8] text-white rounded-tr-sm border border-[#0004C8]'
                          : 'bg-neutral-950 text-neutral-200 rounded-tl-sm border border-neutral-900'
                      }`}>
                        <p className="whitespace-pre-wrap font-normal">{message.text}</p>
                      </div>

                      {isStaff && message.id === thread[thread.length - 1]?.id && (
                        <div className="flex items-center gap-1 mt-1 text-[9px] font-sans text-[#5468FF]">
                          <CheckCheck className="w-3 h-3" />
                          <span>Salvo</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-2.5 bg-black border-t border-neutral-950 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5468FF]" />
                <span className="text-[10px] font-sans text-neutral-500 leading-none">
                  Respostas do staff aparecem no acompanhamento do membro.
                </span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSendReply();
                }}
                className="p-4 border-t border-neutral-950 bg-black flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Responder como staff..."
                  className="flex-1 bg-neutral-950 border border-neutral-900 focus:border-[#0004C8] hover:border-neutral-800 text-xs text-white placeholder-neutral-600 rounded-xl px-4 py-3 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 outline-none ${
                    replyText.trim()
                      ? 'bg-[#0004C8] text-white cursor-pointer hover:bg-[#1116ed] shadow-[0_0_15px_rgba(0,4,200,0.3)]'
                      : 'bg-neutral-950 text-neutral-600 border border-neutral-900 cursor-not-allowed'
                  }`}
                  title="Enviar resposta"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
