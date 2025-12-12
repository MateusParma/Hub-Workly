
import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Edit, Loader2, Save, X, AlertCircle, ShoppingBag, Store, QrCode, ArrowRight, Share2 } from 'lucide-react';
import { Company, Coupon } from '../types';
import { fetchCompanyById, createCoupon, updateCoupon, deleteCoupon, fetchClaimedCoupons } from '../services/bubbleService'; 

const MyCoupons: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'published' | 'wallet'>('published');
  
  // Carteira e Modal
  const [walletCoupons, setWalletCoupons] = useState<Coupon[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [selectedQrCoupon, setSelectedQrCoupon] = useState<Coupon | null>(null);

  // Form Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', description: '', discountValue: '', maxUses: '', expiryDate: '' });

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

  useEffect(() => { loadData(); }, []);

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

  const handleOpenCreate = () => { resetForm(); setShowCreateModal(true); };
  
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
      if (!window.confirm("Deseja apagar este cupom?")) return;
      setLoading(true);
      await deleteCoupon(id);
      await loadData();
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
            await updateCoupon(editingId, formData);
        } else {
            await createCoupon(currentUser._id, formData);
        }
        setShowCreateModal(false);
        await loadData();
    } catch (err: any) {
        setErrorMsg(err.message || "Erro ao salvar.");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciador de Cupons</h1>
          <p className="text-slate-500">Alterne entre suas ofertas criadas e seus benefícios resgatados.</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
          <button
             onClick={() => setActiveTab('published')}
             className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                 activeTab === 'published' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
             }`}
          >
             <Store className="w-4 h-4 mr-2" />
             Minhas Ofertas
          </button>
          <button
             onClick={() => setActiveTab('wallet')}
             className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                 activeTab === 'wallet' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
             }`}
          >
             <ShoppingBag className="w-4 h-4 mr-2" />
             Minha Carteira
          </button>
      </div>

      {loading ? (
           <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
      ) : activeTab === 'published' ? (
        // --- ABA 1: MEUS CUPONS (CRIADOS) ---
        <div className="animate-fadeIn">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Cupons Ativos</h3>
                 <p className="text-sm text-slate-500">Benefícios que você oferece aos parceiros.</p>
               </div>
               <button 
                 onClick={handleOpenCreate}
                 className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-bold text-sm"
               >
                 <Plus className="w-4 h-4 mr-2" />
                 Novo Cupom
               </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Oferta</th>
                    <th className="px-6 py-4">Resgates</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentUser?.Coupons?.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{coupon.discountValue}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{coupon.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs">
                           <ShoppingBag className="w-3 h-3 mr-1" />
                           {coupon.utilizadores?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${coupon.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                             {coupon.status === 'paused' ? 'Pausado' : 'Ativo'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleOpenEdit(coupon)} className="text-slate-400 hover:text-blue-600 p-2"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(coupon.id)} className="text-slate-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!currentUser?.Coupons || currentUser.Coupons.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <Ticket className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        Nenhuma oferta criada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // --- ABA 2: MINHA CARTEIRA (RESGATADOS) ---
        <div className="animate-fadeIn">
            {loadingWallet ? (
                <div className="flex justify-center p-20 bg-white rounded-xl border border-slate-200">
                    <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {walletCoupons.length > 0 ? (
                        walletCoupons.map((coupon) => (
                            <div key={coupon.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 flex flex-col h-full transform hover:-translate-y-1">
                                {/* Header Colorido com Logo */}
                                <div className="h-28 bg-gradient-to-br from-slate-800 to-slate-900 relative p-6 flex flex-col justify-between">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                    
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="w-12 h-12 bg-white rounded-lg p-0.5 shadow-lg overflow-hidden">
                                            {coupon.ownerData?.logo ? (
                                                <img src={coupon.ownerData.logo} className="w-full h-full object-cover rounded-md" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 font-bold text-slate-400 text-xs rounded-md">
                                                    {coupon.ownerData?.name.substring(0,2)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/10 uppercase tracking-wider">
                                            Cupom Digital
                                        </span>
                                    </div>
                                    <div className="relative z-10 mt-2">
                                        <h4 className="text-white font-bold text-sm truncate">{coupon.ownerData?.name}</h4>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <div className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                                            {coupon.discountValue}
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {coupon.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Código</span>
                                            <span className="font-mono font-bold text-slate-700">{coupon.code}</span>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedQrCoupon(coupon)}
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                                        >
                                            <QrCode className="w-4 h-4 mr-2" />
                                            Usar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
                            <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Sua carteira está vazia</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">Navegue pelos parceiros e resgate benefícios para eles aparecerem aqui.</p>
                            <button 
                                onClick={() => setActiveTab('published')} 
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                            >
                                Voltar para Minhas Ofertas
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
      )}

      {/* MODAL QR CODE - Workly Style */}
      {selectedQrCoupon && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform scale-100 transition-transform">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center relative">
                     <button 
                        onClick={() => setSelectedQrCoupon(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-white font-bold text-lg mb-1">{selectedQrCoupon.ownerData?.name}</h3>
                    <p className="text-blue-100 text-xs uppercase tracking-wider font-medium">Apresente no Caixa</p>
                </div>

                <div className="p-8 flex flex-col items-center bg-white relative">
                    <div className="absolute -top-6 w-full flex justify-center">
                         <div className="bg-white p-1 rounded-full">
                            <div className="bg-slate-100 w-3 h-3 rounded-full"></div>
                         </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border-2 border-slate-100 shadow-lg mb-6">
                        {/* URL da API de QR Code - Robusta e sem dependências */}
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(`${selectedQrCoupon.id}:${currentUser._id}`)}`}
                            alt="QR Code" 
                            className="w-48 h-48 mix-blend-multiply"
                        />
                    </div>

                    <div className="w-full text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Valor do Benefício</p>
                        <p className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{selectedQrCoupon.discountValue}</p>
                        
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">Código Promocional</span>
                            <span className="font-mono font-bold text-slate-800 text-lg">{selectedQrCoupon.code}</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-mono">ID: {selectedQrCoupon.id.substring(0,12)}...</p>
                </div>
            </div>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR (MANTIDO) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center">
                <Ticket className="w-5 h-5 mr-2" /> 
                {editingId ? 'Editar Oferta' : 'Nova Oferta'}
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
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Código</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: PROMO10"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-700 uppercase"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Valor/Desconto</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: 15%"
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
                  placeholder="Regras de uso..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 h-20 resize-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Validade</label>
                    <input 
                        type="date" 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Limite Usos</label>
                    <input 
                        type="number" 
                        placeholder="Ilimitado"
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
                    className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-md flex justify-center items-center disabled:opacity-70"
                >
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
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
