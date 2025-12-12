
import React from 'react';
import { Company } from '../types';
import { Lock, ArrowRight, Ticket, Tag } from 'lucide-react';

interface CompanyCardProps {
  company: Company;
  userIsPro: boolean;
  onOpenDetails: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, userIsPro, onOpenDetails }) => {
  const activeCoupons = company.Coupons?.filter(c => c.status !== 'paused') || [];
  const activeCouponsCount = activeCoupons.length;

  return (
    <div 
        onClick={() => onOpenDetails(company)}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden group cursor-pointer"
    >
      {/* Card Header with Logo */}
      <div className="h-24 bg-gradient-to-br from-slate-50 to-slate-100 relative border-b border-slate-100 group-hover:from-orange-50 group-hover:to-orange-100 transition-colors">
        <div className="absolute -bottom-6 left-6">
          <div className="h-16 w-16 rounded-xl border-4 border-white shadow-sm bg-white overflow-hidden">
            <img 
              src={company.Logo || `https://ui-avatars.com/api/?name=${company.Name}&background=random`} 
              alt={company.Name} 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            {company.IsPartner && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/80 backdrop-blur text-orange-800 shadow-sm border border-orange-100">
                Parceiro
            </span>
            )}
        </div>
      </div>

      {/* Card Body */}
      <div className="pt-8 px-6 pb-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{company.Name}</h3>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mt-1">{company.Category}</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-4 line-clamp-3 min-h-[40px]">
          {company.Description || "Sem descrição disponível."}
        </p>

        {/* Coupons Preview Section - Lógica Visual de Cupons */}
        <div className="mb-4 min-h-[50px]">
            {activeCouponsCount > 0 ? (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        <Ticket className="w-3 h-3 mr-1" />
                        {activeCouponsCount} Ofertas Disponíveis
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {activeCoupons.slice(0, 2).map((coupon, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100 truncate max-w-[140px]">
                                <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
                                {coupon.discountValue}
                            </span>
                        ))}
                        {activeCouponsCount > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">
                                +{activeCouponsCount - 2}
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full opacity-50">
                   <span className="text-xs text-slate-400 italic">Sem ofertas no momento</span>
                </div>
            )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 mt-auto">
          {userIsPro ? (
              <button 
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-slate-50 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300"
              >
                Ver Perfil e Ofertas
                <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button 
                disabled
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed"
              >
                <Lock className="w-4 h-4 mr-2" />
                Exclusivo PRO
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
