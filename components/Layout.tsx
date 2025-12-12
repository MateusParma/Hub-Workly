
import React, { useState } from 'react';
import { LayoutDashboard, Users, Ticket, Settings, Menu, X, Crown, LogOut, Terminal, Activity, Camera, ScanLine, Database } from 'lucide-react';
import { Company } from '../types';
import QRScannerModal from './QRScannerModal';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  currentUser: Company;
  debugLogs?: string[]; // Propriedade opcional para logs
  onToggleEnv?: () => void; // Nova prop para alternar ambiente
  isTestEnv?: boolean; // Nova prop para saber se está em teste
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, currentUser, debugLogs = [], onToggleEnv, isTestEnv = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const NavItem = ({ icon: Icon, label, viewId, onClick }: { icon: any, label: string, viewId?: string, onClick?: () => void }) => {
    const active = currentView === viewId;
    return (
      <button
        onClick={() => {
          if (onClick) onClick();
          else if (viewId) onChangeView(viewId);
          setIsSidebarOpen(false);
        }}
        className={`flex items-center w-full px-4 py-3 mb-1 rounded-lg transition-colors ${
          active 
            ? 'bg-white text-orange-600 font-bold shadow-sm' 
            : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
        }`}
      >
        <Icon className={`w-5 h-5 mr-3 ${active ? 'text-orange-600' : 'text-slate-400'}`} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#FFFDFB] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Theme Light Blue */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[#E5EAEF] border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Workly<span className="text-orange-600">Hub</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-80px)] justify-between">
          <nav className="p-4 mt-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Menu Principal</div>
            <NavItem icon={LayoutDashboard} label="Dashboard" viewId="dashboard" />
            <NavItem icon={Users} label="Empresas Parceiras" viewId="partners" />
            <NavItem icon={Ticket} label="Meus Cupons" viewId="coupons" />
            
            <div className="my-2"></div>
            <NavItem 
                icon={ScanLine} 
                label="Escanear Código" 
                onClick={() => setIsScannerOpen(true)}
            />
            
            <div className="my-6 border-t border-slate-200/60 mx-4"></div>
            
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Configurações</div>
            <NavItem icon={Settings} label="Minha Conta" viewId="settings" />
          </nav>

          {/* User Profile */}
          <div className="p-4 bg-[#E5EAEF] border-t border-slate-200/60">
            <button 
              onClick={() => window.location.href = window.location.pathname} // Logout simples
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-white/50 rounded-lg transition-colors font-medium"
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shadow-sm">
          <div className="flex items-center">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-slate-500 hover:text-slate-700 mr-4"
              >
                <Menu className="w-6 h-6" />
             </button>
          </div>

          <div className="flex items-center space-x-4 ml-auto">
             <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">
                 <Crown className="w-3 h-3 mr-1" /> Membro PRO
             </span>
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{currentUser.Name}</p>
                <p className="text-xs text-slate-500 truncate max-w-[150px]">{currentUser.Category}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-orange-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                {currentUser.Logo ? (
                  <img src={currentUser.Logo} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-orange-700 font-bold text-sm">{currentUser.Name.substring(0,2).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#FFFDFB] pb-12">
           {/* Admin Environment Indicator */}
           {currentUser.ADM && isTestEnv && (
               <div className="mb-4 bg-yellow-100 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg flex items-center animate-pulse">
                   <Database className="w-4 h-4 mr-2" />
                   <span className="text-sm font-bold">AMBIENTE DE TESTE ATIVO</span>
               </div>
           )}
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </main>

        {/* Debug Footer */}
        <div className="bg-slate-900 text-slate-400 text-xs py-1 px-4 flex justify-between items-center border-t border-slate-700 absolute bottom-0 w-full z-10">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
               <Activity className={`w-3 h-3 mr-1 ${isTestEnv ? 'text-yellow-500' : 'text-green-500'}`} />
               Env: {isTestEnv ? 'TEST' : 'LIVE'}
            </span>
            <span className="hidden sm:inline">UID: {currentUser._id}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botão de Troca de Ambiente (Apenas Admins) */}
            {currentUser.ADM && (
                <button 
                    onClick={onToggleEnv}
                    className={`flex items-center px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                        isTestEnv ? 'bg-yellow-600 text-black hover:bg-yellow-500' : 'bg-green-700 text-white hover:bg-green-600'
                    }`}
                >
                    <Database className="w-3 h-3 mr-1" />
                    {isTestEnv ? "Switch to LIVE" : "Switch to TEST"}
                </button>
            )}

            <button 
               onClick={() => setIsDebugOpen(!isDebugOpen)}
               className="hover:text-white flex items-center bg-slate-800 px-2 py-0.5 rounded"
            >
              <Terminal className="w-3 h-3 mr-1" />
              {isDebugOpen ? 'Fechar Logs' : 'Debug'}
            </button>
          </div>
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

      {/* SCANNER MODAL */}
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} currentUser={currentUser} />
    </div>
  );
};

export default Layout;