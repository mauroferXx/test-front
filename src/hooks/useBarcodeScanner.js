import { useState, useRef, useEffect, useCallback } from 'react';
import { productAPI } from '../services/api';
import { SCANNER_CONFIG } from '../utils/constants';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

/**
 * Hook personalizado para gestionar el scanner de códigos de barras mejorado
 * Usa ZXing que es más moderno y compatible con bundlers modernos
 * Incluye detección visual del código de barras y captura automática
 */
export const useBarcodeScanner = (selectedCountry, onProductScanned) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [burstMode, setBurstMode] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);
    const [barcodeDetected, setBarcodeDetected] = useState(false);
    const [detectionBox, setDetectionBox] = useState(null);
    const lastScannedCode = useRef(null);
    const scanTimeoutRef = useRef(null);
    const handleScannedBarcodeRef = useRef(null);
    const codeReaderRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    /**
     * Captura una imagen del frame actual del video
     */
    const captureFrame = useCallback(() => {
        const video = videoRef.current || document.querySelector('#scanner-container video');
        if (!video) return null;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
        } catch (err) {
            console.error('Error capturing frame:', err);
            return null;
        }
    }, []);

    /**
     * Inicia el scanner de códigos de barras mejorado usando ZXing
     */
    const startScanning = useCallback(async () => {
        try {
            setScanError(null);
            setIsScanning(true);
            setBarcodeDetected(false);
            setDetectionBox(null);
            lastScannedCode.current = null;

            // Esperar a que React renderice el elemento en el DOM
            const container = await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50;
                
                const checkContainer = () => {
                    const element = document.getElementById('scanner-container');
                    if (element) {
                        resolve(element);
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        requestAnimationFrame(checkContainer);
                    } else {
                        reject(new Error('No se pudo encontrar el contenedor del scanner después de varios intentos'));
                    }
                };
                
                requestAnimationFrame(() => {
                    requestAnimationFrame(checkContainer);
                });
            });

            // Crear el lector de códigos ZXing
            const codeReader = new BrowserMultiFormatReader();
            codeReaderRef.current = codeReader;

            // Obtener lista de cámaras disponibles
            const videoInputDevices = await codeReader.listVideoInputDevices();
            
            // Seleccionar la cámara trasera si está disponible
            let selectedDeviceId = null;
            const backCamera = videoInputDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment')
            );
            
            if (backCamera) {
                selectedDeviceId = backCamera.deviceId;
            } else if (videoInputDevices.length > 0) {
                selectedDeviceId = videoInputDevices[0].deviceId;
            }

            // Crear elemento de video si no existe
            let videoElement = container.querySelector('video');
            if (!videoElement) {
                videoElement = document.createElement('video');
                videoElement.id = 'scanner-video';
                videoElement.setAttribute('autoplay', 'true');
                videoElement.setAttribute('playsinline', 'true');
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.objectFit = 'cover';
                container.appendChild(videoElement);
            }
            videoRef.current = videoElement;

            // Iniciar el escaneo continuo
            const scanContinuously = async () => {
                try {
                    const result = await codeReader.decodeOnceFromVideoDevice(
                        selectedDeviceId,
                        videoElement
                    );

                    const code = result.getText();
                    
                    // Evitar escaneos duplicados muy rápidos
                    if (lastScannedCode.current === code) {
                        // Continuar escaneando
                        if (isScanning) {
                            setTimeout(scanContinuously, 300);
                        }
                        return;
                    }

                    // Actualizar detección visual
                    setBarcodeDetected(true);
                    
                    // Obtener posición del código detectado
                    const points = result.getResultPoints();
                    if (points && points.length >= 2) {
                        const minX = Math.min(...points.map(p => p.getX()));
                        const maxX = Math.max(...points.map(p => p.getX()));
                        const minY = Math.min(...points.map(p => p.getY()));
                        const maxY = Math.max(...points.map(p => p.getY()));
                        
                        setDetectionBox({
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY
                        });
                    }

                    // Capturar imagen automáticamente
                    const capturedImage = captureFrame();

                    // Limpiar timeout anterior
                    if (scanTimeoutRef.current) {
                        clearTimeout(scanTimeoutRef.current);
                    }

                    // Procesar el código después de un pequeño delay
                    scanTimeoutRef.current = setTimeout(async () => {
                        lastScannedCode.current = code;
                        if (handleScannedBarcodeRef.current) {
                            await handleScannedBarcodeRef.current(code, capturedImage, {
                                result: result,
                                points: points
                            });
                        }
                        
                        // Continuar escaneando si está en modo ráfaga o si no se detuvo
                        if (isScanning && (burstMode || lastScannedCode.current === null)) {
                            setTimeout(() => {
                                if (isScanning) {
                                    scanContinuously();
                                }
                            }, burstMode ? (SCANNER_CONFIG.PAUSE_DURATION || 1500) : 1000);
                        }
                    }, 300);
                } catch (err) {
                    if (err instanceof NotFoundException) {
                        // No se encontró código, continuar escaneando
                        if (isScanning) {
                            setBarcodeDetected(false);
                            setDetectionBox(null);
                            requestAnimationFrame(scanContinuously);
                        }
                    } else {
                        console.error('Error durante el escaneo:', err);
                        if (isScanning) {
                            requestAnimationFrame(scanContinuously);
                        }
                    }
                }
            };

            // Iniciar el stream de video
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            streamRef.current = stream;
            videoElement.srcObject = stream;
            
            // Esperar a que el video esté listo
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve();
                };
            });

            // Iniciar escaneo continuo
            scanContinuously();

        } catch (err) {
            console.error('Error starting scanner:', err);
            setScanError('No se pudo acceder a la cámara. Verifica los permisos.');
            setIsScanning(false);
        }
    }, [captureFrame, burstMode, isScanning]);

    /**
     * Detiene el scanner de códigos de barras
     */
    const stopScanning = useCallback(async () => {
        try {
            // Limpiar timeout si existe
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = null;
            }

            // Detener el lector de códigos
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
                codeReaderRef.current = null;
            }

            // Detener el stream de video
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            // Limpiar el elemento de video
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current = null;
            }

        } catch (err) {
            console.error('Error stopping scanner:', err);
        } finally {
            setIsScanning(false);
            setBarcodeDetected(false);
            setDetectionBox(null);
            lastScannedCode.current = null;
        }
    }, []);

    /**
     * Maneja el código de barras escaneado con captura automática
     * @param {string} code - Código de barras escaneado
     * @param {string} capturedImage - Imagen capturada automáticamente
     * @param {Object} detectionData - Datos de detección
     */
    const handleScannedBarcode = useCallback(async (code, capturedImage = null, detectionData = null) => {
        console.log('Scanned barcode:', code);
        
        // Si no hay imagen capturada, intentar capturarla ahora
        if (!capturedImage) {
            capturedImage = captureFrame();
        }

        // Mostrar feedback visual de éxito
        setBarcodeDetected(true);

        try {
            const product = await productAPI.getByBarcode(code, selectedCountry);

            // Agregar información de la captura al producto
            const productWithImage = {
                ...product,
                capturedImage,
                scanTimestamp: new Date().toISOString(),
                barcode: code
            };

            if (burstMode) {
                setScannedItems(prev => [...prev, productWithImage]);
                if (onProductScanned) {
                    onProductScanned(productWithImage, true);
                }
                // Resetear detección después de un momento para permitir siguiente escaneo
                setTimeout(() => {
                    setBarcodeDetected(false);
                    setDetectionBox(null);
                    lastScannedCode.current = null;
                }, SCANNER_CONFIG.PAUSE_DURATION || 1500);
            } else {
                if (onProductScanned) {
                    onProductScanned(productWithImage, false);
                }
                // Mantener feedback visual por un momento antes de cerrar
                setTimeout(() => {
                    stopScanning();
                }, 1000);
            }
        } catch (err) {
            console.error('Error fetching scanned product:', err);
            setScanError('Producto no encontrado');
            setBarcodeDetected(false);
            setDetectionBox(null);
            if (!burstMode) {
                setTimeout(() => {
                    setScanError(null);
                    // Permitir intentar de nuevo después del error
                    lastScannedCode.current = null;
                }, 3000);
            } else {
                // En modo ráfaga, resetear después de un momento
                setTimeout(() => {
                    setScanError(null);
                    lastScannedCode.current = null;
                }, 2000);
            }
        }
    }, [burstMode, selectedCountry, onProductScanned, stopScanning, captureFrame]);

    // Actualizar la referencia cuando handleScannedBarcode esté disponible
    useEffect(() => {
        handleScannedBarcodeRef.current = handleScannedBarcode;
    }, [handleScannedBarcode]);

    /**
     * Finaliza el modo ráfaga y retorna los items escaneados
     */
    const finishBurstScanning = useCallback(() => {
        stopScanning();
        const items = [...scannedItems];
        setScannedItems([]);
        return items;
    }, [scannedItems, stopScanning]);

    /**
     * Alterna el modo ráfaga
     */
    const toggleBurstMode = useCallback((enabled) => {
        setBurstMode(enabled);
        if (!enabled) {
            setScannedItems([]);
        }
    }, []);

    // Cleanup en desmontaje
    useEffect(() => {
        return () => {
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
            stopScanning();
        };
    }, [stopScanning]);

    return {
        isScanning,
        scanError,
        burstMode,
        scannedItems,
        barcodeDetected,      // Indica si hay un código detectado visualmente
        detectionBox,         // Coordenadas del código detectado
        startScanning,
        stopScanning,
        toggleBurstMode,
        finishBurstScanning,
        setScanError
    };
};

export default useBarcodeScanner;
