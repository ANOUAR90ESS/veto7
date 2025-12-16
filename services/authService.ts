
import { supabase } from './supabase';
import { UserProfile } from '../types';

export const signIn = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const resetPasswordForEmail = async (email: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch the profile data from the 'profiles' table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // EMERGENCY FALLBACK: If DB fetch fails but email matches owner, grant admin
  if (error || !profile) {
    console.warn("Error fetching profile, checking overrides:", error);
    
    if (user.email === 'anouares.seghyr91@gmail.com') {
        return {
            id: user.id,
            email: user.email || '',
            role: 'admin',
            plan: 'pro',
            generationsCount: 0
        };
    }

    // Fallback if profile trigger failed or table doesn't exist yet
    return {
      id: user.id,
      email: user.email || '',
      role: 'user',
      plan: 'free',
      generationsCount: 0
    };
  }

  // Force admin for owner email if DB record exists but says user (safety check)
  const role = (user.email === 'anouares.seghyr91@gmail.com') ? 'admin' : (profile.role as 'user' | 'admin');

  return {
    id: user.id,
    email: user.email || '',
    role: role,
    plan: profile.plan as any,
    subscriptionEnd: profile.subscription_end,
    generationsCount: profile.generations_count || 0
  };
};
