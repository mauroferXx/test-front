import { useState, useEffect } from 'react';
import { purchaseAPI } from '../services/api';
import useShoppingStore from '../store/useShoppingStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { formatPrice, getCurrencySymbol } from '../utils/formatters';
import './Dashboard.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, selectedCountry, optimizedList } = useShoppingStore();

  useEffect(() => {
    if (user?.id) {
      loadPurchaseHistory();
    }
  }, [user?.id]);

  // Recargar cuando cambie optimizedList
  useEffect(() => {
    if (optimizedList && user?.id) {
      setTimeout(() => {
        loadPurchaseHistory();
      }, 500);
    }
  }, [optimizedList]);

  // Recargar cuando cambie el país
  useEffect(() => {
    if (user?.id) {
      loadPurchaseHistory();
    }
  }, [selectedCountry]);

  const handleFocus = () => {
    if (user?.id) {
      loadPurchaseHistory();
    }
  };

  // Usar utilidad compartida para símbolo de moneda
  const currencySymbol = getCurrencySymbol(selectedCountry);

  const loadPurchaseHistory = async () => {
    setLoading(true);
    try {
      const history = await purchaseAPI.getHistory(user.id);
      console.log('Purchase history loaded:', history);
      setPurchases(history || []);
    } catch (err) {
      console.error('Error loading purchase history:', err);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = purchases.reduce((sum, p) =>
    sum + (parseFloat(p.total_savings || 0)), 0
  );

  const totalCarbonReduced = purchases.reduce((sum, p) =>
    sum + (parseFloat(p.total_carbon || 0)), 0
  );

  const totalSpent = purchases.reduce((sum, p) =>
    sum + (parseFloat(p.total_price || 0)), 0
  );

  // Preparar datos para los gráficos
  const chartLabels = purchases.map(p =>
    new Date(p.purchase_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  ).reverse();

  const savingsData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Ahorro Acumulado',
        data: purchases.map(p => parseFloat(p.total_savings || 0)).reverse(),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const carbonData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'CO₂ Reducido (kg)',
        data: purchases.map(p => parseFloat(p.total_carbon || 0)).reverse(),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const efficiencyData = {
    labels: ['Ahorro', 'Gasto Real'],
    datasets: [
      {
        data: [totalSavings, totalSpent],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="dashboard">
      <h1>📊 Dashboard de Ahorros e Impacto</h1>

      <div className="dashboard-stats">
        <div className="stat-card primary">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Ahorro Total</h3>
            <p className="stat-value">{currencySymbol}{formatPrice(totalSavings, selectedCountry === 'en:chile' ? 'CLP' : 'EUR')}</p>
            <p className="stat-label">Ahorrado en todas tus compras</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">🌱</div>
          <div className="stat-content">
            <h3>CO₂ Reducido</h3>
            <p className="stat-value">{totalCarbonReduced.toFixed(2)} kg</p>
            <p className="stat-label">Impacto ambiental evitado</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>Total Gastado</h3>
            <p className="stat-value">{currencySymbol}{formatPrice(totalSpent, selectedCountry === 'en:chile' ? 'CLP' : 'EUR')}</p>
            <p className="stat-label">En {purchases.length} compras</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Eficiencia</h3>
            <p className="stat-value">
              {totalSpent > 0 ? ((totalSavings / totalSpent) * 100).toFixed(1) : 0}%
            </p>
            <p className="stat-label">Porcentaje de ahorro</p>
          </div>
        </div>
      </div>

      {purchases.length > 0 && (
        <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3>Tendencia de Ahorros</h3>
            <Line options={chartOptions} data={savingsData} />
          </div>
          <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3>Impacto Ambiental (CO₂)</h3>
            <Bar options={chartOptions} data={carbonData} />
          </div>
          <div className="chart-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3>Eficiencia de Gasto</h3>
            <div style={{ width: '300px', height: '300px' }}>
              <Pie data={efficiencyData} />
            </div>
          </div>
        </div>
      )}

      {optimizedList && (
        <div className="current-optimization">
          <h2>✨ Última Optimización</h2>
          <div className="optimization-stats">
            <div className="mini-stat">
              <span className="mini-label">Ahorro</span>
              <span className="mini-value">
                {optimizedList.selected.length > 0 && optimizedList.selected[0].currency_symbol
                  ? optimizedList.selected[0].currency_symbol
                  : currencySymbol}
                {formatPrice(optimizedList.savings.economic, optimizedList.selected.length > 0 ? optimizedList.selected[0].currency : 'EUR')}
              </span>
            </div>
            <div className="mini-stat">
              <span className="mini-label">CO₂ Reducido</span>
              <span className="mini-value">{optimizedList.savings.carbon.toFixed(2)} kg</span>
            </div>
            <div className="mini-stat">
              <span className="mini-label">Costo</span>
              <span className="mini-value">
                {optimizedList.selected.length > 0 && optimizedList.selected[0].currency_symbol
                  ? optimizedList.selected[0].currency_symbol
                  : currencySymbol}
                {formatPrice(optimizedList.totalCost, optimizedList.selected.length > 0 ? optimizedList.selected[0].currency : 'EUR')}
              </span>
            </div>
            <div className="mini-stat">
              <span className="mini-label">Score</span>
              <span className="mini-value">{optimizedList.totalScore.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="purchase-history">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>📜 Historial de Compras</h2>
          <button
            onClick={loadPurchaseHistory}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {loading ? 'Cargando...' : '🔄 Actualizar'}
          </button>
        </div>

        {purchases.length === 0 ? (
          <p>No hay compras registradas aún.</p>
        ) : (
          <div className="history-list">
            {purchases.map((purchase, idx) => (
              <div key={idx} className="history-item">
                <div className="purchase-header">
                  <span className="purchase-date">
                    {new Date(purchase.purchase_date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="purchase-total">
                    {currencySymbol}{formatPrice(purchase.total_price, selectedCountry === 'en:chile' ? 'CLP' : 'EUR')}
                  </span>
                </div>
                <div className="purchase-details">
                  <span>💰 Ahorro: {currencySymbol}{formatPrice(purchase.total_savings, selectedCountry === 'en:chile' ? 'CLP' : 'EUR')}</span>
                  <span>🌱 CO₂ reducido: {parseFloat(purchase.total_carbon || 0).toFixed(2)} kg</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
