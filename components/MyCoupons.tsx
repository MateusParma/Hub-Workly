
import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit, Loader2, Save, X, AlertCircle, ShoppingBag, Store, QrCode, ArrowRight, Share2 } from 'lucide-react';
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

  // URL Segura do QR Code
  const getQrCodeUrl = (couponId: string, userId: string) => {
      const data = encodeURIComponent(`${couponId}:${userId}`);
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${data}`;
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
                 activeTab === 'wallet' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
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
                           {coupon.utilizadores?.length || 0} resgates
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
                    <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {walletCoupons.length > 0 ? (
                        walletCoupons.map((coupon) => (
                            <div key={coupon.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 flex flex-col h-full">
                                {/* Header Colorido */}
                                <div className="h-24 bg-gradient-to-br from-indigo-900 to-blue-900 relative p-4 flex justify-between items-start">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                                    <span className="relative z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-md uppercase tracking-wide border border-white/20">
                                        Cupom Digital
                                    </span>
                                    {coupon.status === 'paused' && (
                                        <span className="relative z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/80 text-white backdrop-blur-md">Expirado</span>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="px-5 pt-0 pb-5 flex-1 flex flex-col relative">
                                    {/* Logo do Parceiro */}
                                    <div className="absolute -top-10 left-5 h-16 w-16 rounded-xl border-4 border-white shadow-md bg-white overflow-hidden">
                                        {coupon.ownerData?.logo ? (
                                            <img src={coupon.ownerData.logo} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 font-bold text-slate-400">
                                                {coupon.ownerData?.name.substring(0,2) || "??"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 mb-4">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">
                                            {coupon.ownerData?.name || "Parceiro"}
                                        </h4>
                                        <div className="text-3xl font-black text-slate-900 mb-2">
                                            {coupon.discountValue}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-indigo-200 pl-3">
                                            {coupon.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                                        <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {coupon.code}
                                        </div>
                                        <button 
                                            onClick={() => setSelectedQrCoupon(coupon)}
                                            className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                        >
                                            <QrCode className="w-4 h-4 mr-1" />
                                            Usar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                            <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Sua carteira está vazia</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">Explore as empresas parceiras e resgate cupons exclusivos para começar a economizar.</p>
                            <button 
                                onClick={() => setActiveTab('published')} // Isso não muda a view global, mas serve de dica visual
                                className="px-6 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                            >
                                Ver Empresas Parceiras
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
      )}

      {/* QR CODE DISPLAY MODAL */}
      {selectedQrCoupon && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl p-0 max-w-sm w-full text-center relative shadow-2xl overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                     <div className="text-left">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validar Desconto</p>
                        <h3 className="text-lg font-bold text-slate-900">{selectedQrCoupon.ownerData?.name}</h3>
                     </div>
                     <button 
                        onClick={() => setSelectedQrCoupon(null)}
                        className="text-slate-400 hover:text-slate-600 bg-white shadow-sm border border-slate-100 rounded-full p-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] mb-6">
                        {/* 
                           Gera QR Code usando API Externa. 
                           Garantimos o encodeURIComponent para não quebrar a URL com caracteres especiais.
                        */}
                        <img 
                            src={getQrCodeUrl(selectedQrCoupon.id, currentUser._id)}
                            alt="QR Code" 
                            className="w-48 h-48 mix-blend-multiply"
                        />
                    </div>

                    <div className="mb-6 w-full bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 uppercase font-bold mb-1">Valor do Desconto</p>
                        <p className="text-3xl font-black text-indigo-900">{selectedQrCoupon.discountValue}</p>
                    </div>
                    
                    <p className="text-sm text-slate-500 leading-relaxed px-2">
                        Apresente este código ao parceiro para validar seu benefício instantaneamente.
                    </p>
                </div>
                
                <div className="bg-slate-50 p-4 text-xs text-slate-400 font-mono border-t border-slate-100">
                    ID Transação: {selectedQrCoupon.id.substring(0,8)}...
                </div>
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
