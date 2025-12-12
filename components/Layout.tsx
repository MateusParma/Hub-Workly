
import React, { useState } from 'react';
import { LayoutDashboard, Users, Ticket, Settings, Menu, X, Crown, LogOut, Terminal, Activity } from 'lucide-react';
import { Company } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  currentUser: Company;
  debugLogs?: string[]; // Propriedade opcional para logs
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, currentUser, debugLogs = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

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

          {/* User Profile */}
          <div className="p-4 bg-slate-50 border-t border-slate-100">
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
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
                 <Crown className="w-3 h-3 mr-1" /> Membro PRO
             </span>
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50 pb-12">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </main>

        {/* Debug Footer */}
        <div className="bg-slate-900 text-slate-400 text-xs py-1 px-4 flex justify-between items-center border-t border-slate-700 absolute bottom-0 w-full z-10">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
               <Activity className="w-3 h-3 mr-1 text-green-500" />
               Status: Online
            </span>
            <span className="hidden sm:inline">UID: {currentUser._id}</span>
            <span className="hidden sm:inline">Env: {window.location.hostname}</span>
          </div>
          <button 
             onClick={() => setIsDebugOpen(!isDebugOpen)}
             className="hover:text-white flex items-center bg-slate-800 px-2 py-0.5 rounded"
          >
            <Terminal className="w-3 h-3 mr-1" />
            {isDebugOpen ? 'Fechar Logs' : 'Debug'}
          </button>
        </div>

        {/* Debug Console Overlay */}
        {isDebugOpen && (
          <div className="absolute bottom-8 left-0 right-0 bg-slate-900/95 border-t border-slate-700 h-64 overflow-y-auto p-4 z-20 text-xs font-mono text-green-400 shadow-xl backdrop-blur-sm">
             <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
               <strong className="text-white">System Logs</strong>
               <button onClick={() => setIsDebugOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
             </div>
             {debugLogs.length === 0 ? (
               <div className="text-slate-500 italic">Nenhum log registrado.</div>
             ) : (
               debugLogs.map((log, i) => (
                 <div key={i} className="mb-1 border-b border-slate-800/50 pb-0.5">{log}</div>
               ))
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
