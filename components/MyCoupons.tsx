import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit, Calendar, Hash, Loader2, Save, X, AlertCircle } from 'lucide-react';
import { Company, Coupon } from '../types';
import { fetchCompanyById, createCoupon, updateCoupon, deleteCoupon } from '../services/bubbleService'; 

const MyCoupons: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Company | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Estado para edição/criação
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Formulário alinhado com o Bubble
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountValue: '',
    maxUses: '',
    expiryDate: ''
  });

  const loadData = async () => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      if (uid) {
          try {
             const user = await fetchCompanyById(uid);
             setCurrentUser(user);
          } catch(e) {
             console.error(e);
          }
      }
      setLoading(false);
  };

  useEffect(() => {
      loadData();
  }, []);

  const resetForm = () => {
    setFormData({ code: '', description: '', discountValue: '', maxUses: '', expiryDate: '' });
    setEditingId(null);
    setErrorMsg(null);
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
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : ''
    });
    setEditingId(coupon.id);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm("Tem certeza que deseja apagar este cupom?")) return;
      setLoading(true);
      await deleteCoupon(id);
      await loadData(); // Recarrega a lista
      setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    if (!currentUser?._id) {
        setErrorMsg("Erro: ID da empresa não identificado.");
        setSaving(false);
        return;
    }

    try {
        if (editingId) {
            // EDITAR
            const success = await updateCoupon(editingId, formData);
            if (!success) throw new Error("Falha ao atualizar cupom.");
        } else {
            // CRIAR
            const newId = await createCoupon(currentUser._id, formData);
            if (!newId) throw new Error("Falha ao criar cupom. Verifique as permissões de API no Bubble.");
        }
        
        setShowCreateModal(false);
        await loadData(); // Recarrega tudo para mostrar atualizado
    } catch (err: any) {
        setErrorMsg(err.message || "Ocorreu um erro ao salvar.");
    } finally {
        setSaving(false);
    }
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
                 <h3 className="text-lg font-bold text-slate-900">Cupons Ativos</h3>
                 <p className="text-sm text-slate-500">Sincronizado com Bubble DB.</p>
               </div>
               <button 
                 onClick={handleOpenCreate}
                 className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
               >
                 <Plus className="w-4 h-4 mr-2" />
                 Criar Novo
               </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Regras</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentUser?.Coupons?.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-green-700">{coupon.discountValue}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{coupon.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 space-y-1">
                        {coupon.maxUses ? (
                          <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">
                            <Hash className="w-3 h-3 mr-1" /> Max: {coupon.maxUses}
                          </div>
                        ) : null}
                        
                        {coupon.expiryDate ? (
                          <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                            <Calendar className="w-3 h-3 mr-1" /> {new Date(coupon.expiryDate).toLocaleDateString('pt-BR')}
                          </div>
                        ) : <span className="text-xs text-slate-400">Sem validade</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${coupon.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                             {coupon.status === 'paused' ? 'Inativo' : 'Ativo'}
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
                          <button 
                            onClick={() => handleDelete(coupon.id)}
                            className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!currentUser?.Coupons || currentUser.Coupons.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                        Nenhum cupom encontrado. Crie o primeiro acima.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center">
                <Ticket className="w-5 h-5 mr-2" /> 
                {editingId ? 'Editar Cupom' : 'Novo Cupom'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="hover:bg-slate-700 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {errorMsg && (
                  <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errorMsg}
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Código do Cupom</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: VERAO10"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-700"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Desconto</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: 10% ou R$ 50"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Descrição</label>
                <textarea 
                  required
                  placeholder="Explique as regras ou benefícios..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 h-20 resize-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Validade (Opcional)</label>
                    <input 
                        type="date" 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Máx. Usos (Opcional)</label>
                    <input 
                        type="number" 
                        placeholder="Ex: 100"
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                    />
                  </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)} 
                    className="flex-1 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex justify-center items-center disabled:opacity-70"
                >
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-4 h-4 mr-2" /> Salvar Cupom</>}
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