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

// Mapeia os dados (seja de User ou Empresa) para nossa interface Company
const mapBubbleToCompany = (item: any): Company => {
  if (!item) return MOCK_COMPANIES[0];
  
  let generatedCoupons: Coupon[] = [];
  
  // 1. Tenta ler a Lista_Cupons (Prioridade)
  const listKey = item['Lista_cupons'] ? 'Lista_cupons' : 'Lista_Cupons';
  
  if (Array.isArray(item[listKey])) {
      generatedCoupons = item[listKey].map((c: any) => {
          if (typeof c === 'object') return mapBubbleToCoupon(c);
          return null;
      }).filter((c): c is Coupon => c !== null);
  }

  // 2. Fallback: Codigo Promocional antigo (caso não tenha lista)
  if (generatedCoupons.length === 0) {
      const promoCode = item['Codigo_Promocional'] || item['codigo_promocional'] || item['promocode'];
      if (promoCode) {
        generatedCoupons.push({
          id: `coupon-${item._id}`,
          code: promoCode,
          description: 'Desconto Parceiro',
          discountValue: 'Verificar'
        });
      }
  }

  // Mapeamento Híbrido: Tenta campos da Tabela Empresa E da Tabela User
  return {
    _id: item._id,
    Name: item['Nome da empresa'] || item['Nome'] || item['name'] || item['Name'] || "Empresa Sem Nome",
    Description: item['Descricao'] || item['descricao'] || item['Biografio'] || "",
    Logo: cleanImageUrl(item['Logo'] || item['logo'] || item['Logo_Capa'] || item['Img_Perfil']),
    Category: item['Categoria'] || item['categoria'] || item['Setor de Atuação'] || "Parceiro", 
    Website: item['website'] || item['Website'] || item['Site'] || "",
    Phone: item['Contato'] || item['contato'] || item['Telefone'] || "",
    Address: item['Morada'] || item['morada'] || item['Endereco'] || "",
    // @ts-ignore
    Email: item['email'] || item['Email'] || item['authentication']?.email || "", 
    IsPartner: true, 
    Coupons: generatedCoupons
  };
};

const fetchWithFallback = async (targetUrl: string, signal?: AbortSignal, method: string = 'GET', body?: any) => {
  let lastError;
  const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, signal };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(targetUrl, options);
    if (response.ok) {
        if (method === 'PATCH' || method === 'POST') return true;
        return await response.json();
    }
  } catch (e: any) {
    lastError = e;
  }
  
  // Tenta proxy apenas para GET se falhar direto
  if (method === 'GET') {
      try {
        const proxy1 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxy1, { method: 'GET', signal });
        if (response.ok) return await response.json();
      } catch (e) { lastError = e; }
  }

  return null; 
};

// Helper para buscar em possíveis nomes de tabela (Case Sensitive do Bubble)
const fetchFromTableVariants = async (id: string, tableBaseName: string, signal?: AbortSignal) => {
    const variants = [tableBaseName, tableBaseName.toLowerCase(), tableBaseName.charAt(0).toUpperCase() + tableBaseName.slice(1).toLowerCase()];
    // Remove duplicatas
    const uniqueVariants = [...new Set(variants)];

    for (const tableName of uniqueVariants) {
        const url = `${BUBBLE_API_ROOT}/${tableName}/${id}`;
        console.log(`[API] Tentando buscar em ${tableName}...`);
        const result = await fetchWithFallback(url, signal);
        if (result && (result.response || result._id)) return result.response || result;
    }
    return null;
};

// Busca detalhes expandidos dos cupons se vierem apenas como IDs
const enrichCoupons = async (companyData: any, signal?: AbortSignal) => {
    const listKey = companyData['Lista_cupons'] ? 'Lista_cupons' : 'Lista_Cupons';
    
    if (companyData[listKey] && Array.isArray(companyData[listKey]) && typeof companyData[listKey][0] === 'string') {
        try {
            const couponIds = companyData[listKey];
            const couponPromises = couponIds.map((cId: string) => 
                fetchFromTableVariants(cId, 'Cupom', signal)
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

  // 1. TENTATIVA: Buscar como USUÁRIO
  console.log(`[AUTH] Buscando ID ${id} na tabela User...`);
  const userObj = await fetchFromTableVariants(id, 'User', controller.signal);

  if (userObj) {
      console.log(`[AUTH] Usuário encontrado.`);
      // Verifica se tem link para empresa
      const empresaId = userObj['empresa'] || userObj['Empresa'];
      
      if (empresaId) {
          console.log(`[AUTH] Link 'empresa' encontrado (${empresaId}). Buscando dados da empresa...`);
          // Se tiver link, busca a empresa vinculada
          const empresaObj = await fetchFromTableVariants(empresaId, 'Empresa', controller.signal);
          if (empresaObj) {
              companyData = empresaObj;
          } else {
              console.warn(`[AUTH] Link existia mas empresa ${empresaId} não retornou dados. Usando dados do User.`);
              companyData = userObj; // Fallback se o link estiver quebrado
          }
      } else {
          console.log(`[AUTH] Usuário não tem campo 'empresa' vinculado. Usando o próprio User como empresa (Modo Legado).`);
          // MODO LEGADO: O próprio User contém os dados (comportamento antigo)
          companyData = userObj;
      }
  } 
  else {
      // 2. TENTATIVA: Buscar direto como EMPRESA (caso o ID passado já seja da empresa)
      console.log(`[AUTH] ID não encontrado em User. Tentando direto em Empresa...`);
      companyData = await fetchFromTableVariants(id, 'Empresa', controller.signal);
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
      Name: "Erro: Não encontrada", 
      Description: "Não foi possível localizar este ID nas tabelas 'User' ou 'Empresa'. Verifique as permissões de privacidade no Bubble." 
  };
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  try {
      // Tenta buscar na tabela Empresa primeiro
      let url = `${BUBBLE_API_ROOT}/Empresa?t=${Date.now()}`;
      let json = await fetchWithFallback(url, controller.signal);
      
      if (!json || !json.response) {
         // Fallback para tabela User se Empresa estiver vazia ou proibida
         url = `${BUBBLE_API_ROOT}/User?t=${Date.now()}`;
         json = await fetchWithFallback(url, controller.signal);
      }

      if (json && json.response && json.response.results) {
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
  if (data.Name) payload['Nome da empresa'] = data.Name; // Tenta nome novo
  if (data.Name) payload['Nome'] = data.Name; // Tenta nome antigo (User)
  if (data.Phone) payload['Contato'] = data.Phone;
  if (data.Website) payload['website'] = data.Website;
  if (data.Address) payload['morada'] = data.Address;
  if (data.Description) payload['Descricao'] = data.Description;

  // Tenta atualizar onde der (User ou Empresa)
  try {
      // Tenta Empresa primeiro
      await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${id}`, undefined, 'PATCH', payload);
      return true;
  } catch (e) {
      try {
          // Se falhar (ex: 404), tenta User
          await fetchWithFallback(`${BUBBLE_API_ROOT}/User/${id}`, undefined, 'PATCH', payload);
          return true;
      } catch (e2) {
          return false;
      }
  }
};