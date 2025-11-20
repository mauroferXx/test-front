import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import useShoppingStore from '../store/useShoppingStore';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser, loadUserFromStorage, isAuthenticated } = useShoppingStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar usuario del localStorage al montar
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Si ya está autenticado, redirigir a la página principal
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(email, password);
      setUser(response.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.quickLoginTest();
      setUser(response.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión rápido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🛒 Iniciar Sesión</h1>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="divider">
          <span>O</span>
        </div>

        <button 
          onClick={handleQuickLogin} 
          disabled={loading}
          className="quick-login-button"
        >
          🚀 Iniciar con Usuario TEST
        </button>

        <p className="login-hint">
          El usuario TEST te permite acceder rápidamente sin necesidad de registro
        </p>
      </div>
    </div>
  );
}

export default Login;

