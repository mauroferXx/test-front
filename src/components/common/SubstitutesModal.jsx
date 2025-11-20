import React from 'react';
import PriceDisplay from './PriceDisplay';
import ScoreBadge from './ScoreBadge';
import { formatPrice } from '../../utils/formatters';
import './SubstitutesModal.css';

/**
 * Modal reutilizable para mostrar y seleccionar productos sustitutos
 * @param {Object} props
 * @param {boolean} props.show - Si el modal está visible
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.originalProduct - Producto original
 * @param {Array} props.substitutes - Lista de productos sustitutos
 * @param {boolean} props.loading - Estado de carga
 * @param {Function} props.onReplace - Callback al reemplazar producto
 */
const SubstitutesModal = ({
    show,
    onClose,
    originalProduct,
    substitutes = [],
    loading = false,
    onReplace
}) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Alternativas para {originalProduct?.name}</h3>
                    <button onClick={onClose} className="close-modal" aria-label="Cerrar">×</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <p className="loading-message">Buscando mejores alternativas...</p>
                    ) : substitutes.length > 0 ? (
                        <div className="comparison-container">
                            {/* Producto Original */}
                            <div className="original-product-card">
                                <h4>Producto Original</h4>
                                <div className="substitute-item original">
                                    <div className="sub-main-info">
                                        <div className="sub-product-details">
                                            {originalProduct?.image_url && (
                                                <img src={originalProduct.image_url} alt={originalProduct.name} className="sub-img" />
                                            )}
                                            <div className="sub-info">
                                                <h4>{originalProduct?.name}</h4>
                                                <div className="sub-details">
                                                    <PriceDisplay
                                                        price={originalProduct?.price}
                                                        currency={originalProduct?.currency}
                                                        currencySymbol={originalProduct?.currency_symbol || '€'}
                                                        className="substitute-price"
                                                    />
                                                    {originalProduct?.sustainability_score && (
                                                        <ScoreBadge score={originalProduct.sustainability_score} size="small" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {originalProduct?.sustainability_score?.breakdown && (
                                        <div className="score-breakdown">
                                            <div className="score-item">
                                                <span className="score-label">Económico</span>
                                                <span className="score-value">{(originalProduct.sustainability_score.breakdown.economic * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Ambiental</span>
                                                <span className="score-value">{(originalProduct.sustainability_score.breakdown.environmental * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Social</span>
                                                <span className="score-value">{(originalProduct.sustainability_score.breakdown.social * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lista de Alternativas */}
                            <div className="substitutes-section">
                                <h4>Mejores Alternativas</h4>
                                <div className="substitutes-list">
                                    {substitutes.map(sub => (
                                        <div key={sub.id || sub.barcode} className="substitute-item">
                                            <div className="sub-main-info">
                                                <div className="sub-product-details">
                                                    {sub.image_url && (
                                                        <img src={sub.image_url} alt={sub.name} className="sub-img" />
                                                    )}
                                                    <div className="sub-info">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <h4>{sub.name}</h4>
                                                            {sub.recommendationLabel && (
                                                                <span className={`recommendation-badge recommendation-${sub.recommendationType || 'balanced'}`}>
                                                                    {sub.recommendationType === 'economic' && '💰'}
                                                                    {sub.recommendationType === 'environmental' && '🌱'}
                                                                    {sub.recommendationType === 'social' && '🤝'}
                                                                    {sub.recommendationType === 'balanced' && '⚖️'}
                                                                    {' '}
                                                                    {sub.recommendationLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="sub-details">
                                                            <PriceDisplay
                                                                price={sub.price}
                                                                currency={sub.currency}
                                                                currencySymbol={sub.currency_symbol || '€'}
                                                                className="substitute-price"
                                                            />
                                                            {sub.sustainability_score && (
                                                                <ScoreBadge score={sub.sustainability_score} size="small" />
                                                            )}
                                                        </div>
                                                        {sub.improvement && (
                                                            <div className="improvement-badge">
                                                                Mejora: +{(sub.improvement * 100).toFixed(0)}%
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button onClick={() => onReplace(sub)} className="replace-btn">
                                                    Reemplazar
                                                </button>
                                            </div>

                                            {sub.sustainability_score?.breakdown && (
                                                <div className="score-breakdown">
                                                    <div className="score-item">
                                                        <span className="score-label">Económico</span>
                                                        <span className="score-value">{(sub.sustainability_score.breakdown.economic * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="score-item">
                                                        <span className="score-label">Ambiental</span>
                                                        <span className="score-value">{(sub.sustainability_score.breakdown.environmental * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="score-item">
                                                        <span className="score-label">Social</span>
                                                        <span className="score-value">{(sub.sustainability_score.breakdown.social * 100).toFixed(0)}%</span>
                                                    </div>
                                                    {sub.carbon_footprint && (
                                                        <div className="score-item">
                                                            <span className="score-label">CO₂</span>
                                                            <span className="score-value">{parseFloat(sub.carbon_footprint).toFixed(2)} kg</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="no-results">No se encontraron alternativas mejores para este producto.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubstitutesModal;
