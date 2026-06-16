import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';
const devOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const supabaseClientUrl = import.meta.env.DEV && devOrigin ? `${devOrigin}/supabase` : supabaseUrl;
const projectRef = new URL(supabaseUrl).hostname.split('.')[0] || 'autocare';
export const authStorageKey = `sb-${projectRef}-auth-token`;

function clearOversizedSupabaseTokens() {
  if (typeof window === 'undefined') return;

  Object.keys(localStorage)
    .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
    .forEach((key) => {
      if (key === authStorageKey) {
        return;
      }

      const value = localStorage.getItem(key) || '';
      const isProxyGeneratedKey = key === 'sb-localhost-auth-token';
      const isPlaceholderKey = key === 'sb-placeholder-auth-token';
      const hasInlineImage = value.includes('data:image');
      const isOversizedToken = value.length > 12000;

      if (isProxyGeneratedKey || isPlaceholderKey || isOversizedToken || hasInlineImage) {
        localStorage.removeItem(key);
      }
    });
}

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  // Keep the error explicit so local setup problems are obvious during development.
  console.warn('Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
}

clearOversizedSupabaseTokens();

export const supabase = createClient<Database>(supabaseClientUrl, supabasePublishableKey, {
  auth: {
    storageKey: authStorageKey
  }
});
