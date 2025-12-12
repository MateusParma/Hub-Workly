import { Company, BubbleResponse } from '../types';

// CONFIGURAÇÃO: URL oficial
// Usando version-test pois geralmente é onde o desenvolvimento ocorre.
// Se em produção, remover 'version-test'.
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

const cleanImageUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith('//') ? `https:${url}` : url;
};

const mapBubbleToCompany = (item: any): Company => {
  if (!item) return MOCK_COMPANIES[0];
  
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

const fetchWithFallback = async (targetUrl: string, signal: AbortSignal) => {
  // 1. Tentar Direto
  try {
    console.log(`[API] Direto: ${targetUrl}`);
    const response = await fetch(targetUrl, { method: 'GET', signal });
    if (response.ok) return await response.json();
    console.warn(`[API] Direto falhou: ${response.status}`);
  } catch (e) {
    console.warn("[API] Erro conexão direta.");
  }

  // 2. Tentar Proxy 1 (corsproxy.io)
  try {
    const proxy1 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    console.log(`[API] Proxy 1: ${proxy1}`);
    const response = await fetch(proxy1, { method: 'GET', signal });
    if (response.ok) return await response.json();
    console.warn(`[API] Proxy 1 falhou: ${response.status}`);
  } catch (e) {
    console.warn("[API] Proxy 1 erro.");
  }

  // 3. Tentar Proxy 2 (allorigins) - Este proxy retorna o JSON dentro de um campo 'contents' stringificado
  try {
    const proxy2 = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    console.log(`[API] Proxy 2: ${proxy2}`);
    const response = await fetch(proxy2, { method: 'GET', signal });
    if (response.ok) {
        const data = await response.json();
        // AllOrigins retorna { contents: "STRING_DO_JSON", status: ... }
        if (data.contents) {
            return JSON.parse(data.contents);
        }
    }
  } catch (e) {
    console.warn("[API] Proxy 2 erro.");
  }

  throw new Error("Falha em todos os métodos de conexão.");
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const url = `${BUBBLE_API_BASE}?t=${Date.now()}`;
    const json = await fetchWithFallback(url, controller.signal);
    clearTimeout(timeoutId);
    
    // Bubble standard response: { response: { results: [...] } }
    if (json.response && json.response.results) {
        return json.response.results.map(mapBubbleToCompany);
    } 
    
    // As vezes o proxy pode ter comido o wrapper 'response'
    if (json.results) {
        return json.results.map(mapBubbleToCompany);
    }

    return MOCK_COMPANIES;

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
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const url = `${BUBBLE_API_BASE}/${id}`;
    const json = await fetchWithFallback(url, controller.signal);
    clearTimeout(timeoutId);
    
    console.log("JSON Recebido (ID):", json);

    // Caso 1: Estrutura Padrão Bubble { response: { ... } }
    if (json.response) {
        return mapBubbleToCompany(json.response);
    }
    
    // Caso 2: Objeto retornado diretamente (alguns proxies ou configs do Bubble)
    if (json._id || json.Name || json['Nome da empresa']) {
        return mapBubbleToCompany(json);
    }

    throw new Error("JSON recebido não possui dados da empresa: " + JSON.stringify(json).substring(0, 100));

  } catch (error: any) {
    console.error("ERRO ID:", error);
    clearTimeout(timeoutId);
    
    return { 
        ...MOCK_COMPANIES[0], 
        _id: id, 
        Name: "Erro ao Carregar Dados", 
        Description: `ID: ${id}. Detalhe: ${error.message}.` 
    };
  }
};