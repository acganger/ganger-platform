import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@ganger/ui';

interface BarcodeScanOptions {
  onScan?: (barcode: string) => void;
  onError?: (error: Error) => void;
  continuous?: boolean;
  beepOnScan?: boolean;
  vibrateOnScan?: boolean;
}

export function useBarcodeScan(options: BarcodeScanOptions = {}) {
  const {
    onScan,
    onError,
    continuous = false,
    beepOnScan = true,
    vibrateOnScan = true
  } = options;
  
  const { addToast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Create beep sound
  const playBeep = useCallback(() => {
    if (!beepOnScan) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = 1000; // 1000 Hz beep
      gainNode.gain.value = 0.1; // Low volume
      
      oscillator.start();
      oscillator.stop(context.currentTime + 0.1); // 100ms beep
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  }, [beepOnScan]);

  // Vibrate device
  const vibrate = useCallback(() => {
    if (!vibrateOnScan) return;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(100); // 100ms vibration
    }
  }, [vibrateOnScan]);

  // Handle successful scan
  const handleScan = useCallback((barcode: string) => {
    setLastScanned(barcode);
    setScanCount(prev => prev + 1);
    playBeep();
    vibrate();
    
    if (onScan) {
      onScan(barcode);
    }
    
    // For continuous scanning, add a small delay to prevent double scans
    if (continuous) {
      setTimeout(() => {
        // Resume scanning
      }, 1000);
    } else {
      stopScanning();
    }
  }, [onScan, continuous, playBeep, vibrate]);

  // Start camera and scanning
  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Initialize barcode detection
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'code_93', 'codabar', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
        });
        
        const detectLoop = async () => {
          if (!isScanning || !videoRef.current) return;
          
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            
            if (barcodes.length > 0) {
              handleScan(barcodes[0].rawValue);
              
              if (!continuous) {
                return; // Stop detection loop
              }
            }
            
            // Continue detection loop
            requestAnimationFrame(detectLoop);
          } catch (error) {
            console.error('Barcode detection error:', error);
            requestAnimationFrame(detectLoop);
          }
        };
        
        detectLoop();
      } else {
        // Fallback for browsers without BarcodeDetector API
        addToast({
          title: 'Error',
          message: 'Your browser does not support barcode scanning. Please use Chrome on Android or Safari on iOS.',
          type: 'error'
        });
        if (onError) {
          onError(new Error('BarcodeDetector API not supported'));
        }
        stopScanning();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      addToast({
        title: 'Error',
        message: 'Failed to access camera. Please check permissions.',
        type: 'error'
      });
      if (onError) {
        onError(error as Error);
      }
      setIsScanning(false);
    }
  }, [continuous, handleScan, onError]);

  // Stop camera and scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Manual barcode input (fallback)
  const manualInput = useCallback((barcode: string) => {
    if (barcode.trim()) {
      handleScan(barcode.trim());
    }
  }, [handleScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopScanning]);

  return {
    isScanning,
    lastScanned,
    scanCount,
    startScanning,
    stopScanning,
    manualInput,
    videoRef
  };
}