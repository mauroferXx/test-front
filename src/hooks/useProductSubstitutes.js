import { useState, useCallback } from 'react';
import { listAPI, productAPI } from '../services/api';
import useShoppingStore from '../store/useShoppingStore';

/**
 * Hook personalizado para gestionar la lógica de productos sustitutos
 * Usado en ListGenerator y ProductComparator
 */
export const useProductSubstitutes = () => {
    const [substitutes, setSubstitutes] = useState([]);
    const [loadingSubstitutes, setLoadingSubstitutes] = useState(false);
    const [showSubstitutesModal, setShowSubstitutesModal] = useState(false);
    const [productToSubstitute, setProductToSubstitute] = useState(null);

    const { removeFromWishlist, addToWishlist, updateQuantity, user, selectedCountry } = useShoppingStore();

    /**
     * Obtiene sustitutos para un producto
     * Asegura que el producto tenga ID en la BD antes de buscar alternativas
     * @param {Object} product - Producto para el cual buscar sustitutos
     */
    const getSubstitutes = useCallback(async (product) => {
        setProductToSubstitute(product);
        setLoadingSubstitutes(true);
        setShowSubstitutesModal(true);

        try {
            let productWithId = product;
            
            // Si el producto no tiene ID pero tiene barcode, asegurar que exista en BD
            if (!product.id && product.barcode) {
                try {
                    productWithId = await productAPI.ensureExists(product);
                    console.log('Product ensured in database for alternatives:', productWithId.id);
                    // Actualizar el producto en el estado para que tenga el ID
                    setProductToSubstitute(productWithId);
                } catch (err) {
                    console.error('Error ensuring product exists:', err);
                    // Continuar con el producto original, pero puede fallar la búsqueda
                }
            }

            // Buscar sustitutos usando el ID (requerido por el backend)
            const productId = productWithId.id;
            if (!productId) {
                throw new Error('Product must have an ID to find alternatives');
            }

            // Pasar el país seleccionado para que el backend convierta los precios correctamente
            const result = await listAPI.getSubstitutes(productId, { country: selectedCountry });
            
            // Asegurar que el producto original también tenga precio convertido
            let originalProduct = result.original || productWithId;
            if (result.original && (!result.original.currency || result.original.currency === 'EUR')) {
                // Si el original viene en EUR, mantener el precio convertido del producto original de la wishlist
                originalProduct = {
                    ...result.original,
                    price: product.price || result.original.price,
                    currency: product.currency || result.original.currency,
                    currency_symbol: product.currency_symbol || result.original.currency_symbol
                };
            }
            
            setProductToSubstitute(originalProduct);
            setSubstitutes(result.substitutes || []);
        } catch (err) {
            console.error('Error fetching substitutes:', err);
            setSubstitutes([]);
            // Mostrar mensaje de error al usuario si es necesario
            if (err.response?.status === 404) {
                console.warn('Product not found in database. It may need to be saved first.');
            }
        } finally {
            setLoadingSubstitutes(false);
        }
    }, [selectedCountry]);

    /**
     * Reemplaza un producto con un sustituto
     * @param {Object} newProduct - Nuevo producto sustituto
     */
    const replaceProduct = useCallback(async (newProduct) => {
        if (!productToSubstitute) return;

        const oldQuantity = productToSubstitute.quantity || 1;
        const oldId = productToSubstitute.id || productToSubstitute.barcode;
        const userId = user?.id;

        try {
            // 1. Remover el producto original
            await removeFromWishlist(oldId, userId);

            // 2. Agregar el nuevo producto
            await addToWishlist(newProduct);

            // 3. Actualizar la cantidad para que coincida con el original
            if (oldQuantity > 1) {
                const newId = newProduct.id || newProduct.barcode;
                setTimeout(() => {
                    updateQuantity(newId, oldQuantity, userId);
                }, 100);
            }

            // 4. Cerrar modal
            closeModal();
        } catch (error) {
            console.error('Error replacing product:', error);
        }
    }, [productToSubstitute, user, removeFromWishlist, addToWishlist, updateQuantity]);

    /**
     * Cierra el modal de sustitutos
     */
    const closeModal = useCallback(() => {
        setShowSubstitutesModal(false);
        setProductToSubstitute(null);
        setSubstitutes([]);
    }, []);

    return {
        substitutes,
        loadingSubstitutes,
        showSubstitutesModal,
        productToSubstitute,
        getSubstitutes,
        replaceProduct,
        closeModal
    };
};

export default useProductSubstitutes;
