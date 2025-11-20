import React from 'react';
import { formatPrice } from '../../utils/formatters';
import './PriceDisplay.css';

/**
 * Componente reutilizable para mostrar precios formateados
 * @param {Object} props
 * @param {number} props.price - Precio a mostrar
 * @param {string} props.currency - Código de moneda
 * @param {string} props.currencySymbol - Símbolo de moneda
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.label - Etiqueta opcional antes del precio
 */
const PriceDisplay = ({ price, currency, currencySymbol = '€', className = '', label = '' }) => {
    const formattedPrice = formatPrice(price, currency);

    return (
        <span className={`price-display ${className}`}>
            {label && <span className="price-label">{label} </span>}
            <span className="price-symbol">{currencySymbol}</span>
            <span className="price-amount">{formattedPrice}</span>
            {currency && currency !== 'EUR' && (
                <span className="currency-code"> {currency}</span>
            )}
        </span>
    );
};

export default PriceDisplay;
