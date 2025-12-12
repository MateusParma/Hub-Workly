
import React, { useState } from 'react';
import { Company } from '../types';
import { X, Check, Ticket, MapPin, Globe, Phone, Mail, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import { addToWallet } from '../services/bubbleService'; // Updated import

interface CompanyDetailsModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({ company, isOpen, onClose }) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [localClaimed, setLocalClaimed] = useState<string[]>([]);

  if (!isOpen || !company) return null;

  const params = new URLSearchParams(window.location.search);
  const currentUserId = params.get('uid');

  const handleClaim = async (couponId: string) => {
      if (!currentUserId) {
          alert("Erro: ID da sua empresa não encontrado. Faça login novamente.");
          return;
      }
      setClaimingId(couponId);
      
      // Agora chamamos addToWallet (apenas vincula, não usa)
      const success = await addToWallet(couponId, currentUserId);
      
      if (success) {
          setLocalClaimed(prev => [...prev, couponId]);
      } else {
          alert("Não foi possível salvar na sua carteira. Verifique sua conexão.");
      }
      setClaimingId(null);
  };

  const hasCoupons = company.Coupons && company.Coupons.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full animate-fadeIn">
          
          {/* Header Banner - Orange Gradient */}
          <div className="h-32 bg-gradient-to-r from-orange-600 to-orange-500 relative">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <button 
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors z-10 backdrop-blur-md"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
          </div>

          <div className="px-6 sm:px-10 pb-10">
             {/* Info da Empresa */}
             <div className="relative -mt-12 mb-8 flex flex-col sm:flex-row sm:items-end gap-6">
                <div className="h-32 w-32 rounded-2xl border-4 border-white shadow-xl bg-white overflow-hidden shrink-0">
                    <img 
                        src={company.Logo || `https://ui-avatars.com/api/?name=${company.Name}&background=random`} 
                        alt={company.Name} 
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {company.IsPartner && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                                Parceiro Verificado
                            </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {company.Category}
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{company.Name}</h2>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 {/* Coluna Esquerda: Sobre e Contatos */}
                 <div className="lg:col-span-5 space-y-6">
                     <div>
                        <h4 className="font-bold text-slate-900 mb-2">Sobre</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {company.Description || "Sem descrição disponível."}
                        </p>
                     </div>
                     
                     <div className="space-y-3 pt-4 border-t border-slate-100">
                        {company.Website && (
                            <a href={company.Website} target="_blank" rel="noreferrer" className="flex items-center text-sm text-slate-600 hover:text-orange-600 transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-orange-50">
                                    <Globe className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
                                </div>
                                <span className="truncate flex-1">Website Oficial</span>
                                <ExternalLink className="w-3 h-3 opacity-50"/>
                            </a>
                        )}
                        {company.Phone && (
                            <div className="flex items-center text-sm text-slate-600 group">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="truncate">{company.Phone}</span>
                            </div>
                        )}
                        {company.Email && (
                            <div className="flex items-center text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="truncate">{company.Email}</span>
                            </div>
                        )}
                        {company.Address && (
                            <div className="flex items-center text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="truncate">{company.Address}</span>
                            </div>
                        )}
                     </div>
                 </div>

                 {/* Coluna Direita: Lista de Tickets (Cupons) */}
                 <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex items-center mb-6">
                        <Ticket className="w-5 h-5 text-orange-600 mr-2" />
                        <h3 className="text-lg font-bold text-slate-900">Benefícios & Ofertas</h3>
                    </div>

                    {hasCoupons ? (
                        <div className="space-y-4">
                            {company.Coupons?.filter(c => c.status !== 'paused').map((coupon) => {
                                // Verifica se já está na carteira (pelo carteira_cupons da Company ou estado local)
                                // NOTA: Aqui não verificamos se foi USADO, apenas se foi PEGO.
                                // Como não temos o objeto Company completo do usuário logado aqui,
                                // baseamos no localClaimed ou se tivéssemos a prop currentUser.
                                // Para simplificar visualmente nesta view pública:
                                const isAlreadyClaimed = localClaimed.includes(coupon.id);
                                
                                return (
                                    <div key={coupon.id} className="relative flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                                        {/* Detalhe Decorativo Lateral */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-orange-600"></div>
                                        
                                        {/* Left Side: Valor */}
                                        <div className="p-5 flex flex-col justify-center items-center text-center sm:w-32 bg-slate-50 border-b sm:border-b-0 sm:border-r border-dashed border-slate-300 relative">
                                             {/* Círculos recortados para efeito de ticket */}
                                            <div className="absolute -left-2 top-1/2 -mt-2 w-4 h-4 bg-slate-50 rounded-full"></div> 
                                            <div className="absolute -right-2 top-1/2 -mt-2 w-4 h-4 bg-slate-50 rounded-full border border-slate-200 z-10 hidden sm:block"></div>
                                            
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">OFF</span>
                                            <span className="text-2xl font-black text-slate-800">{coupon.discountValue}</span>
                                        </div>

                                        {/* Right Side: Info */}
                                        <div className="p-5 flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="text-center sm:text-left">
                                                <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">{coupon.description}</h4>
                                                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200">{coupon.code}</span>
                                                    {coupon.expiryDate && (
                                                        <span>Val: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full sm:w-auto">
                                                {isAlreadyClaimed ? (
                                                    <button disabled className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold text-xs uppercase tracking-wide cursor-default">
                                                        <Check className="w-3 h-3 mr-1.5" />
                                                        Na Carteira
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleClaim(coupon.id)}
                                                        disabled={claimingId === coupon.id || !currentUserId}
                                                        className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold text-sm transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                                                    >
                                                        {claimingId === coupon.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>Pegar Cupom <ArrowRight className="w-4 h-4 ml-2" /></>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-xl">
                            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Nenhuma oferta disponível no momento.</p>
                            <p className="text-xs text-slate-400 mt-1">Siga esta empresa para ser notificado de novidades.</p>
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
