
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  user_type?: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  username?: string;
  name?: string;
  type: 'passenger' | 'driver' | 'admin';
  email?: string;
}

export const authService = {
  // Sign up new user
  signUp: async (email: string, password: string, userData: { username: string; full_name: string; user_type?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.full_name,
          user_type: userData.user_type || 'passenger'
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    
    return { data, error };
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user profile
  getUserProfile: async (userId: string): Promise<{ profile: UserProfile | null; error: any }> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { profile: data, error };
  },

  // Convert Supabase user to AuthUser format
  formatAuthUser: (user: User, profile: UserProfile | null): AuthUser => {
    return {
      id: user.id,
      username: profile?.username || user.email?.split('@')[0] || '',
      name: profile?.full_name || profile?.username || user.email?.split('@')[0] || '',
      type: (profile?.user_type as 'passenger' | 'driver' | 'admin') || 'passenger',
      email: user.email
    };
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};
