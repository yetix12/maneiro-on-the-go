
import React from 'react';
import { Bus } from 'lucide-react';

const AppHeader: React.FC = () => {
  return (
    <div className="text-center mb-6">
      <div className="caribbean-gradient rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
        <Bus size={32} className="text-white" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Transporte Maneiro</h1>
      <p className="text-gray-600 text-sm">Nueva Esparta, Venezuela</p>
    </div>
  );
};

export default AppHeader;
