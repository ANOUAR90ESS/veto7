import { createClient } from '@supabase/supabase-js';
import { VITE_SUPABASE_URL as LOCAL_URL, VITE_SUPABASE_ANON_KEY as LOCAL_KEY } from '../env.example';

// Safe environment variable retrieval
const getEnvVar = (key: string): string => {
  try {
    // Check import.meta.env (Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    
    // Check process.env (Node/Webpack)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    console.warn(`Error reading env var ${key}`, e);
  }

  return '';
};

// Use environment variables first, fallback to local config file
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || LOCAL_URL;
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || LOCAL_KEY;

// Check if configured (truthy & non-empty)
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;