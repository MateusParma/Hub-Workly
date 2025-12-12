
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { processQrCode } from '../services/bubbleService';
import { Coupon } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const [scanResult, setScanResult] = useState<{valid: boolean, message: string, coupon?: Coupon} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let scanner: any = null;

    if (isOpen && !scanResult) {
      // Pequeno delay para garantir que o DOM renderizou a div 'reader'
      setTimeout(() => {
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          
          // Verifica se a lib carregou
          if ((window as any).Html5QrcodeScanner) {
              scanner = new (window as any).Html5QrcodeScanner("reader", config, /* verbose= */ false);
              
              scanner.render(
                async (decodedText: string) => {
                    if (isProcessing) return;
                    setIsProcessing(true);
                    
                    // Pausa o scanner visualmente
                    scanner.pause();
                    
                    const result = await processQrCode(decodedText);
                    setScanResult(result);
                    setIsProcessing(false);
                },
                (errorMessage: any) => {
                    // Ignora erros de leitura contínua
                }
              );
          } else {
              setScanResult({ valid: false, message: "Biblioteca de scanner não carregada. Recarregue a página." });
          }
      }, 300);
    }

    return () => {
      if (scanner) {
        try {
            scanner.clear().catch((error: any) => console.error("Failed to clear scanner", error));
        } catch (e) {}
      }
    };
  }, [isOpen]);

  const handleReset = () => {
      setScanResult(null);
      // Re-mount happens via useEffect when scanResult becomes null
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-black/80 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="relative inline-block align-bottom bg-slate-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-slate-700">
          
          <div className="flex justify-between items-center p-4 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white flex items-center">
                <Camera className="w-5 h-5 mr-2 text-blue-400" />
                Scanner de Validação
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {!scanResult ? (
                <div className="space-y-4">
                    <div id="reader" className="overflow-hidden rounded-xl border-2 border-slate-600 bg-black"></div>
                    <p className="text-sm text-center text-slate-400">
                        Aponte a câmera para o QR Code do cliente para validar o cupom.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center py-6 animate-fadeIn">
                    {scanResult.valid ? (
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                    )}
                    
                    <h4 className={`text-xl font-bold mb-2 ${scanResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {scanResult.valid ? 'Aprovado!' : 'Negado'}
                    </h4>
                    <p className="text-slate-300 mb-6 px-4">{scanResult.message}</p>

                    {scanResult.coupon && (
                        <div className="bg-slate-800 p-4 rounded-lg w-full mb-6 text-left border border-slate-700">
                            <p className="text-xs text-slate-500 uppercase font-bold">Cupom</p>
                            <p className="text-lg font-mono font-bold text-white">{scanResult.coupon.code}</p>
                            <p className="text-green-400 font-bold">{scanResult.coupon.discountValue}</p>
                        </div>
                    )}

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Fechar
                        </button>
                        <button 
                            onClick={handleReset}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
                        >
                            Ler Outro
                        </button>
                    </div>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
