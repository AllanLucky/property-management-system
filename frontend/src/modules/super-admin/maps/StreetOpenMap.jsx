import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClick({ onPick }) {
  useMapEvents({
    click: async (e) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`,
          {
            headers: {
              "Accept": "application/json",
            },
          }
        );

        const data = await res.json();

        onPick({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          address: data.display_name || "",
        });
      } catch (err) {
        console.error("Reverse geocoding failed:", err);

        onPick({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          address: "",
        });
      }
    },
  });

  return null;
}

// FIX: force map recenter when position changes
function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position?.lat && position?.lng) {
      map.setView([position.lat, position.lng], map.getZoom(), {
        animate: true,
      });
    }
  }, [position, map]);

  return null;
}

export default function StreetOpenMap({
  latitude,
  longitude,
  onChange,
}) {
  const [position, setPosition] = useState({
    lat: latitude || -1.286389,
    lng: longitude || 36.817223,
  });

  useEffect(() => {
    if (latitude && longitude) {
      setPosition({
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
      });
    }
  }, [latitude, longitude]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[position.lat, position.lng]} icon={markerIcon} />

        <MapClick
          onPick={(data) => {
            const newPos = {
              lat: data.latitude,
              lng: data.longitude,
            };

            setPosition(newPos);
            onChange?.(data);
          }}
        />

        <RecenterMap position={position} />
      </MapContainer>
    </div>
  );
}