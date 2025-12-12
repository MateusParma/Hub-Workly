
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
    // Normaliza a lista de utilizadores (pode vir null, undefined ou array)
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
  
  // ESTRATÉGIA HÍBRIDA:
  // 1. Tenta pegar da lista aninhada (se o Bubble enviou)
  const listKey = item['Lista_cupons'] ? 'Lista_cupons' : 'Lista_Cupons';
  if (Array.isArray(item[listKey])) {
      generatedCoupons = item[listKey].map((c: any) => {
          if (typeof c === 'object') return mapBubbleToCoupon(c);
          return null;
      }).filter((c): c is Coupon => c !== null);
  }

  // 2. Fallback: Se a lista acima estiver vazia ou só tiver IDs (string),
  // tentamos casar com os cupons buscados separadamente pelo 'Dono' ou pelo ID na lista.
  if (generatedCoupons.length === 0 && extraCoupons.length > 0) {
      // Filtra cupons onde 'Dono' é o ID desta empresa
      const ownedCoupons = extraCoupons.filter(c => c.Dono === item._id);
      
      if (ownedCoupons.length > 0) {
          generatedCoupons = ownedCoupons;
      } else if (Array.isArray(item[listKey])) {
          // Se não tem Dono, tenta bater o ID da lista de strings com o ID do cupom
          const idsList = item[listKey];
          if (idsList.length > 0 && typeof idsList[0] === 'string') {
               generatedCoupons = extraCoupons.filter(c => idsList.includes(c.id));
          }
      }
  }

  // Lógica Aprimorada de Categoria
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
    CreatedDate: item['Created Date'] || item['Created_Date']
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

// FUNÇÃO REESCRITA PARA FALLBACK E PERFORMANCE
export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  try {
      // 1. Busca Empresas
      let url = `${BUBBLE_API_ROOT}/Empresa?t=${Date.now()}`;
      let json = await fetchWithFallback(url, controller.signal);
      
      if (!json || !json.response || json.response.results.length === 0) {
         url = `${BUBBLE_API_ROOT}/User?t=${Date.now()}`;
         json = await fetchWithFallback(url, controller.signal);
      }

      // 2. Busca Categorias em paralelo
      const categoryMapPromise = fetchCategoriesMap();
      
      // 3. Busca TODOS os cupons em paralelo (Fallback robusto)
      const allCouponsPromise = fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom?t=${Date.now()}`, controller.signal);

      const [categoryMap, allCouponsJson] = await Promise.all([categoryMapPromise, allCouponsPromise]);

      // Processa lista de todos os cupons disponíveis
      let allCoupons: Coupon[] = [];
      if (allCouponsJson && allCouponsJson.response && allCouponsJson.response.results) {
          allCoupons = allCouponsJson.response.results.map((c: any) => mapBubbleToCoupon(c));
      }

      if (json && json.response && json.response.results) {
          // Passa a lista completa de cupons para o mapper fazer o "join" em memória
          return json.response.results.map((item: any) => mapBubbleToCompany(item, categoryMap, allCoupons));
      }
  } catch (error) {
      console.warn("Erro ao listar empresas", error);
  }
  return MOCK_COMPANIES;
};

// NOVA FUNÇÃO: Busca estatísticas reais do sistema
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    const controller = new AbortController();
    
    // Default stats
    const stats: DashboardStats = {
        totalPartners: 0,
        totalCoupons: 0,
        totalRedemptions: 0,
        recentPartners: [],
        topCategories: []
    };

    try {
        // Fetch Parallel: Empresas, Cupons, Categorias
        const [companiesData, couponsData, categoryMap] = await Promise.all([
            fetchCompanies(),
            fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom`, controller.signal),
            fetchCategoriesMap()
        ]);

        // Process Companies
        if (companiesData) {
            stats.totalPartners = companiesData.length;
            
            // Recent Partners (Last 5 based on created date if available, or just first 5)
            stats.recentPartners = companiesData
                .sort((a, b) => (b.CreatedDate || '').localeCompare(a.CreatedDate || ''))
                .slice(0, 5);

            // Calculate Categories Distribution
            const catCounts: Record<string, number> = {};
            companiesData.forEach(c => {
                const cat = c.Category || 'Outros';
                catCounts[cat] = (catCounts[cat] || 0) + 1;
            });
            
            stats.topCategories = Object.entries(catCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4); // Top 4
        }

        // Process Coupons (Direct Table Access for Accuracy)
        if (couponsData && couponsData.response && couponsData.response.results) {
            const allCoupons = couponsData.response.results;
            stats.totalCoupons = allCoupons.length;
            
            // Sum 'usos_atuais'
            stats.totalRedemptions = allCoupons.reduce((acc: number, curr: any) => {
                return acc + (Number(curr.usos_atuais) || Number(curr.Usos) || 0);
            }, 0);
        }

    } catch (e) {
        console.warn("Erro ao calcular dashboard stats", e);
    }

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
  try {
      await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${id}`, undefined, 'PATCH', payload);
      return true;
  } catch (e) { return false; }
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
        Utilizadores: [] // Inicia lista vazia
    };
    const result = await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom`, undefined, 'POST', payload);
    if (result && result.id) {
        const newCouponId = result.id;
        try {
            // Vincula à lista da empresa
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

// --- NOVAS FUNÇÕES: RESGATE E CARTEIRA ---

// Adiciona o usuário à lista de Utilizadores do cupom
export const claimCoupon = async (couponId: string, companyId: string, currentUsers: string[]): Promise<boolean> => {
    if (currentUsers.includes(companyId)) return true; // Já pegou

    const newList = [...currentUsers, companyId];
    
    try {
        await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${couponId}`, undefined, 'PATCH', {
            Utilizadores: newList,
            usos_atuais: newList.length // Atualiza contagem
        });
        return true;
    } catch (e) {
        console.error("Erro ao resgatar cupom", e);
        return false;
    }
};

// Busca todos os cupons onde o companyId está na lista Utilizadores
// ATUALIZADO: Com fallback Client-Side se a constraint de API falhar
export const fetchClaimedCoupons = async (companyId: string): Promise<Coupon[]> => {
    try {
        // Tenta filtrar via API
        const constraints = [
            { key: "Utilizadores", constraint_type: "contains", value: companyId }
        ];
        
        const url = `${BUBBLE_API_ROOT}/Cupom?constraints=${JSON.stringify(constraints)}`;
        const result = await fetchWithFallback(url);

        let coupons: Coupon[] = [];

        if (result && result.response && result.response.results && result.response.results.length > 0) {
            coupons = result.response.results.map((c: any) => mapBubbleToCoupon(c));
        } else {
            // FALLBACK: Se API retornou vazio (talvez por permissão de busca), busca TUDO e filtra aqui
            // Isso garante que se o dado existe, o usuário vê.
            const allUrl = `${BUBBLE_API_ROOT}/Cupom`;
            const allResult = await fetchWithFallback(allUrl);
            if (allResult && allResult.response && allResult.response.results) {
                const allMapped = allResult.response.results.map((c: any) => mapBubbleToCoupon(c));
                coupons = allMapped.filter(c => c.utilizadores && c.utilizadores.includes(companyId));
            }
        }

        // Tenta enriquecer com dados do Dono
        if (coupons.length > 0) {
            const allCompanies = await fetchCompanies();
            return coupons.map(c => {
                const owner = allCompanies.find(comp => comp._id === c.Dono);
                if (owner) {
                    c.ownerData = {
                        name: owner.Name,
                        logo: owner.Logo || ''
                    };
                }
                return c;
            });
        }
    } catch (e) {
        console.warn("Erro ao buscar carteira de cupons", e);
    }
    return [];
};
