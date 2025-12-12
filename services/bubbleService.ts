import { Company, BubbleResponse, Coupon } from '../types';

// CONFIGURAÇÃO: Base da URL
const BUBBLE_API_ROOT = "https://workly.pt/version-test/api/1.1/obj";

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

// Mapeia um objeto Cupom do Bubble para nossa interface Coupon
const mapBubbleToCoupon = (item: any): Coupon => {
    return {
        id: item._id,
        code: item.codigo || item.Code || 'CUPOM',
        description: item.descricao || item.Description || '',
        discountValue: item.desconto || item.Discount || '',
        expiryDate: item.validade || undefined,
        maxUses: item.max_usos || undefined,
        uses: item.usos_atuais || 0,
        status: item.ativo === false ? 'paused' : 'active'
    };
};

// Mapeia os dados da tabela EMPRESA para nossa interface Company
const mapBubbleToCompany = (item: any): Company => {
  if (!item) return MOCK_COMPANIES[0];
  
  let generatedCoupons: Coupon[] = [];
  
  // 1. Tenta ler a Lista_Cupons da tabela Empresa
  if (Array.isArray(item['Lista_cupons']) || Array.isArray(item['Lista_Cupons'])) {
      const rawList = item['Lista_cupons'] || item['Lista_Cupons'];
      generatedCoupons = rawList.map((c: any) => {
          if (typeof c === 'object') return mapBubbleToCoupon(c);
          return null;
      }).filter((c): c is Coupon => c !== null);
  }

  // 2. Fallback: Codigo Promocional antigo
  if (generatedCoupons.length === 0) {
      const promoCode = item['Codigo_Promocional'] || item['codigo_promocional'];
      if (promoCode) {
        generatedCoupons.push({
          id: `coupon-${item._id}`,
          code: promoCode,
          description: 'Desconto Parceiro',
          discountValue: 'Verificar'
        });
      }
  }

  return {
    _id: item._id,
    Name: item['Nome da empresa'] || item['Nome'] || item['name'] || "Empresa Sem Nome",
    Description: item['Descricao'] || item['descricao'] || "",
    Logo: cleanImageUrl(item['Logo'] || item['logo'] || item['Logo_Capa']),
    Category: item['Categoria'] || item['categoria'] || item['Setor de Atuação'] || "Parceiro", 
    Website: item['website'] || item['Website'] || item['Site'] || "",
    Phone: item['Contato'] || item['contato'] || "",
    Address: item['Morada'] || item['morada'] || item['Endereco'] || "",
    // @ts-ignore
    Email: item['email'] || item['Email'] || "", 
    IsPartner: true, 
    Coupons: generatedCoupons
  };
};

const fetchWithFallback = async (targetUrl: string, signal?: AbortSignal, method: string = 'GET', body?: any) => {
  let lastError;
  const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, signal };
  if (body) options.body = JSON.stringify(body);

  try {
    console.log(`[API] ${method} ${targetUrl}`);
    const response = await fetch(targetUrl, options);
    if (response.ok) {
        if (method === 'PATCH' || method === 'POST') return true;
        return await response.json();
    }
  } catch (e: any) {
    lastError = e;
  }
  
  // Tenta proxy apenas para GET
  if (method === 'GET') {
      try {
        const proxy1 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxy1, { method: 'GET', signal });
        if (response.ok) return await response.json();
      } catch (e) { lastError = e; }
  }

  return null; // Retorna null em vez de lançar erro para controlar o fluxo
};

// Busca detalhes expandidos dos cupons se vierem apenas como IDs
const enrichCoupons = async (companyData: any, signal?: AbortSignal) => {
    const listKey = companyData['Lista_cupons'] ? 'Lista_cupons' : 'Lista_Cupons';
    
    if (companyData[listKey] && Array.isArray(companyData[listKey]) && typeof companyData[listKey][0] === 'string') {
        console.log("[ID] Buscando detalhes dos cupons (ids)...");
        try {
            const couponIds = companyData[listKey];
            const couponPromises = couponIds.map((cId: string) => 
                fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${cId}`, signal)
                .then((res: any) => res?.response || res)
                .catch(() => null)
            );
            const couponsDetails = await Promise.all(couponPromises);
            companyData[listKey] = couponsDetails.filter((c: any) => c !== null);
        } catch (err) {
            console.warn("Erro ao enriquecer cupons", err);
        }
    }
    return companyData;
}

export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  if (!id) return null;
  if (id === 'mock_user') return { ...MOCK_COMPANIES[0], _id: 'mock', Name: "Modo Teste" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  let companyData = null;
  let finalTableName = 'Empresa';

  // 1. TENTA BUSCAR COMO SE O ID FOSSE DE UM USUÁRIO (User -> Empresa)
  console.log(`[AUTH] Verificando se ID ${id} é um Usuário...`);
  const userResponse = await fetchWithFallback(`${BUBBLE_API_ROOT}/User/${id}`, controller.signal);
  const userObj = userResponse?.response || userResponse;

  if (userObj && userObj['empresa']) {
      // É um usuário e tem uma empresa vinculada!
      const empresaId = userObj['empresa'];
      console.log(`[AUTH] Usuário encontrado. Redirecionando para Empresa ID: ${empresaId}`);
      
      const empresaResponse = await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${empresaId}`, controller.signal);
      companyData = empresaResponse?.response || empresaResponse;
  } 
  else {
      // Não é usuário ou não tem campo empresa. Tenta buscar direto na tabela Empresa (caso o ID passado já seja da empresa)
      console.log(`[AUTH] ID não é User ou User sem empresa. Tentando buscar direto na tabela Empresa...`);
      const empresaDirectResponse = await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${id}`, controller.signal);
      companyData = empresaDirectResponse?.response || empresaDirectResponse;
  }

  if (companyData) {
      // Busca os cupons detalhados se necessário
      companyData = await enrichCoupons(companyData, controller.signal);
      clearTimeout(timeoutId);
      return mapBubbleToCompany(companyData);
  }

  clearTimeout(timeoutId);
  return { 
      ...MOCK_COMPANIES[0], 
      _id: id, 
      Name: "Erro: Empresa não encontrada", 
      Description: "Verifique se o Usuário tem o campo 'empresa' preenchido no Bubble ou se o ID está correto." 
  };
};

export const fetchCompanies = async (): Promise<Company[]> => {
    // Busca todas as empresas para o diretório
  const controller = new AbortController();
  try {
      const url = `${BUBBLE_API_ROOT}/Empresa?t=${Date.now()}`; // Constraints podem ser adicionados aqui
      const json = await fetchWithFallback(url, controller.signal);
      
      if (json && json.response && json.response.results) {
          // Mapeia resultados
          return json.response.results.map(mapBubbleToCompany);
      }
  } catch (error) {
      console.warn("Erro ao listar empresas");
  }
  return MOCK_COMPANIES;
};

export const updateCompany = async (id: string, data: Partial<Company>): Promise<boolean> => {
  if (!id || id === 'mock' || id.includes('Erro')) return false;

  const payload: any = {};
  // Mapeamento Inverso (App -> Bubble Table Empresa)
  if (data.Name) payload['Nome da empresa'] = data.Name;
  if (data.Phone) payload['Contato'] = data.Phone;
  if (data.Website) payload['website'] = data.Website;
  if (data.Address) payload['morada'] = data.Address;
  if (data.Description) payload['Descricao'] = data.Description;

  // Atualiza na tabela EMPRESA (garantido, pois o ID que temos no objeto Company agora É da empresa)
  try {
      const url = `${BUBBLE_API_ROOT}/Empresa/${id}`;
      console.log(`[UPDATE] Atualizando Empresa/${id}`, payload);
      await fetchWithFallback(url, undefined, 'PATCH', payload);
      return true;
  } catch (e) {
      console.warn(`[UPDATE] Falha ao atualizar empresa.`, e);
      return false;
  }
};