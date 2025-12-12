
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera, Loader2, Upload, FileImage, RefreshCw, Scan } from 'lucide-react';
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
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startCamera = async () => {
      setCameraError(null);
      
      const element = document.getElementById("reader");
      if (!element) return;

      try {
        // Limpa instância anterior se existir
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch(e) {}
            scannerRef.current.clear();
        }

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        // Configuração para evitar esticar e focar no centro
        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
        };

        await html5QrCode.start(
          { facingMode: "environment" }, // Preferência por câmera traseira
          config,
          (decodedText) => {
             // Pausa para processar
             html5QrCode.pause(true);
             handleCodeFound(decodedText);
          },
          (errorMessage) => { 
             // Ignora erros de frame vazio
          }
        );
        setIsCameraActive(true);

      } catch (err: any) {
        console.error("Erro ao iniciar câmera:", err);
        setCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
        setIsCameraActive(false);
      }
  };

  const stopCamera = async () => {
      if (scannerRef.current && isCameraActive) {
          try {
              await scannerRef.current.stop();
              scannerRef.current.clear();
          } catch (e) {
              console.error(e);
          }
          setIsCameraActive(false);
      }
  };

  // Encerra câmera ao fechar modal
  useEffect(() => {
    if (!isOpen) {
        stopCamera();
        setScanResult(null);
        setCameraError(null);
    }
  }, [isOpen]);

  const handleCodeFound = async (decodedText: string) => {
      if (isProcessing) return;
      setIsProcessing(true);
      
      try {
          // Passamos o ID da empresa atual (quem está escaneando)
          const result = await processQrCode(decodedText, currentUser?._id);
          setScanResult(result);
      } catch (err) {
          setScanResult({ valid: false, message: "Erro ao processar dados do QR." });
      } finally {
          setIsProcessing(false);
      }
  };

  const handleReset = () => {
      setScanResult(null);
      setIsProcessing(false);
      if (scannerRef.current) {
          scannerRef.current.resume();
      } else {
          startCamera();
      }
  };

  const handleClose = () => {
      stopCamera();
      onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      
      try {
          const html5QrCode = new Html5Qrcode("reader"); // Reutiliza ID ou cria temp
          const decodedText = await html5QrCode.scanFile(file, true);
          handleCodeFound(decodedText);
      } catch (err) {
          setScanResult({ valid: false, message: "Não foi possível ler um QR Code nesta imagem." });
          setIsProcessing(false);
      }
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

          <div className="p-4 bg-slate-900 min-h-[400px] flex flex-col items-center justify-center">
            
            {/* ESTADO 1: RESULTADO (SUCESSO/ERRO) */}
            {scanResult ? (
                <div className="flex flex-col items-center text-center py-4 w-full animate-fadeIn">
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
                    <p className="text-slate-300 mb-6 px-4 leading-relaxed border-b border-slate-800 pb-6 w-full">{scanResult.message}</p>

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

                    <div className="flex gap-3 w-full mt-4">
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
                    
                    {/* Viewport da Câmera */}
                    <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner mb-6">
                        {!isCameraActive && !isProcessing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <Camera className="w-16 h-16 mb-2 opacity-50" />
                                <p className="text-sm">Câmera desligada</p>
                            </div>
                        )}
                        
                        {/* Container do Html5Qrcode - Importante: ID fixo */}
                        <div id="reader" className="w-full h-full object-cover"></div>
                        
                        {isProcessing && (
                             <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 backdrop-blur-sm">
                                <div className="text-white flex flex-col items-center">
                                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
                                    <span className="font-bold">Processando...</span>
                                </div>
                             </div>
                        )}

                        {cameraError && (
                             <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10 p-4 text-center">
                                <div className="text-red-400">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                                    <p>{cameraError}</p>
                                </div>
                             </div>
                        )}
                    </div>

                    {/* Controles */}
                    {!isCameraActive ? (
                        <div className="flex gap-4 w-full">
                            <button 
                                onClick={startCamera}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center transition-all"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Ativar Câmera
                            </button>
                            
                            <label className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg cursor-pointer flex items-center justify-center transition-all border border-slate-700">
                                <Upload className="w-5 h-5 mr-2" />
                                Enviar Foto
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </div>
                    ) : (
                        <div className="w-full">
                            <p className="text-center text-slate-400 text-sm mb-4 animate-pulse">
                                Aponte a câmera para o código QR do cliente
                            </p>
                            <button 
                                onClick={stopCamera}
                                className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-900/50 rounded-xl font-bold transition-all"
                            >
                                Parar Câmera
                            </button>
                        </div>
                    )}

                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
