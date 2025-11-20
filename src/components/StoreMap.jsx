import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import './StoreMap.css';

// Fix para iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icono personalizado para el usuario
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para centrar el mapa
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function StoreMap() {
  // Coordenadas de ejemplo (en producción, estas vendrían de una API de tiendas)
  const stores = [
    {
      id: 1,
      name: 'Supermercado Eco',
      address: 'Calle Sostenible 123',
      lat: 40.4168,
      lng: -3.7038,
      rating: 4.5,
      bestPrices: true
    },
    {
      id: 2,
      name: 'Tienda Verde',
      address: 'Avenida Ecológica 45',
      lat: 40.4178,
      lng: -3.7138,
      rating: 4.2,
      bestPrices: false
    },
    {
      id: 3,
      name: 'Mercado Local',
      address: 'Plaza Sostenible 7',
      lat: 40.4158,
      lng: -3.6938,
      rating: 4.7,
      bestPrices: true
    }
  ];

  // Coordenadas por defecto (Madrid, España)
  const defaultCenter = [40.4168, -3.7038];
  const defaultZoom = 13;

  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Calcular ruta usando OSRM
  const handleCalculateRoute = async (store) => {
    if (!userLocation) {
      alert('Necesitamos tu ubicación para calcular la ruta. Por favor permite el acceso a la ubicación.');
      return;
    }

    setLoadingRoute(true);
    setSelectedStore(store);

    try {
      // OSRM usa formato lng,lat
      const start = `${userLocation[1]},${userLocation[0]}`;
      const end = `${store.lng},${store.lat}`;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        // Invertir coordenadas de GeoJSON [lng, lat] a Leaflet [lat, lng]
        const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteData({
          coordinates,
          distance: (data.routes[0].distance / 1000).toFixed(1), // km
          duration: (data.routes[0].duration / 60).toFixed(0) // min
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      alert('Error al calcular la ruta');
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="store-map">
      <h1>🗺️ Mapa de Tiendas</h1>

      <div className="map-container">
        <div className="map-info">
          <h2>Tiendas Cercanas</h2>
          <p>Encuentra las mejores tiendas con productos sostenibles cerca de ti</p>

          {userLocation && (
            <div className="user-location-status">
              📍 Tu ubicación detectada
            </div>
          )}

          <div className="stores-list">
            {stores.map((store) => (
              <div key={store.id} className={`store-card ${selectedStore?.id === store.id ? 'selected' : ''}`}>
                <div className="store-header">
                  <h3>{store.name}</h3>
                  {store.bestPrices && (
                    <span className="badge best-prices">💰 Mejores Precios</span>
                  )}
                </div>
                <p className="store-address">{store.address}</p>
                <div className="store-rating">
                  {'⭐'.repeat(Math.floor(store.rating))} {store.rating}
                </div>
                <button
                  className="route-btn"
                  onClick={() => handleCalculateRoute(store)}
                  disabled={loadingRoute}
                >
                  {loadingRoute && selectedStore?.id === store.id ? 'Calculando...' : '🚗 Cómo llegar'}
                </button>
                {selectedStore?.id === store.id && routeData && (
                  <div className="route-info">
                    <p><strong>Distancia:</strong> {routeData.distance} km</p>
                    <p><strong>Tiempo:</strong> {routeData.duration} min</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="map-wrapper">
          <MapContainer
            center={mapCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          >
            <MapUpdater center={mapCenter} zoom={defaultZoom} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Marcador del usuario */}
            {userLocation && (
              <Marker position={userLocation} icon={userIcon}>
                <Popup>📍 Tu ubicación actual</Popup>
              </Marker>
            )}

            {/* Ruta */}
            {routeData && (
              <Polyline
                positions={routeData.coordinates}
                color="#667eea"
                weight={5}
                opacity={0.7}
              />
            )}

            {/* Tiendas */}
            {stores.map((store) => (
              <Marker key={store.id} position={[store.lat, store.lng]}>
                <Popup>
                  <div className="popup-content">
                    <h3>{store.name}</h3>
                    <p>{store.address}</p>
                    <p>Rating: {'⭐'.repeat(Math.floor(store.rating))} {store.rating}</p>
                    {store.bestPrices && (
                      <p className="best-prices-text">💰 Mejores Precios</p>
                    )}
                    <button
                      className="popup-route-btn"
                      onClick={() => handleCalculateRoute(store)}
                    >
                      🚗 Ir aquí
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="map-features">
        <div className="feature-card">
          <h3>📍 Ubicación</h3>
          <p>Encuentra tiendas cercanas a tu ubicación</p>
        </div>
        <div className="feature-card">
          <h3>💰 Precios</h3>
          <p>Compara precios entre diferentes tiendas</p>
        </div>
        <div className="feature-card">
          <h3>🌱 Sostenibilidad</h3>
          <p>Tiendas con productos ecológicos y sostenibles</p>
        </div>
      </div>
    </div>
  );
}

export default StoreMap;

