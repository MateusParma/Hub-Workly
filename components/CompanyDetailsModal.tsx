import React from 'react';
import { Company } from '../types';
import { X, Copy, Check, Ticket, MapPin, Globe, Phone, Mail, Building, ExternalLink } from 'lucide-react';

interface CompanyDetailsModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({ company, isOpen, onClose }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen || !company) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasCoupons = company.Coupons && company.Coupons.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Overlay com Blur */}
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full animate-fadeIn">
          
          {/* Header Visual */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
             <button 
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors z-10"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
          </div>

          <div className="px-6 sm:px-8 pb-8">
             {/* Logo Flutuante */}
             <div className="relative -mt-12 mb-4 flex justify-between items-end">
                <div className="h-24 w-24 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden">
                    <img 
                        src={company.Logo || `https://ui-avatars.com/api/?name=${company.Name}&background=random`} 
                        alt={company.Name} 
                        className="h-full w-full object-cover"
                    />
                </div>
                {company.IsPartner && (
                    <span className="mb-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        Parceiro Verificado
                    </span>
                )}
             </div>

             {/* Informações Principais */}
             <div className="mb-6">
                 <h2 className="text-2xl font-bold text-slate-900">{company.Name}</h2>
                 <p className="text-sm font-medium text-blue-600 mb-3">{company.Category}</p>
                 <p className="text-slate-600 text-sm leading-relaxed">{company.Description}</p>
             </div>

             {/* Grid de Contato */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {company.Website && (
                    <a href={company.Website} target="_blank" rel="noreferrer" className="flex items-center text-sm text-slate-600 hover:text-blue-600 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm group-hover:shadow-md transition-shadow">
                            <Globe className="w-4 h-4" />
                        </div>
                        <span className="truncate flex-1">Website Oficial <ExternalLink className="w-3 h-3 inline ml-1 opacity-50"/></span>
                    </a>
                )}
                 {company.Phone && (
                    <div className="flex items-center text-sm text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                            <Phone className="w-4 h-4" />
                        </div>
                        <span className="truncate">{company.Phone}</span>
                    </div>
                )}
                 {company.Email && (
                    <div className="flex items-center text-sm text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                            <Mail className="w-4 h-4" />
                        </div>
                        <span className="truncate">{company.Email}</span>
                    </div>
                )}
                 {company.Address && (
                    <div className="flex items-center text-sm text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <span className="truncate max-w-[200px]" title={company.Address}>{company.Address}</span>
                    </div>
                )}
             </div>

             {/* Seção de Cupons */}
             <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <Ticket className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Cupons & Ofertas</h3>
                        <p className="text-xs text-slate-500">Benefícios exclusivos para parceiros</p>
                    </div>
                </div>

                {hasCoupons ? (
                    <div className="space-y-3">
                        {company.Coupons?.map((coupon) => (
                        <div key={coupon.id} className="border border-green-200 bg-green-50/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between transition-all hover:shadow-sm">
                            <div className="text-center sm:text-left">
                                <div className="font-bold text-green-800 text-lg mb-1">{coupon.discountValue}</div>
                                <div className="text-sm text-slate-600 font-medium leading-tight">{coupon.description}</div>
                                {coupon.expiryDate && (
                                    <div className="text-xs text-slate-400 mt-1">Válido até: {new Date(coupon.expiryDate).toLocaleDateString()}</div>
                                )}
                            </div>
                            
                            <div className="flex items-center bg-white border-2 border-green-100 rounded-lg p-1 pr-2 shadow-sm w-full sm:w-auto">
                                <div className="bg-slate-100 px-3 py-2 rounded-md font-mono font-bold text-slate-800 tracking-wider text-sm flex-1 text-center sm:text-left">
                                    {coupon.code}
                                </div>
                                <button
                                    onClick={() => handleCopy(coupon.code, coupon.id)}
                                    className="ml-2 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                                    title="Copiar código"
                                >
                                    {copiedId === coupon.id ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                    <Copy className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-500 text-sm">Esta empresa ainda não disponibilizou cupons no Hub.</p>
                    </div>
                )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsModal;