import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type AuthJwtPayload = {
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

const authImageMetadataKeys = ['avatar_url', 'picture', 'image'];
const avatarMaxBytes = 2 * 1024 * 1024;
const allowedAvatarTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const avatarExtensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
};

function decodeJwtPayload(accessToken: string): AuthJwtPayload | null {
  const payloadPart = accessToken.split('.')[1];
  if (!payloadPart) return null;

  try {
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(paddedBase64));
  } catch {
    return null;
  }
}

function isUnsafeMetadataImage(value: unknown) {
  return typeof value === 'string' && (value.includes('data:image') || value.length > 1000);
}

function validateAvatarFile(file: File) {
  if (!allowedAvatarTypes.has(file.type)) {
    throw new Error('Profile photo must be a PNG, JPG, JPEG, or WEBP image.');
  }

  if (file.size > avatarMaxBytes) {
    throw new Error('Profile photo must be 2MB or smaller.');
  }
}

export async function repairOversizedAuthMetadata() {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const decodedPayload = session ? decodeJwtPayload(session.access_token) : null;
  const metadata = decodedPayload?.user_metadata;
  if (!metadata) return null;

  const hasUnsafeImageMetadata = authImageMetadataKeys.some((key) => isUnsafeMetadataImage(metadata[key]));
  if (!hasUnsafeImageMetadata) return session;

  const cleanedMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) => !authImageMetadataKeys.includes(key) && !isUnsafeMetadataImage(value))
  );

  const { data: repaired, error } = await supabase.auth.updateUser({
    data: {
      ...cleanedMetadata,
      avatar_url: null,
      picture: null,
      image: null
    }
  });

  if (error) throw error;

  const refreshed = await supabase.auth.refreshSession();
  return refreshed.data.session ?? data.session;
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, displayName: string, email: string, avatarUrl?: string | null) {
  const { data: userData, error: userError } = await supabase.auth.updateUser({
    email,
    data: {
      display_name: displayName,
      avatar_url: null,
      picture: null,
      image: null
    }
  });

  if (userError) throw userError;

  const profilePayload: Database['public']['Tables']['profiles']['Insert'] = {
    id: userId,
    display_name: displayName,
    avatar_url: avatarUrl || null
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  if (profileError) {
    console.error('Supabase profile update failed', {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint
    });
    throw profileError;
  }
  return userData;
}

export async function uploadAvatar(userId: string, file: File) {
  validateAvatarFile(file);

  const extension = avatarExtensions[file.type] || 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function updatePassword(email: string, currentPassword: string, newPassword: string) {
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (signInError) throw signInError;

  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export async function signOutEverywhere() {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`
  });
  if (error) throw error;
  return data;
}
