
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  MapPin, 
  BarChart3,
  LogOut,
  Car
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParishAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  parroquiaName: string;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'vehicles', label: 'Vehículos', icon: Car },
  { id: 'routes', label: 'Rutas', icon: Map },
  { id: 'stops', label: 'Paradas', icon: MapPin },
  { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
];

const ParishAdminSidebar: React.FC<ParishAdminSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onLogout,
  parroquiaName 
}) => {
  return (
    <aside className="w-64 bg-gradient-to-b from-emerald-900 to-emerald-800 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-emerald-700">
        <h1 className="text-xl font-bold text-white">Admin Municipio</h1>
        <p className="text-sm text-emerald-300 truncate">{parroquiaName || 'Cargando...'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
              activeTab === item.id
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-emerald-200 hover:bg-emerald-700/50 hover:text-white"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-emerald-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-200 hover:bg-red-600/20 hover:text-red-400 transition-all"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default ParishAdminSidebar;
