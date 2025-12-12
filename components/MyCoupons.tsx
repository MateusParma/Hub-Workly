
import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit, Calendar, Hash, Loader2, Save, X, AlertCircle, ShoppingBag, Store, QrCode } from 'lucide-react';
import { Company, Coupon } from '../types';
import { fetchCompanyById, createCoupon, updateCoupon, deleteCoupon, fetchClaimedCoupons } from '../services/bubbleService'; 

const MyCoupons: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Company | null>(null);
  
  // Abas
  const [activeTab, setActiveTab] = useState<'published' | 'wallet'>('published');
  
  // Carteira
  const [walletCoupons, setWalletCoupons] = useState<Coupon[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [selectedQrCoupon, setSelectedQrCoupon] = useState<Coupon | null>(null);

  // Modal de Criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  const loadWallet = async () => {
      if (!currentUser?._id) return;
      setLoadingWallet(true);
      const coupons = await fetchClaimedCoupons(currentUser._id);
      setWalletCoupons(coupons);
      setLoadingWallet(false);
  };

  useEffect(() => {
      loadData();
  }, []);

  // Carrega carteira quando muda de aba e temos usuário
  useEffect(() => {
      if (activeTab === 'wallet' && currentUser) {
          loadWallet();
      }
  }, [activeTab, currentUser]);

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
            const success = await updateCoupon(editingId, formData);
            if (!success) throw new Error("Falha ao atualizar cupom.");
        } else {
            const newId = await createCoupon(currentUser._id, formData);
            if (!newId) throw new Error("Falha ao criar cupom. Verifique as permissões de API no Bubble.");
        }
        
        setShowCreateModal(false);
        await loadData();
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
          <p className="text-slate-500">Gerencie suas ofertas ou veja os benefícios que você resgatou.</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
          <button
             onClick={() => setActiveTab('published')}
             className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                 activeTab === 'published' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
             }`}
          >
             <Store className="w-4 h-4 mr-2" />
             Ofertas Criadas
          </button>
          <button
             onClick={() => setActiveTab('wallet')}
             className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                 activeTab === 'wallet' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
             }`}
          >
             <ShoppingBag className="w-4 h-4 mr-2" />
             Minha Carteira
          </button>
      </div>

      {loading ? (
           <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : activeTab === 'published' ? (
        // --- ABA: CUPONS PUBLICADOS ---
        <div className="animate-fadeIn">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Cupons Ativos da Sua Empresa</h3>
                 <p className="text-sm text-slate-500">Estes cupons aparecem para outros parceiros.</p>
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
                    <th className="px-6 py-4">Engajamento</th>
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
                        <div className="flex items-center font-medium text-slate-700">
                           <ShoppingBag className="w-3 h-3 mr-1" />
                           {coupon.utilizadores?.length || 0} pegaram
                        </div>
                        {coupon.maxUses && (
                           <div className="text-xs text-slate-400">
                             Limite: {coupon.maxUses}
                           </div>
                        )}
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
                        Nenhum cupom criado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // --- ABA: CARTEIRA (RESGATADOS) ---
        <div className="animate-fadeIn">
            {loadingWallet ? (
                <div className="flex justify-center p-20 bg-white rounded-xl border border-slate-200">
                    <Loader2 className="animate-spin text-green-600 w-8 h-8" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {walletCoupons.length > 0 ? (
                        walletCoupons.map((coupon) => (
                            <div key={coupon.id} className="bg-white border border-green-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full -mr-8 -mt-8 z-0 transition-transform group-hover:scale-110"></div>
                                
                                <div className="relative z-10 flex-1">
                                    <div className="flex items-center mb-4">
                                        <div className="w-10 h-10 rounded-full border border-slate-100 bg-white shadow-sm overflow-hidden flex-shrink-0">
                                            {coupon.ownerData?.logo ? (
                                                <img src={coupon.ownerData.logo} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-xs font-bold text-slate-400">
                                                    {coupon.ownerData?.name.substring(0,2) || "??"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs text-slate-500 font-bold uppercase">Oferecido por</p>
                                            <p className="text-sm font-bold text-slate-900 line-clamp-1">{coupon.ownerData?.name || "Parceiro"}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-center py-2 border-y border-dashed border-slate-200 my-2">
                                        <div className="text-3xl font-bold text-green-700">{coupon.discountValue}</div>
                                        <p className="text-sm text-slate-600 line-clamp-2 mt-1">{coupon.description}</p>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600 tracking-widest">
                                            {coupon.code}
                                        </div>
                                        {coupon.status === 'paused' && <span className="text-xs text-red-500 font-bold">Expirado</span>}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4">
                                    <button 
                                        onClick={() => setSelectedQrCoupon(coupon)}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-bold text-sm"
                                    >
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Usar no Caixa
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
                            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">Sua carteira está vazia</h3>
                            <p className="text-slate-500">Visite a aba "Empresas Parceiras" para resgatar descontos exclusivos.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      )}

      {/* QR CODE DISPLAY MODAL */}
      {selectedQrCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center relative shadow-2xl transform transition-all">
                <button 
                    onClick={() => setSelectedQrCoupon(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="mb-4">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cupom de Desconto</p>
                     <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedQrCoupon.ownerData?.name || "Oferta"}</h3>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200 mb-6">
                    <p className="text-green-600 font-bold text-3xl mb-1">{selectedQrCoupon.discountValue}</p>
                    <p className="font-mono text-slate-500 tracking-wider text-sm">{selectedQrCoupon.code}</p>
                </div>
                
                <div className="bg-white p-2 rounded-xl border-2 border-slate-900 inline-block mb-6 shadow-xl">
                    {/* 
                       Gera QR Code usando API Externa. 
                       Dados: ID_CUPOM : ID_USUARIO
                       Isso permite que o scanner valide a posse.
                    */}
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${selectedQrCoupon.id}:${currentUser?._id}`}
                        alt="QR Code" 
                        className="w-48 h-48"
                    />
                </div>
                
                <p className="text-sm text-slate-600 px-4 leading-relaxed">
                    Mostre este código ao lojista para validar e aplicar seu desconto na hora da compra.
                </p>
            </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO (Mesmo código anterior) */}
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
              {/* Campos do formulário iguais aos anteriores... */}
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
