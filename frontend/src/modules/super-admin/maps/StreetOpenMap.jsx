import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import {
  Search,
  MapPin,
  Loader2,
  X,
} from "lucide-react";

import "leaflet/dist/leaflet.css";

/*
|--------------------------------------------------------------------------
| Fix Leaflet default marker
|--------------------------------------------------------------------------
*/

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/*
|--------------------------------------------------------------------------
| Default Nairobi location
|--------------------------------------------------------------------------
*/

const DEFAULT_POSITION = {
  lat: -1.286389,
  lng: 36.817223,
};

/*
|--------------------------------------------------------------------------
| Map click
|--------------------------------------------------------------------------
*/

function MapClick({ onPick }) {
  useMapEvents({
    click: async (e) => {
      const latitude = e.latlng.lat;
      const longitude = e.latlng.lng;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error("Reverse geocoding failed.");
        }

        const data = await res.json();

        onPick({
          latitude,
          longitude,
          address: data.display_name || "",
          addressDetails: data.address || {},
        });
      } catch (error) {
        console.error("Reverse geocoding failed:", error);

        onPick({
          latitude,
          longitude,
          address: "",
          addressDetails: {},
        });
      }
    },
  });

  return null;
}

/*
|--------------------------------------------------------------------------
| Recenter map
|--------------------------------------------------------------------------
*/

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (
      position &&
      Number.isFinite(position.lat) &&
      Number.isFinite(position.lng)
    ) {
      map.setView(
        [position.lat, position.lng],
        Math.max(map.getZoom(), 15),
        {
          animate: true,
        }
      );
    }
  }, [position, map]);

  return null;
}

/*
|--------------------------------------------------------------------------
| Search controller
|--------------------------------------------------------------------------
*/

function SearchLocation({
  onPick,
  searchValue,
  setSearchValue,
}) {
  const map = useMap();

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (event) => {
    event?.preventDefault();

    const query = searchValue.trim();

    if (!query) {
      setError("Enter a place or address to search.");
      return;
    }

    setSearching(true);
    setError("");

    try {
      /*
      |--------------------------------------------------------------------------
      | Restrict search to Kenya
      |--------------------------------------------------------------------------
      |
      | countrycodes=ke helps make results more relevant for your
      | Kenya estate-management application.
      |
      */

      const url =
        "https://nominatim.openstreetmap.org/search" +
        `?format=jsonv2` +
        `&q=${encodeURIComponent(query)}` +
        `&countrycodes=ke` +
        `&limit=5` +
        `&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Search request failed.");
      }

      const results = await response.json();

      if (!results || results.length === 0) {
        setError("Location not found. Try another search.");
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Use first/best result
      |--------------------------------------------------------------------------
      */

      const result = results[0];

      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error("Invalid coordinates returned.");
      }

      /*
      |--------------------------------------------------------------------------
      | Move map
      |--------------------------------------------------------------------------
      */

      map.setView(
        [latitude, longitude],
        17,
        {
          animate: true,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Send location to parent form
      |--------------------------------------------------------------------------
      */

      onPick({
        latitude,
        longitude,
        address: result.display_name || "",
        addressDetails: result.address || {},
      });
    } catch (error) {
      console.error("Location search failed:", error);

      setError(
        "Unable to search location. Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setError("");
  };

  return (
    <div className="absolute left-4 right-4 top-4 z-[1000]">
      <form
        onSubmit={handleSearch}
        className="mx-auto max-w-2xl"
      >
        <div className="relative flex items-center rounded-xl border border-gray-200 bg-white shadow-lg">
          <Search
            size={19}
            className="ml-4 shrink-0 text-gray-400"
          />

          <input
            type="text"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setError("");
            }}
            placeholder="Search place, street, area or building..."
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />

          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="mr-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Clear search"
            >
              <X size={17} />
            </button>
          )}

          <button
            type="submit"
            disabled={searching}
            className="mr-1.5 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Searching
              </>
            ) : (
              <>
                <Search size={16} />
                Search
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-600 shadow-md">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Main Street Open Map
|--------------------------------------------------------------------------
*/

export default function StreetOpenMap({
  latitude,
  longitude,
  onChange,
}) {
  const parsedLatitude = parseFloat(latitude);
  const parsedLongitude = parseFloat(longitude);

  const initialPosition =
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude)
      ? {
          lat: parsedLatitude,
          lng: parsedLongitude,
        }
      : DEFAULT_POSITION;

  const [position, setPosition] = useState(
    initialPosition
  );

  const [searchValue, setSearchValue] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Sync map with form coordinates
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      setPosition({
        lat,
        lng,
      });
    }
  }, [latitude, longitude]);

  /*
  |--------------------------------------------------------------------------
  | Handle selected location
  |--------------------------------------------------------------------------
  */

  const handlePick = (data) => {
    const newPosition = {
      lat: data.latitude,
      lng: data.longitude,
    };

    setPosition(newPosition);

    /*
    |--------------------------------------------------------------------------
    | Send everything back to PropertyForm
    |--------------------------------------------------------------------------
    */

    onChange?.({
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || "",
      addressDetails: data.addressDetails || {},
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <MapContainer
        center={[
          position.lat,
          position.lng,
        ]}
        zoom={13}
        scrollWheelZoom
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            position.lat,
            position.lng,
          ]}
          icon={markerIcon}
        />

        <SearchLocation
          onPick={handlePick}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />

        <MapClick onPick={handlePick} />

        <RecenterMap position={position} />
      </MapContainer>

      {/* Selected location indicator */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <MapPin size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800">
                Selected Location
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {position.lat.toFixed(7)},{" "}
                {position.lng.toFixed(7)}
              </p>

              <p className="mt-1 text-[11px] text-gray-400">
                Search for a place or click directly on
                the map to select the exact location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}