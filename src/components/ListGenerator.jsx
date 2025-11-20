import { useState } from 'react';
import { listAPI, purchaseAPI, productAPI } from '../services/api';
import useShoppingStore from '../store/useShoppingStore';
import useProductSubstitutes from '../hooks/useProductSubstitutes';
import SubstitutesModal from './common/SubstitutesModal';
import QuantityControl from './common/QuantityControl';
import { formatPrice, extractSearchTerm, getScoreColor, getCurrencySymbol, getCurrencyCode } from '../utils/formatters';
import './ListGenerator.css';

function ListGenerator() {
  const { wishlist, setOptimizedList, optimizedList, updateQuantity, removeFromWishlist, selectedCountry, user } = useShoppingStore();
  const [budget, setBudget] = useState('');
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const userId = user?.id || 1;
  
  // Obtener moneda del país seleccionado como fallback
  const defaultCurrencySymbol = getCurrencySymbol(selectedCountry || 'en:chile');
  const defaultCurrency = getCurrencyCode(selectedCountry || 'en:chile');

  const handleOptimize = async () => {
    if (!budget || !listName || wishlist.length === 0) {
      setError('Por favor completa todos los campos y agrega productos a tu lista');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear lista
      const list = await listAPI.create(userId, listName, parseFloat(budget));

      // Agregar productos a la lista
      let addedCount = 0;
      for (const product of wishlist) {
        let productId = product.id;

        if (!productId && product.barcode) {
          try {
            const existingProduct = await productAPI.getByBarcode(product.barcode, selectedCountry);
            if (existingProduct && existingProduct.id) {
              productId = existingProduct.id;
            } else {
              console.warn('Product found but has no ID:', product.name);
              continue;
            }
          } catch (err) {
            console.error('Error fetching product by barcode:', err);
            if (product.name) {
              try {
                const searchResult = await productAPI.search(product.name, 1, 5, selectedCountry);
                if (searchResult.products && searchResult.products.length > 0) {
                  const foundProduct = searchResult.products.find(p =>
                    (p.barcode && p.barcode === product.barcode) ||
                    (p.name && p.name.toLowerCase() === product.name.toLowerCase())
                  ) || searchResult.products[0];

                  if (foundProduct.id) {
                    productId = foundProduct.id;
                  }
                }
              } catch (searchErr) {
                console.error('Error searching product:', searchErr);
              }
            }
            if (!productId) {
              console.warn('Cannot add product to list - no ID available:', product.name);
              continue;
            }
          }
        }

        if (productId) {
          try {
            await listAPI.addItem(list.id, productId, product.quantity || 1);
            addedCount++;
          } catch (itemError) {
            console.error('Error adding item to list:', itemError);
          }
        } else {
          console.warn('Skipping product without ID or barcode:', product.name);
        }
      }

      if (addedCount === 0) {
        throw new Error('No se pudieron agregar productos a la lista. Asegúrate de que los productos tengan código de barras.');
      }

      // Optimizar lista (pasar país para conversión de precios)
      const optimized = await listAPI.optimize(list.id, {
        prioritizeSustainability: true
      }, selectedCountry);

      const responseData = optimized;
      const optimizedData = {
        ...responseData.optimized,
        original: responseData.original
      };
      setOptimizedList(optimizedData);

      // Registrar automáticamente como compra
      try {
        const items = optimizedData.selected.map(product => ({
          productId: product.id,
          quantity: product.quantity || 1,
          price: product.price || 0
        }));

        const purchase = await purchaseAPI.create(
          userId,
          list.id,
          items,
          optimizedData.totalCost,
          optimizedData.savings?.carbon || 0,
          optimizedData.savings?.economic || 0
        );

        console.log('Purchase created:', purchase);
        alert('✅ Lista optimizada y registrada en tu historial!');

        setTimeout(() => {
          // El dashboard se actualizará automáticamente
        }, 1000);
      } catch (purchaseError) {
        console.error('Error al registrar compra:', purchaseError);
      }
    } catch (err) {
      setError('Error al optimizar la lista. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalWishlistCost = wishlist.reduce((sum, p) =>
    sum + ((p.price || 0) * (p.quantity || 1)), 0
  );

  return (
    <div className="list-generator">
      <h1>🛒 Generador de Listas Optimizadas</h1>

      {/* Modal de Sustitutos - using shared component */}
      <SubstitutesModal
        show={showSubstitutesModal}
        onClose={closeModal}
        originalProduct={productToSubstitute}
        substitutes={substitutes}
        loading={loadingSubstitutes}
        onReplace={replaceProduct}
      />

      <div className="generator-section">
        <div className="wishlist-card">
          <h2>Tu Lista de Compras</h2>

          {wishlist.length === 0 ? (
            <p className="empty-message">
              Tu lista está vacía. Ve a la página de búsqueda para agregar productos.
            </p>
          ) : (
            <>
              <div className="wishlist-items">
                {(() => {
                  // Agrupar productos por categoría
                  const groupedByCategory = wishlist.reduce((groups, product) => {
                    const category = product.search_term || extractSearchTerm(product.name);
                    if (!groups[category]) {
                      groups[category] = [];
                    }
                    groups[category].push(product);
                    return groups;
                  }, {});

                  return Object.entries(groupedByCategory).map(([category, products]) => (
                    <div key={category} className="category-group">
                      <h3 className="category-header">{category}</h3>
                      {products.map((product) => (
                        <div key={product.id || product.barcode} className="wishlist-item">
                          {product.image_url && (
                            <img src={product.image_url} alt={product.name} className="sub-img" style={{ width: '50px', height: '50px', marginRight: '1rem' }} />
                          )}
                          <div className="item-info">
                            <h4>{product.name}</h4>
                            {product.price !== null && product.price !== undefined && (
                              <p>{(product.currency_symbol || defaultCurrencySymbol)}{formatPrice(product.price, product.currency || defaultCurrency)} c/u</p>
                            )}
                            <button
                              className="alternatives-btn"
                              onClick={() => getSubstitutes(product)}
                            >
                              ✨ Ver Alternativas
                            </button>
                          </div>
                          <div className="item-controls">
                            <QuantityControl
                              quantity={product.quantity || 1}
                              onChange={(newQuantity) => updateQuantity(product.id || product.barcode, newQuantity, userId)}
                              min={0}
                            />
                            <button
                              className="remove-btn"
                              onClick={() => removeFromWishlist(product.id || product.barcode, userId)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
              <div className="wishlist-total">
                Total: {wishlist.length > 0 && wishlist[0].currency_symbol ? wishlist[0].currency_symbol : defaultCurrencySymbol}{formatPrice(totalWishlistCost, wishlist.length > 0 && wishlist[0].currency ? wishlist[0].currency : defaultCurrency)}
              </div>
            </>
          )}
        </div>

        <div className="optimize-card">
          <h2>Configuración de Optimización</h2>

          <div className="form-group">
            <label>Nombre de la Lista</label>
            <input
              type="text"
              placeholder="Ej: Compra Semanal"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Presupuesto Máximo</label>
            <input
              type="number"
              placeholder={wishlist.length > 0 && wishlist[0].currency_symbol ? `Ej: 50000 (${wishlist[0].currency_symbol})` : `Ej: 50000 (${defaultCurrencySymbol})`}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          {budget && (
            <div className="budget-info">
              <p>Presupuesto: {wishlist.length > 0 && wishlist[0].currency_symbol ? wishlist[0].currency_symbol : defaultCurrencySymbol}{parseFloat(budget || 0).toFixed(2)}</p>
              <p>Lista actual: {wishlist.length > 0 && wishlist[0].currency_symbol ? wishlist[0].currency_symbol : defaultCurrencySymbol}{totalWishlistCost.toFixed(2)}</p>
              {totalWishlistCost > parseFloat(budget || 0) && (
                <p className="warning">
                  ⚠️ Tu lista excede el presupuesto
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={loading || wishlist.length === 0}
            className="optimize-button"
          >
            {loading ? 'Optimizando...' : '🚀 Optimizar Lista'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>

      {
        optimizedList && (
          <div className="optimized-results">
            <h2>✨ Resultado de la Optimización</h2>

            <div className="results-stats">
              <div className="stat-card">
                <h3>Ahorro Económico</h3>
                <p className="stat-value">
                  {optimizedList.selected.length > 0 && optimizedList.selected[0].currency_symbol
                    ? optimizedList.selected[0].currency_symbol
                    : defaultCurrencySymbol}{formatPrice(optimizedList.savings.economic, optimizedList.selected.length > 0 ? optimizedList.selected[0].currency : defaultCurrency)}
                </p>
                <p className="stat-percentage">
                  {optimizedList.savings.percentage}% de ahorro
                </p>
              </div>
              <div className="stat-card">
                <h3>Reducción de CO₂</h3>
                <p className="stat-value">
                  {optimizedList.savings.carbon.toFixed(2)} kg
                </p>
              </div>
              <div className="stat-card">
                <h3>Mejora de Score</h3>
                <p className="stat-value">
                  +{(optimizedList.totalScore - (optimizedList.original?.totalScore || 0)).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="comparison-view">
              <div className="comparison-column original">
                <h3>📋 Tu Lista Original</h3>
                <div className="items-list">
                  {optimizedList.original?.items.map((item, index) => (
                    <div key={`orig-${index}`} className="comparison-item original-item">
                      <div className="item-header">
                        <h4>{item.name}</h4>
                        <span className="price-tag">
                          {(item.currency_symbol || defaultCurrencySymbol)}{formatPrice(item.price, item.currency || defaultCurrency)}
                        </span>
                      </div>
                      {item.sustainability_score && (
                        <div className="item-score-badge" style={{ backgroundColor: getScoreColor(item.sustainability_score.total) }}>
                          Score: {(item.sustainability_score.total * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="column-total">
                  <p>Total: {(optimizedList.original?.items[0]?.currency_symbol || defaultCurrencySymbol)}{formatPrice(optimizedList.original?.totalCost || 0, optimizedList.original?.items[0]?.currency || defaultCurrency)}</p>
                </div>
              </div>

              <div className="comparison-arrow">
                ➜
              </div>

              <div className="comparison-column optimized">
                <h3>🚀 Lista Optimizada</h3>
                <div className="items-list">
                  {optimizedList.selected.map((item, index) => (
                    <div key={`opt-${index}`} className="comparison-item optimized-item">
                      <div className="item-header">
                        <h4>{item.name}</h4>
                        <span className="price-tag">
                          {(item.currency_symbol || defaultCurrencySymbol)}{formatPrice(item.price, item.currency || defaultCurrency)}
                        </span>
                      </div>
                      {item.sustainability_score && (
                        <div className="item-score-badge" style={{ backgroundColor: getScoreColor(item.sustainability_score.total) }}>
                          Score: {(item.sustainability_score.total * 100).toFixed(0)}%
                        </div>
                      )}
                      <div className="improvement-indicator">
                        Mejor Opción
                      </div>
                    </div>
                  ))}
                </div>
                <div className="column-total">
                  <p>Total: {(optimizedList.selected[0]?.currency_symbol || defaultCurrencySymbol)}{formatPrice(optimizedList.totalCost, optimizedList.selected[0]?.currency || defaultCurrency)}</p>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default ListGenerator;
