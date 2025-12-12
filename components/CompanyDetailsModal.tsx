
import React, { useState } from 'react';
import { Company } from '../types';
import { X, Copy, Check, Ticket, MapPin, Globe, Phone, Mail, ExternalLink, Download, ArrowRight } from 'lucide-react';
import { claimCoupon } from '../services/bubbleService';

interface CompanyDetailsModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({ company, isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [localClaimed, setLocalClaimed] = useState<string[]>([]);

  if (!isOpen || !company) return null;

  const params = new URLSearchParams(window.location.search);
  const currentUserId = params.get('uid');

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClaim = async (couponId: string, currentUtilizadores: string[] = []) => {
      if (!currentUserId) {
          alert("Erro: Não foi possível identificar sua empresa. Recarregue a página.");
          return;
      }
      setClaimingId(couponId);
      
      const success = await claimCoupon(couponId, currentUserId, currentUtilizadores);
      
      if (success) {
          setLocalClaimed(prev => [...prev, couponId]);
      } else {
          alert("Houve um erro ao salvar o cupom na carteira. Tente novamente.");
      }
      setClaimingId(null);
  };

  const hasCoupons = company.Coupons && company.Coupons.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full animate-fadeIn">
          
          {/* Header Image/Gradient */}
          <div className="h-40 bg-gradient-to-r from-slate-800 to-slate-900 relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <button 
                className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors z-10 backdrop-blur-md"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
          </div>

          <div className="px-6 sm:px-10 pb-10">
             {/* Logo Section */}
             <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="h-32 w-32 rounded-2xl border-4 border-white shadow-lg bg-white overflow-hidden shrink-0">
                    <img 
                        src={company.Logo || `https://ui-avatars.com/api/?name=${company.Name}&background=random`} 
                        alt={company.Name} 
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                        {company.IsPartner && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                                Oficial
                            </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {company.Category}
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">{company.Name}</h2>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Left Column: Info */}
                 <div className="lg:col-span-1 space-y-6">
                     <div className="prose prose-sm text-slate-600">
                         <p>{company.Description}</p>
                     </div>
                     
                     <div className="space-y-3 pt-4 border-t border-slate-100">
                        {company.Website && (
                            <a href={company.Website} target="_blank" rel="noreferrer" className="flex items-center text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                <Globe className="w-4 h-4 mr-3 text-slate-400" />
                                <span className="truncate">Website</span>
                                <ExternalLink className="w-3 h-3 ml-1 opacity-50"/>
                            </a>
                        )}
                        {company.Phone && (
                            <div className="flex items-center text-sm text-slate-600">
                                <Phone className="w-4 h-4 mr-3 text-slate-400" />
                                <span className="truncate">{company.Phone}</span>
                            </div>
                        )}
                        {company.Email && (
                            <div className="flex items-center text-sm text-slate-600">
                                <Mail className="w-4 h-4 mr-3 text-slate-400" />
                                <span className="truncate">{company.Email}</span>
                            </div>
                        )}
                        {company.Address && (
                            <div className="flex items-center text-sm text-slate-600">
                                <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                                <span className="truncate">{company.Address}</span>
                            </div>
                        )}
                     </div>
                 </div>

                 {/* Right Column: Coupons */}
                 <div className="lg:col-span-2">
                    <div className="flex items-center mb-6">
                        <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
                        <h3 className="text-lg font-bold text-slate-900">Ofertas Disponíveis</h3>
                    </div>

                    {hasCoupons ? (
                        <div className="space-y-4">
                            {company.Coupons?.map((coupon) => {
                                const isAlreadyClaimed = (currentUserId && coupon.utilizadores?.includes(currentUserId)) || localClaimed.includes(coupon.id);
                                
                                return (
                                    <div key={coupon.id} className="relative group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        {/* Visual 'Ticket' details */}
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                                        <div className="flex flex-col sm:flex-row">
                                            
                                            {/* Ticket Left: Discount */}
                                            <div className="p-5 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-dashed border-slate-200 min-w-[140px] bg-slate-50 text-center relative">
                                                <div className="absolute -left-1.5 top-1/2 -mt-2 w-3 h-4 bg-white rounded-r-full border-l-0 border border-slate-200"></div>
                                                <div className="absolute -right-1.5 top-1/2 -mt-2 w-3 h-4 bg-white rounded-l-full border-r-0 border border-slate-200 z-10 hidden sm:block"></div>
                                                
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Desconto</span>
                                                <span className="text-2xl font-black text-slate-900">{coupon.discountValue}</span>
                                            </div>

                                            {/* Ticket Right: Info & Action */}
                                            <div className="p-5 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 uppercase">
                                                            {coupon.code}
                                                        </span>
                                                        {coupon.expiryDate && (
                                                            <span className="text-[10px] text-red-400 font-medium flex items-center">
                                                                Expira em {new Date(coupon.expiryDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-lg mb-1">{coupon.description}</h4>
                                                    <p className="text-xs text-slate-400">Válido para apresentação na loja física.</p>
                                                </div>

                                                <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                                    {isAlreadyClaimed ? (
                                                        <button disabled className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold text-sm cursor-default">
                                                            <Check className="w-4 h-4 mr-2" />
                                                            Resgatado
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleClaim(coupon.id, coupon.utilizadores || [])}
                                                            disabled={claimingId === coupon.id || !currentUserId}
                                                            className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-slate-900/20"
                                                        >
                                                            {claimingId === coupon.id ? (
                                                                <span className="flex items-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> Processando...</span>
                                                            ) : (
                                                                <>Pegar Agora <ArrowRight className="w-4 h-4 ml-2" /></>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Esta empresa ainda não disponibilizou cupons.</p>
                        </div>
                    )}
                 </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsModal;
