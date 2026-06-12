export interface UserSession {
  id?: string;
  discordId?: string;
  highestRole?: string;
  highestRoleId?: string;
  highestRoleGuildId?: string;
  highestRoleColor?: number;
  username: string;
  avatar: string;
  tag: string;
}

export interface StaffAccess {
  canAccessStaff: boolean;
  canAccessSettings: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isConfiguredStaff: boolean;
  matchedRoleIds: string[];
}

export interface DiscordServer {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  memberCount?: string;
  roleCount?: number;
}

export type TicketCategory = 'Dúvida' | 'Problema técnico' | 'Denúncia' | 'Cargo' | 'Evento' | 'Parceria' | 'Recuperar acesso' | 'Outro';

export type TicketStatus = 'Recebido' | 'Em análise' | 'Respondido' | 'Finalizado';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'support' | 'ai';
  text: string;
  timestamp: string;
}

export interface ChatAiInsight {
  summary: string;
  suggestedReply: string;
  intent: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  confidence: number;
  nextStep: string;
}

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  fileName?: string;
  replyMessage?: string;
  serverId?: string;
  serverName?: string;
  chatHistory?: ChatMessage[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}
