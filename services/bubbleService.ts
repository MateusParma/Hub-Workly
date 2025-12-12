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
        if (method === 'PATCH' || method === 'POST' || method === 'DELETE') {
            // Se tiver conteúdo JSON, retorna, senão true
            const text = await response.text();
            return text ? JSON.parse(text) : true;
        }
        return await response.json();
    }
  } catch (e: any) {
    lastError = e;
    console.warn("Fetch Error:", e);
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
    const uniqueVariants = [...new Set(variants)];

    for (const tableName of uniqueVariants) {
        const url = `${BUBBLE_API_ROOT}/${tableName}/${id}`;
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
  const userObj = await fetchFromTableVariants(id, 'User', controller.signal);

  if (userObj) {
      // Verifica se tem link para empresa
      const empresaId = userObj['empresa'] || userObj['Empresa'];
      
      if (empresaId) {
          // Se tiver link, busca a empresa vinculada
          const empresaObj = await fetchFromTableVariants(empresaId, 'Empresa', controller.signal);
          if (empresaObj) {
              companyData = empresaObj;
          } else {
              companyData = userObj; // Fallback se o link estiver quebrado
          }
      } else {
          // MODO LEGADO: O próprio User contém os dados
          companyData = userObj;
      }
  } 
  else {
      // 2. TENTATIVA: Buscar direto como EMPRESA
      companyData = await fetchFromTableVariants(id, 'Empresa', controller.signal);
  }

  if (companyData) {
      companyData = await enrichCoupons(companyData, controller.signal);
      clearTimeout(timeoutId);
      return mapBubbleToCompany(companyData);
  }

  clearTimeout(timeoutId);
  return { 
      ...MOCK_COMPANIES[0], 
      _id: id, 
      Name: "Erro: Não encontrada", 
      Description: "Não foi possível localizar este ID nas tabelas 'User' ou 'Empresa'." 
  };
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  try {
      let url = `${BUBBLE_API_ROOT}/Empresa?t=${Date.now()}`;
      let json = await fetchWithFallback(url, controller.signal);
      
      if (!json || !json.response) {
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
  
  // Mapeamento exato para os campos do Bubble (Case Sensitive)
  // Baseado no mapBubbleToCompany, estes são os campos mais prováveis
  if (data.Name) payload['Nome da empresa'] = data.Name;
  if (data.Phone) payload['Contato'] = data.Phone;
  if (data.Website) payload['website'] = data.Website;
  if (data.Address) payload['morada'] = data.Address;
  if (data.Description) payload['Descricao'] = data.Description;
  
  // Campo de Logo
  if (data.Logo) payload['Logo'] = data.Logo;

  console.log("Enviando Update para Empresa:", id, payload);

  try {
      await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${id}`, undefined, 'PATCH', payload);
      return true;
  } catch (e) {
      console.warn("Falha ao atualizar tabela Empresa, tentando User...");
      try {
          // Fallback para tabela User caso a estrutura seja antiga
          const userPayload: any = {};
          if (data.Name) userPayload['Nome'] = data.Name;
          if (data.Phone) userPayload['Telefone'] = data.Phone;
          if (data.Logo) userPayload['Img_Perfil'] = data.Logo;
          // ... outros campos ...
          
          await fetchWithFallback(`${BUBBLE_API_ROOT}/User/${id}`, undefined, 'PATCH', payload);
          return true;
      } catch (e2) {
          return false;
      }
  }
};

// --- FUNÇÕES DE CUPOM ---

export const createCoupon = async (companyId: string, couponData: any): Promise<string | null> => {
    // 1. Cria o Cupom
    const payload = {
        codigo: couponData.code,
        descricao: couponData.description,
        desconto: couponData.discountValue,
        max_usos: Number(couponData.maxUses) || 0,
        validade: couponData.expiryDate,
        ativo: true,
        Dono: companyId // Tenta vincular diretamente se o Bubble permitir
    };

    console.log("Criando cupom...", payload);
    const result = await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom`, undefined, 'POST', payload);
    
    if (result && result.id) {
        const newCouponId = result.id;
        
        // 2. Atualiza a lista da empresa (Isso é crucial no Bubble se não tiver Backend Workflow automático)
        // Precisamos ler a lista atual primeiro para não sobrescrever? 
        // A API 'PATCH' do Bubble substitui arrays. O ideal é usar o endpoint específico de lista se existir, 
        // mas aqui vamos fazer: Ler -> Adicionar -> Salvar
        try {
            const company = await fetchCompanyById(companyId);
            const currentCoupons = company?.Coupons?.map(c => c.id) || [];
            const newCouponsList = [...currentCoupons, newCouponId];
            
            await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${companyId}`, undefined, 'PATCH', {
                "Lista_cupons": newCouponsList
            });
        } catch (err) {
            console.warn("Cupom criado, mas falha ao vincular na lista da empresa. Verifique se o campo 'Dono' resolveu.", err);
        }
        
        return newCouponId;
    }
    return null;
};

export const updateCoupon = async (couponId: string, couponData: any): Promise<boolean> => {
    const payload: any = {};
    if (couponData.code) payload.codigo = couponData.code;
    if (couponData.description) payload.descricao = couponData.description;
    if (couponData.discountValue) payload.desconto = couponData.discountValue;
    if (couponData.maxUses) payload.max_usos = Number(couponData.maxUses);
    if (couponData.expiryDate) payload.validade = couponData.expiryDate;
    if (couponData.status) payload.ativo = (couponData.status === 'active');

    const result = await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${couponId}`, undefined, 'PATCH', payload);
    return !!result;
};

export const deleteCoupon = async (couponId: string): Promise<boolean> => {
    // No Bubble, geralmente deletamos o objeto
    const result = await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${couponId}`, undefined, 'DELETE');
    return !!result;
};