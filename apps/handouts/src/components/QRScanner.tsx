import { useEffect, useRef, useState } from 'react';
import { Button } from '@ganger/ui';
// @ts-ignore - Quagga types not fully compatible
import Quagga from 'quagga';

interface QRScannerProps {
  onScanned: (data: string) => void;
  onCancel: () => void;
}

export function QRScanner({ onScanned, onCancel }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        if (!scannerRef.current) return;

        setIsScanning(true);
        setError(null);

        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: 480,
              height: 320,
              facingMode: "environment"
            }
          },
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "code_39_vin_reader",
              "codabar_reader",
              "upc_reader",
              "upc_e_reader",
              "i2of5_reader",
              "2of5_reader",
              "code_93_reader"
            ]
          },
          locate: true
        }, (err: any) => {
          if (err) {
            setError('Failed to initialize camera. Please check permissions.');
            setIsScanning(false);
            return;
          }
          
          Quagga.start();
        });

        Quagga.onDetected((data: any) => {
          const code = data.codeResult.code;
          if (code) {
            Quagga.stop();
            setIsScanning(false);
            onScanned(code);
          }
        });

      } catch (err) {
        setError('Camera access denied. Please allow camera permissions and try again.');
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      Quagga.stop();
      setIsScanning(false);
    };
  }, [onScanned]);

  const handleCancel = () => {
    Quagga.stop();
    setIsScanning(false);
    onCancel();
  };

  if (error) {
    return (
      <div className="text-center space-y-4 p-6">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={handleCancel} variant="outline">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Scan Patient QR Code</h3>
        <p className="text-gray-600">Position the QR code within the camera view</p>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden camera-overlay">
        <div ref={scannerRef} className="w-full h-80" />
        
        {isScanning && (
          <>
            {/* Scanning overlay */}
            <div className="absolute inset-0 border-2 border-handouts-primary rounded-lg" />
            
            {/* Scanning line animation */}
            <div className="scan-line" />
            
            {/* Corner guides */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-handouts-primary" />
            <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-handouts-primary" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-handouts-primary" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-handouts-primary" />
          </>
        )}
        
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <Button onClick={handleCancel} variant="outline" className="w-full">
          Cancel Scanning
        </Button>
        <p className="text-xs text-gray-500">
          Make sure the QR code is well-lit and clearly visible
        </p>
      </div>
    </div>
  );
}