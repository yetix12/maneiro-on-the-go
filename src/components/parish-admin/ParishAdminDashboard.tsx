
import React, { useState, useEffect } from 'react';
import ParishAdminSidebar from './ParishAdminSidebar';
import ParishDashboardOverview from './ParishDashboardOverview';
import ParishUsersManager from './ParishUsersManager';
import ParishVehiclesManager from './ParishVehiclesManager';
import ParishRoutesManager from './ParishRoutesManager';
import ParishStopsManager from './ParishStopsManager';
import ParishStatistics from './ParishStatistics';
import { supabase } from '@/integrations/supabase/client';

interface ParishAdminDashboardProps {
  onLogout: () => void;
  parroquiaId?: string;
}

const ParishAdminDashboard: React.FC<ParishAdminDashboardProps> = ({ onLogout, parroquiaId }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [parroquiaName, setParroquiaName] = useState('');

  useEffect(() => {
    if (parroquiaId) {
      loadParroquiaInfo();
    }
  }, [parroquiaId]);

  const loadParroquiaInfo = async () => {
    if (!parroquiaId) return;
    
    const { data } = await supabase
      .from('parroquias')
      .select('nombre')
      .eq('id', parroquiaId)
      .single();
    
    if (data) {
      setParroquiaName(data.nombre);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ParishDashboardOverview parroquiaId={parroquiaId} parroquiaName={parroquiaName} />;
      case 'users':
        return <ParishUsersManager parroquiaId={parroquiaId} />;
      case 'vehicles':
        return <ParishVehiclesManager parroquiaId={parroquiaId} />;
      case 'routes':
        return <ParishRoutesManager parroquiaId={parroquiaId} />;
      case 'stops':
        return <ParishStopsManager parroquiaId={parroquiaId} />;
      case 'statistics':
        return <ParishStatistics parroquiaId={parroquiaId} />;
      default:
        return <ParishDashboardOverview parroquiaId={parroquiaId} parroquiaName={parroquiaName} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ParishAdminSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={onLogout}
        parroquiaName={parroquiaName}
      />
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default ParishAdminDashboard;
