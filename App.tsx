import React, { useState, useEffect, ReactNode, ErrorInfo, Component } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PartnerDirectory from './components/PartnerDirectory';
import MyCoupons from './components/MyCoupons';
import Settings from './components/Settings';
import { Company } from './types';
import { fetchCompanyById } from './services/bubbleService';
import { Loader2, LogIn, AlertTriangle, Terminal } from 'lucide-react';

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

  const addLog = (msg: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  useEffect(() => {
    let isMounted = true;
    addLog("Iniciando App...");

    const initSession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');

        if (uid) {
          addLog(`UID encontrado: ${uid}. Buscando dados...`);
          const company = await fetchCompanyById(uid);
          
          if (isMounted) {
            if (company) {
              addLog("Dados recebidos (pode ser Mock se a API falhou).");
              setCurrentUser(company);
              
              // Se o nome contiver "Modo Demonstração", avisamos que houve erro na API
              if (company.Name.includes("Modo Demonstração") || company.Name.includes("Erro API")) {
                 addLog("⚠️ Aviso: API falhou, usando dados de fallback.");
              }
            } else {
              addLog("❌ Nenhum usuário retornado.");
            }
          }
        } else {
          addLog("Nenhum UID na URL.");
        }
      } catch (err: any) {
        if (isMounted) addLog(`❌ Erro Fatal no useEffect: ${err.message}`);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    initSession();

    return () => { isMounted = false; };
  }, []);

  const handleLogin = () => {
    alert("Login deve ser feito via Workly App principal.");
  };

  if (authLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-6" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Conectando ao Workly...</h2>
        
        {/* Debug Console na tela de Loading para ver erros reais */}
        <div className="w-full max-w-md bg-slate-900 rounded-lg p-4 mt-8 font-mono text-xs text-green-400 h-48 overflow-y-auto shadow-inner border border-slate-700">
          <div className="flex items-center text-slate-400 mb-2 border-b border-slate-700 pb-1">
            <Terminal className="w-3 h-3 mr-2" />
            <span>System Log</span>
          </div>
          {debugLog.map((log, i) => (
            <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">{log}</div>
          ))}
        </div>
        
        <button 
           onClick={() => setAuthLoading(false)}
           className="mt-6 text-sm text-slate-400 underline hover:text-slate-600"
        >
          Demorando muito? Pular carregamento
        </button>
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
            Acesse via Workly App.
          </p>

           {/* Debug Console Simplificado */}
          <div className="text-left bg-red-50 p-3 rounded-lg text-xs text-red-800 mb-4 font-mono max-h-32 overflow-auto">
             <strong>Debug Info:</strong>
             {debugLog.map((l, i) => <div key={i}>{l}</div>)}
          </div>

          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors mb-4"
          >
            Ir para Workly
          </button>
          
          <div className="border-t border-slate-100 pt-4">
             <button 
               onClick={() => {
                 window.location.href = window.location.pathname + "?uid=mock_user";
               }}
               className="text-xs text-blue-500 hover:underline"
             >
               Entrar Modo Teste (Sem Login)
             </button>
          </div>
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