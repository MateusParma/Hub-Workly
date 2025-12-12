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
  // Bubble as vezes retorna //s3.amazonaws.com... sem o https:
  if (url.startsWith('//')) return `https:${url}`;
  // Se já vier com http, mantem
  if (url.startsWith('http')) return url;
  return url;
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

  // LOG DE DEBUG: Verifique no Console do navegador o que está chegando
  console.log("🛠️ DADOS BRUTOS DO BUBBLE:", item);
  
  let generatedCoupons: Coupon[] = [];
  
  const listKey = item['Lista_cupons'] ? 'Lista_cupons' : 'Lista_Cupons';
  
  if (Array.isArray(item[listKey])) {
      generatedCoupons = item[listKey].map((c: any) => {
          if (typeof c === 'object') return mapBubbleToCoupon(c);
          return null;
      }).filter((c): c is Coupon => c !== null);
  }

  // Tratamento da Categoria
  let category = "Parceiro";
  const rawCategory = item['Setor de Atuação'] || item['Categoria'] || item['categoria'];
  if (rawCategory) {
      if (Array.isArray(rawCategory)) {
          category = rawCategory.join(', ');
      } else {
          category = String(rawCategory);
      }
  }

  // Tenta extrair o EMAIL de forma robusta
  const rawEmail = 
      item['email'] || 
      item['Email'] || 
      item['authentication']?.email || 
      item['Email_Candidatos'] || 
      "";

  // Mapeamento EXATO baseado nas imagens do Bubble Editor
  return {
    _id: item._id,
    Name: item['Nome da empresa'] || item['Nome'] || item['name'] || "Empresa Sem Nome",
    Description: item['Descricao'] || item['descricao'] || "",
    Logo: cleanImageUrl(item['Logo'] || item['logo'] || item['Logo_Capa']),
    Category: category, 
    Website: item['website'] || item['Website'] || item['Site'] || "",
    Phone: item['Contato'] || item['contato'] || item['Telefone'] || "",
    Address: item['Morada'] || item['morada'] || item['Endereco'] || "",
    Email: rawEmail,
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
            const text = await response.text();
            return text ? JSON.parse(text) : true;
        }
        return await response.json();
    }
  } catch (e: any) {
    lastError = e;
    console.warn("Fetch Error:", e);
  }
  
  // Proxy fallback apenas para GET
  if (method === 'GET') {
      try {
        const proxy1 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxy1, { method: 'GET', signal });
        if (response.ok) return await response.json();
      } catch (e) { lastError = e; }
  }

  return null; 
};

// Helper para buscar em possíveis nomes de tabela
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

// Busca detalhes expandidos dos cupons
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

  // 1. TENTATIVA: Buscar como USUÁRIO (caso o ID passado seja de user)
  const userObj = await fetchFromTableVariants(id, 'User', controller.signal);

  if (userObj) {
      // Se encontrou user, verifica se tem link para empresa
      const empresaId = userObj['empresa'] || userObj['Empresa'];
      
      if (empresaId) {
          console.log("Encontrado User, buscando empresa vinculada:", empresaId);
          const empresaObj = await fetchFromTableVariants(empresaId, 'Empresa', controller.signal);
          if (empresaObj) {
              companyData = empresaObj;
          } else {
              companyData = userObj; 
          }
      } else {
          // Se falhou user ou não tem empresa vinculada, tentamos buscar direto na tabela Empresa
          if (!userObj['authentication']) {
             const directCompany = await fetchFromTableVariants(id, 'Empresa', controller.signal);
             companyData = directCompany || userObj;
          } else {
             companyData = userObj;
          }
      }
  } 
  else {
      // 2. TENTATIVA: Buscar direto como EMPRESA
      console.log("User não encontrado, buscando direto na tabela Empresa...");
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
      Description: "Não foi possível localizar este ID nas tabelas 'User' ou 'Empresa'. Verifique as Privacy Rules." 
  };
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  try {
      let url = `${BUBBLE_API_ROOT}/Empresa?t=${Date.now()}`;
      let json = await fetchWithFallback(url, controller.signal);
      
      if (!json || !json.response || json.response.results.length === 0) {
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
  
  if (data.Name) payload['Nome da empresa'] = data.Name;
  if (data.Phone) payload['Contato'] = data.Phone;
  if (data.Website) payload['website'] = data.Website;
  if (data.Address) payload['Morada'] = data.Address; 
  if (data.Description) payload['Descricao'] = data.Description;
  
  // Campo de Logo:
  // Se for Base64 (data:image...), tentamos enviar.
  // Nota: O Bubble Data API para campos 'image' normalmente espera uma URL (S3).
  // Porém, algumas configurações aceitam conteúdo encoded. Se falhar, o ideal é usar um plugin de upload.
  if (data.Logo) payload['Logo'] = data.Logo;

  console.log("Enviando Update para Empresa:", id, payload);

  try {
      await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${id}`, undefined, 'PATCH', payload);
      return true;
  } catch (e) {
      console.warn("Falha ao atualizar tabela Empresa.");
      return false;
  }
};

// --- FUNÇÕES DE CUPOM ---

export const createCoupon = async (companyId: string, couponData: any): Promise<string | null> => {
    const payload = {
        codigo: couponData.code,
        descricao: couponData.description,
        desconto: couponData.discountValue,
        max_usos: Number(couponData.maxUses) || 0,
        validade: couponData.expiryDate,
        ativo: true,
        Dono: companyId 
    };

    console.log("Criando cupom...", payload);
    const result = await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom`, undefined, 'POST', payload);
    
    if (result && result.id) {
        const newCouponId = result.id;
        try {
            const company = await fetchCompanyById(companyId);
            const currentCoupons = company?.Coupons?.map(c => c.id) || [];
            const newCouponsList = [...currentCoupons, newCouponId];
            
            await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${companyId}`, undefined, 'PATCH', {
                "Lista_cupons": newCouponsList
            });
        } catch (err) {
            console.warn("Cupom criado, erro ao vincular na lista.", err);
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
    const result = await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${couponId}`, undefined, 'DELETE');
    return !!result;
};