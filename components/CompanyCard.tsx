
import React from 'react';
import { Company } from '../types';
import { Sparkles, Lock, ArrowRight, Ticket } from 'lucide-react';
import { generateCompanyInsight } from '../services/geminiService';

interface CompanyCardProps {
  company: Company;
  userIsPro: boolean;
  onOpenDetails: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, userIsPro, onOpenDetails }) => {
  const [insight, setInsight] = React.useState<string>("");
  const [isLoadingInsight, setIsLoadingInsight] = React.useState(false);

  const handleGenerateInsight = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingInsight(true);
    const text = await generateCompanyInsight(company.Name, company.Description);
    setInsight(text);
    setIsLoadingInsight(false);
  };

  const activeCouponsCount = company.Coupons?.filter(c => c.status !== 'paused').length || 0;

  return (
    <div 
        onClick={() => onOpenDetails(company)}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden group cursor-pointer"
    >
      {/* Card Header with Logo */}
      <div className="h-24 bg-gradient-to-br from-slate-50 to-slate-100 relative border-b border-slate-100 group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors">
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/80 backdrop-blur text-blue-800 shadow-sm border border-blue-100">
                Parceiro
            </span>
            )}
            {activeCouponsCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 shadow-sm border border-green-200 animate-pulse-slow">
                    <Ticket className="w-3 h-3 mr-1" />
                    {activeCouponsCount} {activeCouponsCount === 1 ? 'Oferta' : 'Ofertas'}
                </span>
            )}
        </div>
      </div>

      {/* Card Body */}
      <div className="pt-8 px-6 pb-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{company.Name}</h3>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mt-1">{company.Category}</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-4 line-clamp-3 min-h-[60px]">
          {company.Description || "Sem descrição disponível."}
        </p>

        {/* AI Insight Section */}
        <div className="mb-4 min-h-[40px]" onClick={(e) => e.stopPropagation()}>
          {!insight ? (
            <button 
              onClick={handleGenerateInsight}
              disabled={isLoadingInsight}
              className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100"
            >
              <Sparkles className={`w-3 h-3 mr-1 ${isLoadingInsight ? 'animate-spin' : ''}`} />
              {isLoadingInsight ? 'Analisando...' : 'Ver destaque IA'}
            </button>
          ) : (
            <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 animate-fadeIn">
              <p className="text-xs text-indigo-800 italic">
                <Sparkles className="w-3 h-3 inline-block mr-1 text-indigo-500" />
                "{insight}"
              </p>
            </div>
          )}
        </div>

        {/* Coupon Action */}
        <div className="pt-4 border-t border-slate-100 mt-auto">
          {userIsPro ? (
              <button 
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
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
