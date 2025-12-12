import { Company, BubbleResponse } from '../types';

// CONFIGURAÇÃO: Base da URL sem o nome da tabela
const BUBBLE_API_ROOT = "https://workly.pt/version-test/api/1.1/obj";

// Mock Data para Fallback (apenas se tudo falhar)
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

// Mapeia os dados brutos do Bubble para nossa interface Company
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

// Função genérica de fetch com tentativas em proxies
const fetchWithFallback = async (targetUrl: string, signal: AbortSignal) => {
  let lastError;

  // 1. Tentar Direto (Caso CORS esteja habilitado ou Same-Origin)
  try {
    const response = await fetch(targetUrl, { method: 'GET', signal });
    if (response.ok) return await response.json();
    if (response.status === 404) throw new Error("404_NOT_FOUND"); // Identificador específico para pular tentativas inúteis
  } catch (e: any) {
    if (e.message === "404_NOT_FOUND") throw e; // Se o Bubble disse que não existe, não adianta tentar proxy
    lastError = e;
  }

  // 2. Tentar Proxy 1 (corsproxy.io)
  try {
    const proxy1 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxy1, { method: 'GET', signal });
    if (response.ok) {
      const data = await response.json();
      // Verificação se o Bubble retornou erro dentro do JSON (comum em proxies)
      if (data.statusCode && data.statusCode >= 400) throw new Error("BUBBLE_ERROR_IN_BODY");
      return data;
    }
  } catch (e) {
    lastError = e;
  }

  // 3. Tentar Proxy 2 (allorigins)
  try {
    const proxy2 = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxy2, { method: 'GET', signal });
    if (response.ok) {
        const data = await response.json();
        if (data.contents) {
            const parsed = JSON.parse(data.contents);
            // Verifica erros encapsulados no body do AllOrigins
            if (parsed.statusCode && parsed.statusCode >= 400) throw new Error("BUBBLE_ERROR_IN_BODY");
            if (parsed.body && parsed.body.status === "MISSING_DATA") throw new Error("BUBBLE_MISSING_DATA");
            return parsed;
        }
    }
  } catch (e) {
    lastError = e;
  }

  throw new Error("Falha de conexão ou dado não encontrado.");
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  // Lista de possíveis nomes de tabela (Bubble é Case Sensitive na API)
  // Tenta 'Empresa' (padrão) primeiro, depois minúsculo.
  const tablesToTry = ['Empresa', 'empresa']; 
  
  for (const tableName of tablesToTry) {
    try {
      const url = `${BUBBLE_API_ROOT}/${tableName}?t=${Date.now()}`; // timestamp evita cache
      console.log(`[LISTA] Tentando tabela: ${tableName}`);
      
      const json = await fetchWithFallback(url, controller.signal);
      
      if (json.response && json.response.results) {
          clearTimeout(timeoutId);
          return json.response.results.map(mapBubbleToCompany);
      }
    } catch (error) {
      console.warn(`[LISTA] Falha na tabela ${tableName}, tentando próxima...`);
    }
  }

  clearTimeout(timeoutId);
  console.error("[LISTA] Todas as tentativas falharam.");
  return MOCK_COMPANIES;
};

export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  if (!id) return null;
  if (id === 'mock_user') return { ...MOCK_COMPANIES[0], _id: 'mock', Name: "Modo Teste" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  // ESTRATÉGIA MULTI-ENDPOINT
  // O erro do log mostra "Missing object of type empresa".
  // Vamos tentar variações do nome da tabela. 
  const tablesToTry = ['Empresa', 'empresa', 'User', 'user'];
  
  for (const tableName of tablesToTry) {
    try {
      const url = `${BUBBLE_API_ROOT}/${tableName}/${id}`;
      console.log(`[ID] Tentando buscar ID ${id} na tabela: ${tableName}`);
      
      const json = await fetchWithFallback(url, controller.signal);
      
      // Sucesso!
      clearTimeout(timeoutId);
      
      if (json.response) return mapBubbleToCompany(json.response);
      if (json._id) return mapBubbleToCompany(json); // Algumas respostas vêm diretas
      
    } catch (error: any) {
      // Se for um erro de "Missing Data", continuamos o loop para tentar a próxima tabela
      // Se for erro de rede, também continuamos.
      console.warn(`[ID] Não encontrado em ${tableName}: ${error.message}`);
    }
  }

  clearTimeout(timeoutId);
  
  // Se chegou aqui, não encontrou em nenhuma tabela
  return { 
      ...MOCK_COMPANIES[0], 
      _id: id, 
      Name: "Erro ao Carregar Dados", 
      Description: `Não foi possível encontrar o ID ${id} nas tabelas: ${tablesToTry.join(', ')}. Verifique se o ID está correto e se os dados estão públicos no Bubble.` 
  };
};