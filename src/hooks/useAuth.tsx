
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { authService, AuthUser } from '@/services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: { username: string; full_name: string; user_type?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile
          const { profile } = await authService.getUserProfile(session.user.id);
          const authUser = authService.formatAuthUser(session.user, profile);
          setUser(authUser);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    authService.getCurrentSession().then(({ session }) => {
      if (session?.user) {
        authService.getUserProfile(session.user.id).then(({ profile }) => {
          const authUser = authService.formatAuthUser(session.user, profile);
          setUser(authUser);
          setSession(session);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await authService.signIn(email, password);
    
    if (error) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Error al iniciar sesión');
    } else {
      toast.success('¡Sesión iniciada correctamente!');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, userData: { username: string; full_name: string; user_type?: string }) => {
    setLoading(true);
    const { error } = await authService.signUp(email, password, userData);
    
    if (error) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Error al registrarse');
    } else {
      toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      console.error('Sign out error:', error);
      toast.error('Error al cerrar sesión');
    } else {
      toast.success('Sesión cerrada correctamente');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
