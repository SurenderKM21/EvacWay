'use client';

import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
} from '@react-google-maps/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Trash2, AlertTriangle, MapPin, Focus, Navigation } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 12.84,
  lng: 80.04,
};

const polygonOptions = {
  fillColor: '#ef4444',
  fillOpacity: 0.35,
  strokeColor: '#ef4444',
  strokeOpacity: 0.9,
  strokeWeight: 3,
  clickable: false,
};

export function GoogleMapsZoneSelector({
  coordinates,
  onCoordinatesChange,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });
  
  const [mapInstance, setMapInstance] = useState(null);
  const initialFocusDone = useRef(false);
  const initialCoordsAtMount = useRef(coordinates);

  const focusOnZone = useCallback(() => {
    if (!mapInstance || !coordinates || coordinates.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    
    mapInstance.fitBounds(bounds);
    
    const listener = window.google.maps.event.addListener(mapInstance, 'idle', () => {
      if (mapInstance.getZoom() > 20) mapInstance.setZoom(19);
      window.google.maps.event.removeListener(listener);
    });
  }, [mapInstance, coordinates]);

  const centerOnCurrentLocation = useCallback(() => {
    if (!mapInstance) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstance.panTo(pos);
          mapInstance.setZoom(18);
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [mapInstance]);

  useEffect(() => {
    // Determine initial focus strategy ONLY once when map loads
    if (mapInstance && !initialFocusDone.current) {
      if (initialCoordsAtMount.current && initialCoordsAtMount.current.length > 0) {
        // EDIT MODE: Focus on existing markers, ignore GPS
        const bounds = new window.google.maps.LatLngBounds();
        initialCoordsAtMount.current.forEach(coord => bounds.extend(coord));
        mapInstance.fitBounds(bounds);
      } else {
        // ADD MODE: Point to current location
        centerOnCurrentLocation();
      }
      initialFocusDone.current = true;
    }
  }, [mapInstance, centerOnCurrentLocation]);

  const handleMapClick = (event) => {
    if (coordinates.length < 15 && event.latLng) {
      const newCoord = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      onCoordinatesChange([...coordinates, newCoord]);
    }
  };

  const handleMarkerDragEnd = (index, event) => {
    if (event.latLng) {
      const newCoords = [...coordinates];
      newCoords[index] = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      onCoordinatesChange(newCoords);
    }
  };

  const clearCoordinates = () => {
    onCoordinatesChange([]);
  };

  if (loadError) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h3 className="font-bold text-lg text-destructive">Maps Error</h3>
            <p className="text-sm text-muted-foreground">Domain authorization required.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">
            {coordinates.length > 0 ? `${coordinates.length} points defined` : 'Click map to define zone'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={centerOnCurrentLocation}
            title="Locate Me"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          {coordinates.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={focusOnZone}
              title="Focus Zone"
            >
              <Focus className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearCoordinates}
            disabled={coordinates.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={18}
        onClick={handleMapClick}
        onLoad={(map) => setMapInstance(map)}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: false,
          mapTypeId: 'hybrid' 
        }}
      >
        {coordinates.map((pos, index) => (
          <Marker
            key={`marker-${index}-${pos.lat}-${pos.lng}`}
            position={pos}
            draggable={true}
            onDragEnd={(e) => handleMarkerDragEnd(index, e)}
            label={{
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        ))}

        {coordinates.length > 2 && (
          <Polygon paths={coordinates} options={polygonOptions} />
        )}
      </GoogleMap>
      
      <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
        Red markers show boundary points. Drag existing points to refine, or click empty space to add new ones.
      </p>
    </div>
  );
}
