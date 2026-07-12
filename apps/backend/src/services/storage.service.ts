import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabase = () => {
  if (!supabaseClient && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
};

export const generateUploadUrl = async (bucket: string, filePath: string) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase Storage is not configured.');
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(filePath);

  if (error) {
    throw error;
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  };
};

export const getPublicUrl = (bucket: string, filePath: string): string => {
  if (!env.SUPABASE_URL) {
    return '';
  }
  return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
};
