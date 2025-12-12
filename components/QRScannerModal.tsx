
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera, Loader2, Upload, RefreshCw, Scan, Zap, ZapOff, Image as ImageIcon } from 'lucide-react';
import { processQrCode } from '../services/bubbleService';
import { Coupon, Company } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: Company | null;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [scanResult, setScanResult] = useState<{valid: boolean, message: string, coupon?: Coupon} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Input para Câmera Direta (Foto)
  const galleryInputRef = useRef<HTMLInputElement>(null); // Input para Galeria (Arquivo)

  const startCamera = async () => {
      setCameraError(null);
      
      // Garante que o elemento existe
      const element = document.getElementById("reader");
      if (!element) return;

      try {
        // Limpa instância anterior se existir
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch(e) {}
            try { await scannerRef.current.clear(); } catch(e) {}
        }

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        // Configuração Otimizada para Mobile
        const config = { 
            fps: 15, // Aumentado para leitura mais fluida
            qrbox: { width: 250, height: 250 }, // Apenas para guia visual, o scanner lê a tela toda
            aspectRatio: 1.0,
            disableFlip: false,
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
            videoConstraints: {
                facingMode: "environment",
                focusMode: "continuous" // Tenta forçar foco contínuo
            }
        };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          (decodedText) => {
             // SUCESSO AO LER
             handleCodeFound(decodedText);
          },
          (errorMessage) => { 
             // Ignora erros de frame vazio para não poluir o console
          }
        );

        setIsCameraActive(true);
        
        // Verifica suporte a lanterna
        try {
            const settings = html5QrCode.getRunningTrackCameraCapabilities();
            setHasTorch(!!settings.torch);
        } catch(e) {
            setHasTorch(false);
        }

      } catch (err: any) {
        console.error("Erro ao iniciar câmera:", err);
        setCameraError("Não foi possível acessar a câmera. Verifique as permissões do navegador ou tente usar a opção 'Foto'.");
        setIsCameraActive(false);
      }
  };

  const stopCamera = async () => {
      if (scannerRef.current) {
          try {
              if (isCameraActive) {
                  await scannerRef.current.stop();
              }
              scannerRef.current.clear();
          } catch (e) {
              console.warn("Erro ao parar câmera:", e);
          }
          setIsCameraActive(false);
          setTorchOn(false);
      }
  };

  const toggleTorch = async () => {
      if (scannerRef.current && hasTorch) {
          try {
              await scannerRef.current.applyVideoConstraints({
                  advanced: [{ torch: !torchOn }]
              });
              setTorchOn(!torchOn);
          } catch (err) {
              console.error("Erro ao alternar lanterna", err);
          }
      }
  };

  // Encerra câmera ao fechar modal
  useEffect(() => {
    if (!isOpen) {
        stopCamera();
        setScanResult(null);
        setCameraError(null);
        setIsProcessing(false);
    }
  }, [isOpen]);

  const handleCodeFound = async (decodedText: string) => {
      if (isProcessing) return;
      
      // Pausa o scanner visualmente e logicamente
      if (scannerRef.current && isCameraActive) {
          try { await scannerRef.current.pause(); } catch(e) {}
      }

      setIsProcessing(true);
      
      try {
          const result = await processQrCode(decodedText, currentUser?._id);
          setScanResult(result);
      } catch (err) {
          setScanResult({ valid: false, message: "Erro crítico ao processar." });
      } finally {
          setIsProcessing(false);
          // Nota: Não retomamos a câmera automaticamente para deixar o usuário ver o resultado
      }
  };

  const handleReset = async () => {
      setScanResult(null);
      setIsProcessing(false);
      setCameraError(null);
      
      if (scannerRef.current && isCameraActive) {
          try { 
              await scannerRef.current.resume(); 
          } catch(e) {
              // Se falhar o resume, reinicia
              startCamera();
          }
      } else {
          startCamera();
      }
  };

  const handleClose = () => {
      stopCamera();
      onClose();
  };

  const triggerCapture = () => {
      // Importante: Parar a câmera de stream antes de abrir o input de arquivo
      // Isso evita conflito de hardware em alguns Androids
      if (isCameraActive) {
          stopCamera().then(() => {
              fileInputRef.current?.click();
          });
      } else {
          fileInputRef.current?.click();
      }
  };

  const triggerGallery = () => {
      if (isCameraActive) {
          stopCamera().then(() => {
              galleryInputRef.current?.click();
          });
      } else {
          galleryInputRef.current?.click();
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setCameraError(null);
      
      try {
          const html5QrCode = new Html5Qrcode("reader");
          // scanFile(file, showImage) -> false para não renderizar a imagem no dom (mais rápido)
          const decodedText = await html5QrCode.scanFile(file, false);
          handleCodeFound(decodedText);
      } catch (err) {
          console.error(err);
          setScanResult({ 
              valid: false, 
              message: "Não foi possível identificar um QR Code nesta imagem. Tente uma foto mais clara ou aproxime mais." 
          });
          setIsProcessing(false);
      }
      // Limpa input para permitir selecionar a mesma foto se necessário
      e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-black/90 transition-opacity backdrop-blur-md" onClick={handleClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="relative inline-block align-bottom bg-slate-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-slate-700">
          
          <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center">
                <Scan className="w-5 h-5 mr-2 text-blue-400" />
                Validar Cupom
            </h3>
            <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700 p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 bg-slate-900 min-h-[450px] flex flex-col items-center justify-start pt-8">
            
            {/* ESTADO 1: RESULTADO (SUCESSO/ERRO) */}
            {scanResult ? (
                <div className="flex flex-col items-center text-center w-full animate-fadeIn mt-4">
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
                        {scanResult.valid ? 'VALIDADO!' : 'INVÁLIDO'}
                    </h4>
                    <p className="text-slate-300 mb-6 px-4 leading-relaxed border-b border-slate-800 pb-6 w-full text-sm">
                        {scanResult.message}
                    </p>

                    {scanResult.coupon && (
                        <div className="bg-slate-800 p-5 rounded-xl w-full mb-6 text-left border border-slate-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <CheckCircle className="w-24 h-24 text-white" />
                            </div>
                            <p className="text-xs text-blue-400 uppercase font-bold tracking-wider mb-1">Cupom</p>
                            <p className="text-2xl font-mono font-bold text-white mb-1">{scanResult.coupon.code}</p>
                            <p className="text-green-400 font-bold text-lg">{scanResult.coupon.discountValue}</p>
                        </div>
                    )}

                    <div className="flex gap-3 w-full mt-auto">
                        <button 
                            onClick={handleClose}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                        >
                            Fechar
                        </button>
                        <button 
                            onClick={handleReset}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" /> Ler Novo
                        </button>
                    </div>
                </div>
            ) : (
                // ESTADO 2: CAMERA / UPLOAD
                <div className="w-full flex flex-col items-center">
                    
                    {/* Viewport da Câmera com Efeito de Scan */}
                    <div className="relative w-full max-w-[300px] aspect-square bg-black rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl mb-6 group">
                        
                        {!isCameraActive && !isProcessing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-800">
                                <Camera className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm px-4 text-center">Inicie a câmera ou envie uma foto</p>
                            </div>
                        )}
                        
                        {/* Container do Html5Qrcode - Importante: ID fixo */}
                        <div id="reader" className="w-full h-full object-cover rounded-3xl overflow-hidden bg-black"></div>
                        
                        {/* Overlay de Scan Animation (Só aparece se câmera ativa) */}
                        {isCameraActive && !isProcessing && (
                            <>
                                {/* Cantos do Viewfinder */}
                                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg opacity-80"></div>
                                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg opacity-80"></div>
                                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg opacity-80"></div>
                                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg opacity-80"></div>
                                
                                {/* Linha Laser Animada */}
                                <div className="absolute left-0 right-0 h-0.5 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scan-line top-1/2"></div>
                            </>
                        )}

                        {isProcessing && (
                             <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 backdrop-blur-sm">
                                <div className="text-white flex flex-col items-center">
                                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
                                    <span className="font-bold">Processando...</span>
                                </div>
                             </div>
                        )}

                        {cameraError && (
                             <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-30 p-4 text-center">
                                <div className="text-red-400">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-sm">{cameraError}</p>
                                </div>
                             </div>
                        )}

                        {/* Botão Lanterna (Overlay) */}
                        {isCameraActive && hasTorch && (
                            <button 
                                onClick={toggleTorch}
                                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/60 p-3 rounded-full text-white hover:bg-slate-900 backdrop-blur-md border border-white/10 z-40"
                            >
                                {torchOn ? <ZapOff className="w-5 h-5 text-yellow-400" /> : <Zap className="w-5 h-5" />}
                            </button>
                        )}
                    </div>

                    {/* Controles Principais */}
                    {!isCameraActive ? (
                        <div className="grid grid-cols-2 gap-3 w-full max-w-[300px]">
                            <button 
                                onClick={startCamera}
                                className="col-span-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center transition-all text-sm"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Ler com Câmera
                            </button>
                            
                            <button 
                                onClick={triggerCapture}
                                className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg border border-slate-700 flex items-center justify-center transition-all text-sm"
                            >
                                <Camera className="w-5 h-5 mr-2 text-green-400" />
                                Foto
                            </button>
                            
                            <button 
                                onClick={triggerGallery}
                                className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg border border-slate-700 flex items-center justify-center transition-all text-sm"
                            >
                                <ImageIcon className="w-5 h-5 mr-2 text-yellow-400" />
                                Galeria
                            </button>
                        </div>
                    ) : (
                        <div className="w-full grid grid-cols-2 gap-3 max-w-[300px]">
                             {/* Instrução */}
                            <div className="col-span-2 text-center text-slate-400 text-xs mb-2 animate-pulse font-mono">
                                Centralize o QR Code na tela
                            </div>
                            
                            <button 
                                onClick={stopCamera}
                                className="col-span-1 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-900/50 rounded-xl font-bold transition-all text-sm"
                            >
                                Parar
                            </button>

                             {/* Botão Capturar Foto (Alternativa Rápida) */}
                            <button 
                                onClick={triggerCapture}
                                className="col-span-1 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-bold transition-all flex items-center justify-center text-sm"
                            >
                                <Camera className="w-4 h-4 mr-2" /> Foto
                            </button>
                        </div>
                    )}

                    {/* Hidden Input for Capture (Foto Instantânea) - Força Camera no Mobile */}
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        capture="environment"
                        className="hidden" 
                        onChange={handleFileUpload} 
                    />
                    
                    {/* Hidden Input for Gallery (Arquivo) - Permite Escolher */}
                    <input 
                        type="file" 
                        ref={galleryInputRef}
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                    />
                    
                    <style>{`
                        @keyframes scan-line {
                            0% { top: 5%; opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { top: 95%; opacity: 0; }
                        }
                        .animate-scan-line {
                            animation: scan-line 2s linear infinite;
                        }
                    `}</style>

                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
