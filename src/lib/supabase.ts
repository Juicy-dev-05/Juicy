import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { UserSession } from '../types';

interface AppConfig {
  supabaseUrl: string | null;
  supabaseKey: string | null;
}

let supabaseClientPromise: Promise<SupabaseClient | null> | null = null;

async function loadAppConfig(): Promise<AppConfig> {
  const response = await fetch('/api/config');

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a configuracao do Supabase.');
  }

  return response.json();
}

export async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = loadAppConfig().then((config) => {
      if (!config.supabaseUrl || !config.supabaseKey) {
        return null;
      }

      return createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      });
    });
  }

  return supabaseClientPromise;
}

export function mapSupabaseUserToSession(user: User): UserSession {
  const metadata = user.user_metadata || {};
  const discordIdentity = user.identities?.find((identity) => identity.provider === 'discord');
  const discordId =
    metadata.provider_id ||
    metadata.sub ||
    metadata.discord_id ||
    discordIdentity?.identity_data?.provider_id ||
    discordIdentity?.identity_data?.sub ||
    discordIdentity?.id;
  const username =
    metadata.full_name ||
    metadata.name ||
    metadata.global_name ||
    metadata.user_name ||
    metadata.preferred_username ||
    metadata.username ||
    user.email ||
    'Juicy Member';

  return {
    id: user.id,
    discordId: discordId ? String(discordId) : undefined,
    username,
    avatar:
      metadata.avatar_url ||
      metadata.picture ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tag: metadata.user_name || metadata.preferred_username || user.email || user.id.slice(0, 8),
  };
}
