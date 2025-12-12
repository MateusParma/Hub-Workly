
import { Company, BubbleResponse, Coupon, DashboardStats } from '../types';

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
      { id: 'c1', code: 'TECH10', description: '10% OFF em serviços', discountValue: '10%', utilizadores: [] }
    ]
  }
];

const cleanImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http')) return url;
  return url;
};

const mapBubbleToCoupon = (item: any): Coupon => {
    // Normaliza a lista de utilizadores (List of Empresas)
    let utilizadoresList: string[] = [];
    if (Array.isArray(item['Utilizadores'])) {
        utilizadoresList = item['Utilizadores'];
    }

    return {
        id: item._id,
        code: item.codigo || item.Code || 'CUPOM',
        description: item.descricao || item.Description || '',
        discountValue: item.desconto || item.Discount || '',
        expiryDate: item.validade || undefined,
        maxUses: item.max_usos || undefined,
        uses: item.usos_atuais || item.Usos || 0,
        status: item.ativo === false ? 'paused' : 'active',
        utilizadores: utilizadoresList,
        Dono: item['Dono']
    };
};

// Mapeia os dados usando um dicionário opcional de categorias
const mapBubbleToCompany = (item: any, categoryMap: Record<string, string> = {}, extraCoupons: Coupon[] = []): Company => {
  if (!item) return MOCK_COMPANIES[0];

  let generatedCoupons: Coupon[] = [];
  
  const listKey = item['Lista_cupons'] ? 'Lista_cupons' : 'Lista_Cupons';
  if (Array.isArray(item[listKey])) {
      generatedCoupons = item[listKey].map((c: any) => {
          if (typeof c === 'object') return mapBubbleToCoupon(c);
          return null;
      }).filter((c): c is Coupon => c !== null);
  }

  // Fallback para cupons
  if (generatedCoupons.length === 0 && extraCoupons.length > 0) {
      const ownedCoupons = extraCoupons.filter(c => c.Dono === item._id);
      if (ownedCoupons.length > 0) {
          generatedCoupons = ownedCoupons;
      } else if (Array.isArray(item[listKey])) {
          const idsList = item[listKey];
          if (idsList.length > 0 && typeof idsList[0] === 'string') {
               generatedCoupons = extraCoupons.filter(c => idsList.includes(c.id));
          }
      }
  }

  // Mapear Carteira de Cupons (Resgatados) - Campo na tabela Empresa
  let carteiraList: string[] = [];
  if (Array.isArray(item['carteira_cupons'])) {
      carteiraList = item['carteira_cupons'];
  } else if (Array.isArray(item['Carteira_Cupons'])) {
      carteiraList = item['Carteira_Cupons'];
  }

  // Lógica de Categoria
  let category = "Parceiro";
  const rawSetor = item['Setor de Atuação'] || item['Setor'] || item['Categoria'];
  
  if (rawSetor) {
      if (Array.isArray(rawSetor)) {
          const names = rawSetor.map(id => categoryMap[id] || id);
          const cleanNames = names.filter(n => typeof n === 'string' && (!n.includes('x') || n.length < 20));
          if (cleanNames.length > 0) category = cleanNames.join(', ');
      } else if (typeof rawSetor === 'string') {
          if (categoryMap[rawSetor]) category = categoryMap[rawSetor];
          else if (!rawSetor.includes('x') || rawSetor.length < 20) category = rawSetor;
      }
  }

  if (category === "Parceiro" || (category.includes('x') && category.length > 20)) {
     const textCandidates = [item['Categoria_Texto'], item['Setor_Texto'], item['Especialidade_Principal']];
     const validText = textCandidates.find(c => c && typeof c === 'string' && c.length < 30 && !c.includes('x'));
     if (validText) category = validText;
  }

  const rawEmail = item['email'] || item['Email'] || item['authentication']?.email || item['Email_Candidatos'] || "";

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
    Coupons: generatedCoupons,
    CreatedDate: item['Created Date'] || item['Created_Date'],
    carteira_cupons: carteiraList
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
  }
  
  if (method === 'GET') {
      try {
        const proxy1 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxy1, { method: 'GET', signal });
        if (response.ok) return await response.json();
      } catch (e) { lastError = e; }
  }
  return null; 
};

// ... (fetchCategoriesMap, fetchFromTableVariants, enrichCoupons - MANTIDOS IGUAIS) ...
// Busca auxiliar para mapear IDs de Categoria -> Titulo
const fetchCategoriesMap = async (): Promise<Record<string, string>> => {
    const map: Record<string, string> = {};
    try {
        let url = `${BUBBLE_API_ROOT}/Categoria`;
        let result = await fetchWithFallback(url);
        if (!result || !result.response) {
            url = `${BUBBLE_API_ROOT}/Categorias`;
            result = await fetchWithFallback(url);
        }
        if (result && result.response && result.response.results) {
            result.response.results.forEach((cat: any) => {
                const name = cat['Titulo'] || cat['Name'] || cat['Nome'];
                if (cat._id && name) {
                    map[cat._id] = name;
                }
            });
        }
    } catch (e) {
        console.warn("Erro ao buscar mapa de categorias", e);
    }
    return map;
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

const enrichCoupons = async (companyData: any, signal?: AbortSignal) => {
    const listKey = companyData['Lista_cupons'] ? 'Lista_cupons' : 'Lista_Cupons';
    if (companyData[listKey] && Array.isArray(companyData[listKey]) && typeof companyData[listKey][0] === 'string') {
        try {
            const couponIds = companyData[listKey];
            const couponPromises = couponIds.map((cId: string) => fetchFromTableVariants(cId, 'Cupom', signal));
            const couponsDetails = await Promise.all(couponPromises);
            companyData[listKey] = couponsDetails.filter((c: any) => c !== null);
        } catch (err) { console.warn("Erro ao enriquecer cupons", err); }
    }
    return companyData;
}

export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  if (!id) return null;
  if (id === 'mock_user') return { ...MOCK_COMPANIES[0], _id: 'mock', Name: "Modo Teste" };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  let companyData = null;
  const userObj = await fetchFromTableVariants(id, 'User', controller.signal);

  if (userObj) {
      const empresaId = userObj['empresa'] || userObj['Empresa'];
      if (empresaId) {
          const empresaObj = await fetchFromTableVariants(empresaId, 'Empresa', controller.signal);
          companyData = empresaObj || userObj;
      } else {
          companyData = userObj['authentication'] ? userObj : (await fetchFromTableVariants(id, 'Empresa', controller.signal) || userObj);
      }
  } else {
      companyData = await fetchFromTableVariants(id, 'Empresa', controller.signal);
  }

  if (companyData) {
      companyData = await enrichCoupons(companyData, controller.signal);
      const categoryMap = await fetchCategoriesMap(); 
      clearTimeout(timeoutId);
      return mapBubbleToCompany(companyData, categoryMap);
  }

  clearTimeout(timeoutId);
  return null;
};

// ... (fetchCompanies, fetchDashboardStats, updateCompany, createCoupon, updateCoupon, deleteCoupon - MANTIDOS IGUAIS) ...
export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  try {
      let url = `${BUBBLE_API_ROOT}/Empresa?t=${Date.now()}`;
      let json = await fetchWithFallback(url, controller.signal);
      
      if (!json || !json.response || json.response.results.length === 0) {
         url = `${BUBBLE_API_ROOT}/User?t=${Date.now()}`;
         json = await fetchWithFallback(url, controller.signal);
      }

      const categoryMapPromise = fetchCategoriesMap();
      const allCouponsPromise = fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom?t=${Date.now()}`, controller.signal);

      const [categoryMap, allCouponsJson] = await Promise.all([categoryMapPromise, allCouponsPromise]);

      let allCoupons: Coupon[] = [];
      if (allCouponsJson && allCouponsJson.response && allCouponsJson.response.results) {
          allCoupons = allCouponsJson.response.results.map((c: any) => mapBubbleToCoupon(c));
      }

      if (json && json.response && json.response.results) {
          return json.response.results.map((item: any) => mapBubbleToCompany(item, categoryMap, allCoupons));
      }
  } catch (error) {
      console.warn("Erro ao listar empresas", error);
  }
  return MOCK_COMPANIES;
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    const controller = new AbortController();
    const stats: DashboardStats = { totalPartners: 0, totalCoupons: 0, totalRedemptions: 0, recentPartners: [], topCategories: [] };
    try {
        const [companiesData, couponsData, categoryMap] = await Promise.all([
            fetchCompanies(),
            fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom`, controller.signal),
            fetchCategoriesMap()
        ]);
        if (companiesData) {
            stats.totalPartners = companiesData.length;
            stats.recentPartners = companiesData.sort((a, b) => (b.CreatedDate || '').localeCompare(a.CreatedDate || '')).slice(0, 5);
            const catCounts: Record<string, number> = {};
            companiesData.forEach(c => { const cat = c.Category || 'Outros'; catCounts[cat] = (catCounts[cat] || 0) + 1; });
            stats.topCategories = Object.entries(catCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 4);
        }
        if (couponsData && couponsData.response && couponsData.response.results) {
            const allCoupons = couponsData.response.results;
            stats.totalCoupons = allCoupons.length;
            stats.totalRedemptions = allCoupons.reduce((acc: number, curr: any) => acc + (Number(curr.usos_atuais) || Number(curr.Usos) || 0), 0);
        }
    } catch (e) {}
    return stats;
};

export const updateCompany = async (id: string, data: Partial<Company>): Promise<boolean> => {
  if (!id || id === 'mock' || id.includes('Erro')) return false;
  const payload: any = {};
  if (data.Name) payload['Nome da empresa'] = data.Name;
  if (data.Phone) payload['Contato'] = data.Phone;
  if (data.Website) payload['website'] = data.Website;
  if (data.Address) payload['Morada'] = data.Address; 
  if (data.Description) payload['Descricao'] = data.Description;
  if (data.Logo) payload['Logo'] = data.Logo;
  try { await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${id}`, undefined, 'PATCH', payload); return true; } catch (e) { return false; }
};

export const createCoupon = async (companyId: string, couponData: any): Promise<string | null> => {
    const payload = {
        codigo: couponData.code,
        descricao: couponData.description,
        desconto: couponData.discountValue,
        max_usos: Number(couponData.maxUses) || 0,
        validade: couponData.expiryDate,
        ativo: true,
        Dono: companyId,
        usos_atuais: 0,
        Utilizadores: []
    };
    const result = await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom`, undefined, 'POST', payload);
    if (result && result.id) {
        const newCouponId = result.id;
        try {
            const company = await fetchCompanyById(companyId); 
            const currentCoupons = company?.Coupons?.map(c => c.id) || [];
            const newCouponsList = [...currentCoupons, newCouponId];
            await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${companyId}`, undefined, 'PATCH', { "Lista_cupons": newCouponsList });
        } catch (err) {}
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

// --- LOGICA REFINADA DE RESGATE E CARTEIRA ---

// 1. Resgatar Cupom (Vincula Coupon->Empresa e Empresa->Coupon)
export const claimCoupon = async (couponId: string, companyId: string, currentUtilizadores: string[]): Promise<boolean> => {
    // Verificação de segurança
    if (currentUtilizadores.includes(companyId)) return true;

    try {
        // Passo 1: Atualizar o Cupom (Adicionar empresa na lista Utilizadores)
        // No Bubble, se 'Utilizadores' é List of Empresas, precisamos passar o ID da Empresa.
        const newUtilizadoresList = [...currentUtilizadores, companyId];
        await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${couponId}`, undefined, 'PATCH', {
            Utilizadores: newUtilizadoresList,
            usos_atuais: newUtilizadoresList.length
        });

        // Passo 2: Atualizar a Empresa (Adicionar cupom na lista carteira_cupons)
        const user = await fetchCompanyById(companyId);
        if (user) {
            const currentWallet = user.carteira_cupons || [];
            // Evita duplicata na lista da empresa
            if (!currentWallet.includes(couponId)) {
                const newWalletList = [...currentWallet, couponId];
                
                // Prioridade: Atualizar tabela Empresa
                let success = await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${companyId}`, undefined, 'PATCH', { "carteira_cupons": newWalletList });
                
                // Fallback para User somente se falhar e se o ID for compatível (mas o foco é Empresa)
                if (!success || success.statusCode >= 400) {
                     await fetchWithFallback(`${BUBBLE_API_ROOT}/User/${companyId}`, undefined, 'PATCH', { "carteira_cupons": newWalletList });
                }
            }
        }
        return true;
    } catch (e) {
        console.error("Erro ao resgatar cupom", e);
        return false;
    }
};

// 2. Busca a Carteira (Prioriza a lista no perfil da empresa para performance)
export const fetchClaimedCoupons = async (companyId: string): Promise<Coupon[]> => {
    try {
        let couponIds: string[] = [];

        // Busca dados frescos da empresa para pegar a lista de IDs
        const user = await fetchCompanyById(companyId);
        if (user && user.carteira_cupons && user.carteira_cupons.length > 0) {
            couponIds = user.carteira_cupons;
        }

        let coupons: Coupon[] = [];

        if (couponIds.length > 0) {
             // Busca detalhes de cada cupom em paralelo
             const promises = couponIds.map(id => fetchFromTableVariants(id, 'Cupom'));
             const results = await Promise.all(promises);
             coupons = results.filter(r => r !== null).map(c => mapBubbleToCoupon(c));
        } else {
            // Fallback: Busca reversa (Cupons onde eu estou na lista) - Mais lento mas seguro
            const constraints = [{ key: "Utilizadores", constraint_type: "contains", value: companyId }];
            const url = `${BUBBLE_API_ROOT}/Cupom?constraints=${JSON.stringify(constraints)}`;
            const result = await fetchWithFallback(url);
            if (result && result.response && result.response.results) {
                coupons = result.response.results.map((c: any) => mapBubbleToCoupon(c));
            }
        }

        // Enriquece com dados do Dono (Logo/Nome da loja)
        if (coupons.length > 0) {
            const allCompanies = await fetchCompanies();
            return coupons.map(c => {
                const owner = allCompanies.find(comp => comp._id === c.Dono);
                if (owner) {
                    c.ownerData = { name: owner.Name, logo: owner.Logo || '' };
                }
                return c;
            });
        }
    } catch (e) {
        console.warn("Erro ao buscar carteira de cupons", e);
    }
    return [];
};

// 3. Validar QR Code (Simulação de validação no caixa)
export const processQrCode = async (dataString: string): Promise<{valid: boolean, message: string, coupon?: Coupon}> => {
    try {
        // Esperado formato: "COUPON_ID:EMPRESA_ID"
        let couponId = "";
        let empresaId = "";

        if (dataString.includes(":")) {
            const parts = dataString.split(":");
            couponId = parts[0];
            empresaId = parts[1];
        } else {
            // Tenta achar apenas ID do cupom
            couponId = dataString;
        }

        if (!couponId) return { valid: false, message: "Código inválido." };

        // Busca o cupom no banco
        const couponData = await fetchFromTableVariants(couponId, 'Cupom');
        if (!couponData) return { valid: false, message: "Cupom não encontrado." };

        const coupon = mapBubbleToCoupon(couponData);

        if (coupon.status !== 'active') return { valid: false, message: "Este cupom está inativo ou expirado." };

        // Verifica se a empresa está na lista de Utilizadores (List of Empresas)
        if (empresaId) {
            if (!coupon.utilizadores?.includes(empresaId)) {
                return { valid: false, message: "Esta empresa não resgatou este cupom oficialmente no Hub." };
            }
        }

        return { valid: true, message: "Cupom Válido! Pode aplicar o desconto para o parceiro.", coupon };

    } catch (e) {
        return { valid: false, message: "Erro ao processar código." };
    }
};
