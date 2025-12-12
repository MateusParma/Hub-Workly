import React, { useState, useEffect, ReactNode, ErrorInfo, Component } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PartnerDirectory from './components/PartnerDirectory';
import MyCoupons from './components/MyCoupons';
import Settings from './components/Settings';
import { Company } from './types';
import { fetchCompanyById } from './services/bubbleService';
import { Loader2, LogIn, AlertTriangle, Terminal, Search } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Erro Crítico</h1>
            <p className="text-slate-500 mb-4">O aplicativo encontrou um erro inesperado.</p>
            <div className="bg-red-50 p-3 rounded text-red-700 text-xs font-mono mb-4 text-left overflow-auto max-h-32">
              {this.state.error?.message || "Erro desconhecido"}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [userIsPro, setUserIsPro] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<Company | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [manualUid, setManualUid] = useState('');

  const addLog = (msg: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const loadUser = async (uid: string) => {
    setAuthLoading(true);
    // Limpa o UID de caracteres indesejados (aspas, espaços)
    const cleanUid = uid.replace(/['"\s]/g, '');
    addLog(`Buscando dados para ID: ${cleanUid}`);
    
    try {
      const company = await fetchCompanyById(cleanUid);
      if (company) {
        setCurrentUser(company);
        if (company.Name.includes("Erro")) {
          addLog(`⚠️ Dados retornaram com erro: ${company.Description}`);
        } else {
          addLog("✅ Dados carregados com sucesso!");
          addLog(`Nome: ${company.Name}`);
        }
      } else {
        addLog("❌ Nenhum dado encontrado.");
      }
    } catch (e: any) {
      addLog(`Erro fatal no loadUser: ${e.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    addLog("Iniciando App...");

    const initSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');

      if (uid && isMounted) {
        await loadUser(uid);
      } else {
        addLog("Nenhum UID na URL. Aguardando input.");
        if (isMounted) setAuthLoading(false);
      }
    };

    initSession();
    return () => { isMounted = false; };
  }, []);

  const handleManualLogin = () => {
    if (manualUid) {
      // Atualiza a URL sem recarregar para facilitar share
      const newUrl = `${window.location.pathname}?uid=${manualUid}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      loadUser(manualUid);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-6" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Conectando ao Workly...</h2>
        <div className="w-full max-w-md bg-slate-900 rounded-lg p-4 mt-8 font-mono text-xs text-green-400 h-48 overflow-y-auto shadow-inner">
          <div className="border-b border-slate-700 pb-1 mb-2">System Log</div>
          {debugLog.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h1>
          <p className="text-slate-500 mb-6">
            Não identificamos a empresa na URL.
          </p>

          <div className="mb-6 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase">Testar Manualmente (UID)</label>
            <div className="flex mt-1">
              <input 
                type="text" 
                placeholder="Cole o ID da empresa do Bubble aqui..."
                className="flex-1 border border-slate-300 rounded-l-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={manualUid}
                onChange={(e) => setManualUid(e.target.value)}
              />
              <button 
                onClick={handleManualLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Ex: 1714589... (pegue na URL do Bubble)</p>
          </div>

           {/* Debug Console */}
          <div className="text-left bg-slate-900 p-3 rounded-lg text-xs text-green-400 mb-4 font-mono max-h-32 overflow-auto">
             <div className="font-bold border-b border-slate-700 pb-1 mb-1">Debug Info:</div>
             {debugLog.map((l, i) => <div key={i}>{l}</div>)}
          </div>
          
          <button 
            onClick={() => loadUser('mock_user')}
            className="text-xs text-blue-500 hover:underline"
          >
            Entrar com Dados Fictícios
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'partners':
        return <PartnerDirectory userIsPro={userIsPro} />;
      case 'coupons':
        return <MyCoupons />;
      case 'settings':
        return <Settings currentUser={currentUser} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      userIsPro={userIsPro} 
      onTogglePro={() => setUserIsPro(!userIsPro)}
      currentView={currentView}
      onChangeView={setCurrentView}
      currentUser={currentUser}
      debugLogs={debugLog}
    >
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;