import { useState } from 'react';
import { productAPI } from '../services/api';
import useShoppingStore from '../store/useShoppingStore';
import useBarcodeScanner from '../hooks/useBarcodeScanner';
import PriceDisplay from './common/PriceDisplay';
import ScoreBadge from './common/ScoreBadge';
import { PAGINATION } from '../utils/constants';
import './ProductSearch.css';

function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;

  const { addToWishlist, selectedCountry } = useShoppingStore();

  // Hook para el scanner de códigos de barras
  const {
    isScanning,
    scanError,
    burstMode,
    scannedItems,
    barcodeDetected,
    detectionBox,
    startScanning,
    stopScanning,
    toggleBurstMode,
    finishBurstScanning
  } = useBarcodeScanner(selectedCountry, handleProductScanned);

  /**
   * Callback cuando un producto es escaneado
   * @param {Object} product - Producto escaneado
   * @param {boolean} isBurst - Si es modo ráfaga
   */
  function handleProductScanned(product, isBurst) {
    if (isBurst) {
      // En modo ráfaga, agregar automáticamente a wishlist
      addToWishlist(product);
    } else {
      // En modo normal, mostrar el producto
      setProducts([product]);
      setTotalProducts(1);
      setCurrentPage(1);
    }
  }

  const handleSearch = async (e, page = 1) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await productAPI.search(searchQuery, page, pageSize, selectedCountry);
      console.log('Search result:', result);

      if (result.products && result.products.length > 0) {
        setProducts(result.products);
        setTotalProducts(result.total || result.products.length);
        setCurrentPage(page);
      } else {
        setError('No se encontraron productos. Intenta con otro término de búsqueda.');
        setProducts([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al buscar productos. Por favor, intenta de nuevo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalProducts / pageSize);
    if (currentPage < totalPages) {
      handleSearch(null, currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handleSearch(null, currentPage - 1);
    }
  };

  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    setError(null);
    setProducts([]);

    try {
      const product = await productAPI.getByBarcode(barcode, selectedCountry);
      setProducts([product]);
      setTotalProducts(1);
      setCurrentPage(1);
    } catch (err) {
      setError('Producto no encontrado. Verifica el código de barras.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishBurst = () => {
    const items = finishBurstScanning();
    setProducts(items);
    setTotalProducts(items.length);
    setCurrentPage(1);
  };

  const handleAddToWishlist = async (product) => {
    const { user } = useShoppingStore.getState();

    try {
      // Asegurar que el producto tenga ID en la BD antes de agregarlo
      // Esto permite que "Ver Alternativas" funcione correctamente
      let productWithId = product;
      
      if (!product.id && product.barcode) {
        try {
          // Asegurar que el producto exista en la BD
          const ensuredProduct = await productAPI.ensureExists(product);
          console.log('Product ensured in database:', ensuredProduct.id);
          
          // El producto de ensureExists viene con precio en EUR base
          // Mantener el precio convertido del producto original (de la búsqueda)
          // que ya tiene currency y currency_symbol correctos
          productWithId = {
            ...ensuredProduct,
            // Mantener precio, currency y currency_symbol del producto original
            // que ya están convertidos según el país seleccionado
            price: product.price,
            currency: product.currency || ensuredProduct.currency,
            currency_symbol: product.currency_symbol || ensuredProduct.currency_symbol
          };
          
          console.log('Product added to wishlist:', {
            name: productWithId.name,
            price: productWithId.price,
            currency: productWithId.currency,
            currency_symbol: productWithId.currency_symbol
          });
        } catch (err) {
          console.error('Error ensuring product exists:', err);
          // Continuar de todas formas, pero el producto puede no tener alternativas
        }
      }

      // Agregar a wishlist con el producto que tiene ID y precio convertido
      addToWishlist(productWithId);

      // Sincronizar con carrito si el usuario está logueado
      if (user && user.id && productWithId.id) {
        try {
          const { cartAPI } = await import('../services/api.js');
          await cartAPI.addItem(user.id, productWithId.id, productWithId.quantity || 1);
        } catch (error) {
          console.error('Error syncing to cart:', error);
        }
      }

      alert('Producto agregado a tu lista de compras');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Error al agregar producto. Por favor, intenta de nuevo.');
    }
  };



  return (
    <div className="product-search">
      <h1>🔍 Búsqueda de Productos</h1>

      <div className="search-section">
        <div className="search-card">
          <h2>Buscar por Nombre</h2>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Ej: Leche, Pan, Arroz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>

        <div className="search-card">
          <h2>Buscar por Código de Barras</h2>
          <form onSubmit={handleBarcodeSearch}>
            <input
              type="text"
              placeholder="Ingresa el código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <div className="barcode-buttons">
              <button type="submit" disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
              <button
                type="button"
                onClick={isScanning ? stopScanning : startScanning}
                className={isScanning ? 'scan-button-active' : 'scan-button'}
                disabled={loading}
              >
                {isScanning ? '🛑 Detener Escaneo' : '📷 Escanear con Cámara'}
              </button>
            </div>
          </form>

          {/* Burst mode toggle */}
          <div className="burst-mode-toggle">
            <label>
              <input
                type="checkbox"
                checked={burstMode}
                onChange={(e) => toggleBurstMode(e.target.checked)}
              />
              Modo Ráfaga (escanear múltiples productos)
            </label>
          </div>

          {/* Scanner modal */}
          {isScanning && (
            <div className="scanner-modal">
              <div className="scanner-content">
                <div className="scanner-header">
                  <h3>Escaneando... {burstMode && `(${scannedItems.length} productos)`}</h3>
                  <button onClick={stopScanning} className="close-scanner">✕</button>
                </div>

                <div id="scanner-container" className="scanner-container">
                  {/* Overlay visual para mostrar detección del código */}
                  {barcodeDetected && (
                    <div className="barcode-detection-overlay">
                      <div className="detection-indicator">
                        <div className="detection-pulse"></div>
                        <span className="detection-text">✓ Código detectado</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                    </div>
                  )}
                  {!barcodeDetected && (
                    <div className="scanner-guide">
                      <div className="guide-frame">
                        <div className="guide-corner top-left"></div>
                        <div className="guide-corner top-right"></div>
                        <div className="guide-corner bottom-left"></div>
                        <div className="guide-corner bottom-right"></div>
                      </div>
                      <p className="guide-text">Apunta el código de barras aquí</p>
                    </div>
                  )}
                </div>

                {burstMode && scannedItems.length > 0 && (
                  <div className="scanned-preview">
                    <h4>Escaneados recientemente:</h4>
                    <div className="scanned-list">
                      {scannedItems.slice(-3).map((item, idx) => (
                        <div key={idx} className="scanned-item-preview">
                          <span>✅ {item.name}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleFinishBurst} className="finish-scan-button">
                      Terminar y Ver ({scannedItems.length})
                    </button>
                  </div>
                )}

                {scanError && (
                  <div className="scan-error">{scanError}</div>
                )}
                <p className="scan-instructions">
                  Apunta la cámara al código de barras del producto
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {products.length > 0 && (
        <>
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id || product.barcode} className="product-card">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="product-image" />
                )}
                <div className="product-info">
                  <h3>{product.name}</h3>
                  {product.brand && <p className="brand">{product.brand}</p>}

                  {product.price && (
                    <PriceDisplay
                      price={product.price}
                      currency={product.currency}
                      currencySymbol={product.currency_symbol || '€'}
                      className="product-price"
                    />
                  )}

                  {product.sustainability_score && (
                    <ScoreBadge
                      score={product.sustainability_score}
                      showBreakdown={true}
                      size="medium"
                    />
                  )}

                  {product.carbon_footprint && (
                    <p className="carbon">
                      CO₂: {parseFloat(product.carbon_footprint).toFixed(2)} kg
                    </p>
                  )}

                  <button
                    onClick={() => handleAddToWishlist(product)}
                    className="add-button"
                  >
                    ➕ Agregar a Lista
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalProducts > pageSize && (
            <div className="pagination-controls">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
                className="pagination-btn"
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {currentPage} de {Math.ceil(totalProducts / pageSize)}
                <span className="total-products">
                  {' '}({totalProducts} productos en total)
                </span>
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= Math.ceil(totalProducts / pageSize) || loading}
                className="pagination-btn"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductSearch;
