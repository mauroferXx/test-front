/**
 * Utilidades para formateo de valores
 * Compartido entre todos los componentes
 */

/**
 * Formatea un precio según la moneda especificada
 * @param {number|string} price - Precio a formatear
 * @param {string} currency - Código de moneda (EUR, USD, CLP, etc.)
 * @returns {string} - Precio formateado
 */
export const formatPrice = (price, currency) => {
    // Asegurarse de que price sea un número
    const numPrice = typeof price === 'string'
        ? parseFloat(price.replace(/[^\d.-]/g, '')) // Remover separadores de miles si existen
        : parseFloat(price);

    if (isNaN(numPrice)) {
        return '0';
    }

    // Monedas que no usan decimales
    const noDecimalCurrencies = ['CLP', 'COP', 'JPY', 'KRW', 'VND'];

    if (currency && noDecimalCurrencies.includes(currency)) {
        // Para monedas sin decimales, redondear y formatear sin decimales
        return Math.round(numPrice).toLocaleString('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    // Para otras monedas, mostrar con 2 decimales
    return numPrice.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Retorna un color basado en el score de sostenibilidad
 * @param {number} score - Score entre 0 y 1
 * @returns {string} - Color hexadecimal
 */
export const getScoreColor = (score) => {
    if (score >= 0.7) return '#4caf50'; // Verde
    if (score >= 0.5) return '#ff9800'; // Naranja
    return '#f44336'; // Rojo
};

/**
 * Obtiene el símbolo de moneda basado en el código de país
 * @param {string} countryCode - Código de país (en:spain, en:france, etc.)
 * @returns {string} - Símbolo de moneda
 */
export const getCurrencySymbol = (countryCode) => {
    const currencyMap = {
        'en:spain': '€',
        'en:france': '€',
        'en:italy': '€',
        'en:germany': '€',
        'en:portugal': '€',
        'en:netherlands': '€',
        'en:belgium': '€',
        'en:switzerland': 'CHF',
        'en:united-kingdom': '£',
        'en:united-states': '$',
        'en:mexico': '$',
        'en:argentina': '$',
        'en:colombia': '$',
        'en:chile': '$',
    };

    return currencyMap[countryCode] || '€';
};

/**
 * Obtiene el código de moneda basado en el código de país
 * @param {string} countryCode - Código de país (en:spain, en:france, etc.)
 * @returns {string} - Código de moneda (EUR, USD, etc.)
 */
export const getCurrencyCode = (countryCode) => {
    const currencyMap = {
        'en:spain': 'EUR',
        'en:france': 'EUR',
        'en:italy': 'EUR',
        'en:germany': 'EUR',
        'en:portugal': 'EUR',
        'en:netherlands': 'EUR',
        'en:belgium': 'EUR',
        'en:switzerland': 'CHF',
        'en:united-kingdom': 'GBP',
        'en:united-states': 'USD',
        'en:mexico': 'MXN',
        'en:argentina': 'ARS',
        'en:colombia': 'COP',
        'en:chile': 'CLP',
    };

    return currencyMap[countryCode] || 'EUR';
};

/**
 * Extrae un término de búsqueda significativo del nombre de un producto
 * @param {string} productName - Nombre del producto
 * @returns {string} - Término de búsqueda extraído
 */
export const extractSearchTerm = (productName) => {
    if (!productName) return 'Productos';

    // Lista de palabras a ignorar (artículos, preposiciones)
    const skipWords = ['el', 'la', 'los', 'las', 'de', 'del', 'con', 'sin', 'para', 'y', 'e', 'o', 'u'];

    // Dividir el nombre por espacios
    const words = productName.toLowerCase().split(' ');

    // Encontrar la primera palabra significativa (> 2 caracteres y no en skipWords)
    for (const word of words) {
        if (word.length > 2 && !skipWords.includes(word.toLowerCase())) {
            // Capitalizar primera letra
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
    }

    // Si no encontramos nada, usar la primera palabra
    return words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Productos';
};
