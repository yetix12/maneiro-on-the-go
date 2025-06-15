
export const busRoutes = [
  {
    id: 'ruta-1',
    name: 'Pampatar - Porlamar',
    color: '#3B82F6',
    stops: [
      { id: 'stop-1', name: 'Terminal Pampatar', lat: 11.0047, lng: -63.8697 },
      { id: 'stop-2', name: 'Castillo San Carlos', lat: 11.0089, lng: -63.8658 },
      { id: 'stop-3', name: 'Plaza Bolívar Pampatar', lat: 11.0125, lng: -63.8542 },
      { id: 'stop-4', name: 'Centro de Salud', lat: 11.0167, lng: -63.8465 },
      { id: 'stop-5', name: 'Mercado Municipal', lat: 11.0203, lng: -63.8387 },
      { id: 'stop-6', name: 'Sambil Margarita', lat: 10.9577, lng: -63.8497 },
    ]
  },
  {
    id: 'ruta-2',
    name: 'Pampatar - Playa El Agua',
    color: '#10B981',
    stops: [
      { id: 'stop-7', name: 'Terminal Pampatar', lat: 11.0047, lng: -63.8697 },
      { id: 'stop-8', name: 'El Tirano', lat: 11.0435, lng: -63.8156 },
      { id: 'stop-9', name: 'Pedro González', lat: 11.0654, lng: -63.8001 },
      { id: 'stop-10', name: 'Manzanillo', lat: 11.0745, lng: -63.7898 },
      { id: 'stop-11', name: 'Playa El Agua', lat: 11.0856, lng: -63.7944 },
    ]
  }
];

export const activeVehicles = [
  { id: 'bus-1', routeId: 'ruta-1', lat: 11.0089, lng: -63.8620, status: 'En ruta', driver: 'Carlos M.' },
  { id: 'bus-2', routeId: 'ruta-1', lat: 11.0167, lng: -63.8465, status: 'En parada', driver: 'María G.' },
  { id: 'bus-3', routeId: 'ruta-2', lat: 11.0241, lng: -63.8376, status: 'En ruta', driver: 'José R.' },
];

// Área específica de Maneiro más precisa
export const maneiroArea = [
  { lat: 10.9950, lng: -63.8750 },
  { lat: 10.9950, lng: -63.8550 },
  { lat: 11.0150, lng: -63.8550 },
  { lat: 11.0150, lng: -63.8750 },
  { lat: 10.9950, lng: -63.8750 }
];

// Obtener puntos de interés desde localStorage (agregados por admin)
export const getAdminPointsOfInterest = () => {
  try {
    const savedPoints = localStorage.getItem('admin_points_of_interest');
    return savedPoints ? JSON.parse(savedPoints) : [];
  } catch (error) {
    console.error('Error loading points of interest:', error);
    return [];
  }
};

// Guardar puntos de interés en localStorage
export const saveAdminPointsOfInterest = (points: any[]) => {
  try {
    localStorage.setItem('admin_points_of_interest', JSON.stringify(points));
  } catch (error) {
    console.error('Error saving points of interest:', error);
  }
};
