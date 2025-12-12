import React, { useState, useEffect } from 'react';
import { Save, User, Lock, CreditCard, Building, Mail, Globe, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { Company } from '../types';

interface SettingsProps {
  currentUser: Company;
}

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  
  // Initialize form with current user data
  const [formData, setFormData] = useState({
    companyName: currentUser.Name,
    email: 'email@exemplo.com', 
    phone: currentUser.Phone || '',
    website: currentUser.Website || '',
    address: currentUser.Address || '',
    description: currentUser.Description || ''
  });

  // Update form if user changes
  useEffect(() => {
    setFormData({
      companyName: currentUser.Name,
      email: 'email@exemplo.com', 
      phone: currentUser.Phone || '',
      website: currentUser.Website || '',
      address: currentUser.Address || '',
      description: currentUser.Description || ''
    });
  }, [currentUser]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setLoading(true);
    // Simulação de chamada de API para salvar no Bubble
    setTimeout(() => {
      setLoading(false);
      alert("Configurações salvas com sucesso! (Em produção, isso atualizaria o registro no Bubble)");
    }, 1500);
  };

  const handleOpenWorkly = () => {
    window.open('https://www.workly.pt', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações da Conta</h1>
        <p className="text-slate-500">Gerencie as informações da sua empresa e sua assinatura.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="relative inline-block">
               <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mx-auto mb-4 border-4 border-white shadow-md overflow-hidden">
                 {currentUser.Logo ? (
                    <img src={currentUser.Logo} alt="Logo" className="w-full h-full object-cover" />
                 ) : (
                    formData.companyName.substring(0,2).toUpperCase()
                 )}
               </div>
               <button className="absolute bottom-0 right-0 bg-white border border-slate-200 p-1.5 rounded-full text-slate-500 hover:text-blue-600 shadow-sm">
                 <User className="w-4 h-4" />
               </button>
            </div>
            <h2 className="font-bold text-slate-900 text-lg">{formData.companyName}</h2>
            <p className="text-sm text-slate-500">Parceiro Ativo</p>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
               <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                 {currentUser.IsPartner ? 'Conta Verificada' : 'Pendente'}
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl text-white shadow-lg">
             <div className="flex items-center mb-4">
               <CreditCard className="w-5 h-5 mr-2 text-blue-400" />
               <span className="font-bold">Plano Atual</span>
             </div>
             <div className="text-2xl font-bold mb-1">PRO Business</div>
             <p className="text-slate-400 text-sm mb-4">Gerenciado via Workly App</p>
             <button 
               onClick={handleOpenWorkly}
               className="w-full py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors flex items-center justify-center group"
             >
               Gerenciar Assinatura 
               <ExternalLink className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Company Info Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
              <Building className="w-5 h-5 text-slate-400 mr-2" />
              <h3 className="font-bold text-slate-700">Dados da Empresa</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                  <input 
                    type="text" 
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site Oficial</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Curta</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">Essa descrição aparecerá no seu cartão de parceiro.</p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
              <Lock className="w-5 h-5 text-slate-400 mr-2" />
              <h3 className="font-bold text-slate-700">Acesso e Segurança</h3>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email de Login</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg pl-10 pr-3 py-2.5 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Gerenciado pelo app principal.</p>
               </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
             <button 
               onClick={handleSave}
               disabled={loading}
               className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {loading ? (
                 <>
                   <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando...
                 </>
               ) : (
                 <>
                   <Save className="w-5 h-5 mr-2" /> Salvar Alterações
                 </>
               )}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;