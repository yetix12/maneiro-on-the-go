import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DiagnosticResult {
  test_name: string;
  result: string;
  details: any;
}

const AdminDiagnostic: React.FC = () => {
  const { user, session } = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Current user:', user);
      console.log('Current session:', session);
      
      // Test 1: Frontend authentication state
      const frontendTests = [
        {
          test_name: 'frontend_user_exists',
          result: user ? 'PASS' : 'FAIL',
          details: { user_data: user }
        },
        {
          test_name: 'frontend_session_exists', 
          result: session ? 'PASS' : 'FAIL',
          details: { session_exists: !!session, user_id: session?.user?.id }
        },
        {
          test_name: 'frontend_user_is_admin',
          result: user?.type === 'admin' ? 'PASS' : 'FAIL',
          details: { user_type: user?.type }
        }
      ];

      // Test 2: Backend authentication tests
      const { data: backendTests, error: backendError } = await supabase
        .rpc('test_admin_access');

      if (backendError) {
        console.error('Backend test error:', backendError);
        setError(`Error en pruebas backend: ${backendError.message}`);
      }

      // Test 3: Try to access admin-only tables
      const tableTests = [];
      
      // Test profiles access
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id');
        
        tableTests.push({
          test_name: 'profiles_table_access',
          result: profilesError ? 'FAIL' : 'PASS',
          details: { 
            error: profilesError?.message || '', 
            count: profilesData ? profilesData.length : 0,
            access_granted: !profilesError
          }
        });
      } catch (err: any) {
        tableTests.push({
          test_name: 'profiles_table_access',
          result: 'FAIL',
          details: { error: err.message, count: 0 }
        });
      }

      // Test bus_routes access
      try {
        const { count: routesCount, error: routesError } = await supabase
          .from('bus_routes')
          .select('*', { count: 'exact', head: true });
        
        tableTests.push({
          test_name: 'bus_routes_table_access',
          result: routesError ? 'FAIL' : 'PASS',
          details: { error: routesError?.message, count: routesCount }
        });
      } catch (err: any) {
        tableTests.push({
          test_name: 'bus_routes_table_access',
          result: 'FAIL',
          details: { error: err.message }
        });
      }

      // Test bus_stop_info access
      try {
        const { count: stopsCount, error: stopsError } = await supabase
          .from('bus_stop_info')
          .select('*', { count: 'exact', head: true });
        
        tableTests.push({
          test_name: 'bus_stop_info_table_access',
          result: stopsError ? 'FAIL' : 'PASS',
          details: { error: stopsError?.message, count: stopsCount }
        });
      } catch (err: any) {
        tableTests.push({
          test_name: 'bus_stop_info_table_access',
          result: 'FAIL',
          details: { error: err.message }
        });
      }

      // Combine all results
      const allResults = [
        ...frontendTests,
        ...(backendTests || []),
        ...tableTests
      ];

      setDiagnosticResults(allResults);
      
    } catch (err: any) {
      console.error('Diagnostic error:', err);
      setError(`Error ejecutando diagnósticos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session) {
      runDiagnostics();
    }
  }, [user, session]);

  const getStatusColor = (result: string) => {
    return result === 'PASS' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (result: string) => {
    return result === 'PASS' ? 'bg-green-100' : 'bg-red-100';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnóstico de Permisos de Administrador</CardTitle>
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {diagnosticResults.length > 0 && (
          <div className="space-y-4">
            {diagnosticResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${getStatusBg(result.result)}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{result.test_name}</span>
                  <span className={`font-bold ${getStatusColor(result.result)}`}>
                    {result.result}
                  </span>
                </div>
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDiagnostic;