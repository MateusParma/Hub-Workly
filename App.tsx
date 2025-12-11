import React, { useState, useEffect, ReactNode, ErrorInfo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PartnerDirectory from './components/PartnerDirectory';
import MyCoupons from './components/MyCoupons';
import Settings from './components/Settings';
import { Company } from './types';
import { fetchCompanyById } from './services/bubbleService';
import { Loader2, LogIn } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component robusto (sem dependências externas que podem falhar)
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
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

  useEffect(() => {
    const initSession = async () => {
      setAuthLoading(true);
      
      try {
        // 1. Tenta pegar o ID da URL (?uid=123)
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');

        if (uid) {
          // Busca os dados da empresa no Bubble
          const company = await fetchCompanyById(uid);
          if (company) {
            setCurrentUser(company);
          }
        } 
      } catch (err) {
        console.error("Erro na sessão:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    initSession();
  }, []);

  const handleLogin = () => {
    alert("Para fazer login, acesse através do seu painel no Workly App.");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Autenticando com Workly...</p>
        </div>
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
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Voltar para o App
          </button>
          <div className="mt-6 text-xs text-slate-400">
            Dica para teste: Adicione ?uid=SEU_ID_DO_BUBBLE ao final da URL.
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