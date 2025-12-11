import React, { useState } from 'react';
import { Ticket, Plus, Trash2, Edit, Calendar, Hash, Wallet, Store, AlertCircle } from 'lucide-react';

interface MyCoupon {
  id: string;
  code: string;
  description: string;
  discount: string;
  status: 'active' | 'expired' | 'paused';
  uses: number;
  maxUses?: number; // Limite de usos
  expiryDate?: string; // Data de validade
}

const MyCoupons: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'publisher'>('wallet');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Estado unificado para o formulário (Create/Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount: '',
    maxUses: '',
    expiryDate: ''
  });

  // Mock data for "My Wallet"
  const myWallet = [
    { id: 1, company: "TechSolutions", code: "TECH20", desc: "20% off consultoria", date: "Expira em 20 dias", status: "active" },
    { id: 2, company: "Café Central", code: "CAFEFREE", desc: "Café grátis", date: "Expira em 5 dias", status: "active" },
    { id: 3, company: "FitLife", code: "FITSTART", desc: "Matrícula Zero", date: "Usado em 10/05", status: "used" },
  ];

  // Mock data for "My Offers"
  const [myOffers, setMyOffers] = useState<MyCoupon[]>([
    { id: '1', code: 'BEMVINDO10', description: '10% de desconto para novos clientes', discount: '10%', status: 'active', uses: 45, maxUses: 100, expiryDate: '2024-12-31' },
    { id: '2', code: 'PARCEIROVIP', description: 'Frete grátis em compras acima de R$100', discount: 'Frete Grátis', status: 'active', uses: 12 },
  ]);

  const resetForm = () => {
    setFormData({ code: '', description: '', discount: '', maxUses: '', expiryDate: '' });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (coupon: MyCoupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount: coupon.discount,
      maxUses: coupon.maxUses ? coupon.maxUses.toString() : '',
      expiryDate: coupon.expiryDate || ''
    });
    setEditingId(coupon.id);
    setShowCreateModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Lógica de ATUALIZAÇÃO
        setMyOffers(prev => prev.map(c => {
          if (c.id === editingId) {
            return {
              ...c,
              code: formData.code.toUpperCase(),
              description: formData.description,
              discount: formData.discount,
              maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
              expiryDate: formData.expiryDate || undefined
            };
          }
          return c;
        }));
        alert("Cupom atualizado com sucesso!");
      } else {
        // Lógica de CRIAÇÃO
        const newCoupon: MyCoupon = {
          id: Date.now().toString(),
          code: formData.code.toUpperCase(),
          description: formData.description,
          discount: formData.discount,
          status: 'active',
          uses: 0,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          expiryDate: formData.expiryDate || undefined
        };
        setMyOffers([...myOffers, newCoupon]);
        alert("Novo cupom criado e disponível na rede!");
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar cupom:", error);
      alert("Ocorreu um erro ao salvar. Verifique os dados.");
    }
  };

  const handleDelete = (id: string) => {
    if(confirm("Tem certeza que deseja remover este cupom? Esta ação é irreversível.")) {
      setMyOffers(myOffers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciador de Cupons</h1>
          <p className="text-slate-500">Veja seus resgates e gerencie as ofertas da sua empresa.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="mt-4 md:mt-0 bg-white p-1 rounded-lg border border-slate-200 inline-flex">
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'wallet' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Minha Carteira
          </button>
          <button 
             onClick={() => setActiveTab('publisher')}
             className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'publisher' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Store className="w-4 h-4 mr-2" />
            Minhas Ofertas (Empresa)
          </button>
        </div>
      </div>

      {activeTab === 'wallet' ? (
        // WALLET VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
          {myWallet.map((item) => (
            <div key={item.id} className={`bg-white p-5 rounded-xl border ${item.status === 'used' ? 'border-slate-100 opacity-70' : 'border-slate-200 shadow-sm'} relative`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">De: {item.company}</span>
                {item.status === 'active' ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Ativo</span>
                ) : (
                   <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-medium">Utilizado</span>
                )}
              </div>
              <div className="mb-4">
                 <h3 className="text-lg font-bold text-slate-800">{item.code}</h3>
                 <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>{item.date}</span>
                {item.status === 'active' && <button className="text-blue-600 font-bold hover:underline">Usar Agora</button>}
              </div>
            </div>
          ))}
          {myWallet.length === 0 && (
             <div className="col-span-3 text-center py-10 text-slate-400">
               Você ainda não resgatou nenhum cupom. Vá para a aba "Parceiros".
             </div>
          )}
        </div>
      ) : (
        // PUBLISHER VIEW
        <div className="animate-fadeIn">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Cupons Ativos da Sua Empresa</h3>
                 <p className="text-sm text-slate-500">Estes cupons estão visíveis para outros parceiros no Hub.</p>
               </div>
               <button 
                 onClick={handleOpenCreate}
                 className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
               >
                 <Plus className="w-4 h-4 mr-2" />
                 Criar Novo Cupom
               </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Detalhes</th>
                    <th className="px-6 py-4">Limites</th>
                    <th className="px-6 py-4 text-center">Uso Atual</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myOffers.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-medium">{coupon.discount}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{coupon.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 space-y-1">
                        {coupon.maxUses ? (
                          <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">
                            <Hash className="w-3 h-3 mr-1" /> Max: {coupon.maxUses}
                          </div>
                        ) : <div className="text-xs text-slate-400">Sem limite</div>}
                        
                        {coupon.expiryDate ? (
                          <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                            <Calendar className="w-3 h-3 mr-1" /> Até {new Date(coupon.expiryDate).toLocaleDateString('pt-BR')}
                          </div>
                        ) : <div className="text-xs text-slate-400">Sem validade</div>}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="inline-flex flex-col items-center">
                           <span className="font-bold text-slate-800">{coupon.uses}</span>
                           {coupon.maxUses && (
                             <span className="text-[10px] text-slate-400">de {coupon.maxUses}</span>
                           )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenEdit(coupon)}
                            className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                            title="Editar Cupom"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(coupon.id)}
                            className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Excluir Cupom"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {myOffers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                        Nenhum cupom criado ainda. Clique em "Criar Novo Cupom" para começar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center">
                <Ticket className="w-5 h-5 mr-2" /> 
                {editingId ? 'Editar Cupom' : 'Novo Cupom de Parceiro'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="hover:bg-blue-700 p-1 rounded">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código (Ex: PRO20)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase font-mono bg-slate-50"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (Ex: 20% OFF)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição da Oferta</label>
                <textarea 
                  required
                  placeholder="Descreva as regras de uso e benefícios..." 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-slate-400" />
                  Limites e Validade (Opcional)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Limite de Usos (Qtd)</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Ilimitado"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Data de Validade</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  {editingId ? 'Salvar Alterações' : 'Publicar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCoupons;