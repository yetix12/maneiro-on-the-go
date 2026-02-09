/// <reference types="google.maps" />

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Undo2, Redo2, MousePointer2, Move, Pencil, Save, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useMapData, RouteData } from '@/hooks/useMapData';

type EditorMode = 'select' | 'move-stop' | 'edit-waypoints' | 'add-waypoint';

interface HistoryEntry {
  type: 'move-stop' | 'add-waypoint' | 'move-waypoint' | 'delete-waypoint';
  data: any;
}

const MapEditorInner: React.FC = () => {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const waypointMarkersRef = useRef<google.maps.Marker[]>([]);

  const { routes, loading, refetch } = useMapData();
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [localWaypoints, setLocalWaypoints] = useState<{ id?: string; lat: number; lng: number; waypoint_order: number }[]>([]);
  const [localStops, setLocalStops] = useState<{ id: string; lat: number; lng: number; name: string; stop_order: number | null }[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 11.0047, lng: -63.8697 },
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#4FC3F7' }] },
        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#81C784' }] }
      ]
    });

    // Listen for clicks on map to add waypoints
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (editorMode === 'add-waypoint' && selectedRouteId && e.latLng) {
        const newWp = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          waypoint_order: localWaypoints.length
        };
        
        setLocalWaypoints(prev => [...prev, newWp]);
        pushHistory({
          type: 'add-waypoint',
          data: { waypoint: newWp }
        });
      }
    });

    mapInstanceRef.current = map;
  }, []);

  // Update map click handler when mode/state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (editorMode === 'add-waypoint' && selectedRouteId && e.latLng) {
        const newWp = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          waypoint_order: localWaypoints.length
        };
        
        setLocalWaypoints(prev => [...prev, newWp]);
        pushHistory({
          type: 'add-waypoint',
          data: { waypoint: newWp }
        });
      }
    });

    return () => google.maps.event.removeListener(listener);
  }, [editorMode, selectedRouteId, localWaypoints.length]);

  // Load route data when selected
  useEffect(() => {
    if (selectedRoute) {
      setLocalStops(selectedRoute.stops.map(s => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        name: s.name,
        stop_order: s.stop_order
      })));
      setLocalWaypoints(selectedRoute.waypoints.map(w => ({
        id: w.id,
        lat: w.lat,
        lng: w.lng,
        waypoint_order: w.waypoint_order
      })));
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [selectedRouteId, routes]);

  // Draw markers and polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedRoute) return;

    // Clear previous elements
    markersRef.current.forEach(m => m.setMap(null));
    polylinesRef.current.forEach(p => p.setMap(null));
    waypointMarkersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
    waypointMarkersRef.current = [];

    const routeColor = selectedRoute.color;

    // Draw stops
    localStops.forEach((stop) => {
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        title: stop.name,
        draggable: editorMode === 'move-stop',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="12" fill="white" stroke="${routeColor}" stroke-width="3"/>
              <circle cx="14" cy="14" r="6" fill="${routeColor}"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 14),
        },
      });

      if (editorMode === 'move-stop') {
        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const oldLat = stop.lat;
          const oldLng = stop.lng;
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();

          setLocalStops(prev => prev.map(s =>
            s.id === stop.id ? { ...s, lat: newLat, lng: newLng } : s
          ));
          pushHistory({
            type: 'move-stop',
            data: { stopId: stop.id, oldLat, oldLng, newLat, newLng }
          });
        });
      }

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding:4px;"><strong>${stop.name}</strong><br/><small>Orden: ${stop.stop_order ?? 'N/A'}</small></div>`
      });
      marker.addListener('click', () => infoWindow.open(map, marker));

      markersRef.current.push(marker);
    });

    // Draw waypoint markers
    if (editorMode === 'edit-waypoints' || editorMode === 'add-waypoint') {
      localWaypoints.forEach((wp, idx) => {
        const marker = new google.maps.Marker({
          position: { lat: wp.lat, lng: wp.lng },
          map,
          title: `Waypoint ${idx + 1}`,
          draggable: editorMode === 'edit-waypoints',
          icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="7" fill="${routeColor}" stroke="white" stroke-width="2" opacity="0.8"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(16, 16),
            anchor: new google.maps.Point(8, 8),
          },
        });

        if (editorMode === 'edit-waypoints') {
          marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            const oldLat = wp.lat;
            const oldLng = wp.lng;

            setLocalWaypoints(prev => prev.map((w, i) =>
              i === idx ? { ...w, lat: e.latLng!.lat(), lng: e.latLng!.lng() } : w
            ));
            pushHistory({
              type: 'move-waypoint',
              data: { index: idx, oldLat, oldLng, newLat: e.latLng!.lat(), newLng: e.latLng!.lng() }
            });
          });

          marker.addListener('rightclick', () => {
            setLocalWaypoints(prev => prev.filter((_, i) => i !== idx));
            pushHistory({
              type: 'delete-waypoint',
              data: { index: idx, waypoint: wp }
            });
          });
        }

        waypointMarkersRef.current.push(marker);
      });
    }

    // Draw polyline
    let pathPoints: { lat: number; lng: number }[] = [];
    if (localWaypoints.length > 0) {
      pathPoints = localWaypoints
        .sort((a, b) => a.waypoint_order - b.waypoint_order)
        .map(wp => ({ lat: wp.lat, lng: wp.lng }));
    } else {
      pathPoints = localStops.map(s => ({ lat: s.lat, lng: s.lng }));
    }

    if (pathPoints.length > 1) {
      const polyline = new google.maps.Polyline({
        path: pathPoints,
        geodesic: true,
        strokeColor: routeColor,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        editable: editorMode === 'edit-waypoints',
      });

      if (editorMode === 'edit-waypoints') {
        google.maps.event.addListener(polyline.getPath(), 'set_at', () => {
          const newPath = polyline.getPath().getArray().map((p, i) => ({
            ...localWaypoints[i],
            lat: p.lat(),
            lng: p.lng(),
            waypoint_order: i
          }));
          setLocalWaypoints(newPath);
        });

        google.maps.event.addListener(polyline.getPath(), 'insert_at', (idx: number) => {
          const path = polyline.getPath();
          const point = path.getAt(idx);
          const newWaypoints = [];
          for (let i = 0; i < path.getLength(); i++) {
            const p = path.getAt(i);
            newWaypoints.push({
              ...(localWaypoints[i] || {}),
              lat: p.lat(),
              lng: p.lng(),
              waypoint_order: i
            });
          }
          setLocalWaypoints(newWaypoints);
        });
      }

      polyline.setMap(map);
      polylinesRef.current.push(polyline);
    }

    // Also draw other routes faintly
    routes.forEach(route => {
      if (route.id === selectedRouteId) return;
      if (route.stops.length > 1) {
        const otherPolyline = new google.maps.Polyline({
          path: route.stops.map(s => ({ lat: s.lat, lng: s.lng })),
          strokeColor: route.color,
          strokeOpacity: 0.2,
          strokeWeight: 2,
        });
        otherPolyline.setMap(map);
        polylinesRef.current.push(otherPolyline);
      }
    });

  }, [selectedRoute, localStops, localWaypoints, editorMode, routes, selectedRouteId]);

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(entry);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    const entry = history[historyIndex];

    switch (entry.type) {
      case 'move-stop':
        setLocalStops(prev => prev.map(s =>
          s.id === entry.data.stopId ? { ...s, lat: entry.data.oldLat, lng: entry.data.oldLng } : s
        ));
        break;
      case 'add-waypoint':
        setLocalWaypoints(prev => prev.slice(0, -1));
        break;
      case 'move-waypoint':
        setLocalWaypoints(prev => prev.map((w, i) =>
          i === entry.data.index ? { ...w, lat: entry.data.oldLat, lng: entry.data.oldLng } : w
        ));
        break;
      case 'delete-waypoint':
        setLocalWaypoints(prev => {
          const newArr = [...prev];
          newArr.splice(entry.data.index, 0, entry.data.waypoint);
          return newArr;
        });
        break;
    }

    setHistoryIndex(prev => prev - 1);
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];

    switch (entry.type) {
      case 'move-stop':
        setLocalStops(prev => prev.map(s =>
          s.id === entry.data.stopId ? { ...s, lat: entry.data.newLat, lng: entry.data.newLng } : s
        ));
        break;
      case 'add-waypoint':
        setLocalWaypoints(prev => [...prev, entry.data.waypoint]);
        break;
      case 'move-waypoint':
        setLocalWaypoints(prev => prev.map((w, i) =>
          i === entry.data.index ? { ...w, lat: entry.data.newLat, lng: entry.data.newLng } : w
        ));
        break;
      case 'delete-waypoint':
        setLocalWaypoints(prev => prev.filter((_, i) => i !== entry.data.index));
        break;
    }

    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex]);

  const handleSave = async () => {
    if (!selectedRouteId) return;
    setSaving(true);

    try {
      // Save stop positions
      for (const stop of localStops) {
        await supabase
          .from('bus_stops')
          .update({ latitude: stop.lat, longitude: stop.lng })
          .eq('id', stop.id);
      }

      // Delete existing waypoints for this route
      await supabase
        .from('route_waypoints')
        .delete()
        .eq('route_id', selectedRouteId);

      // Insert new waypoints
      if (localWaypoints.length > 0) {
        const waypointsToInsert = localWaypoints.map((wp, idx) => ({
          route_id: selectedRouteId,
          latitude: wp.lat,
          longitude: wp.lng,
          waypoint_order: idx
        }));

        const { error } = await supabase
          .from('route_waypoints')
          .insert(waypointsToInsert);

        if (error) throw error;
      }

      toast({ title: "Éxito", description: "Cambios guardados correctamente" });
      setHistory([]);
      setHistoryIndex(-1);
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClearWaypoints = async () => {
    if (!confirm('¿Eliminar todos los waypoints de esta ruta? Se usará Google Directions automáticamente.')) return;
    setLocalWaypoints([]);
    pushHistory({ type: 'delete-waypoint', data: { index: -1, waypoint: null } });
  };

  const handleGenerateFromDirections = async () => {
    if (!selectedRoute || selectedRoute.stops.length < 2) {
      toast({ title: "Error", description: "La ruta debe tener al menos 2 paradas", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const service = new google.maps.DirectionsService();
      const stops = localStops;
      const origin = stops[0];
      const destination = stops[stops.length - 1];
      const intermediateStops = stops.slice(1, -1).map(stop => ({
        location: new google.maps.LatLng(stop.lat, stop.lng),
        stopover: true
      }));

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            waypoints: intermediateStops.slice(0, 23),
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (response, status) => {
            if (status === google.maps.DirectionsStatus.OK && response) {
              resolve(response);
            } else {
              reject(new Error(`Directions API: ${status}`));
            }
          }
        );
      });

      // Extract path points (sample every N points to avoid too many waypoints)
      const allPoints: { lat: number; lng: number }[] = [];
      result.routes[0].legs.forEach(leg => {
        leg.steps.forEach(step => {
          step.path.forEach(point => {
            allPoints.push({ lat: point.lat(), lng: point.lng() });
          });
        });
      });

      // Sample points to keep ~50-100 waypoints for manageable editing
      const sampleRate = Math.max(1, Math.floor(allPoints.length / 80));
      const sampledPoints = allPoints.filter((_, i) => i % sampleRate === 0 || i === allPoints.length - 1);

      const newWaypoints = sampledPoints.map((p, i) => ({
        lat: p.lat,
        lng: p.lng,
        waypoint_order: i
      }));

      setLocalWaypoints(newWaypoints);
      toast({ title: "Éxito", description: `Generados ${newWaypoints.length} waypoints desde Google Directions` });
    } catch (error: any) {
      toast({ title: "Error", description: `No se pudo generar la ruta: ${error.message}`, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edición de Mapeo</h1>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Route selector */}
          <div className="w-64">
            <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ruta..." />
              </SelectTrigger>
              <SelectContent>
                {routes.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: r.color }} />
                      {r.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Editor mode buttons */}
          <Button
            variant={editorMode === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditorMode('select')}
            title="Modo selección"
          >
            <MousePointer2 size={16} className="mr-1" /> Seleccionar
          </Button>
          <Button
            variant={editorMode === 'move-stop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditorMode('move-stop')}
            disabled={!selectedRouteId}
            title="Mover paradas"
          >
            <Move size={16} className="mr-1" /> Mover Paradas
          </Button>
          <Button
            variant={editorMode === 'edit-waypoints' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditorMode('edit-waypoints')}
            disabled={!selectedRouteId}
            title="Editar waypoints de la línea"
          >
            <Pencil size={16} className="mr-1" /> Editar Línea
          </Button>
          <Button
            variant={editorMode === 'add-waypoint' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditorMode('add-waypoint')}
            disabled={!selectedRouteId}
            title="Agregar waypoints haciendo clic"
          >
            <Plus size={16} className="mr-1" /> Agregar Punto
          </Button>

          <div className="h-8 w-px bg-border" />

          {/* Undo/Redo */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex < 0}
            title="Deshacer"
          >
            <Undo2 size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Rehacer"
          >
            <Redo2 size={16} />
          </Button>

          <div className="h-8 w-px bg-border" />

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateFromDirections}
            disabled={!selectedRouteId || saving}
            title="Generar ruta desde Google Directions"
          >
            🛣️ Auto-Generar Ruta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearWaypoints}
            disabled={!selectedRouteId || localWaypoints.length === 0}
          >
            <Trash2 size={16} className="mr-1" /> Limpiar Waypoints
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!selectedRouteId || saving}
          >
            <Save size={16} className="mr-1" /> {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>

        {/* Instructions */}
        {selectedRouteId && (
          <div className="mt-3 text-sm text-muted-foreground">
            {editorMode === 'select' && '🖱️ Modo selección: haz clic en paradas para ver información.'}
            {editorMode === 'move-stop' && '✋ Arrastra las paradas para moverlas a una nueva posición.'}
            {editorMode === 'edit-waypoints' && '✏️ Arrastra los puntos de la línea para ajustar la curva. Clic derecho para eliminar un punto.'}
            {editorMode === 'add-waypoint' && '➕ Haz clic en el mapa para agregar puntos a la línea de la ruta.'}
            <span className="ml-2 text-xs">
              ({localWaypoints.length} waypoints | {localStops.length} paradas)
            </span>
          </div>
        )}
      </Card>

      {/* Map */}
      <div ref={mapRef} className="w-full h-[calc(100vh-300px)] rounded-lg border" />
    </div>
  );
};

const MapEditor: React.FC = () => {
  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="animate-spin" size={32} />
            <span className="ml-2">Cargando mapa...</span>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-96">
            <p className="text-destructive">Error al cargar el mapa</p>
          </div>
        );
      case Status.SUCCESS:
        return <MapEditorInner />;
    }
  };

  return (
    <Wrapper
      apiKey="AIzaSyDGan9WbWLJW1guKw1T_uInSql4bZrGP9Y"
      render={render}
    />
  );
};

export default MapEditor;
