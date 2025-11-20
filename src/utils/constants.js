/**
 * Constantes compartidas en toda la aplicación
 */

// Monedas que no utilizan decimales
export const NO_DECIMAL_CURRENCIES = ['CLP', 'COP', 'JPY', 'KRW', 'VND'];

// Lista de países disponibles con códigos ISO de Open Food Facts
export const COUNTRIES = [
    { code: 'all', name: '🌍 Todos' },
    { code: 'en:spain', name: '🇪🇸 España' },
    { code: 'en:france', name: '🇫🇷 Francia' },
    { code: 'en:italy', name: '🇮🇹 Italia' },
    { code: 'en:germany', name: '🇩🇪 Alemania' },
    { code: 'en:united-kingdom', name: '🇬🇧 Reino Unido' },
    { code: 'en:united-states', name: '🇺🇸 Estados Unidos' },
    { code: 'en:mexico', name: '🇲🇽 México' },
    { code: 'en:argentina', name: '🇦🇷 Argentina' },
    { code: 'en:colombia', name: '🇨🇴 Colombia' },
    { code: 'en:chile', name: '🇨🇱 Chile' },
    { code: 'en:portugal', name: '🇵🇹 Portugal' },
    { code: 'en:netherlands', name: '🇳🇱 Países Bajos' },
    { code: 'en:belgium', name: '🇧🇪 Bélgica' },
    { code: 'en:switzerland', name: '🇨🇭 Suiza' }
];

// Umbrales para clasificación de scores de sostenibilidad
export const SCORE_THRESHOLDS = {
    HIGH: 0.7,    // >= 0.7 = Alto (verde)
    MEDIUM: 0.5,  // >= 0.5 = Medio (naranja)
    // < 0.5 = Bajo (rojo)
};

// Colores para scores de sostenibilidad
export const SCORE_COLORS = {
    HIGH: '#4caf50',    // Verde
    MEDIUM: '#ff9800',  // Naranja
    LOW: '#f44336'      // Rojo
};

// Configuración de paginación
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
};

// Configuración del scanner de códigos de barras
export const SCANNER_CONFIG = {
    FPS: 10,
    QRBOX: { width: 250, height: 250 },
    ASPECT_RATIO: 1.0,
    PAUSE_DURATION: 1500 // ms entre escaneos en modo ráfaga
};
