import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ProductSearch from './components/ProductSearch';
import ListGenerator from './components/ListGenerator';
import Dashboard from './components/Dashboard';
import ProductComparator from './components/ProductComparator';
import StoreMap from './components/StoreMap';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import useShoppingStore from './store/useShoppingStore';
import './App.css';

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { isAuthenticated, loadUserFromStorage } = useShoppingStore();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const { selectedCountry, setSelectedCountry, user, isAuthenticated, logout, loadUserFromStorage, loadCartFromDB, loadCountryFromStorage } = useShoppingStore();
  const isLoginPage = location.pathname === '/login';

  // Cargar usuario y país del localStorage al iniciar
  useEffect(() => {
    loadUserFromStorage();
    loadCountryFromStorage();
  }, [loadUserFromStorage, loadCountryFromStorage]);

  // Cargar carrito cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadCartFromDB(user.id, selectedCountry);
    }
  }, [isAuthenticated, user?.id, selectedCountry, loadCartFromDB]);

  // Lista de países comunes (códigos ISO de Open Food Facts)
  const countries = [
    { code: 'all', name: '🌍 Todos' },
    { code: 'en:spain', name: '🇪🇸 España' },
    { code: 'en:france', name: '🇫🇷 Francia' },
    { code: 'en:italy', name: '🇮🇹 Italia' },
    { code: 'en:germany', name: '🇩🇪 Alemania' },
    { code: 'en:united-kingdom', name: '🇬🇧 Reino Unido' },
    { code: 'en:united-states', name: '🇺🇸 Estados Unidos' },
    { code: 'en:mexico', name: '🇲🇽 México' },
    { code: 'en:argentina', name: '🇦🇷 Argentina' },
    { code: 'en:colombia', name: '🇨🇴 Colombia' },
    { code: 'en:chile', name: '🇨🇱 Chile' },
    { code: 'en:portugal', name: '🇵🇹 Portugal' },
    { code: 'en:netherlands', name: '🇳🇱 Países Bajos' },
    { code: 'en:belgium', name: '🇧🇪 Bélgica' },
    { code: 'en:switzerland', name: '🇨🇭 Suiza' }
  ];

  return (
    <div className="app">
      {!isLoginPage && (
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="logo">
              🌱 LiquiVerde
            </Link>
            <div className="nav-right">
              {isAuthenticated ? (
                <>
                  <div className="nav-links">
                    <Link to="/">Búsqueda</Link>
                    <Link to="/list">Lista</Link>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/compare">Comparar</Link>
                    <Link to="/map">Mapa</Link>
                    <Link to="/profile">Perfil</Link>
                  </div>
                  <div className="user-info">
                    <span className="user-name">👤 {user?.name || 'Usuario'}</span>
                    <button onClick={logout} className="logout-button">Cerrar Sesión</button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="login-link">Iniciar Sesión</Link>
              )}
              <div className="country-selector-nav">
                <label htmlFor="country-select-nav">País:</label>
                <select
                  id="country-select-nav"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="country-select-nav"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProductSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list"
            element={
              <ProtectedRoute>
                <ListGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <ProductComparator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <StoreMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

