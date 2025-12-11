import React from 'react';
import { TrendingUp, PiggyBank, Ticket, ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Bem-vindo de volta! Aqui está o resumo da sua atividade no Hub.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PiggyBank className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <PiggyBank className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-slate-500">Economia Total</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">R$ 1.250,00</h3>
            <div className="flex items-center mt-2 text-sm text-emerald-600">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span className="font-medium">+12%</span>
              <span className="text-slate-400 ml-1">esse mês</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Ticket className="w-24 h-24 text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-slate-500">Cupons Utilizados</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">18</h3>
            <div className="flex items-center mt-2 text-sm text-blue-600">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span className="font-medium">3 novos</span>
              <span className="text-slate-400 ml-1">esta semana</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-slate-500">Parceiros Ativos</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">42</h3>
            <div className="flex items-center mt-2 text-sm text-indigo-600">
              <span className="font-medium">5 novas</span>
              <span className="text-slate-400 ml-1">empresas entraram</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Atividade Recente</h2>
          <div className="space-y-4">
            {[
              { company: "TechSolutions", action: "Cupom resgatado", date: "Hoje, 10:23", value: "-20%" },
              { company: "Café Central", action: "Visualizou perfil", date: "Ontem, 14:30", value: "" },
              { company: "EcoPrint", action: "Cupom expirado", date: "2 dias atrás", value: "Alert", color: "text-amber-500" },
              { company: "Hub Admin", action: "Upgrade para PRO", date: "1 semana atrás", value: "Sucesso", color: "text-emerald-500" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {item.company.substring(0,2).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-900">{item.company}</p>
                    <p className="text-xs text-slate-500">{item.action}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className={`text-sm font-bold ${item.color || 'text-slate-700'}`}>{item.value}</p>
                   <p className="text-xs text-slate-400">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Offers Performance */}
         <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-6">
             <div>
              <h2 className="text-lg font-bold text-white">Desempenho da Sua Empresa</h2>
              <p className="text-slate-400 text-sm">Como os parceiros estão usando seus cupons.</p>
             </div>
             <button className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg transition-colors">
               Ver detalhes
             </button>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">CUPOM: BEMVINDO10</span>
                <span className="font-bold text-white">85% uso</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">CUPOM: PARCEIROPRO</span>
                <span className="font-bold text-white">42% uso</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
               <div>
                 <p className="text-2xl font-bold">142</p>
                 <p className="text-xs text-slate-400">Total de resgates</p>
               </div>
               <div>
                 <p className="text-2xl font-bold text-emerald-400">R$ 4.2k</p>
                 <p className="text-xs text-slate-400">Vendas geradas (est.)</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;