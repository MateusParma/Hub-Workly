import React, { useEffect, useState, useMemo } from 'react';
import CompanyCard from './CompanyCard';
import CouponModal from './CouponModal';
import { Company } from '../types';
import { fetchCompanies } from '../services/bubbleService';
import { Search, Filter, Loader2 } from 'lucide-react';

interface PartnerDirectoryProps {
  userIsPro: boolean;
}

const PartnerDirectory: React.FC<PartnerDirectoryProps> = ({ userIsPro }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedCompanyForCoupon, setSelectedCompanyForCoupon] = useState<Company | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchCompanies();
      setCompanies(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = company.Name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            company.Description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || company.Category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [companies, searchTerm, selectedCategory]);

  const categories = ['Todos', ...Array.from(new Set(companies.map(c => c.Category)))];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Rede de Parceiros</h1>
        <p className="text-slate-500">Explore empresas e desbloqueie benefícios exclusivos.</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-0 z-10 backdrop-blur-md bg-opacity-95">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar empresas, serviços..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center overflow-x-auto space-x-2 pb-2 md:pb-0 hide-scrollbar">
            <Filter className="text-slate-400 w-5 h-5 mr-2 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Carregando parceiros...</p>
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCompanies.map((company) => (
            <CompanyCard 
              key={company._id} 
              company={company} 
              userIsPro={userIsPro}
              onOpenCoupon={(c) => setSelectedCompanyForCoupon(c)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Nenhum resultado encontrado</h3>
          <p className="text-slate-500">Tente ajustar seus termos de busca ou filtros.</p>
        </div>
      )}

      {/* Coupon Modal */}
      <CouponModal 
        company={selectedCompanyForCoupon} 
        isOpen={!!selectedCompanyForCoupon} 
        onClose={() => setSelectedCompanyForCoupon(null)} 
      />
    </div>
  );
};

export default PartnerDirectory;