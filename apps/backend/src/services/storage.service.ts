import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabase = () => {
  if (!supabaseClient && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
};

export const generateUploadUrl = async (bucket: string, filePath: string) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(filePath);

  if (error) {
    throw error;
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    publicUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`,
  };
};

export const getPublicUrl = (bucket: string, filePath: string): string => {
  if (!env.SUPABASE_URL) {
    return '';
  }
  return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
};
