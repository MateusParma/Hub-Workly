import { Company, BubbleResponse } from '../types';

// CONFIGURAÇÃO: URL oficial (Bubble exige lowercase no objeto da API geralmente)
// Correção: mudado de /obj/Empresa para /obj/empresa
const BUBBLE_API_BASE = "https://workly.pt/version-test/api/1.1/obj/empresa";

// Mock Data para Fallback
const MOCK_COMPANIES: Company[] = [
  {
    _id: "mock1",
    Name: "Tech Solutions (Demo)",
    Description: "Empresa de tecnologia focada em inovação. (Dados de Exemplo - API Bloqueada)",
    Logo: "https://ui-avatars.com/api/?name=Tech+Solutions&background=0D8ABC&color=fff",
    Category: "Tecnologia",
    IsPartner: true,
    Coupons: [
      { id: 'c1', code: 'TECH10', description: '10% OFF em serviços', discountValue: '10%' }
    ]
  }
];

// Helper para limpar URLs de imagem
const cleanImageUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith('//') ? `https:${url}` : url;
};

// Helper para mapear resposta
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

// Fetch Robusto com Multi-Proxy
const fetchWithFallback = async (targetUrl: string, signal: AbortSignal) => {
  // 1. Tentar Direto (Funciona se CORS estiver liberado ou Localhost)
  try {
    console.log(`[API] Tentando Direto: ${targetUrl}`);
    const response = await fetch(targetUrl, { method: 'GET', signal });
    if (response.ok) return await response.json();
    if (response.status === 404) throw new Error("404 Não Encontrado (Verifique ID ou URL)");
  } catch (e) {
    console.warn("[API] Direto falhou, tentando Proxy 1...");
  }

  // 2. Tentar Proxy 1 (corsproxy.io)
  try {
    const proxy1 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    console.log(`[API] Tentando Proxy 1: ${proxy1}`);
    const response = await fetch(proxy1, { method: 'GET', signal });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn("[API] Proxy 1 falhou, tentando Proxy 2...");
  }

  // 3. Tentar Proxy 2 (allorigins)
  try {
    const proxy2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    console.log(`[API] Tentando Proxy 2: ${proxy2}`);
    const response = await fetch(proxy2, { method: 'GET', signal });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn("[API] Proxy 2 falhou.");
  }

  throw new Error("Todas as tentativas de conexão falharam.");
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // Adiciona timestamp para evitar cache
    const url = `${BUBBLE_API_BASE}?t=${Date.now()}`;
    const json: BubbleResponse<any> = await fetchWithFallback(url, controller.signal);
    
    clearTimeout(timeoutId);
    
    if (!json.response || !json.response.results) return MOCK_COMPANIES;
    return json.response.results.map(mapBubbleToCompany);

  } catch (error: any) {
    console.error("ERRO LISTA:", error);
    clearTimeout(timeoutId);
    return MOCK_COMPANIES;
  }
};

export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  if (!id) return null;
  if (id === 'mock_user') return { ...MOCK_COMPANIES[0], _id: 'mock', Name: "Modo Teste" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `${BUBBLE_API_BASE}/${id}`;
    const json = await fetchWithFallback(url, controller.signal);
    clearTimeout(timeoutId);
    
    if (!json.response) throw new Error("Resposta vazia do Bubble");
    return mapBubbleToCompany(json.response);

  } catch (error: any) {
    console.error("ERRO ID:", error);
    clearTimeout(timeoutId);
    
    return { 
        ...MOCK_COMPANIES[0], 
        _id: id, 
        Name: "Erro ao Carregar Dados", 
        Description: `Não conseguimos ler os dados do ID: ${id}. Erro: ${error.message}. Tente verificar se o ID está correto na URL.` 
    };
  }
};