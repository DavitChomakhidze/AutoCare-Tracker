import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';
const devOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const supabaseClientUrl = import.meta.env.DEV && devOrigin ? `${devOrigin}/supabase` : supabaseUrl;
const projectRef = new URL(supabaseUrl).hostname.split('.')[0] || 'autocare';
export const authStorageKey = `sb-${projectRef}-auth-token`;
const authRememberPreferenceKey = `autocare-${projectRef}-remember-auth`;

function storageAvailable(storage: Storage) {
  try {
    const testKey = '__autocare_storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function shouldRememberAuthSession() {
  if (typeof window === 'undefined' || !storageAvailable(localStorage)) return true;
  return localStorage.getItem(authRememberPreferenceKey) !== 'false';
}

export function setAuthRememberPreference(remember: boolean) {
  if (typeof window === 'undefined') return;

  if (storageAvailable(localStorage)) {
    localStorage.setItem(authRememberPreferenceKey, remember ? 'true' : 'false');
  }

  const currentToken = localStorage.getItem(authStorageKey) || sessionStorage.getItem(authStorageKey);
  if (!currentToken) return;

  if (remember) {
    localStorage.setItem(authStorageKey, currentToken);
    sessionStorage.removeItem(authStorageKey);
    return;
  }

  sessionStorage.setItem(authStorageKey, currentToken);
  localStorage.removeItem(authStorageKey);
}

export function clearAuthRememberPreference() {
  if (typeof window === 'undefined' || !storageAvailable(localStorage)) return;
  localStorage.removeItem(authRememberPreferenceKey);
}

const authStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;

    if (key === authStorageKey && !shouldRememberAuthSession()) {
      return sessionStorage.getItem(key);
    }

    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;

    if (key === authStorageKey && !shouldRememberAuthSession()) {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

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
    storageKey: authStorageKey,
    storage: authStorage
  }
});
