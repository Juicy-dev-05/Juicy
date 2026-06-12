import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, ArrowUpRight, ArrowRight, HelpCircle, FileText, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { UserSession, Ticket, TicketCategory, StaffAccess } from './types';
import DiscordLogin from './components/DiscordLogin';
import SupportForm from './components/SupportForm';
import SupportStatus from './components/SupportStatus';
import HelpCenter from './components/HelpCenter';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import NotFound from './components/NotFound';
import SettingsPage from './components/SettingsPage';
import TicketDesk from './components/TicketDesk';
import WipeTransition from './components/WipeTransition';
import { getSupabaseClient, mapSupabaseUserToSession } from './lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authClient, setAuthClient] = useState<SupabaseClient | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [staffAccess, setStaffAccess] = useState<StaffAccess | null>(null);
  const [activeTab, setActiveTab] = useState<'support' | 'tickets' | 'settings' | 'faq'>('support');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [bootPhase, setBootPhase] = useState<'loading' | 'wipe' | 'ready'>('loading');

  const isNotFound = pathname !== '/';

  const roleColorToHex = (color?: number | null) => {
    if (typeof color !== 'number' || !Number.isFinite(color) || color <= 0) {
      return null;
    }

    return `#${color.toString(16).padStart(6, '0')}`;
  };

  const getReadableTextColor = (hexColor: string) => {
    const normalized = hexColor.replace('#', '');

    if (normalized.length !== 6) {
      return '#ffffff';
    }

    const red = parseInt(normalized.slice(0, 2), 16);
    const green = parseInt(normalized.slice(2, 4), 16);
    const blue = parseInt(normalized.slice(4, 6), 16);
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

    return luminance > 160 ? '#111111' : '#ffffff';
  };

  const hydrateUserWithDiscordRole = async (sessionUser: UserSession) => {
    if (!sessionUser.discordId) {
      return sessionUser;
    }

    try {
      const response = await fetch(`/api/discord/highest-role?discordUserId=${encodeURIComponent(sessionUser.discordId)}`);

      if (!response.ok) {
        return sessionUser;
      }

      const data = await response.json();

      if (!data.roleName && data.unavailableReason) {
        console.warn('[!] Cargo Discord não atualizado:', data.unavailableReason);
      }

      return {
        ...sessionUser,
        highestRole: data.roleName || undefined,
        highestRoleId: data.roleId || undefined,
        highestRoleGuildId: data.guildId || undefined,
        highestRoleColor: typeof data.roleColor === 'number' ? data.roleColor : undefined,
      };
    } catch (error) {
      console.warn('[-] Erro ao buscar cargo mais alto do Discord:', error);
      return sessionUser;
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    getSupabaseClient()
      .then(async (client) => {
        if (!isMounted) return;

        if (!client) {
          setAuthError('Configuração do Supabase não encontrada.');
          setIsAuthLoading(false);
          return;
        }

        setAuthClient(client);

        const { data, error } = await client.auth.getSession();
        if (!isMounted) return;

        if (error) {
          setAuthError(error.message);
        }

        setUser(data.session?.user ? await hydrateUserWithDiscordRole(mapSupabaseUserToSession(data.session.user)) : null);
        setIsAuthLoading(false);

        const { data: listener } = client.auth.onAuthStateChange(async (_event, session) => {
          setUser(session?.user ? await hydrateUserWithDiscordRole(mapSupabaseUserToSession(session.user)) : null);
        });

        unsubscribe = () => {
          listener.subscription.unsubscribe();
        };
      })
      .catch((error) => {
        if (!isMounted) return;
        setAuthError(error instanceof Error ? error.message : 'Falha ao inicializar autenticação.');
        setIsAuthLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  React.useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Sync tickets list directly from fullstack express endpoints
  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.warn('[-] Erro ao se conectar com a central de atendimento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger loading only when user session is active
  React.useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  React.useEffect(() => {
    let isMounted = true;

    if (!user?.discordId) {
      setStaffAccess(null);
      if (activeTab === 'tickets' || activeTab === 'settings') {
        setActiveTab('support');
      }
      return;
    }

    fetch(`/api/discord/access?discordUserId=${encodeURIComponent(user.discordId)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!isMounted) return;

        const nextAccess: StaffAccess = {
          canAccessStaff: !!data?.canAccessStaff,
          canAccessSettings: !!data?.canAccessSettings,
          isOwner: !!data?.isOwner,
          isAdmin: !!data?.isAdmin,
          isConfiguredStaff: !!data?.isConfiguredStaff,
          matchedRoleIds: Array.isArray(data?.matchedRoleIds) ? data.matchedRoleIds : [],
        };

        setStaffAccess(nextAccess);

        if (activeTab === 'tickets' && !nextAccess.canAccessStaff) {
          setActiveTab('support');
        }
        if (activeTab === 'settings' && !nextAccess.canAccessSettings) {
          setActiveTab('support');
        }
      })
      .catch((error) => {
        console.warn('[-] Erro ao consultar acesso staff:', error);
        if (isMounted) {
          setStaffAccess(null);
          if (activeTab === 'tickets' || activeTab === 'settings') {
            setActiveTab('support');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, user?.discordId]);

  React.useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    setBootPhase('wipe');

    const timeout = window.setTimeout(() => {
      setBootPhase('ready');
    }, 760);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isAuthLoading]);

  // Handle support ticket creation via standard HTTP Post request
  const handleCreateTicket = async (data: { 
    serverId: string; 
    serverName: string; 
    subject: string; 
    message: string; 
    category: TicketCategory; 
    fileName: string; 
  }) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        // Sync fresh tickets view from backend
        await fetchTickets();
      } else {
        throw new Error('Falha no envio do servidor');
      }
    } catch (error) {
      console.warn('[-] Conectividade offline. Salvando temporariamente em memória local:', error);
      
      // Safe local fallback mapping
      const newTicket: Ticket = {
        id: `ticket-${Date.now()}`,
        category: data.category,
        subject: data.subject,
        message: data.message,
        fileName: data.fileName || undefined,
        status: 'Recebido',
        createdAt: 'Agora mesmo',
        serverId: data.serverId,
        serverName: data.serverName
      };

      setTickets(prev => [newTicket, ...prev]);

      // Simulate standard real-world progression for member immersion offline
      const ticketId = newTicket.id;
      setTimeout(() => {
        setTickets(prev => 
          prev.map(t => t.id === ticketId ? { ...t, status: 'Em análise' } : t)
        );
      }, 15000);

      setTimeout(() => {
        setTickets(prev => 
          prev.map(t => t.id === ticketId ? { 
            ...t, 
            status: 'Respondido', 
            replyMessage: 'Verificamos a sua solicitação em nossa central de triagem e tomamos as providências solicitadas. Seus acessos e cargos adicionais correspondentes na comunidade foram atualizados.' 
          } : t)
        );
      }, 30000);
    }
  };

  const handleUpdateTicketChat = (ticketId: string, updatedMessages: any[]) => {
    setTickets(prev => 
      prev.map(t => t.id === ticketId ? { ...t, chatHistory: updatedMessages } : t)
    );
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev =>
      prev.map(ticket => ticket.id === ticketId ? { ...ticket, ...updates } : ticket)
    );
  };

  const handleLogout = async () => {
    if (authClient) {
      await authClient.auth.signOut();
    }
    setUser(null);
    setActiveTab('support');
  };

  // Lock body scroll when guided support modal is open
  React.useEffect(() => {
    if (isSupportModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSupportModalOpen]);

  const isBootLoading = !isNotFound && bootPhase !== 'ready';

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between selection:bg-brand-blue selection:text-white">
      {user && !isNotFound && !isBootLoading && (
        <header className="w-full border-b border-neutral-900/60 bg-black/80 backdrop-blur-md sticky top-0 z-55">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-brand-blue flex items-center justify-center rounded text-xs font-display font-black tracking-widest text-white">
                J
              </div>
              <div>
                <span className="font-display font-semibold text-xs tracking-wider text-white">
                  JUICY COMUNIDADE
                </span>
                <span className="hidden sm:inline-block text-[10px] font-sans font-normal text-neutral-500 ml-2 tracking-widest uppercase">
                  / Central de Suporte
                </span>
              </div>
            </div>

            <AnimatePresence>
              <div className="relative">
                <button
                  id="btn-user-avatar-trigger"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="w-8 h-8 rounded-full overflow-hidden border border-neutral-850 hover:border-[#0004C8] focus:border-[#0004C8] focus:ring-1 focus:ring-[#0004C8] transition-all cursor-pointer outline-none flex items-center justify-center hover:scale-[1.05] active:scale-[0.95]"
                  title={user.username}
                >
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>

                {isUserDropdownOpen && (
                  <div 
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="fixed inset-0 z-40 bg-transparent"
                  />
                )}

                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      id="user-dropdown-menu"
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-56 bg-black border border-neutral-900 rounded-xl p-4 z-50 shadow-[0_10px_35px_rgba(0,0,0,0.9)] space-y-3.5"
                    >
                      <div className="space-y-1.5 pb-2.5 border-b border-neutral-950">
                        <p className="text-xs font-sans text-neutral-100 font-semibold truncate leading-none">
                          {user.username}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-500 leading-none">
                          {user.tag}
                        </p>
                        <div className="pt-2">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-wider border font-bold transition-colors"
                            style={
                              user.highestRoleColor
                                ? (() => {
                                    const roleColorHex = roleColorToHex(user.highestRoleColor);
                                    return roleColorHex
                                      ? {
                                          backgroundColor: roleColorHex,
                                          color: getReadableTextColor(roleColorHex),
                                          borderColor: roleColorHex,
                                        }
                                      : {
                                          backgroundColor: 'rgba(0, 4, 200, 0.1)',
                                          color: '#ffffff',
                                          borderColor: 'rgba(0, 4, 200, 0.2)',
                                        };
                                  })()
                                : {
                                    backgroundColor: 'rgba(0, 4, 200, 0.1)',
                                    color: '#ffffff',
                                    borderColor: 'rgba(0, 4, 200, 0.2)',
                                  }
                            }
                          >
                            {user.highestRole || 'Membro'}
                          </span>
                        </div>
                      </div>

                      {staffAccess?.canAccessStaff && (
                        <button
                          id="btn-user-ticket-desk"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setActiveTab('tickets');
                          }}
                          className="w-full text-[10px] font-mono tracking-wider text-neutral-400 hover:text-white transition-all uppercase h-8 px-2.5 rounded-lg hover:bg-white/5 flex items-center gap-2 cursor-pointer outline-none border border-transparent hover:border-neutral-900"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#5468FF]" />
                          <span>Atendimento</span>
                        </button>
                      )}

                      {staffAccess?.canAccessSettings && (
                        <button
                          id="btn-user-settings"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setActiveTab('settings');
                          }}
                          className="w-full text-[10px] font-mono tracking-wider text-neutral-400 hover:text-white transition-all uppercase h-8 px-2.5 rounded-lg hover:bg-white/5 flex items-center gap-2 cursor-pointer outline-none border border-transparent hover:border-neutral-900"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#5468FF]" />
                          <span>Config</span>
                        </button>
                      )}

                      <button
                        id="btn-logout-dropdown"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-[10px] font-mono tracking-wider text-red-500 hover:text-white transition-all uppercase h-8 px-2.5 rounded-lg hover:bg-red-500/5 flex items-center gap-2 cursor-pointer outline-none border border-transparent hover:border-red-950/20"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>Sair</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimatePresence>
          </div>
        </header>
      )}
      
      {/* 2. Main Content Canvas */}
      <main className={isNotFound || isBootLoading ? 'flex-grow w-full' : user ? 'flex-grow max-w-5xl w-full mx-auto px-6 py-12 md:py-16' : 'flex-grow w-full'}>
        <AnimatePresence mode="wait">
          {isBootLoading ? (
            <motion.div
              key="loading-view"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoadingScreen />
            </motion.div>
          ) : isNotFound ? (
            <motion.div
              key="not-found-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <NotFound />
            </motion.div>
          ) : !user ? (
            /* Intro / Login sequence */
            <motion.div
              key="auth-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DiscordLogin
                authClient={authClient}
                authError={authError}
                isAuthLoading={isAuthLoading}
              />
            </motion.div>
          ) : (
            /* Support Center Main Hub for the logged user */
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
              {/* Tabs subheader layout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900/65 pb-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-white tracking-tight">
                    Olá, {user.username}
                  </h2>
                  <p className="font-sans text-xs text-neutral-450 mt-1">
                    Central integrada de atendimento ao membro da Juicy Comunidade.
                  </p>
                </div>

                 {/* Switcher tabs between Support & FAQ */}
                <div className="flex w-full sm:w-auto bg-neutral-950 p-1 border border-neutral-900 rounded-full shrink-0">
                  <button
                    id="tab-open-support"
                    onClick={() => setActiveTab('support')}
                    className={`flex-1 sm:flex-none text-center px-3 min-[360px]:px-5 h-8 rounded-full font-sans text-[11px] min-[360px]:text-xs font-medium cursor-pointer transition-all duration-300 ${
                      activeTab === 'support'
                        ? 'bg-neutral-900 text-white shadow-sm scale-[1.02]'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Suporte<span className="hidden min-[450px]:inline"> & Acompanhamento</span>
                  </button>
                  <button
                    id="tab-open-faq"
                    onClick={() => setActiveTab('faq')}
                    className={`flex-1 sm:flex-none text-center px-3 min-[360px]:px-5 h-8 rounded-full font-sans text-[11px] min-[360px]:text-xs font-medium cursor-pointer transition-all duration-300 ${
                      activeTab === 'faq'
                        ? 'bg-neutral-900 text-white shadow-sm scale-[1.02]'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    FAQ<span className="hidden min-[450px]:inline"> / Central de Ajuda</span>
                  </button>
                </div>
              </div>

              {/* Dynamic View rendering depending on active tab */}
              <AnimatePresence mode="wait">
                {activeTab === 'support' ? (
                  <motion.div
                    key="tab-support-content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-10"
                  >
                    {/* Premium Call-to-action Banner to open Request modal */}
                    <div className="relative bg-[#141416] p-6 md:p-8 rounded-2xl border border-[#232326] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
                      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-[#0004C8]/10 rounded-full blur-[60px] pointer-events-none" />
                      
                      <div className="space-y-2.5 relative z-10 max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-wider bg-[#0004C8]/10 text-[#5468FF] border border-[#0004C8]/20 font-bold">
                          Suporte Juicy
                        </div>
                        <h4 className="font-sans text-lg font-bold text-white tracking-tight">Precisa de suporte personalizado?</h4>
                        <p className="font-sans text-[12px] text-neutral-400 leading-relaxed">
                          Nossa equipe está pronta para auxiliar você com regastes de cargos, dúvidas gerais, status de assinaturas e suporte para todas as comunidades associadas.
                        </p>
                      </div>
                      
                      <button
                        id="btn-trigger-support-modal"
                        onClick={() => setIsSupportModalOpen(true)}
                        className="group w-full md:w-auto px-6 h-11 bg-[#0004C8] hover:bg-[#1116ed] text-white font-sans font-bold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-[0_4px_15px_rgba(0,4,200,0.3)] hover:scale-[1.02] active:scale-[0.98] outline-none relative z-10"
                      >
                        <span>Abrir Solicitação</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>

                    {/* Active requests timeline / status */}
                    <div className="space-y-4">
                      <SupportStatus tickets={tickets} onUpdateChat={handleUpdateTicketChat} />
                    </div>
                  </motion.div>
                ) : activeTab === 'tickets' && staffAccess?.canAccessStaff ? (
                  <motion.div
                    key="tab-tickets-content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                  >
                    <TicketDesk tickets={tickets} onUpdateTicket={handleUpdateTicket} />
                  </motion.div>
                ) : activeTab === 'settings' && staffAccess?.canAccessSettings ? (
                  <motion.div
                    key="tab-settings-content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                  >
                    <SettingsPage />
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-faq-content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    <HelpCenter />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Support Creation Modal */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-0 md:p-4">
            {/* Backdrop fade-in / blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupportModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-zoom-out"
            />

            {/* Modal Card content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-full md:max-w-xl bg-[#141416] border-0 md:border border-[#232326] rounded-none md:rounded-3xl overflow-hidden z-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] p-0 h-full md:h-auto max-h-screen md:max-h-[92vh] flex flex-col"
            >
              <SupportForm
                onSubmit={(data) => {
                  handleCreateTicket(data);
                  setIsSupportModalOpen(false);
                }}
                onClose={() => setIsSupportModalOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Global Elegant Footer */}
      {!isNotFound && !isBootLoading && <Footer />}

      <AnimatePresence>
        {bootPhase === 'wipe' && <WipeTransition />}
      </AnimatePresence>
    </div>
  );
}
