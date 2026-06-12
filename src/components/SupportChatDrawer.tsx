import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, CheckCheck, ShieldCheck } from 'lucide-react';
import { Ticket, ChatMessage } from '../types';

interface SupportChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onUpdateChat?: (ticketId: string, updatedMessages: ChatMessage[]) => void;
}

export default function SupportChatDrawer({ 
  isOpen, 
  onClose, 
  ticket,
  onUpdateChat 
}: SupportChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages list with ticket message and its reply if not already populated
  useEffect(() => {
    if (ticket.chatHistory && ticket.chatHistory.length > 0) {
      setMessages(ticket.chatHistory);
    } else {
      const initialMsgs: ChatMessage[] = [
        {
          id: 'msg-start',
          sender: 'user',
          text: ticket.message,
          timestamp: ticket.createdAt || 'Ontem'
        }
      ];

      if (ticket.replyMessage) {
        initialMsgs.push({
          id: 'msg-reply',
          sender: 'support',
          text: ticket.replyMessage,
          timestamp: 'Pouco depois'
        });
      }

      setMessages(initialMsgs);
    }
  }, [ticket.id, ticket.chatHistory, ticket.message, ticket.replyMessage, ticket.createdAt]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Lock body scroll when chat drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessageText = inputText.trim();
    setInputText('');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      timestamp: 'Agora'
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    // Call callback if present to update parent state
    if (onUpdateChat) {
      onUpdateChat(ticket.id, updatedMessages);
    }

    // Interactive simulated support replies for premium immersion
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      let replyText = '';
      const textLower = userMessageText.toLowerCase();

      if (textLower.includes('obrigado') || textLower.includes('perfeito') || textLower.includes('vlw') || textLower.includes('grato')) {
        replyText = 'Por nada! Ficamos muito felizes em ajudar. Caso precise de qualquer outra assistência em nossa comunidade, não hesite em mandar uma mensagem neste chat. Tenha um ótimo dia!';
      } else if (textLower.includes('cargo') || textLower.includes('vip') || textLower.includes('plano')) {
        replyText = 'Perfeito! Já passei a confirmação do seu plano para o nosso bot da guilda Juicy. Seus cargos devem ser atualizados e estabilizados no seu perfil do Discord nos próximos 2 a 5 minutos. Pode verificar lá em breve!';
      } else {
        replyText = 'Mensagem recebida com sucesso! Nosso time está acompanhando este chat em tempo real. Deixei sua solicitação com prioridade prioritária e daremos andamento imediato.';
      }

      const supportReply: ChatMessage = {
        id: `msg-sim-${Date.now()}`,
        sender: 'support',
        text: replyText,
        timestamp: 'Agora mesmo'
      };

      setMessages(prev => {
        const next = [...prev, supportReply];
        if (onUpdateChat) {
          onUpdateChat(ticket.id, next);
        }
        return next;
      });
    }, 2200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-105 flex justify-end overflow-hidden">
          {/* Backdrop blur with fade effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Chat Slide-Over Drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative w-full max-w-full md:max-w-md h-full bg-black border-l-0 md:border-l border-neutral-900 flex flex-col z-20 shadow-[0_10px_35px_rgba(0,0,0,0.9)]"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-950 bg-black">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${ticket.status === 'Finalizado' ? 'bg-neutral-600' : 'bg-[#0004C8] animate-pulse'}`} />
                  <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">
                    {ticket.status === 'Finalizado' ? 'Histórico do Chamado' : 'Chat de Atendimento'}
                  </span>
                </div>
                <button 
                  onClick={onClose}
                  className="w-7 h-7 rounded-full border border-neutral-900 hover:border-neutral-700 bg-transparent flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer outline-none"
                  title="Fechar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Ticket Meta Details */}
              <div className="space-y-2 rounded-xl border border-neutral-900 bg-black p-4">
                <span className="inline-block w-fit text-[9px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#0004C8]/10 text-[#5468FF] border border-[#0004C8]/15">
                  {ticket.category}
                </span>
                <h3 className="font-sans text-sm font-bold text-white tracking-tight leading-snug">
                  {ticket.subject}
                </h3>
                {ticket.serverName && (
                  <p className="font-sans text-[11px] text-neutral-500">
                    Comunidade: <span className="text-neutral-300 font-bold">{ticket.serverName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Conversation Messages Thread Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-neutral-900 bg-black">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-sans font-bold text-neutral-500">
                        {isUser ? 'Você' : 'Analista Juicy'}
                      </span>
                      <span className="text-[9px] font-sans text-neutral-600">
                        {msg.timestamp}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed font-sans shadow-[0_4px_12px_rgba(0,0,0,0.35)] ${
                        isUser
                          ? 'bg-[#0004C8] text-white rounded-tr-sm border border-[#0004C8]'
                          : 'bg-neutral-950 text-neutral-200 rounded-tl-sm border border-neutral-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-normal">{msg.text}</p>
                    </div>

                    {isUser && index === messages.length - 1 && (
                      <div className="flex items-center gap-1 mt-1 text-[9px] font-sans text-[#5468FF]">
                        <CheckCheck className="w-3 h-3" />
                        <span>Entregue</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Simulated Typing Indicator */}
              {isTyping && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-sans font-bold text-neutral-500">
                      Analista Juicy
                    </span>
                    <span className="text-[9px] font-sans text-neutral-600">Digitando...</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-900 px-4 py-3 rounded-xl rounded-tl-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#5468FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#5468FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#5468FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Privacy Shield Info Label */}
            <div className="px-5 py-2.5 bg-black border-t border-neutral-950 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5468FF]" />
              <span className="text-[10px] font-sans text-neutral-500 leading-none">
                {ticket.status === 'Finalizado' 
                  ? 'Histórico de atendimento arquivado e protegido.' 
                  : 'Conexão direta e segura criptografada Juicy.'}
              </span>
            </div>

            {/* Chat Input Footer Form or Closed Banner */}
            {ticket.status !== 'Finalizado' ? (
              <form 
                onSubmit={handleSend}
                className="p-4 border-t border-neutral-950 bg-black flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Insira detalhes ou envie sua resposta..."
                  className="flex-1 bg-neutral-950 border border-neutral-900 focus:border-[#0004C8] hover:border-neutral-800 text-xs text-white placeholder-neutral-600 rounded-xl px-4 py-3 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 outline-none ${
                    inputText.trim() 
                      ? 'bg-[#0004C8] text-white cursor-pointer hover:bg-[#1116ed] shadow-[0_0_15px_rgba(0,4,200,0.3)]' 
                      : 'bg-neutral-950 text-neutral-600 border border-neutral-900 cursor-not-allowed'
                  }`}
                  title="Enviar Mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-5 border-t border-neutral-950 bg-black text-center space-y-1">
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Este atendimento foi <span className="text-[#0004C8] font-bold">ENCERRADO</span> e arquivado.
                </p>
                <p className="text-[10px] text-neutral-600 font-sans">
                  Não é possível enviar novas mensagens neste canal.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
