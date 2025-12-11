import React from 'react';
import { Company } from '../types';
import { X, Copy, Check, Ticket } from 'lucide-react';

interface CouponModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

const CouponModal: React.FC<CouponModalProps> = ({ company, isOpen, onClose }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen || !company) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <Ticket className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                  Cupons para {company.Name}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-500 mb-4">
                    Utilize os códigos abaixo no checkout ou apresente na loja parceira.
                  </p>
                  
                  <div className="space-y-3">
                    {company.Coupons?.map((coupon) => (
                      <div key={coupon.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700">{coupon.description}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">
                            {coupon.discountValue}
                          </span>
                        </div>
                        
                        <div className="flex items-center mt-2">
                          <div className="flex-1 bg-white border border-slate-300 border-dashed rounded px-3 py-2 font-mono text-center text-slate-800 tracking-wider font-bold">
                            {coupon.code}
                          </div>
                          <button
                            onClick={() => handleCopy(coupon.code, coupon.id)}
                            className="ml-3 inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="Copiar código"
                          >
                            {copiedId === coupon.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {copiedId === coupon.id && (
                           <span className="text-xs text-green-600 self-end">Copiado!</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-800 text-base font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
          
          <button 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponModal;