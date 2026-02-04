
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bus, Navigation, Clock, MapPin, Image, CreditCard, Loader2, Phone, Building, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Vehicle {
  id: string;
  license_plate: string;
  model: string | null;
  capacity: number | null;
  status: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  route_id: string | null;
  driver_id: string | null;
  route_name?: string;
  route_color?: string;
  driver_name?: string;
  driver_phone?: string;
}

interface DriverPayment {
  payment_method: string;
  pm_telefono: string | null;
  pm_cedula: string | null;
  pm_banco: string | null;
  tf_banco: string | null;
  tf_tipo_cuenta: string | null;
  tf_numero_cuenta: string | null;
  tf_titular: string | null;
  tf_cedula: string | null;
}

const VehicleTracker = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [driverPayment, setDriverPayment] = useState<DriverPayment | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data: vehiclesData, error } = await supabase
        .from('vehicles')
        .select('*');

      if (error) throw error;

      // Fetch routes and drivers info
      const routeIds = vehiclesData?.map(v => v.route_id).filter(Boolean) || [];
      const driverIds = vehiclesData?.map(v => v.driver_id).filter(Boolean) || [];

      let routesMap: Record<string, { name: string; color: string }> = {};
      let driversMap: Record<string, { name: string; phone: string }> = {};

      if (routeIds.length > 0) {
        const { data: routesData } = await supabase
          .from('bus_routes')
          .select('id, name, color')
          .in('id', routeIds);
        
        routesMap = (routesData || []).reduce((acc, r) => {
          acc[r.id] = { name: r.name, color: r.color || '#3B82F6' };
          return acc;
        }, {} as Record<string, { name: string; color: string }>);
      }

      if (driverIds.length > 0) {
        const { data: driversData } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', driverIds);
        
        driversMap = (driversData || []).reduce((acc, d) => {
          acc[d.id] = { name: d.full_name || 'Sin nombre', phone: d.phone || '' };
          return acc;
        }, {} as Record<string, { name: string; phone: string }>);
      }

      const formattedVehicles: Vehicle[] = (vehiclesData || []).map(v => ({
        ...v,
        route_name: v.route_id ? routesMap[v.route_id]?.name : undefined,
        route_color: v.route_id ? routesMap[v.route_id]?.color : '#3B82F6',
        driver_name: v.driver_id ? driversMap[v.driver_id]?.name : undefined,
        driver_phone: v.driver_id ? driversMap[v.driver_id]?.phone : undefined,
      }));

      setVehicles(formattedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverPayment = async (driverId: string) => {
    setLoadingPayment(true);
    try {
      const { data, error } = await supabase
        .from('driver_payments')
        .select('*')
        .eq('driver_id', driverId)
        .maybeSingle();

      if (error) throw error;
      setDriverPayment(data);
    } catch (error) {
      console.error('Error fetching driver payment:', error);
      setDriverPayment(null);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleViewPhoto = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowPhotoDialog(true);
  };

  const handleViewPayment = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle.driver_id) {
      await fetchDriverPayment(vehicle.driver_id);
    } else {
      setDriverPayment(null);
    }
    setShowPaymentDialog(true);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return status || 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} />
        <span className="ml-2">Cargando vehículos...</span>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Vehículos Registrados</h2>
        <p className="text-gray-600">Información de la flota de transporte</p>
      </div>

      {vehicles.length === 0 ? (
        <Card className="p-8 text-center">
          <Bus size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="font-bold text-lg mb-2">No hay vehículos registrados</h3>
          <p className="text-gray-600">Los administradores aún no han registrado vehículos en el sistema.</p>
        </Card>
      ) : (
        vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  <Bus size={20} style={{ color: vehicle.route_color || '#3B82F6' }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{vehicle.license_plate}</h3>
                  <p className="text-gray-600 text-sm">{vehicle.route_name || 'Sin ruta asignada'}</p>
                  <p className="text-gray-500 text-xs">
                    Conductor: {vehicle.driver_name || 'Sin asignar'}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(vehicle.status)}>
                {getStatusText(vehicle.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Bus size={16} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Modelo</p>
                  <p className="font-semibold text-sm">{vehicle.model || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Navigation size={16} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Capacidad</p>
                  <p className="font-semibold text-sm">{vehicle.capacity || 'N/A'} pasajeros</p>
                </div>
              </div>
            </div>

            {vehicle.current_latitude && vehicle.current_longitude && (
              <div className="flex items-center space-x-2 mb-4">
                <MapPin size={16} className="text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Ubicación actual</p>
                  <p className="font-semibold text-sm">
                    {vehicle.current_latitude.toFixed(4)}, {vehicle.current_longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewPhoto(vehicle)}
                className="flex-1"
              >
                <Image size={16} className="mr-2" />
                Ver Foto
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewPayment(vehicle)}
                className="flex-1"
                disabled={!vehicle.driver_id}
              >
                <CreditCard size={16} className="mr-2" />
                Pago Móvil
              </Button>
            </div>
          </Card>
        ))
      )}

      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-dashed border-green-200">
        <div className="text-center">
          <Navigation size={32} className="mx-auto mb-2 text-green-600" />
          <h3 className="font-bold mb-1">Sistema GPS Activo</h3>
          <p className="text-sm text-gray-600">
            Información actualizada en tiempo real desde cada vehículo
          </p>
        </div>
      </Card>

      {/* Photo Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image size={20} />
              Foto del Vehículo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVehicle && (
              <>
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">{selectedVehicle.license_plate}</h3>
                  <p className="text-gray-600">{selectedVehicle.model || 'Sin modelo'}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <div className="text-center text-gray-500">
                    <Image size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Foto no disponible</p>
                    <p className="text-xs mt-1">El administrador aún no ha subido una foto de este vehículo</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Datos de Pago del Conductor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVehicle && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Vehículo:</strong> {selectedVehicle.license_plate}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Conductor:</strong> {selectedVehicle.driver_name || 'Sin asignar'}
                </p>
              </div>
            )}

            {loadingPayment ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin" size={24} />
                <span className="ml-2">Cargando información...</span>
              </div>
            ) : !selectedVehicle?.driver_id ? (
              <div className="text-center py-8 text-gray-500">
                <User size={48} className="mx-auto mb-2 opacity-50" />
                <p>Este vehículo no tiene conductor asignado</p>
              </div>
            ) : !driverPayment ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard size={48} className="mx-auto mb-2 opacity-50" />
                <p>El conductor no ha registrado datos de pago</p>
              </div>
            ) : (
              <div className="space-y-4">
                {driverPayment.payment_method === 'pago_movil' ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                      <Phone size={18} />
                      Pago Móvil
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-green-600" />
                        <span className="text-sm">
                          <strong>Teléfono:</strong> {driverPayment.pm_telefono || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-green-600" />
                        <span className="text-sm">
                          <strong>Cédula:</strong> {driverPayment.pm_cedula || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-green-600" />
                        <span className="text-sm">
                          <strong>Banco:</strong> {driverPayment.pm_banco || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : driverPayment.payment_method === 'transferencia' ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <Building size={18} />
                      Transferencia Bancaria
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-blue-600" />
                        <span className="text-sm">
                          <strong>Banco:</strong> {driverPayment.tf_banco || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-600" />
                        <span className="text-sm">
                          <strong>Tipo:</strong> {driverPayment.tf_tipo_cuenta || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-600" />
                        <span className="text-sm">
                          <strong>Cuenta:</strong> {driverPayment.tf_numero_cuenta || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-blue-600" />
                        <span className="text-sm">
                          <strong>Titular:</strong> {driverPayment.tf_titular || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-blue-600" />
                        <span className="text-sm">
                          <strong>Cédula:</strong> {driverPayment.tf_cedula || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Método de pago no reconocido
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleTracker;
