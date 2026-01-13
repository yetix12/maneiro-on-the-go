
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  user_type?: string;
  phone?: string;
  parroquia_id?: string;
}

export interface UserRole {
  role: 'admin_general' | 'admin_parroquia' | 'driver' | 'passenger';
  parroquia_id?: string;
}

export interface AuthUser {
  id: string;
  username?: string;
  name?: string;
  type: 'passenger' | 'driver' | 'admin' | 'admin_parroquia';
  email?: string;
  parroquia_id?: string;
}

export const authService = {
  // Sign up new user
  signUp: async (email: string, password: string, userData: { 
    username: string; 
    full_name: string; 
    user_type?: string;
    phone?: string;
    parroquia_id?: string;
    direccion?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.full_name,
          user_type: userData.user_type || 'passenger',
          phone: userData.phone || null,
          parroquia_id: userData.parroquia_id || null,
          direccion: userData.direccion || null
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

  // Get user roles from user_roles table
  getUserRoles: async (userId: string): Promise<{ roles: UserRole[]; error: any }> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, parroquia_id')
      .eq('user_id', userId);
    
    return { roles: data || [], error };
  },

  // Get current user profile
  getUserProfile: async (userId: string): Promise<{ profile: UserProfile | null; error: any }> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    return { profile: data, error };
  },

  // Convert Supabase user to AuthUser format - now includes role checking
  formatAuthUser: (user: User, profile: UserProfile | null, roles?: UserRole[]): AuthUser => {
    // Check roles first (from user_roles table) - this takes priority
    if (roles && roles.length > 0) {
      // Priority: admin_general > admin_parroquia > driver > passenger
      const adminGeneralRole = roles.find(r => r.role === 'admin_general');
      if (adminGeneralRole) {
        return {
          id: user.id,
          username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
          name: profile?.full_name || user.user_metadata?.full_name || '',
          type: 'admin',
          email: user.email
        };
      }

      const adminParroquiaRole = roles.find(r => r.role === 'admin_parroquia');
      if (adminParroquiaRole) {
        return {
          id: user.id,
          username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
          name: profile?.full_name || user.user_metadata?.full_name || '',
          type: 'admin_parroquia',
          email: user.email,
          parroquia_id: adminParroquiaRole.parroquia_id
        };
      }

      const driverRole = roles.find(r => r.role === 'driver');
      if (driverRole) {
        return {
          id: user.id,
          username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
          name: profile?.full_name || user.user_metadata?.full_name || '',
          type: 'driver',
          email: user.email,
          parroquia_id: profile?.parroquia_id
        };
      }
    }

    // Fallback to user_type from profile or metadata
    const userType = profile?.user_type || user.user_metadata?.user_type || 'passenger';
    const fullName = profile?.full_name || user.user_metadata?.full_name || '';
    const username = profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || '';
    
    // Map user_type to AuthUser type
    let type: 'passenger' | 'driver' | 'admin' | 'admin_parroquia' = 'passenger';
    if (userType === 'admin') {
      type = 'admin';
    } else if (userType === 'admin_parroquia') {
      type = 'admin_parroquia';
    } else if (userType === 'driver') {
      type = 'driver';
    }

    return {
      id: user.id,
      username: username,
      name: fullName || username,
      type: type,
      email: user.email,
      parroquia_id: profile?.parroquia_id
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
