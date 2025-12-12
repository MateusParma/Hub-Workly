import React, { useEffect, useState } from 'react';
import { TrendingUp, PiggyBank, Ticket, ArrowUpRight, Users, Loader2, Building } from 'lucide-react';
import { fetchDashboardStats } from '../services/bubbleService';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const data = await fetchDashboardStats();
      setStats(data);
      setLoading(false);
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando indicadores...</p>
      </div>
    );
  }

  // Se falhar o carregamento ou vier vazio
  const displayStats = stats || {
    totalPartners: 0,
    totalCoupons: 0,
    totalRedemptions: 0,
    recentPartners: [],
    topCategories: []
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard em Tempo Real</h1>
        <p className="text-slate-500">Visão geral do ecossistema de parceiros e benefícios.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Parceiros */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-slate-500">Empresas Parceiras</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{displayStats.totalPartners}</h3>
            <div className="flex items-center mt-2 text-sm text-indigo-600">
               <span className="font-medium text-slate-400">Cadastradas no Hub</span>
            </div>
          </div>
        </div>

        {/* Card 2: Ofertas Ativas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Ticket className="w-24 h-24 text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-slate-500">Ofertas Disponíveis</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{displayStats.totalCoupons}</h3>
            <div className="flex items-center mt-2 text-sm text-blue-600">
              <span className="text-slate-400">Cupons ativos na plataforma</span>
            </div>
          </div>
        </div>

        {/* Card 3: Resgates */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PiggyBank className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <PiggyBank className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-slate-500">Total de Usos</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{displayStats.totalRedemptions}</h3>
            <div className="flex items-center mt-2 text-sm text-emerald-600">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span className="font-medium">Parceiros engajados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Partners List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2 text-slate-400" />
            Novos Parceiros
          </h2>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {displayStats.recentPartners.length > 0 ? (
                displayStats.recentPartners.map((company, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                    <div className="flex items-center overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 overflow-hidden border border-slate-200">
                            {company.Logo ? (
                                <img src={company.Logo} alt="" className="w-full h-full object-cover" />
                            ) : company.Name.substring(0,2).toUpperCase()}
                        </div>
                        <div className="ml-3 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{company.Name}</p>
                            <p className="text-xs text-slate-500 truncate">{company.Category}</p>
                        </div>
                    </div>
                    <div className="text-right pl-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                            Novo
                        </span>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center py-10 text-slate-400 text-sm">Nenhum parceiro recente encontrado.</div>
            )}
          </div>
        </div>

        {/* Categories Distribution */}
         <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-6">
             <div>
              <h2 className="text-lg font-bold text-white">Categorias Populares</h2>
              <p className="text-slate-400 text-sm">Distribuição das empresas por setor.</p>
             </div>
          </div>

          <div className="space-y-5">
            {displayStats.topCategories.length > 0 ? (
                displayStats.topCategories.map((cat, idx) => {
                    const percentage = Math.round((cat.count / displayStats.totalPartners) * 100) || 0;
                    // Cores alternadas para as barras
                    const barColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'];
                    const color = barColors[idx % barColors.length];
                    
                    return (
                        <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300 truncate max-w-[200px]">{cat.name}</span>
                                <span className="font-bold text-white">{cat.count}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className={`${color} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                            </div>
                        </div>
                    );
                })
            ) : (
                 <div className="text-center py-10 text-slate-500 italic">Sem dados de categorias.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
