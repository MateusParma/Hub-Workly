import React from 'react';
import { LayoutDashboard, Users, Ticket, Settings, Menu, X, Crown, LogOut } from 'lucide-react';
import { Company } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userIsPro: boolean;
  onTogglePro: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  currentUser: Company;
}

const Layout: React.FC<LayoutProps> = ({ children, userIsPro, onTogglePro, currentView, onChangeView, currentUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const NavItem = ({ icon: Icon, label, viewId }: { icon: any, label: string, viewId: string }) => {
    const active = currentView === viewId;
    return (
      <button
        onClick={() => {
          onChangeView(viewId);
          setIsSidebarOpen(false);
        }}
        className={`flex items-center w-full px-4 py-3 mb-1 rounded-lg transition-colors ${
          active 
            ? 'bg-blue-50 text-blue-600 font-medium border-r-4 border-blue-600' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Icon className={`w-5 h-5 mr-3 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Hub<span className="text-blue-600">Pro</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-80px)] justify-between">
          <nav className="p-4 mt-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Menu Principal</div>
            <NavItem icon={LayoutDashboard} label="Dashboard" viewId="dashboard" />
            <NavItem icon={Users} label="Empresas Parceiras" viewId="partners" />
            <NavItem icon={Ticket} label="Meus Cupons" viewId="coupons" />
            
            <div className="my-6 border-t border-slate-100"></div>
            
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Configurações</div>
            <NavItem icon={Settings} label="Minha Conta" viewId="settings" />
          </nav>

          {/* User Profile & Simulator */}
          <div className="p-4 bg-slate-50 border-t border-slate-100">
             <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Simulador de Status</p>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${userIsPro ? 'text-blue-600' : 'text-slate-600'}`}>
                  {userIsPro ? 'PRO' : 'Free'}
                </span>
                <button 
                  onClick={onTogglePro}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${userIsPro ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${userIsPro ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => window.location.href = window.location.pathname} // Logout simples (limpa query params)
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            {userIsPro ? (
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm animate-pulse-slow">
                 <Crown className="w-3 h-3 mr-1" /> Membro PRO
               </span>
            ) : (
              <button onClick={onTogglePro} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                Plano Gratuito (Fazer Upgrade)
              </button>
            )}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{currentUser.Name}</p>
                <p className="text-xs text-slate-500 truncate max-w-[150px]">{currentUser.Category}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                {currentUser.Logo ? (
                  <img src={currentUser.Logo} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-blue-700 font-bold text-sm">{currentUser.Name.substring(0,2).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;