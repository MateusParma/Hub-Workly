import React from 'react';
import { Company, Coupon } from '../types';
import { MapPin, Globe, Sparkles, Lock, Ticket } from 'lucide-react';
import { generateCompanyInsight } from '../services/geminiService';

interface CompanyCardProps {
  company: Company;
  userIsPro: boolean;
  onOpenCoupon: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, userIsPro, onOpenCoupon }) => {
  const [insight, setInsight] = React.useState<string>("");
  const [isLoadingInsight, setIsLoadingInsight] = React.useState(false);

  const handleGenerateInsight = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingInsight(true);
    const text = await generateCompanyInsight(company.Name, company.Description);
    setInsight(text);
    setIsLoadingInsight(false);
  };

  const hasCoupons = company.Coupons && company.Coupons.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full overflow-hidden group">
      {/* Card Header with Logo */}
      <div className="h-24 bg-slate-50 relative border-b border-slate-100">
        <div className="absolute -bottom-6 left-6">
          <div className="h-16 w-16 rounded-lg border-4 border-white shadow-sm bg-white overflow-hidden">
            <img 
              src={company.Logo || `https://ui-avatars.com/api/?name=${company.Name}&background=random`} 
              alt={company.Name} 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        {company.IsPartner && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Parceiro Oficial
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="pt-8 px-6 pb-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{company.Name}</h3>
            <p className="text-sm text-slate-500 font-medium">{company.Category}</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
          {company.Description}
        </p>

        {/* AI Insight Section */}
        <div className="mb-4 min-h-[60px]">
          {!insight ? (
            <button 
              onClick={handleGenerateInsight}
              disabled={isLoadingInsight}
              className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <Sparkles className={`w-3 h-3 mr-1 ${isLoadingInsight ? 'animate-spin' : ''}`} />
              {isLoadingInsight ? 'A IA está analisando...' : 'Ver dica da IA'}
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

        {/* Contact Info */}
        <div className="mt-auto space-y-2 mb-4">
          {company.Address && (
            <div className="flex items-center text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <span className="truncate">{company.Address}</span>
            </div>
          )}
          {company.Website && (
             <div className="flex items-center text-xs text-slate-500">
             <Globe className="w-3.5 h-3.5 mr-2 text-slate-400" />
             <a href={company.Website} target="_blank" rel="noreferrer" className="truncate hover:text-blue-600 hover:underline">
               Visitar site
             </a>
           </div>
          )}
        </div>

        {/* Coupon Action */}
        <div className="pt-4 border-t border-slate-100">
          {hasCoupons ? (
            userIsPro ? (
              <button 
                onClick={() => onOpenCoupon(company)}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Ver Cupons ({company.Coupons?.length})
              </button>
            ) : (
              <button 
                disabled
                className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed"
              >
                <Lock className="w-4 h-4 mr-2" />
                Exclusivo PRO
              </button>
            )
          ) : (
            <div className="w-full text-center py-2 text-xs text-slate-400 italic">
              Nenhum cupom ativo
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;