import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit, Calendar, Hash, Wallet, Store, AlertCircle, Loader2 } from 'lucide-react';
import { Company, Coupon } from '../types';
import { fetchCompanyById } from '../services/bubbleService'; // Futuro: usar hook de contexto se app crescer

// Como não estamos usando contexto global complexo, vamos pegar o user via props ou supor que o pai passou
// Para simplificar a edição deste arquivo sem mudar o Layout inteiro, vou fazer uma checagem local.
// No cenário ideal, `currentUser` viria via props.

const MyCoupons: React.FC = () => {
  // Hack para pegar o usuário do estado global seria via props, mas vamos ler do URL para recarregar se necessário
  // ou melhor, vamos assumir que essa tela é renderizada dentro do Layout que já tem o user.
  // Vamos adaptar para usar dados locais simulados baseados no currentUser se ele fosse passado,
  // mas como o componente é isolado, vou adicionar lógica para ler de props se eu alterar o App.tsx, 
  // ou fazer um fetch rápido se necessário. 
  
  // SOLUÇÃO: Vamos ler o 'currentUser' do App.tsx. 
  // Como o arquivo App.tsx não passa props para MyCoupons no `renderView`, vou criar um estado local
  // que tenta sincronizar, mas idealmente você deve passar `currentUser` como prop em `App.tsx`.
  
  const [activeTab, setActiveTab] = useState<'wallet' | 'publisher'>('publisher'); // Default para Publisher para empresas
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado para os cupons da empresa (Minhas Ofertas)
  const [myOffers, setMyOffers] = useState<Coupon[]>([]);
  
  // Estado para edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount: '',
    maxUses: '',
    expiryDate: ''
  });

  // Carrega os cupons do usuário atual ao montar
  useEffect(() => {
      const loadCoupons = async () => {
          setLoading(true);
          const params = new URLSearchParams(window.location.search);
          const uid = params.get('uid');
          if (uid) {
              const { fetchCompanyById } = await import('../services/bubbleService');
              const user = await fetchCompanyById(uid);
              if (user && user.Coupons) {
                  // Mapeia para o formato interno se necessário ou usa direto
                  setMyOffers(user.Coupons);
              }
          }
          setLoading(false);
      };
      loadCoupons();
  }, []);

  const resetForm = () => {
    setFormData({ code: '', description: '', discount: '', maxUses: '', expiryDate: '' });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses ? coupon.maxUses.toString() : '',
      expiryDate: coupon.expiryDate || ''
    });
    setEditingId(coupon.id);
    setShowCreateModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Para criar cupons reais, é necessário configurar o endpoint POST no Bubble para a tabela Cupom e linkar ao User. No momento, esta é uma visualização Front-end.");
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciador de Cupons</h1>
          <p className="text-slate-500">Gerencie as ofertas que sua empresa oferece no Hub.</p>
        </div>
      </div>

      {loading ? (
           <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="animate-fadeIn">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Cupons Ativos da Sua Empresa</h3>
                 <p className="text-sm text-slate-500">Sincronizado com o Banco de Dados do Bubble.</p>
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
                    <th className="px-6 py-4 text-center">Status</th>
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
                        <div className="text-sm text-slate-900 font-medium">{coupon.discountValue}</div>
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
                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${coupon.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                             {coupon.status === 'paused' ? 'Pausado' : 'Ativo'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenEdit(coupon)}
                            className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {myOffers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                        Nenhum cupom encontrado para sua empresa no Bubble.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL (Visual Only for now) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center">
                <Ticket className="w-5 h-5 mr-2" /> 
                {editingId ? 'Editar Cupom' : 'Novo Cupom'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="hover:bg-blue-700 p-1 rounded">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>Nota:</strong> Para salvar novos cupons, implemente a chamada POST no Bubble API.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Desconto</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-2.5 h-20 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold">Salvar (Simulado)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCoupons;