import { useState } from 'react';
import { productAPI, listAPI } from '../services/api';
import useShoppingStore from '../store/useShoppingStore';
import useProductSubstitutes from '../hooks/useProductSubstitutes';
import SubstitutesModal from './common/SubstitutesModal';
import PriceDisplay from './common/PriceDisplay';
import ScoreBadge from './common/ScoreBadge';
import { formatPrice, getScoreColor } from '../utils/formatters';
import './ProductComparator.css';

function ProductComparator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { selectedCountry } = useShoppingStore();

  // Hook para gestionar sustitutos de productos
  const {
    substitutes,
    loadingSubstitutes,
    showSubstitutesModal,
    productToSubstitute,
    getSubstitutes,
    replaceProduct,
    closeModal
  } = useProductSubstitutes();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const result = await productAPI.search(searchQuery, 1, 10, selectedCountry);
      setResults(result.products || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene un valor anidado de un objeto usando notación de punto
   */
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  };

  /**
   * Renderiza una fila de comparación entre productos
   */
  const compareField = (field, label, formatter = null) => {
    return (
      <tr>
        <td className="field-label">{label}</td>
        {results.slice(0, 2).map((product, idx) => {
          let value = getNestedValue(product, field);

          if (formatter) {
            value = formatter(value, product);
          } else if (value === null || value === undefined || value === '') {
            value = 'N/A';
          }

          return (
            <td key={idx} className="field-value">
              {value}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="product-comparator">
      <h1>🔄 Comparador de Productos</h1>

      {/* Modal de Sustitutos */}
      <SubstitutesModal
        show={showSubstitutesModal}
        onClose={closeModal}
        originalProduct={productToSubstitute}
        substitutes={substitutes}
        loading={loadingSubstitutes}
        onReplace={(product) => {
          replaceProduct(product);
          // Actualizar resultados después de reemplazar
          const updatedResults = results.map(r =>
            r.id === productToSubstitute?.id ? product : r
          );
          setResults(updatedResults);
        }}
      />

      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar productos para comparar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {results.length > 0 && (
        <>
          <div className="products-header">
            {results.slice(0, 2).map((product, idx) => (
              <div key={idx} className="product-header-card">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="product-img" />
                )}
                <h3>{product.name}</h3>
                <button
                  className="alternatives-btn"
                  onClick={() => getSubstitutes(product)}
                >
                  Ver Alternativas
                </button>
              </div>
            ))}
          </div>

          <table className="comparison-table">
            <thead>
              <tr>
                <th>Campo</th>
                {results.slice(0, 2).map((_, idx) => (
                  <th key={idx}>Producto {idx + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareField('name', 'Nombre')}
              {compareField('brand', 'Marca')}
              {compareField('price', 'Precio', (val, product) => (
                <PriceDisplay
                  price={val}
                  currency={product.currency}
                  currencySymbol={product.currency_symbol || '€'}
                />
              ))}
              {compareField('sustainability_score.total', 'Score Total', (val) => (
                val ? <span style={{ color: getScoreColor(val) }}>
                  {(val * 100).toFixed(0)}%
                </span> : 'N/A'
              ))}
              {compareField('sustainability_score.breakdown.economic', 'Score Económico', (val) => (
                val !== null && val !== undefined ? `${(val * 100).toFixed(0)}%` : 'N/A'
              ))}
              {compareField('sustainability_score.breakdown.environmental', 'Score Ambiental', (val) => (
                val !== null && val !== undefined ? `${(val * 100).toFixed(0)}%` : 'N/A'
              ))}
              {compareField('sustainability_score.breakdown.social', 'Score Social', (val) => (
                val !== null && val !== undefined ? `${(val * 100).toFixed(0)}%` : 'N/A'
              ))}
              {compareField('carbon_footprint', 'Huella de Carbono', (val) => (
                val ? `${parseFloat(val).toFixed(2)} kg` : 'N/A'
              ))}
              {compareField('category', 'Categoría', (val) => (
                val ? (typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : String(val)) : 'N/A'
              ))}
            </tbody>
          </table>
        </>
      )}

      {results.length === 0 && !loading && (
        <div className="empty-state">
          <p>Busca productos para comenzar a compararlos</p>
        </div>
      )}
    </div>
  );
}

export default ProductComparator;
