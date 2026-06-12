import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Paperclip, Send, Loader2, FileText, Trash2, X, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, UserPlus, ChevronDown, Search, Check, Users } from 'lucide-react';
import { TicketCategory, DiscordServer } from '../types';
import { DISCORD_SERVERS } from '../data';

interface SupportFormProps {
  onSubmit: (data: { 
    serverId: string; 
    serverName: string; 
    subject: string; 
    message: string; 
    category: TicketCategory; 
    fileName: string; 
  }) => void;
  onClose?: () => void;
}

export default function SupportForm({ onSubmit, onClose }: SupportFormProps) {
  // Steps: 1, 2, 3, 4, 5
  // 1: Servidor/Comunidade, 2: Tipo de Suporte/Estilo, 3: Identificação/Informações, 4: Revisão, 5: Sucesso / Auto fechar
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  
  // State variables for form
  const [chosenServer, setChosenServer] = useState<DiscordServer | null>(null);
  const [category, setCategory] = useState<TicketCategory | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [communityServers, setCommunityServers] = useState<DiscordServer[]>([]);
  const [isCommunitiesLoading, setIsCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  
  // Validation feedback alerts
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Success tracking step 5
  const [sendingState, setSendingState] = useState<'Enviando' | 'Enviado' | 'Confirmado'>('Enviando');

  // Button animation state for step 4 submit
  const [buttonStatus, setButtonStatus] = useState<'default' | 'loading' | 'sent'>('default');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCommunities = async () => {
      try {
        setIsCommunitiesLoading(true);
        setCommunitiesError(null);

        const response = await fetch('/api/discord/guilds');

        if (!response.ok) {
          throw new Error('Falha ao carregar comunidades Discord.');
        }

        const data = await response.json();
        const guilds = Array.isArray(data.guilds) ? data.guilds : [];

        if (!isMounted) {
          return;
        }

        if (guilds.length === 0) {
          setCommunityServers(DISCORD_SERVERS);
          setCommunitiesError(data.unavailableReason || 'Nenhuma comunidade Discord foi encontrada pelo bot.');
          return;
        }

        setCommunityServers(guilds);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.warn('[-] Erro ao carregar comunidades Discord:', error);
        setCommunityServers(DISCORD_SERVERS);
        setCommunitiesError('Usando lista local porque não foi possível sincronizar o Discord.');
      } finally {
        if (isMounted) {
          setIsCommunitiesLoading(false);
        }
      }
    };

    loadCommunities();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto close trigger for step 5
  useEffect(() => {
    if (currentStep === 5) {
      // Step schedule of simulated sending phases
      const sendTimer = setTimeout(() => {
        setSendingState('Enviado');
      }, 800);

      const confirmTimer = setTimeout(() => {
        setSendingState('Confirmado');
      }, 1600);

      const closeTimer = setTimeout(() => {
        // Trigger ultimate callback submission safely
        if (chosenServer && category) {
          const joinedFileNames = attachedFiles.map(f => f.name).join(', ');
          onSubmit({
            serverId: chosenServer.id,
            serverName: chosenServer.name,
            subject,
            message,
            category,
            fileName: joinedFileNames
          });
        }
        
        // Reset local States
        setChosenServer(null);
        setCategory(null);
        setSubject('');
        setMessage('');
        setAttachedFiles([]);
        setValidationError(null);
        setCurrentStep(1);
        
        if (onClose) onClose();
      }, 2900); // 1600 + 1300 = 2900ms (to showcase the success animation for exactly 2.5 seconds total)

      return () => {
        clearTimeout(sendTimer);
        clearTimeout(confirmTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [currentStep, chosenServer, category, subject, message, attachedFiles, onSubmit, onClose]);

  // Handle local simulation uploads
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newList = [...attachedFiles];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        newList.push(e.dataTransfer.files[i]);
      }
      setAttachedFiles(newList);
      setValidationError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newList = [...attachedFiles];
      for (let i = 0; i < e.target.files.length; i++) {
        newList.push(e.target.files[i]);
      }
      setAttachedFiles(newList);
      setValidationError(null);
    }
  };

  const removeFileAt = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Navigations with rigorous validation
  const handleStep1Submit = () => {
    if (!chosenServer) {
      setValidationError('Escolha uma comunidade para continuar.');
      return;
    }
    setValidationError(null);
    setCurrentStep(2);
  };

  const handleStep2Submit = () => {
    if (!category) {
      setValidationError('Escolha um tipo de suporte.');
      return;
    }
    setValidationError(null);
    setCurrentStep(3);
  };

  const handleStep3Submit = () => {
    if (subject.trim() === '') {
      setValidationError('Adicione um título para sua solicitação.');
      return;
    }
    if (message.trim() === '') {
      setValidationError('Descreva melhor o que você precisa.');
      return;
    }
    setValidationError(null);
    setCurrentStep(4);
  };

  const handleStep4Submit = () => {
    if (buttonStatus !== 'default') return;

    setButtonStatus('loading');

    setTimeout(() => {
      setButtonStatus('sent');

      setTimeout(() => {
        // Reset button state and advance to Step 5 (auto save sequence)
        setValidationError(null);
        setCurrentStep(5);
        setButtonStatus('default');
      }, 1200);

    }, 1800);
  };

  // Human explanatory header labels
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Escolha uma comunidade';
      case 2:
        return 'Como podemos ajudar?';
      case 3:
        return 'Descreva sua solicitação';
      case 4:
        return 'Confirmar solicitação';
      case 5:
        return 'Solicitação enviada';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return 'Selecione em qual servidor você precisa de suporte.';
      case 2:
        return 'Escolha o tipo de suporte que melhor combina com sua solicitação.';
      case 3:
        return 'Conte o que aconteceu para que a equipe possa entender melhor.';
      case 4:
        return 'Revise as informações antes de enviar.';
      case 5:
        return 'Sua solicitação foi enviada com sucesso. A equipe responderá assim que possível.';
    }
  };

  // Clean, high contrast progress indicator
  const renderProgressBar = () => {
    return (
      <div className="flex items-center justify-between gap-1 pb-2">
        {[1, 2, 3, 4, 5].map((stepNumber, idx) => {
          const isCurrent = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          
          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center flex-1">
                {/* Horizontal progress accent line */}
                <div 
                  className={`h-1 w-full rounded-full transition-all duration-750 ease-out ${
                    isCurrent 
                      ? 'bg-[#0004C8] shadow-[0_0_12px_rgba(0,4,200,0.6)]' 
                      : isCompleted 
                        ? 'bg-[#0004C8]/60' 
                        : 'bg-[#656565]/35'
                  }`} 
                />
                
                {/* Micro clean text showing step key */}
                <span className={`text-[10px] font-mono mt-2 transition-all tracking-wider ${
                  isCurrent 
                    ? 'text-white font-semibold' 
                    : isCompleted 
                      ? 'text-neutral-400' 
                      : 'text-[#656565]'
                }`}>
                  0{stepNumber}
                </span>
              </div>
              {idx < 4 && (
                <span className={`text-[10px] select-none font-mono pb-4 transition-colors duration-500 text-neutral-800 ${
                  isCompleted ? 'text-brand-blue/30' : 'text-[#656565]/20'
                }`}>
                  —
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Filter servers elegantly using the premium search widget
  const filteredServers = communityServers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="support-guided-modal" className="space-y-5 bg-[#141416] text-white p-5 md:p-8 h-full overflow-y-auto flex flex-col justify-between scrollbar-thin scrollbar-thumb-neutral-900 max-h-full md:max-h-[92vh]">
      
      {/* Top Header layout mirroring the mockup */}
      {currentStep !== 5 && (
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              {/* Rounded square badge containing the UserPlus icon, styled identically to the mockup */}
              <div className="w-12 h-12 rounded-xl bg-[#202022] border border-[#2d2d30] flex items-center justify-center shrink-0 shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-sans text-lg font-bold tracking-tight text-white">
                  {currentStep === 1 && "Escolha uma comunidade"}
                  {currentStep === 2 && "Como podemos ajudar?"}
                  {currentStep === 3 && "Conte-nos mais"}
                  {currentStep === 4 && "Confirmar envio"}
                </h3>
                <p className="font-sans text-[13px] text-neutral-400 font-normal leading-relaxed">
                  {currentStep === 1 && "Selecione onde deseja receber atendimento."}
                  {currentStep === 2 && "Selecione a categoria de suporte adequada."}
                  {currentStep === 3 && "Insira o título e os detalhes da sua solicitação."}
                  {currentStep === 4 && "Revise todos os campos com cuidado antes do envio."}
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-[#2d2d31] hover:border-neutral-700 bg-transparent flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer outline-none"
                title="Fechar"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Premium Capsule step visualizer mimicking the Team Members switcher */}
          <div className="flex bg-[#101012] p-1 border border-[#202024] rounded-full w-full select-none">
            <div className={`flex-1 text-center py-2 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase transition-all ${currentStep === 1 ? 'bg-[#212124] text-white border border-[#2d2d32]' : 'text-neutral-500'}`}>
              01<span className="hidden min-[450px]:inline">. Servidor</span>
            </div>
            <div className={`flex-1 text-center py-2 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase transition-all ${currentStep === 2 ? 'bg-[#212124] text-white border border-[#2d2d32]' : 'text-neutral-500'}`}>
              02<span className="hidden min-[450px]:inline">. Categoria</span>
            </div>
            <div className={`flex-1 text-center py-2 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase transition-all ${currentStep === 3 ? 'bg-[#212124] text-white border border-[#2d2d32]' : 'text-neutral-500'}`}>
              03<span className="hidden min-[450px]:inline">. Detalhes</span>
            </div>
            <div className={`flex-1 text-center py-2 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase transition-all ${currentStep === 4 ? 'bg-[#212124] text-white border border-[#2d2d32]' : 'text-neutral-500'}`}>
              04<span className="hidden min-[450px]:inline">. Revisar</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Validation Error Displays */}
      {validationError && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/5 border border-red-950/40 rounded-lg p-3 flex items-center gap-2 text-xs text-red-400 font-sans"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{validationError}</span>
        </motion.div>
      )}

      {/* Interactive Step Canvas */}
      <div className="relative min-h-[310px] mt-4">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SERVIDOR / COMUNIDADE */}
          {currentStep === 1 && (
            <motion.div
              key="gui-step-1"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Premium search bar styling matching the mockup */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome da comunidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1c1c1e]/60 border border-[#28282b] focus:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition-all font-sans"
                />
              </div>

              <div className="text-[11px] font-sans font-bold text-neutral-500 uppercase tracking-widest pt-2">
                Comunidades ({isCommunitiesLoading ? 'sincronizando' : filteredServers.length})
              </div>

              {communitiesError && (
                <div className="bg-[#18181b]/60 border border-[#232326] rounded-xl px-3 py-2.5 flex items-start gap-2 text-[11px] text-neutral-400 font-sans">
                  <AlertCircle className="w-3.5 h-3.5 text-[#5468FF] shrink-0 mt-0.5" />
                  <span>{communitiesError}</span>
                </div>
              )}

              {/* Members-style listing block */}
              <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                {isCommunitiesLoading ? (
                  <div className="text-center py-12 border border-[#212124] border-dashed rounded-xl text-neutral-500 font-sans text-xs flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[#5468FF]" />
                    <span>Sincronizando comunidades do Discord...</span>
                  </div>
                ) : filteredServers.length === 0 ? (
                  <div className="text-center py-12 border border-[#212124] border-dashed rounded-xl text-neutral-500 font-sans text-xs">
                    Nenhuma comunidade corresponde à sua busca.
                  </div>
                ) : (
                  filteredServers.map((server) => {
                    const isSelected = chosenServer?.id === server.id;

                    return (
                      <div
                        id={`gserver-${server.id}`}
                        key={server.id}
                        onClick={() => {
                          setChosenServer(server);
                          setValidationError(null);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#1a1a1c] border-[#0004C8] shadow-[0_0_15px_rgba(0,4,200,0.15)] scale-[1.01]'
                            : 'bg-[#18181b]/40 border-[#232326] hover:bg-[#1a1a1c] hover:border-[#2f2f32]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circular avatar with high quality border */}
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#2d2d31] shrink-0 bg-neutral-900">
                            <img
                              src={server.photoUrl}
                              alt={server.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-sans text-sm font-bold text-white tracking-tight truncate">
                              {server.name}
                            </h4>
                            <p className="font-sans text-[11px] text-neutral-400 mt-0.5 truncate max-w-[240px]">
                              {server.description}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px] font-sans font-bold uppercase tracking-wider text-neutral-500">
                              {server.memberCount && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {server.memberCount}
                                </span>
                              )}
                              {typeof server.roleCount === 'number' && (
                                <span>{server.roleCount} cargos</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Customized button block matching the dropdown button from the screenshot */}
                        <div className="shrink-0 pl-2">
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-sans font-bold rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-[#0004C8] text-white border-[#0004C8] shadow-[0_4px_10px_rgba(0,4,200,0.3)]'
                                : 'bg-[#1c1c1e] text-neutral-350 border-[#2b2b2e] hover:bg-neutral-800'
                            }`}
                          >
                            <span>{isSelected ? 'Selecionado' : 'Selecionar'}</span>
                            <ChevronDown className="w-3 h-3 text-neutral-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-[#232326] flex justify-end">
                <button
                  type="button"
                  id="btn-gui-next-1"
                  onClick={handleStep1Submit}
                  disabled={isCommunitiesLoading}
                  className="px-7 h-11 bg-white hover:bg-neutral-100 text-black font-sans font-bold text-xs rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CATEGORIA / ESTILO SUPORTE */}
          {currentStep === 2 && (
            <motion.div
              key="gui-step-2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-[11px] font-sans font-bold text-neutral-500 uppercase tracking-widest pb-1">
                Selecione uma Categoria
              </div>

              {/* Grid or bento list of options, styled like individual members */}
              <div className="grid grid-cols-1 gap-2 max-h-[290px] overflow-y-auto pr-1">
                {CATEGORIES.map((catName) => {
                  const isSelected = category === catName;
                  return (
                    <div
                      key={catName}
                      onClick={() => {
                        setCategory(catName);
                        setValidationError(null);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#1a1a1c] border-[#0004C8] shadow-[0_0_15px_rgba(0,4,200,0.15)] scale-[1.01]'
                          : 'bg-[#18181b]/50 border-[#232326] hover:bg-[#1a1a1c] hover:border-[#2f2f32]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#0004C8]/10 text-[#5468FF]' : 'bg-[#1e1e20] text-neutral-400'
                        }`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-[12px] font-bold text-white font-sans">{catName}</span>
                      </div>

                      <div className="shrink-0 pl-2">
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-sans font-bold rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-[#0004C8] text-white border-[#0004C8]'
                              : 'bg-[#1c1c1e] text-neutral-350 border-[#2b2b2e]'
                          }`}
                        >
                          <span>{isSelected ? 'Escolhido' : 'Ativar'}</span>
                          <ChevronDown className="w-3 h-3 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clean Sincere Helper box */}
              <div className="bg-[#18181b]/60 p-4 border border-[#232326] rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#0004C8] shrink-0 mt-0.5" />
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  Seu suporte será direcionado com segurança técnica aos cargos específicos correspondentes no servidor <span className="text-white font-semibold">{chosenServer?.name}</span>.
                </p>
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-[#232326] flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 h-11 border border-[#232326] hover:border-neutral-700 bg-transparent text-neutral-400 hover:text-white font-sans text-xs font-bold rounded-full transition-all outline-none cursor-pointer flex items-center gap-1.5 hover:bg-[#1a1a1c]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  id="btn-gui-next-2"
                  onClick={handleStep2Submit}
                  className="px-7 h-11 bg-white hover:bg-neutral-100 text-black font-sans font-bold text-xs rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: DESCREVA SUA SOLICITAÇÃO */}
          {currentStep === 3 && (
            <motion.div
              key="gui-step-3"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Título */}
              <div className="space-y-1.5">
                <label htmlFor="gui-subject" className="text-[11px] font-sans font-bold text-neutral-500 uppercase tracking-widest block">
                  Título da solicitação
                </label>
                <input
                  id="gui-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (e.target.value.trim() !== '') setValidationError(null);
                  }}
                  placeholder="Ex: Não consigo sincronizar meu cargo vip"
                  className="w-full h-11 bg-[#1a1a1c]/60 border border-[#232326] focus:border-neutral-700 rounded-xl px-4 font-sans text-xs text-white placeholder-neutral-550 outline-none transition-all"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <label htmlFor="gui-message" className="text-[11px] font-sans font-bold text-neutral-500 uppercase tracking-widest block">
                  Descrição detalhada
                </label>
                <textarea
                  id="gui-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (e.target.value.trim() !== '') setValidationError(null);
                  }}
                  placeholder="Escreva como podemos ajudar você com todos os detalhes..."
                  className="w-full bg-[#1a1a1c]/60 border border-[#232326] focus:border-neutral-700 rounded-xl p-4 font-sans text-xs text-white placeholder-neutral-550 outline-none transition-all resize-none min-h-[100px]"
                />
              </div>

              {/* Múltiplos Anexos Area */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-sans font-bold text-neutral-500 uppercase tracking-widest block">
                  Anexar Arquivos (Opcional)
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.zip"
                />

                {attachedFiles.length === 0 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-[#232326] hover:border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-[#18181b]/30 hover:bg-[#1a1a1c]/60 transition-all"
                  >
                    <Paperclip className="w-4 h-4 text-neutral-500" />
                    <p className="text-[11px] font-sans text-neutral-450 text-center">
                      Arraste imagens ou <span className="text-white font-semibold">clique para anexar arquivos</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachedFiles.map((file, idx) => (
                        <div 
                          key={`${file.name}-${idx}`} 
                          className="flex items-center justify-between border border-[#232326] bg-[#1a1a1c]/70 p-2 rounded-xl text-[11px]"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#0004C8] shrink-0" />
                            <span className="text-neutral-300 truncate font-sans">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFileAt(idx)}
                            className="w-6 h-6 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#5468FF] hover:text-white transition-colors cursor-pointer outline-none flex items-center gap-1 mt-1 pl-1"
                    >
                      + Adicionar outro arquivo
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-[#232326] flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 h-11 border border-[#232326] hover:border-neutral-700 bg-transparent text-neutral-400 hover:text-white font-sans text-xs font-bold rounded-full transition-all outline-none cursor-pointer flex items-center gap-1.5 hover:bg-[#1a1a1c]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  id="btn-gui-next-3"
                  onClick={handleStep3Submit}
                  className="px-7 h-11 bg-white hover:bg-neutral-100 text-black font-sans font-bold text-xs rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: REVISAR E CONFIRMAR SOLICITAÇÃO */}
          {currentStep === 4 && (
            <motion.div
              key="gui-step-4"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Elegant clean card summary representation */}
              <div className="border border-[#232326] bg-[#1a1a1c]/80 p-4 rounded-2xl space-y-3.5">
                <div className="grid grid-cols-2 gap-4 pb-3.5 border-b border-[#232326]">
                  <div>
                    <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase block tracking-wider">Comunidade</span>
                    <span className="text-white text-xs font-bold font-sans mt-0.5 block">{chosenServer?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase block tracking-wider">Suporte</span>
                    <span className="text-white text-xs font-bold font-sans mt-0.5 block">{category}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase block tracking-wider">Assunto</span>
                  <p className="text-white text-xs font-bold font-sans">{subject}</p>
                </div>

                <div className="space-y-0.5 pb-1">
                  <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase block tracking-wider">Mensagem</span>
                  <p className="text-neutral-300 text-xs leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap font-sans bg-[#121214] p-3 rounded-xl border border-[#232326]">
                    {message}
                  </p>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#232326]">
                    <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase block tracking-wider">Arquivos anexados</span>
                    <div className="flex flex-wrap gap-1.5">
                      {attachedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[9px] font-sans font-bold uppercase text-neutral-400 bg-neutral-900 py-1 px-2.5 rounded-full border border-[#232326]">
                          <FileText className="w-3 h-3 text-neutral-500" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-[#232326] flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 h-11 border border-[#232326] hover:border-neutral-700 bg-transparent text-neutral-400 hover:text-white font-sans text-xs font-bold rounded-full transition-all outline-none cursor-pointer flex items-center gap-1.5 hover:bg-[#1a1a1c]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  id="demoButton"
                  onClick={handleStep4Submit}
                  className={`button-premium-send ${buttonStatus === 'loading' ? 'is-loading' : ''} ${buttonStatus === 'sent' ? 'is-sent' : ''}`}
                  disabled={buttonStatus !== 'default'}
                >
                  {/* Estado 1: Enviar */}
                  <div className="premium-state state--default">
                    <div className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="1.2em" width="1.2em">
                        <path fill="currentColor" d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"></path>
                        <path fill="currentColor" d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"></path>
                      </svg>
                    </div>
                    <p className="pl-1">Enviar</p>
                  </div>

                  {/* Estado 2: Loading Circle */}
                  <div className="premium-state state--loading">
                    <div className="icon spinner-rotate">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="1.4em" width="1.4em">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </div>

                  {/* Estado 3: Enviado */}
                  <div className="premium-state state--sent">
                    <div className="icon">
                      <svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z" fill="currentColor"></path>
                        <path d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z" fill="currentColor"></path>
                      </svg>
                    </div>
                    <p className="pl-1 font-sans">Enviado</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: STATUS DE ENVIO & AUTO FECHAR */}
          {currentStep === 5 && (
            <motion.div
              key="gui-step-5"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              {/* Premium Progress state visualizer */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {sendingState === 'Enviando' && (
                    <motion.div 
                      key="status-sending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-16 h-16 rounded-full border-2 border-dashed border-[#0004C8] flex items-center justify-center animate-spin"
                    />
                  )}
                  {sendingState === 'Enviado' && (
                    <motion.div 
                      key="status-sent"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-16 h-16 rounded-full border-2 border-[#0004C8] flex items-center justify-center"
                    >
                      <Loader2 className="w-6 h-6 text-[#0004C8] animate-spin" />
                    </motion.div>
                  )}
                  {sendingState === 'Confirmado' && (
                    <motion.div 
                      key="status-confirmed"
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/5 relative shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2 max-w-sm">
                <h4 className="font-sans text-lg font-bold text-white tracking-tight">
                  {sendingState === 'Enviando' && 'Enviando solicitação...'}
                  {sendingState === 'Enviado' && 'Salvando no suporte...'}
                  {sendingState === 'Confirmado' && 'Solicitação enviada'}
                </h4>
                <p className="font-sans text-xs text-neutral-400 font-light leading-relaxed">
                  {sendingState === 'Confirmado' 
                    ? 'Sua solicitação foi enviada com sucesso. A equipe responderá assim que possível.'
                    : 'Processando seus anexos com total segurança e sigilo.'}
                </p>
              </div>

              <div className="text-[10px] font-sans font-bold text-neutral-500 uppercase tracking-widest animate-pulse pt-4">
                Fechando em instantes...
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

const CATEGORIES: TicketCategory[] = [
  'Dúvida',
  'Problema técnico',
  'Denúncia',
  'Cargo',
  'Evento',
  'Parceria',
  'Recuperar acesso',
  'Outro'
];
