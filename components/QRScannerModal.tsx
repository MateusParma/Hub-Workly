
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { processQrCode } from '../services/bubbleService';
import { Coupon } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const [scanResult, setScanResult] = useState<{valid: boolean, message: string, coupon?: Coupon} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isOpen && !scanResult) {
      // Pequeno delay para garantir que o DOM renderizou a div 'reader'
      const initScanner = setTimeout(() => {
          try {
              // Limpa qualquer instância anterior se houver
              const element = document.getElementById("reader");
              if (!element) return;

              // Configuração do Scanner
              scanner = new Html5QrcodeScanner(
                  "reader", 
                  { 
                      fps: 10, 
                      qrbox: { width: 250, height: 250 },
                      aspectRatio: 1.0,
                      showTorchButtonIfSupported: true
                  }, 
                  /* verbose= */ false
              );
              
              scanner.render(
                async (decodedText: string) => {
                    if (isProcessing) return;
                    setIsProcessing(true);
                    
                    try {
                         // Tenta pausar para evitar leituras múltiplas
                        if (scanner) {
                           // O método pause pode não existir em todas as versões ou estados, try-catch protege
                           try { await scanner.pause(true); } catch(e) {} 
                        }

                        const result = await processQrCode(decodedText);
                        setScanResult(result);
                    } catch (err) {
                        console.error("Erro no processamento", err);
                        setScanResult({ valid: false, message: "Erro ao processar dados do QR." });
                    } finally {
                        setIsProcessing(false);
                    }
                },
                (errorMessage: string) => {
                    // Ignora erros de "código não encontrado" que acontecem a cada frame
                }
              );
          } catch (err: any) {
              console.error("Erro ao iniciar câmera", err);
              setCameraError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
          }
      }, 500);

      return () => {
          clearTimeout(initScanner);
          if (scanner) {
            try {
                scanner.clear().catch(e => console.warn("Erro ao limpar scanner", e));
            } catch (e) {}
          }
      };
    }
  }, [isOpen, scanResult]);

  const handleReset = () => {
      setScanResult(null);
      setCameraError(null);
      setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-black/90 transition-opacity backdrop-blur-sm" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="relative inline-block align-bottom bg-slate-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-slate-700">
          
          <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center">
                <Camera className="w-5 h-5 mr-2 text-blue-400" />
                Scanner de Validação
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700 p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 bg-slate-900 min-h-[300px] flex flex-col justify-center">
            {cameraError ? (
                <div className="text-center text-red-400 p-4 border border-red-900/50 bg-red-900/10 rounded-lg">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                    <p>{cameraError}</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 text-white rounded">Fechar</button>
                </div>
            ) : !scanResult ? (
                <div className="space-y-4">
                    {/* Container do Scanner - A biblioteca injeta o vídeo aqui */}
                    <div id="reader" className="overflow-hidden rounded-xl border-2 border-blue-500/50 bg-black shadow-inner relative min-h-[250px]"></div>
                    
                    <p className="text-sm text-center text-slate-400 px-4">
                        Aponte a câmera para o QR Code do cliente.
                        <br/><span className="text-xs text-slate-600">Certifique-se que o ambiente está iluminado.</span>
                    </p>
                    
                    {isProcessing && (
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="text-white flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <span>Verificando...</span>
                            </div>
                         </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center text-center py-2 animate-fadeIn">
                    {scanResult.valid ? (
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-900/50 animate-bounce-short">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-900/50">
                            <X className="w-12 h-12 text-white" />
                        </div>
                    )}
                    
                    <h4 className={`text-2xl font-bold mb-2 ${scanResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {scanResult.valid ? 'APROVADO' : 'RECUSADO'}
                    </h4>
                    <p className="text-slate-300 mb-6 px-4 leading-relaxed border-b border-slate-800 pb-6 w-full">{scanResult.message}</p>

                    {scanResult.coupon && (
                        <div className="bg-slate-800 p-5 rounded-xl w-full mb-6 text-left border border-slate-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <CheckCircle className="w-24 h-24 text-white" />
                            </div>
                            <p className="text-xs text-blue-400 uppercase font-bold tracking-wider mb-1">Cupom Validado</p>
                            <p className="text-2xl font-mono font-bold text-white mb-1">{scanResult.coupon.code}</p>
                            <p className="text-green-400 font-bold text-lg">{scanResult.coupon.discountValue} de Desconto</p>
                        </div>
                    )}

                    <div className="flex gap-3 w-full mt-auto">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                        >
                            Sair
                        </button>
                        <button 
                            onClick={handleReset}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/20"
                        >
                            Ler Próximo
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
