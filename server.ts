import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Lazy-initialize Supabase client to prevent startup crash if keys are missing
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  try {
    return createClient(url, key, {
      auth: {
        persistSession: false
      },
      realtime: {
        transport: WebSocket
      },
    });
  } catch (error) {
    console.warn('[-] Erro ao inicializar o Supabase:', error);
    return null;
  }
};

// In-memory fallback database for members requests session persistence
const inMemoryTickets = [
  {
    id: 'ticket-seed-1',
    category: 'Cargo',
    subject: 'Sincronização de Assinatura Pro',
    message: 'Olá suporte Juicy! Assinei o plano premium no início da tarde de ontem mas meus cargos adicionais ainda não foram refletidos na comunidade de desenvolvedores. Gostaria que verificassem se está tudo correto.',
    status: 'Respondido',
    createdAt: 'Ontem às 14:32',
    fileName: 'comprovante_transacao.pdf',
    replyMessage: 'Olá, Juicy Member! Confirmamos a sua assinatura em nosso sistema de onboarding. O cargo "Developers Premium" foi vinculado com sucesso à sua tag. Seus benefícios exclusivos já estão totalmente ativos em todas as salas secretas.',
    serverId: 'server-2',
    serverName: 'Juicy Devs'
  },
  {
    id: 'ticket-seed-2',
    category: 'Problema técnico',
    subject: 'Problemas ao acessar sala de voz VIP',
    message: 'Estou tentando participar da mentoria de voz com os líderes mas continuo recebendo mensagem de permissão negada no Discord.',
    status: 'Em análise',
    createdAt: 'Hoje às 09:15',
    serverId: 'server-3',
    serverName: 'Juicy VIP'
  }
];

const appSettings = {
  ticketChannelId: process.env.DISCORD_TICKET_CHANNEL_ID || '',
  staffRoleIds: (process.env.DISCORD_STAFF_ROLE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => /^\d{17,20}$/.test(id)),
};

type ChatAiInsight = {
  summary: string;
  suggestedReply: string;
  intent: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  confidence: number;
  nextStep: string;
};

const analyzeSupportChat = (ticket: any, messages: any[]): ChatAiInsight => {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const latestUserMessage = [...safeMessages].reverse().find((message) => message?.sender === 'user');
  const text = String(latestUserMessage?.text || ticket?.message || '').toLowerCase();
  const subject = String(ticket?.subject || '').toLowerCase();
  const category = String(ticket?.category || '').toLowerCase();
  const fullContext = `${subject} ${category} ${text}`;
  const isBilling = /cargo|vip|plano|pagamento|assinatura|assinou|compra|premium/.test(fullContext);
  const isAccess = /acesso|login|entrar|senha|permiss[aã]o|bloqueio|erro|voz|canal/.test(fullContext);
  const isComplaint = /den[uú]ncia|abuso|ofensa|ban|reclama[cç][aã]o|golpe|fraude/.test(fullContext);
  const isUrgent = /urgente|agora|imediato|bloqueado|perdi|sumiu|grave/.test(fullContext);

  if (isComplaint) {
    return {
      summary: 'Sinal de denúncia ou conflito. Conduzir com objetividade, pedir evidências e preservar o histórico do caso.',
      suggestedReply: 'Entendi. Me envie os detalhes principais, prints se houver, IDs envolvidos e o contexto exato para que eu possa encaminhar a análise com prioridade.',
      intent: 'Denúncia / conflito',
      priority: isUrgent ? 'Urgente' : 'Alta',
      confidence: 84,
      nextStep: 'Coletar evidências, identificar servidor/canal e encaminhar para revisão interna.',
    };
  }

  if (isBilling || isAccess) {
    return {
      summary: 'Solicitação ligada a cargo, acesso ou plano. Validar vínculo do membro antes de prometer alteração.',
      suggestedReply: 'Verifiquei o seu chamado. Vou validar sua conta, o servidor selecionado e o vínculo do cargo/acesso. Se estiver tudo correto, a atualização deve refletir em breve.',
      intent: isBilling ? 'Cargo / assinatura' : 'Acesso / permissão',
      priority: isUrgent ? 'Alta' : 'Média',
      confidence: 86,
      nextStep: 'Conferir usuário Discord, guild selecionada, cargo esperado e estado da sincronização.',
    };
  }

  return {
    summary: 'Pedido de suporte geral. Manter resposta curta e pedir contexto suficiente para classificar o caso.',
    suggestedReply: 'Recebido. Me explique com mais detalhes o que aconteceu, em qual comunidade ocorreu e qual resultado você esperava para eu continuar a triagem.',
    intent: 'Suporte geral',
    priority: isUrgent ? 'Alta' : 'Média',
    confidence: 72,
    nextStep: 'Pedir detalhes adicionais e classificar a categoria correta antes de escalar.',
  };
};

const getConfiguredGuildIds = () => {
  const raw = process.env.DISCORD_GUILD_IDS || process.env.DISCORD_GUILD_ID || '';
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => /^\d{17,20}$/.test(id));
};

let cachedBotGuildIds: { ids: string[]; expiresAt: number } | null = null;
let hasStartedDiscordBotGateway = false;

async function fetchBotGuildIdsFromGateway(botToken: string) {
  return new Promise<string[]>((resolve) => {
    const socket = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    const guildIds = new Set<string>();
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let settled = false;

    const finish = (ids: string[]) => {
      if (settled) return;

      settled = true;

      if (heartbeat) {
        clearInterval(heartbeat);
      }

      socket.close();
      resolve(ids);
    };

    const timeout = setTimeout(() => {
      console.warn('[!] Timeout ao listar guilds pelo Gateway Discord. Guilds parciais:', guildIds.size);
      finish([...guildIds]);
    }, 12000);

    socket.on('message', (raw) => {
      try {
        const payload = JSON.parse(String(raw));

        if (payload.op === 10) {
          heartbeat = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ op: 1, d: null }));
            }
          }, payload.d.heartbeat_interval);

          socket.send(JSON.stringify({
            op: 2,
            d: {
              token: botToken,
              intents: 1,
              properties: {
                os: process.platform,
                browser: 'juicy-comunidade',
                device: 'juicy-comunidade',
              },
            },
          }));
          return;
        }

        if (payload.t === 'READY' && Array.isArray(payload.d?.guilds)) {
          payload.d.guilds.forEach((guild: any) => {
            if (/^\d{17,20}$/.test(String(guild.id || ''))) {
              guildIds.add(String(guild.id));
            }
          });

          console.log(`[+] Gateway Discord retornou ${guildIds.size} guild(s) para o bot.`);
          clearTimeout(timeout);
          finish([...guildIds]);
          return;
        }

        if (payload.t === 'GUILD_CREATE' && /^\d{17,20}$/.test(String(payload.d?.id || ''))) {
          guildIds.add(String(payload.d.id));
        }
      } catch (error) {
        console.warn('[!] Erro ao processar evento do Gateway Discord:', error);
      }
    });

    socket.on('error', (error) => {
      console.warn('[!] Erro ao conectar no Gateway Discord para listar guilds:', error);
      clearTimeout(timeout);
      finish([...guildIds]);
    });

    socket.on('close', (code, reason) => {
      if (!settled && guildIds.size === 0) {
        console.warn('[!] Gateway Discord fechou antes de retornar guilds:', code, reason.toString());
      }
      clearTimeout(timeout);
      finish([...guildIds]);
    });
  });
}

async function resolveDiscordGuildIds(botToken: string) {
  const configuredGuildIds = getConfiguredGuildIds();

  if (configuredGuildIds.length > 0) {
    return configuredGuildIds;
  }

  if (cachedBotGuildIds && cachedBotGuildIds.expiresAt > Date.now()) {
    return cachedBotGuildIds.ids;
  }

  const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    console.warn('[!] Erro ao listar guilds do bot Discord:', response.status, response.statusText);
    const ids = await fetchBotGuildIdsFromGateway(botToken);
    cachedBotGuildIds = {
      ids,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    return ids;
  }

  const guilds = await response.json();

  if (!Array.isArray(guilds)) {
    return fetchBotGuildIdsFromGateway(botToken);
  }

  const restGuildIds = guilds
    .map((guild: any) => String(guild.id || ''))
    .filter((id) => /^\d{17,20}$/.test(id));

  console.log(`[+] REST Discord retornou ${restGuildIds.length} guild(s) para o bot.`);

  const ids = restGuildIds.length > 0 ? restGuildIds : await fetchBotGuildIdsFromGateway(botToken);

  cachedBotGuildIds = {
    ids,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  return ids;
}

async function registerJuicyTestCommand(botToken: string) {
  const applicationId = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_BOT_ID;

  if (!applicationId) {
    console.warn('[!] DISCORD_APPLICATION_ID ou DISCORD_BOT_ID não configurado. Comando /juicytest não registrado.');
    return;
  }

  const command = {
    name: 'juicytest',
    description: 'Testa se o bot da Juicy está online.',
    type: 1,
  };

  try {
    const guildIds = await resolveDiscordGuildIds(botToken);
    const targets = guildIds.length > 0
      ? guildIds.map((guildId) => ({
          guildId,
          url: `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`,
        }))
      : [{
          guildId: null,
          url: `https://discord.com/api/v10/applications/${applicationId}/commands`,
        }];

    for (const target of targets) {
      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.warn('[!] Erro ao registrar /juicytest:', response.status, detail);
        continue;
      }

      console.log(`[+] Comando /juicytest registrado ${target.guildId ? `na guild ${target.guildId}` : 'globalmente'}.`);
    }
  } catch (error) {
    console.warn('[!] Falha ao registrar comando /juicytest:', error);
  }
}

async function respondToJuicyTestInteraction(interaction: any) {
  try {
    const response = await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 4,
        data: {
          content: 'Juicy bot online.',
          flags: 64,
        },
      }),
    });

    if (!response.ok) {
      console.warn('[!] Erro ao responder /juicytest:', response.status, await response.text());
    }
  } catch (error) {
    console.warn('[!] Falha ao responder /juicytest:', error);
  }
}

function startDiscordBotGateway() {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken || hasStartedDiscordBotGateway) {
    return;
  }

  hasStartedDiscordBotGateway = true;

  const connect = () => {
    const socket = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let shouldReconnect = true;

    socket.on('message', (raw) => {
      try {
        const payload = JSON.parse(String(raw));

        if (payload.op === 10) {
          heartbeat = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ op: 1, d: null }));
            }
          }, payload.d.heartbeat_interval);

          socket.send(JSON.stringify({
            op: 2,
            d: {
              token: botToken,
              intents: 1,
              properties: {
                os: process.platform,
                browser: 'juicy-comunidade',
                device: 'juicy-comunidade',
              },
            },
          }));
          return;
        }

        if (payload.t === 'READY') {
          const guildIds = Array.isArray(payload.d?.guilds)
            ? payload.d.guilds
                .map((guild: any) => String(guild.id || ''))
                .filter((id: string) => /^\d{17,20}$/.test(id))
            : [];

          cachedBotGuildIds = {
            ids: guildIds,
            expiresAt: Date.now() + 5 * 60 * 1000,
          };

          console.log(`[+] Bot Discord conectado. Guilds no READY: ${guildIds.length}.`);
          return;
        }

        if (payload.t === 'GUILD_CREATE' && /^\d{17,20}$/.test(String(payload.d?.id || ''))) {
          const currentIds = new Set(cachedBotGuildIds?.ids || []);
          currentIds.add(String(payload.d.id));
          cachedBotGuildIds = {
            ids: [...currentIds],
            expiresAt: Date.now() + 5 * 60 * 1000,
          };
          return;
        }

        if (payload.t === 'INTERACTION_CREATE' && payload.d?.data?.name === 'juicytest') {
          respondToJuicyTestInteraction(payload.d);
        }
      } catch (error) {
        console.warn('[!] Erro ao processar evento do bot Discord:', error);
      }
    });

    socket.on('error', (error) => {
      console.warn('[!] Erro no Gateway do bot Discord:', error);
    });

    socket.on('close', (code) => {
      if (heartbeat) {
        clearInterval(heartbeat);
      }

      if (code === 4004) {
        shouldReconnect = false;
        console.warn('[!] Token do bot Discord inválido. Gateway encerrado.');
      }

      if (shouldReconnect) {
        setTimeout(connect, 5000);
      }
    });
  };

  registerJuicyTestCommand(botToken);
  connect();
}

type DiscordRoleSummary = {
  id: string;
  name: string;
  position: number;
  guildId: string;
  color?: number;
};

const formatMemberCount = (count?: number | null) => {
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    return undefined;
  }

  return `${new Intl.NumberFormat('pt-BR').format(count)} membros`;
};

async function fetchDiscordGuildSummaries() {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return {
      guilds: [],
      unavailableReason: 'DISCORD_BOT_TOKEN não configurado.',
    };
  }

  const guildIds = await resolveDiscordGuildIds(botToken);

  if (guildIds.length === 0) {
    return {
      guilds: [],
      unavailableReason: 'Nenhuma guild Discord encontrada para o bot.',
    };
  }

  const guilds = await Promise.all(guildIds.map(async (guildId) => {
    const [guildResponse, rolesResponse] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }),
    ]);

    if (!guildResponse.ok) {
      console.warn('[!] Erro ao buscar dados da guild Discord:', guildId, guildResponse.status);
      return null;
    }

    const guild = await guildResponse.json();
    const roles = rolesResponse.ok ? await rolesResponse.json() : [];
    const roleCount = Array.isArray(roles)
      ? roles.filter((role: any) => role.name !== '@everyone').length
      : undefined;
    const photoUrl = guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(guild.name || 'Juicy')}&background=0004C8&color=ffffff&size=128`;

    return {
      id: String(guild.id),
      name: guild.name || 'Comunidade Discord',
      description: guild.description || `${roleCount ?? 0} cargos sincronizados pelo bot Juicy.`,
      photoUrl,
      memberCount: formatMemberCount(guild.approximate_member_count),
      roleCount,
    };
  }));

  return {
    guilds: guilds.filter(Boolean),
    unavailableReason: null,
  };
}

async function fetchDiscordRoleSummaries() {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return {
      roles: [],
      unavailableReason: 'DISCORD_BOT_TOKEN não configurado.',
    };
  }

  const guildIds = await resolveDiscordGuildIds(botToken);
  const rolesByGuild = await Promise.all(guildIds.map(async (guildId) => {
    const [guildResponse, rolesResponse] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
    ]);

    if (!guildResponse.ok || !rolesResponse.ok) {
      return [];
    }

    const guild = await guildResponse.json();
    const roles = await rolesResponse.json();

    if (!Array.isArray(roles)) {
      return [];
    }

    return roles
      .filter((role: any) => role.name !== '@everyone')
      .sort((a: any, b: any) => b.position - a.position)
      .map((role: any) => ({
        id: String(role.id),
        name: String(role.name),
        position: Number(role.position) || 0,
        color: Number(role.color) || 0,
        guildId: String(guild.id),
        guildName: String(guild.name || guild.id),
      }));
  }));

  return {
    roles: rolesByGuild.flat(),
    unavailableReason: null,
  };
}

async function fetchDiscordAccess(discordUserId: string) {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return {
      canAccessStaff: false,
      canAccessSettings: false,
      isOwner: false,
      isAdmin: false,
      isConfiguredStaff: false,
      matchedRoleIds: [],
      unavailableReason: 'DISCORD_BOT_TOKEN não configurado.',
    };
  }

  const guildIds = await resolveDiscordGuildIds(botToken);
  const matchedRoleIds = new Set<string>();
  let isOwner = false;
  let isAdmin = false;
  let isConfiguredStaff = false;

  for (const guildId of guildIds) {
    const [guildResponse, memberResponse, rolesResponse] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
    ]);

    if (!guildResponse.ok || !memberResponse.ok || !rolesResponse.ok) {
      continue;
    }

    const guild = await guildResponse.json();
    const member = await memberResponse.json();
    const roles = await rolesResponse.json();
    const memberRoleIds = new Set<string>((member.roles || []).map((id: any) => String(id)));

    if (String(guild.owner_id) === discordUserId) {
      isOwner = true;
    }

    if (Array.isArray(roles)) {
      for (const role of roles) {
        const roleId = String(role.id);
        if (!memberRoleIds.has(roleId)) {
          continue;
        }

        matchedRoleIds.add(roleId);

        const permissions = BigInt(String(role.permissions || '0'));
        if ((permissions & 8n) === 8n) {
          isAdmin = true;
        }

        if (appSettings.staffRoleIds.includes(roleId)) {
          isConfiguredStaff = true;
        }
      }
    }
  }

  return {
    canAccessStaff: isOwner || isAdmin || isConfiguredStaff,
    canAccessSettings: isOwner || isAdmin || isConfiguredStaff,
    isOwner,
    isAdmin,
    isConfiguredStaff,
    matchedRoleIds: [...matchedRoleIds],
    unavailableReason: null,
  };
}

const mapSavedDiscordRole = (data: any, fallback: DiscordRoleSummary): DiscordRoleSummary => {
  const savedRole = Array.isArray(data) ? data[0] : data;

  if (!savedRole || typeof savedRole !== 'object') {
    return fallback;
  }

  return {
    id: String(savedRole.highest_role_id || savedRole.role_id || fallback.id),
    name: String(savedRole.highest_role_name || savedRole.role_name || fallback.name),
    position: Number(savedRole.highest_role_position || savedRole.role_position || fallback.position),
    guildId: String(savedRole.guild_id || fallback.guildId),
    color: fallback.color,
  };
};

async function fetchHighestDiscordRole(discordUserId: string) {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return {
      role: null,
      unavailableReason: 'DISCORD_BOT_TOKEN não configurado.',
    };
  }

  const guildIds = await resolveDiscordGuildIds(botToken);

  if (guildIds.length === 0) {
    return {
      role: null,
      unavailableReason: 'Nenhuma guild Discord encontrada para o bot.',
    };
  }

  let highestRole: DiscordRoleSummary | null = null;
  const skippedGuilds: string[] = [];

  for (const guildId of guildIds) {
    const [memberResponse, rolesResponse] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }),
    ]);

    if (!memberResponse.ok || !rolesResponse.ok) {
      skippedGuilds.push(`${guildId}:${memberResponse.status}/${rolesResponse.status}`);
      continue;
    }

    const member = await memberResponse.json();
    const roles = await rolesResponse.json();
    const memberRoleIds = new Set<string>(member.roles || []);

    const guildHighestRole = roles
      .filter((role: any) => memberRoleIds.has(role.id) && role.name !== '@everyone')
      .sort((a: any, b: any) => b.position - a.position)[0];

    if (guildHighestRole && (!highestRole || guildHighestRole.position > highestRole.position)) {
      highestRole = {
        id: guildHighestRole.id,
        name: guildHighestRole.name,
        position: guildHighestRole.position,
        guildId,
        color: guildHighestRole.color,
      };
    }
  }

  if (highestRole) {
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase.rpc('save_user_highest_discord_role', {
        p_discord_user_id: discordUserId,
        p_guild_id: highestRole.guildId,
        p_highest_role_id: highestRole.id,
        p_highest_role_name: highestRole.name,
        p_highest_role_position: highestRole.position,
      });

      if (error) {
        console.warn('[!] Erro ao salvar maior cargo Discord no Supabase:', error.message);
      } else {
        highestRole = mapSavedDiscordRole(data, highestRole);
      }
    }
  }

  return {
    role: highestRole,
    unavailableReason: highestRole ? null : `Nenhum cargo encontrado. Guilds ignoradas: ${skippedGuilds.join(', ') || 'nenhuma'}.`,
  };
}

// Helper to notify the configured Discord Webhook in a premium visual format
async function sendDiscordWebhook(ticket: any) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (botToken && appSettings.ticketChannelId) {
    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${appSettings.ticketChannelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: null,
          embeds: [{
            title: 'Nova Solicitação - JUICY COMUNIDADE',
            description: 'Um membro abriu uma solicitação de atendimento pela Central do Suporte.',
            color: 1224,
            fields: [
              {
                name: 'Comunidade / Servidor',
                value: `**${ticket.serverName || 'Desconhecido'}** (${ticket.serverId || 'N/A'})`,
                inline: true,
              },
              {
                name: 'Categoria',
                value: ticket.category,
                inline: true,
              },
              {
                name: 'Assunto / Título',
                value: ticket.subject,
              },
              {
                name: 'Mensagem / Detalhes',
                value: String(ticket.message || '').substring(0, 1000),
              },
              {
                name: 'Arquivos Anexados',
                value: ticket.fileName ? `\`${ticket.fileName}\`` : 'Nenhum',
              },
            ],
            footer: {
              text: 'Juicy Comunidade - Central Integrada',
            },
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      console.log('[+] Notificação enviada para o canal Discord configurado.');
      return;
    } catch (error) {
      console.warn('[!] Falha ao enviar notificação para canal Discord. Tentando webhook URL:', error);
    }
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    // Elegant deep blue hex #0004C8 converted to decimal is 1224
    const JUICY_BLUE_DECIMAL = 1224;

    const embed = {
      title: `⚙️ Nova Solicitação — JUICY COMUNIDADE`,
      description: `Um membro abriu uma solicitação de atendimento pela Central do Suporte.`,
      color: JUICY_BLUE_DECIMAL,
      fields: [
        {
          name: 'Comunidade / Servidor',
          value: `**${ticket.serverName || 'Desconhecido'}** (${ticket.serverId || 'N/A'})`,
          inline: true
        },
        {
          name: 'Categoria',
          value: `🔹 ${ticket.category}`,
          inline: true
        },
        {
          name: 'Assunto / Título',
          value: `${ticket.subject}`
        },
        {
          name: 'Mensagem / Detalhes',
          value: `${ticket.message.substring(0, 1000)}`
        },
        {
          name: 'Arquivos Anexados',
          value: ticket.fileName ? `📎 \`${ticket.fileName}\`` : 'Nenhum'
        }
      ],
      footer: {
        text: 'Juicy Comunidade • Central Integrada'
      },
      timestamp: new Date().toISOString()
    };

    const payload = {
      username: 'Juicy Suporte',
      avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      embeds: [embed]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log('[+] Notificação enviada para o Webhook do Discord.');
  } catch (error) {
    console.error('[-] Falha ao enviar notificação para o Webhook do Discord:', error);
  }
}

// Wrap server setup in async function to avoid top-level await compilation failure in CommonJS format
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. API route: Retrieve live system configuration settings for client-side setup
  app.get('/api/config', (req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || null,
      supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || null,
      discordClientId: process.env.VITE_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID || null,
      hasWebhookEnabled: !!process.env.DISCORD_WEBHOOK_URL || !!appSettings.ticketChannelId
    });
  });

  app.get('/api/settings', (req, res) => {
    res.json({
      ticketChannelId: appSettings.ticketChannelId,
      staffRoleIds: appSettings.staffRoleIds,
      hasWebhookEnabled: !!process.env.DISCORD_WEBHOOK_URL || !!appSettings.ticketChannelId,
    });
  });

  app.post('/api/settings', (req, res) => {
    const ticketChannelId = typeof req.body?.ticketChannelId === 'string' ? req.body.ticketChannelId.trim() : appSettings.ticketChannelId;
    const staffRoleIds: string[] = Array.isArray(req.body?.staffRoleIds)
      ? req.body.staffRoleIds.map((id: any) => String(id).trim()).filter((id: string) => /^\d{17,20}$/.test(id))
      : appSettings.staffRoleIds;

    appSettings.ticketChannelId = /^\d{17,20}$/.test(ticketChannelId) ? ticketChannelId : '';
    appSettings.staffRoleIds = [...new Set(staffRoleIds)];

    res.json({
      ticketChannelId: appSettings.ticketChannelId,
      staffRoleIds: appSettings.staffRoleIds,
      hasWebhookEnabled: !!process.env.DISCORD_WEBHOOK_URL || !!appSettings.ticketChannelId,
    });
  });

  app.get('/api/discord/highest-role', async (req, res) => {
    const discordUserId = typeof req.query.discordUserId === 'string' ? req.query.discordUserId : '';

    if (!discordUserId) {
      return res.status(400).json({ error: 'Discord user ID não informado.' });
    }

    try {
      const result = await fetchHighestDiscordRole(discordUserId);
      const role = result.role;

      if (!role && result.unavailableReason) {
        console.warn(`[!] Cargo Discord não sincronizado: ${result.unavailableReason}`);
      }

      return res.json({
        roleName: role?.name || null,
        roleId: role?.id || null,
        guildId: role?.guildId || null,
        roleColor: role?.color || null,
        unavailableReason: result.unavailableReason,
      });
    } catch (error) {
      console.warn('[!] Erro ao consultar cargo Discord:', error);
      return res.json({ roleName: null, roleId: null, guildId: null, roleColor: null, unavailableReason: 'Erro ao consultar Discord.' });
    }
  });

  app.get('/api/discord/guilds', async (req, res) => {
    try {
      const result = await fetchDiscordGuildSummaries();

      if (result.unavailableReason) {
        console.warn(`[!] Comunidades Discord não sincronizadas: ${result.unavailableReason}`);
      }

      return res.json(result);
    } catch (error) {
      console.warn('[!] Erro ao listar comunidades Discord:', error);
      return res.json({
        guilds: [],
        unavailableReason: 'Erro ao listar comunidades Discord.',
      });
    }
  });

  app.get('/api/discord/roles', async (req, res) => {
    try {
      const result = await fetchDiscordRoleSummaries();
      return res.json(result);
    } catch (error) {
      console.warn('[!] Erro ao listar cargos Discord:', error);
      return res.json({
        roles: [],
        unavailableReason: 'Erro ao listar cargos Discord.',
      });
    }
  });

  app.get('/api/discord/access', async (req, res) => {
    const discordUserId = typeof req.query.discordUserId === 'string' ? req.query.discordUserId : '';

    if (!discordUserId) {
      return res.status(400).json({ error: 'Discord user ID não informado.' });
    }

    try {
      const access = await fetchDiscordAccess(discordUserId);
      return res.json(access);
    } catch (error) {
      console.warn('[!] Erro ao consultar acesso Discord:', error);
      return res.json({
        canAccessStaff: false,
        canAccessSettings: false,
        isOwner: false,
        isAdmin: false,
        isConfiguredStaff: false,
        matchedRoleIds: [],
        unavailableReason: 'Erro ao consultar acesso Discord.',
      });
    }
  });

  app.post('/api/support/analyze-chat', (req, res) => {
    try {
      const { ticket, messages } = req.body || {};

      if (!ticket) {
        return res.status(400).json({ error: 'Ticket não informado.' });
      }

      return res.json({
        insight: analyzeSupportChat(ticket, messages),
        source: 'backend',
      });
    } catch (error) {
      console.warn('[!] Erro ao analisar chat no backend:', error);
      return res.status(500).json({ error: 'Falha ao analisar atendimento.' });
    }
  });

  // 2. API route: Retrieve all logged user tickets
  app.get('/api/tickets', async (req, res) => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        if (data) {
          const mapped = data.map((t: any) => ({
            id: t.id ? t.id.toString() : String(Math.random()),
            category: t.category,
            subject: t.subject,
            message: t.message,
            status: t.status || 'Recebido',
            createdAt: t.created_at ? new Date(t.created_at).toLocaleString('pt-BR') : 'Agora mesmo',
            fileName: t.file_name || undefined,
            replyMessage: t.reply_message || undefined,
            serverId: t.server_id,
            serverName: t.server_name
          }));
          return res.json(mapped);
        }
      } catch (e: any) {
        console.warn('[!] Supabase não pronto ou sem a tabela "tickets". Retornando dados locais:', e.message);
      }
    }

    res.json(inMemoryTickets);
  });

  // 3. API route: Submit a brand new support item safely
  app.post('/api/tickets', async (req, res) => {
    const { category, subject, message, fileName, serverId, serverName } = req.body;

    if (!category || !subject || !message || !serverId || !serverName) {
      return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
    }

    const newTicket = {
      id: `ticket-${Date.now()}`,
      category,
      subject,
      message,
      status: 'Recebido' as const,
      createdAt: 'Agora mesmo',
      fileName: fileName || undefined,
      serverId,
      serverName
    };

    // Push to local memory stream
    inMemoryTickets.unshift(newTicket);

    // Attempt async save to Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('tickets').insert([
          {
            category,
            subject,
            message,
            status: 'Recebido',
            file_name: fileName || null,
            server_id: serverId,
            server_name: serverName
          }
        ]);
        if (error) throw error;
        console.log('[+] Solicitação persistida com sucesso no Supabase.');
      } catch (e: any) {
        console.warn('[!] Erro ao tentar salvar no Supabase. Mantido apenas localmente:', e.message);
      }
    }

    // Send premium Discord Webhook notification asynchronously
    sendDiscordWebhook(newTicket);

    res.status(201).json(newTicket);
  });

  // 4. Vite middleware integration for production vs development routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[+] Servidor da JUICY COMUNIDADE rodando na porta ${PORT}`);
    startDiscordBotGateway();
  });
}

startServer();
