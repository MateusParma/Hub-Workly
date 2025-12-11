import React, { useState, useEffect, ReactNode, ErrorInfo, Component } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PartnerDirectory from './components/PartnerDirectory';
import MyCoupons from './components/MyCoupons';
import Settings from './components/Settings';
import { Company } from './types';
import { fetchCompanyById } from './services/bubbleService';
import { Loader2, LogIn, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component robusto
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ color: '#1e293b', marginBottom: '10px' }}>Ops! Algo deu errado.</h1>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            Ocorreu um erro ao carregar o aplicativo.
          </p>
          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#ef4444', fontFamily: 'monospace', fontSize: '12px', maxWidth: '500px', overflow: 'auto', marginBottom: '20px', textAlign: 'left' }}>
            {this.state.error?.message || "Erro desconhecido"}
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [userIsPro, setUserIsPro] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<Company | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Safety Timeout: Se a auth demorar mais que 6 segundos, força o fim
    const safetyTimer = setTimeout(() => {
      if (isMounted && authLoading) {
        console.warn("Forçando fim do carregamento por timeout.");
        setAuthLoading(false);
        setLoadingError("O servidor demorou para responder. Verifique sua conexão.");
      }
    }, 6000);

    const initSession = async () => {
      try {
        // 1. Tenta pegar o ID da URL (?uid=123)
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');

        if (uid) {
          console.log("Iniciando login para:", uid);
          const company = await fetchCompanyById(uid);
          if (isMounted) {
            if (company) {
              setCurrentUser(company);
            } else {
              console.warn("Usuário não encontrado.");
            }
          }
        } 
      } catch (err: any) {
        console.error("Erro na sessão:", err);
        if (isMounted) setLoadingError(err.message || "Erro desconhecido");
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setAuthLoading(false);
        }
      }
    };

    initSession();
    return () => { isMounted = false; clearTimeout(safetyTimer); };
  }, []);

  const handleLogin = () => {
    alert("Para fazer login, acesse através do seu painel no Workly App.");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Autenticando com Workly...</p>
        <p className="text-xs text-slate-400 mt-2">Isso não deve demorar mais que alguns segundos.</p>
      </div>
    );
  }

  // Se não estiver logado, mostra tela de bloqueio
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h1>
          <p className="text-slate-500 mb-6">
            Este hub é exclusivo para empresas parceiras. Por favor, acesse através do botão "Clube de Vantagens" dentro do seu aplicativo.
          </p>
          
          {loadingError && (
             <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center text-left">
               <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
               <span>Erro: {loadingError}</span>
             </div>
          )}

          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Voltar para o App
          </button>
          
          {/* Debug helper para facilitar testes */}
          <div className="mt-8 pt-4 border-t border-slate-100">
             <p className="text-xs text-slate-400 mb-2">Modo Desenvolvedor / Fallback</p>
             <button 
               onClick={() => {
                 window.location.href = window.location.pathname + "?uid=mock_user";
               }}
               className="text-xs text-blue-500 hover:underline"
             >
               Entrar com Usuário de Teste (Mock)
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