
import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera, Loader2, Upload, FileImage } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instância do Scanner para controle
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen && !scanResult && activeTab === 'camera') {
      const initScanner = setTimeout(() => {
          try {
              const element = document.getElementById("reader");
              if (!element) return;

              // Limpa anterior se existir
              if (scannerRef.current) {
                  try { scannerRef.current.clear(); } catch(e) {}
              }

              const scanner = new Html5QrcodeScanner(
                  "reader", 
                  { 
                      fps: 10, 
                      qrbox: { width: 250, height: 250 },
                      aspectRatio: 1.0,
                      showTorchButtonIfSupported: true
                  }, 
                  /* verbose= */ false
              );
              scannerRef.current = scanner;
              
              scanner.render(
                async (decodedText: string) => {
                    if (isProcessing) return;
                    handleCodeFound(decodedText, scanner);
                },
                (errorMessage: string) => { /* ignore */ }
              );
          } catch (err: any) {
              console.error("Erro ao iniciar câmera", err);
              setCameraError("Não foi possível acessar a câmera. Tente usar o upload de arquivo.");
              setActiveTab('file');
          }
      }, 500);

      return () => {
          clearTimeout(initScanner);
          if (scannerRef.current) {
            try { scannerRef.current.clear(); } catch (e) {}
          }
      };
    }
  }, [isOpen, scanResult, activeTab]);

  const handleCodeFound = async (decodedText: string, scannerInstance?: any) => {
      setIsProcessing(true);
      try {
          if (scannerInstance) {
              try { await scannerInstance.pause(true); } catch(e) {}
          }
          
          const result = await processQrCode(decodedText, currentUser?._id);
          setScanResult(result);
      } catch (err) {
          setScanResult({ valid: false, message: "Erro ao processar dados do QR." });
      } finally {
          setIsProcessing(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      const html5QrCode = new Html5Qrcode("file-reader-placeholder");
      
      try {
          const decodedText = await html5QrCode.scanFile(file, true);
          await handleCodeFound(decodedText);
      } catch (err) {
          setScanResult({ valid: false, message: "Não foi possível ler um QR Code nesta imagem." });
      } finally {
          setIsProcessing(false);
      }
  };

  const handleReset = () => {
      setScanResult(null);
      setCameraError(null);
      setIsProcessing(false);
      if (activeTab === 'camera') {
         // Force re-mount logic by existing useEffect
         if (scannerRef.current) {
             try { scannerRef.current.resume(); } catch(e) { /* Resume failed, maybe cleared, useEffect will handle */ }
         }
      }
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
                Validador de Cupons
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-700 p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 bg-slate-900 min-h-[350px] flex flex-col">
            
            {/* Tabs */}
            {!scanResult && (
                <div className="flex bg-slate-800 rounded-lg p-1 mb-4">
                    <button 
                        onClick={() => setActiveTab('camera')} 
                        className={`flex-1 flex items-center justify-center py-2 rounded text-sm font-bold transition-all ${activeTab === 'camera' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Camera className="w-4 h-4 mr-2" /> Câmera
                    </button>
                    <button 
                        onClick={() => setActiveTab('file')}
                        className={`flex-1 flex items-center justify-center py-2 rounded text-sm font-bold transition-all ${activeTab === 'file' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Upload className="w-4 h-4 mr-2" /> Upload
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center">
                {!scanResult ? (
                    <>
                        {/* CAMERA VIEW */}
                        {activeTab === 'camera' && (
                            <div className="space-y-4">
                                {cameraError ? (
                                    <div className="text-center text-red-400 p-4 border border-red-900/50 bg-red-900/10 rounded-lg">
                                        <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                                        <p>{cameraError}</p>
                                    </div>
                                ) : (
                                    <div id="reader" className="overflow-hidden rounded-xl border-2 border-blue-500/50 bg-black shadow-inner relative min-h-[250px]"></div>
                                )}
                                <p className="text-sm text-center text-slate-400">
                                    Aponte para o QR Code do cliente.
                                </p>
                            </div>
                        )}

                        {/* FILE VIEW */}
                        {activeTab === 'file' && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-xl hover:border-blue-500 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div id="file-reader-placeholder" className="hidden"></div>
                                <FileImage className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                                <p className="text-white font-bold mb-1">Clique para carregar imagem</p>
                                <p className="text-slate-500 text-sm">JPG, PNG com QR Code</p>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        )}

                        {isProcessing && (
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 rounded-xl backdrop-blur-sm">
                                <div className="text-white flex flex-col items-center">
                                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
                                    <span className="font-bold">Verificando...</span>
                                </div>
                             </div>
                        )}
                    </>
                ) : (
                    // RESULT VIEW
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
    </div>
  );
};

export default QRScannerModal;
