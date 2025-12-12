import { Company, BubbleResponse } from '../types';

// CONFIGURAÇÃO: URL oficial baseada no seu app Workly
const BUBBLE_API_URL = "https://workly.pt/version-test/api/1.1/obj/Empresa";

// Mock Data (Dados de teste para quando a API falhar ou der CORS)
const MOCK_COMPANIES: Company[] = [
  {
    _id: "mock1",
    Name: "Tech Solutions (Demo)",
    Description: "Empresa de tecnologia focada em inovação. (Dados de Exemplo - API Bloqueada por CORS)",
    Logo: "https://ui-avatars.com/api/?name=Tech+Solutions&background=0D8ABC&color=fff",
    Category: "Tecnologia",
    IsPartner: true,
    Coupons: [
      { id: 'c1', code: 'TECH10', description: '10% OFF em serviços', discountValue: '10%' }
    ]
  },
  {
    _id: "mock2",
    Name: "Café & Co (Demo)",
    Description: "O melhor café da cidade para suas reuniões.",
    Logo: "https://ui-avatars.com/api/?name=Cafe+Co&background=D35400&color=fff",
    Category: "Alimentação",
    Website: "https://cafe.com",
    IsPartner: true,
    Coupons: []
  }
];

// Helper para limpar URLs de imagem do Bubble
const cleanImageUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith('//') ? `https:${url}` : url;
};

// Helper para mapear resposta crua do Bubble para nosso tipo Company
const mapBubbleToCompany = (item: any): Company => {
  const generatedCoupons = [];
  const promoCode = item['Codigo_Promocional'] || item['codigo_promocional'] || item['promocode'];
  
  if (promoCode) {
    generatedCoupons.push({
      id: `coupon-${item._id}`,
      code: promoCode,
      description: 'Desconto Exclusivo Parceiro',
      discountValue: 'Verificar'
    });
  }

  return {
    _id: item._id,
    Name: item['Nome da empresa'] || item['Nome'] || item.Name || "Empresa Sem Nome",
    Description: item['Descricao'] || item['descricao'] || item.Description || "",
    Logo: cleanImageUrl(item['Logo'] || item['logo']),
    Category: item['Categoria'] || item['categoria'] || "Parceiro", 
    Website: item['website'] || item['Website'] || "",
    Phone: item['Contato'] || item['contato'] || "",
    Address: item['Morada'] || item['morada'] || "",
    IsPartner: true, 
    Coupons: generatedCoupons
  };
};

// Função genérica de Fetch com Retry via Proxy
const fetchWithFallback = async (url: string, signal: AbortSignal) => {
  try {
    // TENTATIVA 1: Direta
    // Importante: NÃO enviar headers customizados em GET para evitar Preflight CORS (OPTIONS)
    console.log(`[API] Tentando acesso direto: ${url}`);
    const response = await fetch(url, { 
      method: 'GET',
      signal
    });

    if (!response.ok) throw new Error(`Direct Error ${response.status}`);
    return await response.json();

  } catch (directError) {
    console.warn("[API] Acesso direto falhou (provável CORS ou bloqueio). Tentando Proxy...", directError);
    
    // TENTATIVA 2: Via Proxy Público (Solução para Vercel -> Bubble)
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const proxyResponse = await fetch(proxyUrl, {
        method: 'GET',
        signal
      });
      
      if (!proxyResponse.ok) throw new Error(`Proxy Error ${proxyResponse.status}`);
      return await proxyResponse.json();

    } catch (proxyError: any) {
      throw new Error(`Falha total de conexão (Direta e Proxy). ${proxyError.message}`);
    }
  }
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s total timeout

  try {
    const json: BubbleResponse<any> = await fetchWithFallback(BUBBLE_API_URL, controller.signal);
    clearTimeout(timeoutId);
    
    if (!json.response || !json.response.results) {
         return MOCK_COMPANIES;
    }

    const results = json.response.results;
    if (results.length === 0) return MOCK_COMPANIES;

    return results.map(mapBubbleToCompany);

  } catch (error: any) {
    console.error("FALHA CRÍTICA FETCH COMPANIES:", error);
    clearTimeout(timeoutId);
    return MOCK_COMPANIES;
  }
};

export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  if (id === 'mock_user' || id.startsWith('test')) {
      return { ...MOCK_COMPANIES[0], _id: id, Name: "Minha Empresa (Teste)" };
  }

  const url = `${BUBBLE_API_URL}/${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const json = await fetchWithFallback(url, controller.signal);
    clearTimeout(timeoutId);
    return mapBubbleToCompany(json.response);

  } catch (error: any) {
    console.error("ERRO NO LOGIN:", error);
    clearTimeout(timeoutId);
    
    // Retorna um objeto de erro visível para o usuário saber o que aconteceu
    return { 
        ...MOCK_COMPANIES[0], 
        _id: id, 
        Name: "Erro de Conexão", 
        Description: `Não foi possível baixar os dados do Bubble. Detalhes: ${error.message}. Verifique se as 'Privacy Rules' no Bubble permitem visualização pública.` 
    };
  }
};