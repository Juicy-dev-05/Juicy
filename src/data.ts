import { DiscordServer, FAQItem } from './types';

export const DISCORD_SERVERS: DiscordServer[] = [
  {
    id: 'server-1',
    name: 'Juicy Club',
    description: 'A comunidade oficial para membros fundadores, parceiros e entusiastas do ecossistema Juicy.',
    photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    memberCount: '12,450 membros'
  },
  {
    id: 'server-2',
    name: 'Juicy Devs',
    description: 'O ponto de encontro dos desenvolvedores, designers e mentes técnicas mais criativas.',
    photoUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=150&auto=format&fit=crop&q=80',
    memberCount: '5,820 membros'
  },
  {
    id: 'server-3',
    name: 'Juicy VIP',
    description: 'Networking de alto nível, recompensas exclusivas e conexões diretas entre membros premium.',
    photoUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=150&auto=format&fit=crop&q=80',
    memberCount: '2,150 membros'
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Vínculos',
    question: 'Como vincular meu cargo exclusivo do Discord ao meu perfil?',
    answer: 'A sincronização ocorre de forma totalmente automatizada. O nosso bot verifica de tempos em tempos suas interações e compras válidas e atribui os cargos correspondentes no seu servidor Discord. Caso note algum atraso, abra uma solicitação na categoria correspondente.'
  },
  {
    id: 'faq-2',
    category: 'Suporte',
    question: 'Qual o tempo de resposta estimado para uma solicitação?',
    answer: 'Trabalhamos com prioridade máxima. Nossos analistas seniores respondem a maioria dos chamados em até 4 horas úteis, com prazo limite de até 24 horas úteis em períodos de alta volatilidade.'
  },
  {
    id: 'faq-3',
    category: 'Privacidade',
    question: 'Como meus dados de login com Discord são protegidos?',
    answer: 'Sua privacidade é inegociável. Nós não armazenamos suas credenciais de acesso ou IDs privativos. O login via Discord serve inteiramente como um token temporário e público para recuperar sua foto de perfil, tag de usuário e lista de servidores nos quais você já é membro.'
  },
  {
    id: 'faq-4',
    category: 'Assinaturas',
    question: 'Como funciona o acesso aos canais privativos VIP?',
    answer: 'Membros com status VIP ativo no Juicy Club ou Juicy VIP ganham acesso imediato a salas secretas, canais de mentoria de voz e chats editoriais exclusivos. Se você assinou e ainda não possui acesso, envie uma solicitação com o assunto "Acesso VIP".'
  }
];
