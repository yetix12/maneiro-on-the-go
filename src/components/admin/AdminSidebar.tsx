import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Map, 
  Image, 
  Building2, 
  Shield, 
  BarChart3,
  Bus,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'parroquias', label: 'Parroquias', icon: Building2 },
  { id: 'admins', label: 'Administradores', icon: Shield },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'routes', label: 'Rutas', icon: Map },
  { id: 'bus-stops', label: 'Paradas', icon: MapPin },
  { id: 'vehicles', label: 'Vehículos', icon: Bus },
  { id: 'gallery', label: 'Galería', icon: Image },
  { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Admin General</h1>
        <p className="text-sm text-slate-400">Transporte Maneiro</p>
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
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
