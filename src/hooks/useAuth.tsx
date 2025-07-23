
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
      (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        
        if (session?.user) {
          // Defer async operations to prevent deadlock
          setTimeout(() => {
            authService.getUserProfile(session.user.id).then(({ profile, error }) => {
              if (error) {
                console.error('Error fetching user profile:', error);
                // Fallback to basic user data if profile fetch fails
                const basicAuthUser = authService.formatAuthUser(session.user, null);
                setUser(basicAuthUser);
              } else {
                const authUser = authService.formatAuthUser(session.user, profile);
                setUser(authUser);
              }
              setLoading(false);
            }).catch(err => {
              console.error('Unexpected error fetching profile:', err);
              // Fallback to basic user data
              const basicAuthUser = authService.formatAuthUser(session.user, null);
              setUser(basicAuthUser);
              setLoading(false);
            });
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    authService.getCurrentSession().then(({ session, error }) => {
      if (error) {
        console.error('Error getting current session:', error);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        authService.getUserProfile(session.user.id).then(({ profile, error }) => {
          if (error) {
            console.error('Error fetching user profile on init:', error);
            // Fallback to basic user data
            const basicAuthUser = authService.formatAuthUser(session.user, null);
            setUser(basicAuthUser);
          } else {
            const authUser = authService.formatAuthUser(session.user, profile);
            setUser(authUser);
          }
          setSession(session);
          setLoading(false);
        }).catch(err => {
          console.error('Unexpected error on init:', err);
          // Fallback to basic user data
          const basicAuthUser = authService.formatAuthUser(session.user, null);
          setUser(basicAuthUser);
          setSession(session);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Unexpected error getting session:', err);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { error } = await authService.signIn(email, password);
      
      if (error) {
        console.error('Sign in error:', error);
        
        // Manejar errores específicos de inicio de sesión
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor confirma tu email antes de iniciar sesión');
        } else if (error.message.includes('Too many requests')) {
          toast.error('Demasiados intentos. Espera un momento e intenta nuevamente');
        } else {
          toast.error(error.message || 'Error al iniciar sesión');
        }
        
        // Mantener en la pantalla de login en caso de error
        setUser(null);
        setSession(null);
      } else {
        toast.success('¡Sesión iniciada correctamente!');
      }
      
      return { error };
    } catch (err) {
      console.error('Unexpected sign in error:', err);
      toast.error('Error inesperado al iniciar sesión');
      setUser(null);
      setSession(null);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: { username: string; full_name: string; user_type?: string }) => {
    setLoading(true);
    
    try {
      const { error } = await authService.signUp(email, password, userData);
      
      if (error) {
        console.error('Sign up error:', error);
        
        // Manejar errores específicos de registro
        if (error.message.includes('Email address') && error.message.includes('invalid')) {
          toast.error('El formato del email no es válido');
        } else if (error.message.includes('User already registered')) {
          toast.error('Este email ya está registrado');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
        } else {
          toast.error(error.message || 'Error al registrarse');
        }
      } else {
        toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
      }
      
      return { error };
    } catch (err) {
      console.error('Unexpected sign up error:', err);
      toast.error('Error inesperado al registrarse');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Si no hay sesión activa, solo limpiar el estado local
    if (!session) {
      setUser(null);
      setSession(null);
      toast.success('Sesión cerrada correctamente');
      return;
    }

    const { error } = await authService.signOut();
    if (error) {
      console.error('Sign out error:', error);
      // Incluso si hay error, limpiar el estado local
      setUser(null);
      setSession(null);
      // Solo mostrar error si no es de sesión perdida
      if (!error.message?.includes('Auth session missing')) {
        toast.error('Error al cerrar sesión');
      } else {
        toast.success('Sesión cerrada correctamente');
      }
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
