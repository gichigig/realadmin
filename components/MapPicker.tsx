"use client";

import { useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix missing marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onLocationSelected }: { onLocationSelected: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng);
    },
  });
  return null;
}

function FlyToButton({ onLocationSelected }: { onLocationSelected: (latlng: L.LatLng) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);

    // Try browser geolocation first
    const tryBrowserGeo = (): Promise<L.LatLng | null> =>
      new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(new L.LatLng(pos.coords.latitude, pos.coords.longitude)),
          () => resolve(null),
          { timeout: 5000, enableHighAccuracy: true }
        );
      });

    // Try IP-based geolocation
    const tryIpGeo = async (): Promise<L.LatLng | null> => {
      try {
        const res = await fetch("https://ipinfo.io/json");
        const data = await res.json();
        if (data.loc) {
          const [lat, lng] = data.loc.split(",").map(Number);
          if (lat && lng) return new L.LatLng(lat, lng);
        }
      } catch {
        // ignore
      }
      return null;
    };

    const latlng = (await tryBrowserGeo()) || (await tryIpGeo());

    if (latlng) {
      onLocationSelected(latlng);
      map.flyTo(latlng, 15);
    } else {
      alert("Could not detect your location. Please click on the map to place the pin.");
    }

    setLoading(false);
  }, [map, onLocationSelected]);

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: "auto", zIndex: 1000 }}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClick();
        }}
        disabled={loading}
        className="mt-2 mr-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded shadow-md border border-gray-300 flex items-center gap-2 text-sm transition-colors"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
        {loading ? "Locating..." : "Use My Location"}
      </button>
    </div>
  );
}

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );

  const handleLocationSelected = useCallback((latlng: L.LatLng) => {
    setMarkerPos([latlng.lat, latlng.lng]);
    onChangeRef.current(latlng.lat, latlng.lng);
  }, []);

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
      <MapContainer
        center={[latitude || -1.2921, longitude || 36.8219]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onLocationSelected={handleLocationSelected} />
        <FlyToButton onLocationSelected={handleLocationSelected} />
        {markerPos && <Marker position={markerPos} />}
      </MapContainer>
    </div>
  );
}
