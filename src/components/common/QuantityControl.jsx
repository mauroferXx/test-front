import React from 'react';
import './QuantityControl.css';

/**
 * Componente reutilizable para controles de cantidad
 * @param {Object} props
 * @param {number} props.quantity - Cantidad actual
 * @param {Function} props.onChange - Callback al cambiar cantidad
 * @param {number} props.min - Cantidad mínima
 * @param {number} props.max - Cantidad máxima (opcional)
 * @param {boolean} props.disabled - Si está deshabilitado
 */
const QuantityControl = ({
    quantity = 1,
    onChange,
    min = 0,
    max = null,
    disabled = false
}) => {
    const handleDecrement = () => {
        const newQuantity = quantity - 1;
        if (newQuantity >= min) {
            onChange(newQuantity);
        }
    };

    const handleIncrement = () => {
        const newQuantity = quantity + 1;
        if (max === null || newQuantity <= max) {
            onChange(newQuantity);
        }
    };

    return (
        <div className="quantity-control">
            <button
                className="quantity-btn decrement"
                onClick={handleDecrement}
                disabled={disabled || quantity <= min}
                aria-label="Decrementar cantidad"
            >
                −
            </button>
            <span className="quantity-value">{quantity}</span>
            <button
                className="quantity-btn increment"
                onClick={handleIncrement}
                disabled={disabled || (max !== null && quantity >= max)}
                aria-label="Incrementar cantidad"
            >
                +
            </button>
        </div>
    );
};

export default QuantityControl;
