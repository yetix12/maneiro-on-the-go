 import React, { useState, useEffect } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { ChevronLeft, MapPin, Clock, DollarSign, Route, Image as ImageIcon } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import type { Tables } from '@/integrations/supabase/types';
 
 type RouteType = Tables<'bus_routes'>;
 type Stop = Tables<'bus_stops'>;
 
 interface RouteWithStops extends RouteType {
   stops: Stop[];
 }
 
 interface StopInfo extends Stop {
   imageUrl?: string;
   description?: string;
 }
 
 interface RouteInfoSectionProps {
   initialRouteId?: string;
   initialStopId?: string;
   onBack?: () => void;
 }
 
 const RouteInfoSection: React.FC<RouteInfoSectionProps> = ({ 
   initialRouteId, 
   initialStopId,
   onBack 
 }) => {
   const [routes, setRoutes] = useState<RouteWithStops[]>([]);
   const [selectedRoute, setSelectedRoute] = useState<RouteWithStops | null>(null);
   const [selectedStop, setSelectedStop] = useState<StopInfo | null>(null);
   const [stopImages, setStopImages] = useState<Record<string, { imageUrl: string; description: string }>>({});
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     fetchRoutes();
     fetchStopImages();
   }, []);
 
   useEffect(() => {
     if (initialRouteId && routes.length > 0) {
       const route = routes.find(r => r.id === initialRouteId);
       if (route) {
         setSelectedRoute(route);
         if (initialStopId) {
           const stop = route.stops.find(s => s.id === initialStopId);
           if (stop) {
             setSelectedStop({
               ...stop,
               imageUrl: stopImages[stop.id]?.imageUrl,
               description: stopImages[stop.id]?.description
             });
           }
         }
       }
     }
   }, [initialRouteId, initialStopId, routes, stopImages]);
 
   const fetchRoutes = async () => {
     try {
       const { data: routesData, error: routesError } = await supabase
         .from('bus_routes')
         .select('*')
         .eq('is_active', true)
         .order('name');
 
       if (routesError) throw routesError;
 
       const routesWithStops: RouteWithStops[] = [];
       
       for (const route of routesData || []) {
         const { data: stopsData } = await supabase
           .from('bus_stops')
           .select('*')
           .eq('route_id', route.id)
           .order('stop_order');
 
         routesWithStops.push({
           ...route,
           stops: stopsData || []
         });
       }
 
       setRoutes(routesWithStops);
     } catch (err) {
       console.error('Error fetching routes:', err);
     } finally {
       setLoading(false);
     }
   };
 
   const fetchStopImages = async () => {
     try {
       const { data: galleryData } = await supabase
         .from('galeria_maneiro')
         .select('*');
 
       if (galleryData) {
         const imageMap: Record<string, { imageUrl: string; description: string }> = {};
         galleryData.forEach(item => {
           if (item.bus_stop_ids && item.bus_stop_ids.length > 0) {
             item.bus_stop_ids.forEach((stopId: string) => {
               imageMap[stopId] = {
                 imageUrl: item.imagen_url || '',
                 description: item.descripcion || ''
               };
             });
           }
         });
         setStopImages(imageMap);
       }
     } catch (err) {
       console.error('Error fetching stop images:', err);
     }
   };
 
   const handleRouteClick = (route: RouteWithStops) => {
     setSelectedRoute(route);
     setSelectedStop(null);
   };
 
   const handleStopClick = (stop: Stop) => {
     setSelectedStop({
       ...stop,
       imageUrl: stopImages[stop.id]?.imageUrl,
       description: stopImages[stop.id]?.description
     });
   };
 
   const handleBack = () => {
     if (selectedStop) {
       setSelectedStop(null);
     } else if (selectedRoute) {
       setSelectedRoute(null);
     } else if (onBack) {
       onBack();
     }
   };
 
   if (loading) {
     return (
       <div className="p-4 pb-20">
         <div className="text-center py-8">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
           <p className="mt-2 text-muted-foreground">Cargando información...</p>
         </div>
       </div>
     );
   }
 
   // Vista de detalle de parada
   if (selectedStop) {
     return (
       <div className="p-4 pb-20 space-y-4">
         <Button 
           variant="ghost" 
           onClick={handleBack}
           className="mb-4"
         >
           <ChevronLeft size={20} className="mr-2" />
           Volver a {selectedRoute?.name}
         </Button>
 
         <Card className="overflow-hidden">
           {selectedStop.imageUrl ? (
             <img 
               src={selectedStop.imageUrl} 
               alt={selectedStop.name}
               className="w-full h-64 object-cover"
               onError={(e) => {
                 e.currentTarget.src = '/placeholder.svg';
               }}
             />
           ) : (
             <div className="w-full h-48 bg-muted flex items-center justify-center">
               <ImageIcon size={48} className="text-muted-foreground" />
             </div>
           )}
           <CardContent className="p-6">
             <div className="flex items-start justify-between mb-4">
               <h2 className="text-2xl font-bold">{selectedStop.name}</h2>
               {selectedRoute && (
                 <Badge 
                   style={{ backgroundColor: selectedRoute.color }}
                   className="text-white"
                 >
                   {selectedRoute.name}
                 </Badge>
               )}
             </div>
 
             <div className="space-y-4">
               <div className="flex items-center gap-2 text-muted-foreground">
                 <MapPin size={18} />
                 <span>
                   Lat: {selectedStop.latitude}, Lng: {selectedStop.longitude}
                 </span>
               </div>
 
               {selectedStop.stop_order && (
                 <div className="flex items-center gap-2 text-muted-foreground">
                   <Route size={18} />
                   <span>Parada #{selectedStop.stop_order} en la ruta</span>
                 </div>
               )}
 
               {selectedStop.description && (
                 <div className="mt-4">
                   <h4 className="font-semibold mb-2">Descripción</h4>
                   <p className="text-muted-foreground">{selectedStop.description}</p>
                 </div>
               )}
 
               {selectedRoute && (
                 <div className="mt-6 p-4 bg-muted rounded-lg">
                   <h4 className="font-semibold mb-3">Información de la Ruta</h4>
                   <div className="grid grid-cols-2 gap-3 text-sm">
                     <div className="flex items-center gap-2">
                       <Clock size={16} className="text-primary" />
                       <span>Frecuencia: {selectedRoute.frequency_minutes || 15} min</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <DollarSign size={16} className="text-primary" />
                       <span>Corta: Bs. {selectedRoute.short_route || 'N/A'}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Clock size={16} className="text-primary" />
                       <span>Salida: {selectedRoute.departure_time || '05:30'}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <DollarSign size={16} className="text-primary" />
                       <span>Larga: Bs. {selectedRoute.long_route || 'N/A'}</span>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   // Vista de paradas de una ruta
   if (selectedRoute) {
     return (
       <div className="p-4 pb-20 space-y-4">
         <Button 
           variant="ghost" 
           onClick={handleBack}
           className="mb-4"
         >
           <ChevronLeft size={20} className="mr-2" />
           Volver a Rutas
         </Button>
 
         <Card 
           className="p-4 border-l-4"
           style={{ borderLeftColor: selectedRoute.color }}
         >
           <div className="flex items-center gap-3 mb-2">
             <div 
               className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
               style={{ backgroundColor: selectedRoute.color }}
             >
               <Route size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold">{selectedRoute.name}</h2>
               <p className="text-sm text-muted-foreground">
                 {selectedRoute.stops.length} paradas
               </p>
             </div>
           </div>
           {selectedRoute.description && (
             <p className="text-muted-foreground text-sm mt-2">{selectedRoute.description}</p>
           )}
         </Card>
 
         <h3 className="text-lg font-semibold mt-6">Paradas de esta Ruta</h3>
 
         {selectedRoute.stops.length === 0 ? (
           <Card className="p-8 text-center">
             <MapPin size={48} className="mx-auto mb-4 text-muted-foreground" />
             <p className="text-muted-foreground">Esta ruta aún no tiene paradas registradas</p>
           </Card>
         ) : (
           <div className="space-y-3">
             {selectedRoute.stops.map((stop, index) => (
               <Card 
                 key={stop.id} 
                 className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                 onClick={() => handleStopClick(stop)}
               >
                 <div className="flex items-center gap-4">
                   <div 
                     className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                     style={{ backgroundColor: selectedRoute.color }}
                   >
                     {stop.stop_order || index + 1}
                   </div>
                   <div className="flex-1">
                     <h4 className="font-semibold">{stop.name}</h4>
                     <p className="text-xs text-muted-foreground">
                       {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                     </p>
                   </div>
                   {stopImages[stop.id] && (
                     <ImageIcon size={18} className="text-primary" />
                   )}
                 </div>
               </Card>
             ))}
           </div>
         )}
       </div>
     );
   }
 
   // Vista principal de rutas como carpetas
   return (
     <div className="p-4 pb-20 space-y-4">
       <div className="text-center mb-6">
         <h2 className="text-2xl font-bold text-foreground">Información por Rutas</h2>
         <p className="text-muted-foreground">Selecciona una ruta para ver sus paradas</p>
       </div>
 
       {routes.length === 0 ? (
         <Card className="p-8 text-center">
           <Route size={48} className="mx-auto mb-4 text-muted-foreground" />
           <h3 className="text-lg font-semibold mb-2">No hay rutas disponibles</h3>
           <p className="text-muted-foreground">
             Aún no hay rutas registradas en el sistema.
           </p>
         </Card>
       ) : (
         <div className="grid grid-cols-2 gap-4">
           {routes.map((route) => (
             <Card 
               key={route.id}
               className="p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2"
               style={{ borderColor: route.color }}
               onClick={() => handleRouteClick(route)}
             >
               <div 
                 className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mb-3 mx-auto"
                 style={{ backgroundColor: route.color }}
               >
                 <Route size={24} />
               </div>
               <div className="text-center">
                 <h3 className="font-bold text-sm mb-1">{route.name}</h3>
                 <Badge variant="secondary" className="text-xs">
                   {route.stops.length} paradas
                 </Badge>
               </div>
             </Card>
           ))}
         </div>
       )}
     </div>
   );
 };
 
 export default RouteInfoSection;