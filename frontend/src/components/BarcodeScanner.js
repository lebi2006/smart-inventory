import { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

export default function BarcodeScanner({ onDetected, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const detectedRef = useRef(false);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = () => {
    if (!scannerRef.current) return;

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          facingMode: 'environment',
          width: { min: 640 },
          height: { min: 480 },
        },
      },
      locator: {
        patchSize: 'medium',
        halfSample: true,
      },
      numOfWorkers: 2,
      decoder: {
        readers: [
          'ean_reader',
          'ean_8_reader',
          'code_128_reader',
          'code_39_reader',
          'upc_reader',
          'upc_e_reader',
        ],
      },
      locate: true,
    }, (err) => {
      if (err) {
        setError('Camera access denied or not available. Please allow camera access.');
        return;
      }
      Quagga.start();
      setScanning(true);
    });

    Quagga.onDetected((result) => {
      if (detectedRef.current) return;
      const code = result?.codeResult?.code;
      if (code && code.length > 3) {
        detectedRef.current = true;
        stopScanner();
        onDetected(code);
      }
    });
  };

  const stopScanner = () => {
    try {
      Quagga.stop();
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Scan Barcode</h3>
            <p className="text-xs text-gray-500">Point camera at a barcode</p>
          </div>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scanner View */}
        <div className="relative bg-black" style={{ height: '300px' }}>
          {error ? (
            <div className="flex items-center justify-center h-full p-6 text-center">
              <div>
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <p className="text-gray-400 text-xs">
                  Try entering the SKU manually instead
                </p>
              </div>
            </div>
          ) : (
            <>
              <div ref={scannerRef} className="w-full h-full" />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-56 h-32">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-indigo-400 border-t-4 border-l-4"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400"></div>
                  {/* Scan line animation */}
                  {scanning && (
                    <div className="absolute left-0 right-0 h-0.5 bg-indigo-400 opacity-75 animate-bounce" style={{ top: '50%' }}></div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Supports EAN, UPC, Code 128, Code 39 barcodes
          </p>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="mt-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
          >
            Cancel — Enter SKU Manually
          </button>
        </div>
      </div>
    </div>
  );
}