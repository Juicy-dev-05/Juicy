import React from 'react';
import { Bot, CheckCircle2, Loader2, RefreshCcw, Settings, ShieldCheck, Users, X } from 'lucide-react';
import { DiscordServer } from '../types';

type AppConfig = {
  supabaseUrl: string | null;
  supabaseKey: string | null;
  discordClientId: string | null;
  hasWebhookEnabled: boolean;
};

type AppSettings = {
  ticketChannelId: string;
  staffRoleIds: string[];
  hasWebhookEnabled: boolean;
};

type DiscordRoleOption = {
  id: string;
  name: string;
  position: number;
  guildId: string;
  guildName: string;
};

export default function SettingsPage() {
  const [config, setConfig] = React.useState<AppConfig | null>(null);
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [guilds, setGuilds] = React.useState<DiscordServer[]>([]);
  const [roles, setRoles] = React.useState<DiscordRoleOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = React.useState(false);
  const [ticketChannelDraft, setTicketChannelDraft] = React.useState('');
  const [staffRoleDraft, setStaffRoleDraft] = React.useState<string[]>([]);

  const loadSettings = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [configResponse, guildsResponse, settingsResponse, rolesResponse] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/discord/guilds'),
        fetch('/api/settings'),
        fetch('/api/discord/roles'),
      ]);

      if (!configResponse.ok || !guildsResponse.ok || !settingsResponse.ok || !rolesResponse.ok) {
        throw new Error('Falha ao carregar configuracoes.');
      }

      const [configData, guildsData, settingsData, rolesData] = await Promise.all([
        configResponse.json(),
        guildsResponse.json(),
        settingsResponse.json(),
        rolesResponse.json(),
      ]);

      setConfig(configData);
      setSettings(settingsData);
      setGuilds(Array.isArray(guildsData.guilds) ? guildsData.guilds : []);
      setRoles(Array.isArray(rolesData.roles) ? rolesData.roles : []);
      setTicketChannelDraft(settingsData.ticketChannelId || '');
      setStaffRoleDraft(Array.isArray(settingsData.staffRoleIds) ? settingsData.staffRoleIds : []);

      if (guildsData.unavailableReason) {
        setError(guildsData.unavailableReason);
      }
    } catch (loadError) {
      console.warn('[-] Erro ao carregar configuracoes:', loadError);
      setError('Nao foi possivel sincronizar as configuracoes agora.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (nextSettings: Partial<AppSettings>) => {
    const payload = {
      ticketChannelId: nextSettings.ticketChannelId ?? settings?.ticketChannelId ?? '',
      staffRoleIds: nextSettings.staffRoleIds ?? settings?.staffRoleIds ?? [],
    };

    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Falha ao salvar configuracoes.');
    }

    const data = await response.json();
    setSettings(data);
    setTicketChannelDraft(data.ticketChannelId || '');
    setStaffRoleDraft(Array.isArray(data.staffRoleIds) ? data.staffRoleIds : []);
    return data;
  };

  const handleSaveWebhookChannel = async () => {
    try {
      setError(null);
      await saveSettings({ ticketChannelId: ticketChannelDraft });
      setIsWebhookModalOpen(false);
    } catch (saveError) {
      console.warn('[-] Erro ao salvar canal de tickets:', saveError);
      setError('Nao foi possivel salvar o canal de envio de tickets.');
    }
  };

  const handleToggleStaffRole = async (roleId: string) => {
    const nextRoleIds = staffRoleDraft.includes(roleId)
      ? staffRoleDraft.filter((id) => id !== roleId)
      : [...staffRoleDraft, roleId];

    setStaffRoleDraft(nextRoleIds);

    try {
      setError(null);
      await saveSettings({ staffRoleIds: nextRoleIds });
    } catch (saveError) {
      console.warn('[-] Erro ao salvar cargos staff:', saveError);
      setError('Nao foi possivel salvar os cargos de staff.');
    }
  };

  const configItems = [
    {
      label: 'Supabase',
      value: config?.supabaseUrl ? 'Configurado' : 'Pendente',
      active: !!config?.supabaseUrl && !!config?.supabaseKey,
    },
    {
      label: 'Discord OAuth',
      value: config?.discordClientId ? 'Configurado' : 'Pendente',
      active: !!config?.discordClientId,
    },
    {
      label: 'Webhook',
      value: settings?.ticketChannelId ? `Canal ${settings.ticketChannelId}` : config?.hasWebhookEnabled ? 'Webhook URL ativo' : 'Configurar canal',
      active: !!settings?.ticketChannelId || !!config?.hasWebhookEnabled,
      onClick: () => setIsWebhookModalOpen(true),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
            Configuracoes
          </h3>
          <p className="font-sans text-sm text-neutral-400">
            Estado das integracoes usadas pela central Juicy.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#232326] bg-[#141416] px-4 text-xs font-bold text-white transition-all hover:border-neutral-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
          Atualizar
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 text-xs text-amber-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {configItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={'onClick' in item ? item.onClick : undefined}
            className={`rounded-2xl border border-[#232326] bg-[#141416] p-4 text-left ${'onClick' in item ? 'cursor-pointer hover:border-[#0004C8]/50 transition-colors' : 'cursor-default'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                item.active ? 'border-[#0004C8]/20 bg-[#0004C8]/10 text-[#8ea0ff]' : 'border-[#232326] bg-black/30 text-neutral-500'
              }`}>
                {item.active ? <CheckCircle2 className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${item.active ? 'text-[#8ea0ff]' : 'text-neutral-500'}`}>
                {item.active ? 'OK' : 'Verificar'}
              </span>
            </div>
            <p className="mt-4 text-xs font-bold text-white">{item.label}</p>
            <p className="mt-1 text-[11px] text-neutral-500 break-words">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div className="rounded-2xl border border-[#232326] bg-[#141416] overflow-hidden">
          <div className="p-5 border-b border-[#232326] flex items-center justify-between gap-4">
            <div>
              <h4 className="font-display text-lg font-semibold text-white">Comunidades sincronizadas</h4>
              <p className="mt-1 text-xs text-neutral-500">Dados lidos diretamente pelo bot Discord.</p>
            </div>
            <span className="text-xs font-mono text-neutral-500">{guilds.length} guild(s)</span>
          </div>

          <div className="p-3 space-y-2">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center gap-3 text-xs text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#5468FF]" />
                Sincronizando Discord...
              </div>
            ) : guilds.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">Nenhuma comunidade encontrada.</div>
            ) : guilds.map((guild) => (
              <div key={guild.id} className="rounded-xl border border-[#232326] bg-[#18181b]/50 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={guild.photoUrl}
                    alt={guild.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#2d2d31] bg-neutral-900"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{guild.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{guild.id}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-neutral-300">{guild.memberCount || 'Membros indisponiveis'}</p>
                  <p className="text-[10px] text-neutral-500">{guild.roleCount ?? 0} cargos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#232326] bg-[#141416] p-5 space-y-5">
          <div className="w-11 h-11 rounded-xl border border-[#0004C8]/20 bg-[#0004C8]/10 text-[#8ea0ff] flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display text-lg font-semibold text-white">Bot Juicy</h4>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              O bot registra comandos, coleta guilds, lista cargos e alimenta a selecao de comunidade do suporte.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#232326] bg-black/25 p-3">
              <Users className="w-4 h-4 text-[#5468FF]" />
              <p className="mt-2 text-lg font-display text-white">{guilds.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Guilds</p>
            </div>
            <div className="rounded-xl border border-[#232326] bg-black/25 p-3">
              <ShieldCheck className="w-4 h-4 text-[#5468FF]" />
              <p className="mt-2 text-lg font-display text-white">{guilds.reduce((sum, guild) => sum + (guild.roleCount || 0), 0)}</p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Cargos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#232326] bg-[#141416] overflow-hidden">
        <div className="p-5 border-b border-[#232326]">
          <h4 className="font-display text-lg font-semibold text-white">Cargos de Staff</h4>
          <p className="mt-1 text-xs text-neutral-500">
            Cargos selecionados podem acessar a pagina de Atendimento e Configuracoes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-3 max-h-[360px] overflow-y-auto">
          {roles.length === 0 ? (
            <div className="col-span-full p-8 text-center text-xs text-neutral-500">
              Nenhum cargo Discord encontrado.
            </div>
          ) : roles.map((role) => {
            const isSelected = staffRoleDraft.includes(role.id);

            return (
              <button
                key={`${role.guildId}-${role.id}`}
                type="button"
                onClick={() => handleToggleStaffRole(role.id)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-[#0004C8] bg-[#0004C8]/10'
                    : 'border-[#232326] bg-[#18181b]/50 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-white truncate">{role.name}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#8ea0ff]' : 'text-neutral-600'}`}>
                    {isSelected ? 'Staff' : 'Livre'}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-neutral-500 truncate">
                  {role.guildName} / posicao {role.position}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsWebhookModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-900 bg-black p-5 shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-display text-lg font-semibold text-white">Canal de tickets</h4>
                <p className="mt-1 text-xs text-neutral-500">
                  Informe o ID do canal onde o bot enviara mensagens de novos tickets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWebhookModalOpen(false)}
                className="w-8 h-8 rounded-full border border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              <label htmlFor="ticket-channel-id" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                ID do canal Discord
              </label>
              <input
                id="ticket-channel-id"
                value={ticketChannelDraft}
                onChange={(event) => setTicketChannelDraft(event.target.value)}
                placeholder="Ex: 1445055218508238908"
                className="w-full rounded-xl border border-neutral-900 bg-neutral-950 px-4 py-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-[#0004C8]"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWebhookModalOpen(false)}
                className="h-10 rounded-xl border border-neutral-900 px-4 text-xs font-bold text-neutral-400 hover:text-white hover:border-neutral-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveWebhookChannel}
                className="h-10 rounded-xl bg-[#0004C8] px-4 text-xs font-bold text-white hover:bg-[#1116ed]"
              >
                Salvar canal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
