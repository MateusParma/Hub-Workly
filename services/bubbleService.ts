
import { Company, BubbleResponse, Coupon, DashboardStats, Redemption } from '../types';

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
    Zone: "Lisboa",
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
    // Campos baseados no Print do DB
    let utilizadoresList: string[] = [];
    if (Array.isArray(item['Utilizadores'])) {
        utilizadoresList = item['Utilizadores'];
    }

    return {
        id: item._id,
        code: item.codigo || 'CUPOM',
        description: item.descricao || '',
        discountValue: item.desconto || '',
        expiryDate: item.validade || undefined,
        maxUses: item.max_usos || undefined,
        uses: (item.Utilizadores?.length) || 0, // Calculado pelo tamanho da lista
        status: (item.ativo === false) ? 'paused' : 'active',
        utilizadores: utilizadoresList,
        Dono: item.Dono,
        // @ts-ignore
        _creator: item['_creator']
    };
};

const mapBubbleToCompany = (item: any, categoryMap: Record<string, string> = {}, zoneMap: Record<string, string> = {}, extraCoupons: Coupon[] = []): Company => {
  if (!item) return MOCK_COMPANIES[0];

  let generatedCoupons: Coupon[] = [];
  
  // Campo exato do print: Lista_cupons
  const listKey = 'Lista_cupons';

  if (Array.isArray(item[listKey])) {
      generatedCoupons = item[listKey].map((c: any) => {
          if (typeof c === 'object') return mapBubbleToCoupon(c);
          return null;
      }).filter((c): c is Coupon => c !== null);
  }

  // Fallback se vierem apenas IDs
  if (generatedCoupons.length === 0 && extraCoupons.length > 0) {
      if (Array.isArray(item[listKey])) {
          const idsList = item[listKey];
          if (idsList.length > 0 && typeof idsList[0] === 'string') {
               generatedCoupons = extraCoupons.filter(c => idsList.includes(c.id));
          }
      }
      // Fallback final: Buscar pelo campo Dono no cupom
      if (generatedCoupons.length === 0) {
          generatedCoupons = extraCoupons.filter(c => c.Dono === item._id);
      }
  }

  // Campo exato do print: carteira_cupons
  let carteiraList: string[] = [];
  if (Array.isArray(item['carteira_cupons'])) carteiraList = item['carteira_cupons'];

  // Lógica de Categoria
  let category = "Parceiro";
  const rawSetor = item['Setor de Atuação'] || item['Categoria'];
  
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

  // Lógica de Zona
  let zoneName = "";
  const rawZone = item['Zona'];
  if (rawZone) {
      if (typeof rawZone === 'string') {
           // Se for ID, busca no map, senão usa a string direta
           zoneName = zoneMap[rawZone] || rawZone;
      }
  }

  return {
    _id: item._id,
    Name: item['Nome da empresa'] || "Empresa Sem Nome",
    Description: item['Descricao'] || "",
    Logo: cleanImageUrl(item['Logo'] || item['Logo_Capa']),
    Category: category, 
    Zone: zoneName,
    Website: item['website'] || "",
    Phone: item['Contato'] || "",
    Address: item['Morada'] || "",
    Email: item['Email_Candidatos'] || "", // Do print
    IsPartner: true, 
    Coupons: generatedCoupons,
    CreatedDate: item['Created Date'],
    carteira_cupons: carteiraList
  };
};

const fetchWithFallback = async (targetUrl: string, signal?: AbortSignal, method: string = 'GET', body?: any) => {
  const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, signal };
  if (body) options.body = JSON.stringify(body);

  try {
    console.log(`API Call [${method}]: ${targetUrl}`, body ? JSON.stringify(body) : '');
    
    const response = await fetch(targetUrl, options);
    
    if (response.ok) {
        if (method === 'PATCH' || method === 'POST' || method === 'DELETE') {
            const text = await response.text();
            return text ? JSON.parse(text) : { id: 'success_no_content' };
        }
        return await response.json();
    } else {
        const errText = await response.text();
        console.error(`Bubble API Error (${response.status}):`, errText);
        // Retorna o erro detalhado
        let errJson;
        try { errJson = JSON.parse(errText); } catch(e) { errJson = { message: errText }; }
        
        throw new Error(errJson.message || errJson.body?.message || `Erro API Bubble: ${response.status}`);
    }
  } catch (e: any) {
    console.error("Fetch Failure:", e);
    // Repassa o erro para ser tratado na UI
    throw e; 
  }
};

const fetchCategoriesMap = async (): Promise<Record<string, string>> => {
    const map: Record<string, string> = {};
    try {
        const url = `${BUBBLE_API_ROOT}/Categoria`;
        const result = await fetchWithFallback(url);
        if (result && result.response && result.response.results) {
            result.response.results.forEach((cat: any) => {
                const name = cat['Titulo'] || cat['Nome']; // Ajuste conforme tabela Categoria
                if (cat._id && name) {
                    map[cat._id] = name;
                }
            });
        }
    } catch (e) {}
    return map;
};

// Busca Mapa de Zonas (Zonas -> Nome)
const fetchZonesMap = async (): Promise<Record<string, string>> => {
    const map: Record<string, string> = {};
    try {
        // Tenta buscar na tabela 'Zonas' ou 'Zona'
        let url = `${BUBBLE_API_ROOT}/Zonas`; 
        let result = null;
        try {
            result = await fetchWithFallback(url);
        } catch(e) {
             url = `${BUBBLE_API_ROOT}/Zona`;
             result = await fetchWithFallback(url);
        }

        if (result && result.response && result.response.results) {
            result.response.results.forEach((z: any) => {
                const name = z['Nome'] || z['Zona'] || z['Titulo']; 
                if (z._id && name) {
                    map[z._id] = name;
                }
            });
        }
    } catch (e) {
        console.warn("Erro ao buscar zonas:", e);
    }
    return map;
};

// Helper para buscar em possíveis nomes de tabela (Case Insensitive)
const fetchFromTableVariants = async (id: string, tableBaseName: string, signal?: AbortSignal) => {
    // 1. Tenta nome exato (Capitalized)
    try {
        const url = `${BUBBLE_API_ROOT}/${tableBaseName}/${id}`;
        const result = await fetchWithFallback(url, signal);
        if (result && (result.response || result._id)) return result.response || result;
    } catch (e) { /* Ignora e tenta próxima */ }

    // 2. Tenta lowercase (comum no Bubble API para tipos padrão como User)
    if (tableBaseName !== tableBaseName.toLowerCase()) {
        try {
            const urlLower = `${BUBBLE_API_ROOT}/${tableBaseName.toLowerCase()}/${id}`;
            const result = await fetchWithFallback(urlLower, signal);
            if (result && (result.response || result._id)) return result.response || result;
        } catch (e) { /* Ignora */ }
    }
    
    return null;
};

const enrichCoupons = async (companyData: any, signal?: AbortSignal) => {
    const listKey = 'Lista_cupons';
    if (companyData[listKey] && Array.isArray(companyData[listKey]) && typeof companyData[listKey][0] === 'string') {
        try {
            const couponIds = companyData[listKey];
            const couponPromises = couponIds.map((cId: string) => fetchFromTableVariants(cId, 'Cupom', signal));
            const couponsDetails = await Promise.all(couponPromises);
            companyData[listKey] = couponsDetails.filter((c: any) => c !== null);
        } catch (err) {}
    }
    return companyData;
}

export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  if (!id) return null;
  if (id === 'mock_user') return { ...MOCK_COMPANIES[0], _id: 'mock', Name: "Modo Teste" };

  const controller = new AbortController();
  
  // 1. Tenta buscar direto na tabela Empresa (Cenário Ideal: ID é da Empresa)
  let companyData = await fetchFromTableVariants(id, 'Empresa', controller.signal);

  // 2. Fallback: Se não achou, pode ser um ID de User (Login do Bubble)
  if (!companyData) {
      console.log(`ID ${id} não encontrado na tabela Empresa. Tentando tabela User...`);
      const userObj = await fetchFromTableVariants(id, 'User', controller.signal);
      
      if (userObj) {
          // Verifica se o User tem um campo de vínculo com Empresa
          // Tenta 'Empresa' (maiúsculo) ou 'empresa' (minúsculo)
          const linkedEmpresaId = userObj['Empresa'] || userObj['empresa'];
          
          if (linkedEmpresaId && typeof linkedEmpresaId === 'string') {
               console.log(`User ${id} vinculado à Empresa ${linkedEmpresaId}. Buscando detalhes...`);
               companyData = await fetchFromTableVariants(linkedEmpresaId, 'Empresa', controller.signal);
          } else {
               // Se não tem vínculo explícito, talvez o próprio User tenha os dados (menos comum para B2B estruturado)
               if (userObj['Nome da empresa'] || userObj['Name']) {
                   console.log("User encontrado, usando dados do próprio User como Empresa.");
                   companyData = userObj;
               }
          }
      }
  }

  if (companyData) {
      const enriched = await enrichCoupons(companyData, controller.signal);
      const categoryMap = await fetchCategoriesMap(); 
      const zoneMap = await fetchZonesMap();
      return mapBubbleToCompany(enriched, categoryMap, zoneMap);
  }

  return null;
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const controller = new AbortController();
  try {
      let url = `${BUBBLE_API_ROOT}/Empresa?t=${Date.now()}`;
      let json = null;
      
      try {
          json = await fetchWithFallback(url, controller.signal);
      } catch (e) {
          // Fallback se Empresa não existir ou falhar, tenta User
           console.warn("Falha ao listar Empresa, tentando User...");
           url = `${BUBBLE_API_ROOT}/User?t=${Date.now()}`;
           json = await fetchWithFallback(url, controller.signal);
      }

      // Buscas auxiliares em paralelo
      const categoryMapPromise = fetchCategoriesMap();
      const zoneMapPromise = fetchZonesMap();
      const allCouponsPromise = fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom?t=${Date.now()}`, controller.signal).catch(() => ({ response: { results: [] } }));

      const [categoryMap, zoneMap, allCouponsJson] = await Promise.all([categoryMapPromise, zoneMapPromise, allCouponsPromise]);

      let allCoupons: Coupon[] = [];
      if (allCouponsJson && allCouponsJson.response && allCouponsJson.response.results) {
          allCoupons = allCouponsJson.response.results.map((c: any) => mapBubbleToCoupon(c));
      }

      if (json && json.response && json.response.results) {
          return json.response.results.map((item: any) => mapBubbleToCompany(item, categoryMap, zoneMap, allCoupons));
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
        const companiesData = await fetchCompanies();
        if (companiesData) {
            stats.totalPartners = companiesData.length;
            stats.recentPartners = companiesData.sort((a, b) => (b.CreatedDate || '').localeCompare(a.CreatedDate || '')).slice(0, 5);
            
            let totalCoupons = 0;
            let totalUses = 0;
            const catCounts: Record<string, number> = {};
            
            companiesData.forEach(c => { 
                const cat = c.Category || 'Outros'; 
                catCounts[cat] = (catCounts[cat] || 0) + 1;
                
                if (c.Coupons) {
                    totalCoupons += c.Coupons.length;
                    c.Coupons.forEach(cup => totalUses += (cup.uses || 0));
                }
            });

            stats.totalCoupons = totalCoupons;
            stats.totalRedemptions = totalUses;
            stats.topCategories = Object.entries(catCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 4);
        }
    } catch (e) {}
    return stats;
};

export const fetchMyRedemptions = async (myCoupons: Coupon[]): Promise<Redemption[]> => {
    const redemptions: Redemption[] = [];
    const uniqueUserIds = new Set<string>();

    myCoupons.forEach(coupon => {
        if (coupon.utilizadores) {
            coupon.utilizadores.forEach(uid => uniqueUserIds.add(uid));
        }
    });

    if (uniqueUserIds.size === 0) return [];

    const userPromises = Array.from(uniqueUserIds).map(uid => fetchCompanyById(uid));
    const usersData = await Promise.all(userPromises);
    
    const usersMap: Record<string, Company> = {};
    usersData.forEach(u => {
        if (u) usersMap[u._id] = u;
    });

    myCoupons.forEach(coupon => {
        if (coupon.utilizadores) {
            coupon.utilizadores.forEach(uid => {
                const userCompany = usersMap[uid];
                if (userCompany) {
                    redemptions.push({
                        companyName: userCompany.Name,
                        companyLogo: userCompany.Logo || '',
                        couponCode: coupon.code,
                        discount: coupon.discountValue,
                        date: 'Recente'
                    });
                }
            });
        }
    });

    return redemptions;
};

export const updateCompany = async (id: string, data: Partial<Company>): Promise<boolean> => {
  if (!id || id === 'mock' || id.includes('Erro')) return false;
  
  // Mapeamento Estrito para Tabela Empresa
  const payload: any = {};
  if (data.Name) payload['Nome da empresa'] = data.Name;
  if (data.Phone) payload['Contato'] = data.Phone;
  if (data.Website) payload['website'] = data.Website; // lowercase conforme print
  if (data.Address) payload['Morada'] = data.Address; 
  if (data.Description) payload['Descricao'] = data.Description;
  if (data.Logo) payload['Logo'] = data.Logo;

  try { 
      await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${id}`, undefined, 'PATCH', payload); 
      return true; 
  } catch (e) { 
      return false; 
  }
};

export const createCoupon = async (companyId: string, couponData: any): Promise<string | null> => {
    // 1. Data em ISO 8601
    let isoDate = null;
    if (couponData.expiryDate) {
        try {
            isoDate = new Date(couponData.expiryDate).toISOString();
        } catch (e) {
            console.warn("Invalid date", couponData.expiryDate);
        }
    }

    // 2. Payload ESTRITO baseado nas IMAGENS (Data Types)
    const payload = {
        codigo: couponData.code,
        descricao: couponData.description,
        desconto: couponData.discountValue,
        max_usos: couponData.maxUses ? Number(couponData.maxUses) : null,
        validade: isoDate,
        ativo: true,
        Dono: companyId, // ID da Empresa
        Utilizadores: [] // Lista vazia inicial
    };

    console.log("Enviando Payload Cupom Estrito:", payload);

    try {
        const result = await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom`, undefined, 'POST', payload);
        
        if (result && result.id) {
            const newCouponId = result.id;
            
            // 3. Vincular na Empresa (Campo: Lista_cupons)
            const companyRaw = await fetchFromTableVariants(companyId, 'Empresa');
            
            if (companyRaw) {
                // Pega lista existente ou inicia vazia
                // Tenta variações de nome de campo de lista, mas prioriza o da imagem (Lista_cupons)
                const currentList = companyRaw['Lista_cupons'] || companyRaw['Lista_Cupons'] || [];
                const newList = [...currentList, newCouponId];
                
                console.log(`Vinculando cupom ${newCouponId} na empresa ${companyId}. Lista nova:`, newList);

                // Tenta update
                await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${companyId}`, undefined, 'PATCH', { 
                    "Lista_cupons": newList 
                });
            } else {
                console.warn("Empresa não encontrada para vincular, mas cupom foi criado.");
            }
            return newCouponId;
        }
    } catch (err: any) {
        console.error("Erro fatal no createCoupon:", err);
        // Repassa o erro para o UI
        throw err;
    }
    return null;
};

export const updateCoupon = async (couponId: string, couponData: any): Promise<boolean> => {
    let isoDate = undefined;
    if (couponData.expiryDate) {
        try { isoDate = new Date(couponData.expiryDate).toISOString(); } catch(e) {}
    }

    // Payload Estrito Update
    const payload: any = {};
    if (couponData.code) payload.codigo = couponData.code;
    if (couponData.description) payload.descricao = couponData.description;
    if (couponData.discountValue) payload.desconto = couponData.discountValue;
    if (couponData.maxUses) payload.max_usos = Number(couponData.maxUses);
    if (couponData.expiryDate) payload.validade = isoDate;
    
    // Status (toggle)
    if (couponData.status) payload.ativo = (couponData.status === 'active');

    try {
        await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${couponId}`, undefined, 'PATCH', payload);
        return true;
    } catch (e) {
        throw e;
    }
};

export const deleteCoupon = async (couponId: string): Promise<boolean> => {
    try {
        await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${couponId}`, undefined, 'DELETE');
        return true;
    } catch (e) { return false; }
};

// ==========================================================
// FUNÇÕES DE CARTEIRA (Wallet Logic)
// ==========================================================

// Função A: Adicionar à Carteira (Sem marcar como usado/queimado)
export const addToWallet = async (couponId: string, companyId: string): Promise<boolean> => {
    try {
        // 1. UPDATE EMPRESA (Adiciona Cupom na carteira_cupons da empresa que está pegando)
        const empresaRaw = await fetchFromTableVariants(companyId, 'Empresa');
        if (empresaRaw) {
             const currentCarteira = empresaRaw['carteira_cupons'] || [];
             if (!currentCarteira.includes(couponId)) {
                const newCarteira = [...currentCarteira, couponId];
                await fetchWithFallback(`${BUBBLE_API_ROOT}/Empresa/${companyId}`, undefined, 'PATCH', { 
                    "carteira_cupons": newCarteira 
                });
            }
            return true;
        }
        return false;
    } catch(e) {
        console.error("Erro ao adicionar à carteira:", e);
        return false;
    }
}

// Função B: Registrar Uso (Queimar Cupom via Scanner)
export const registerUsage = async (couponId: string, companyId: string): Promise<boolean> => {
    try {
        const couponRaw = await fetchFromTableVariants(couponId, 'Cupom');
        if (!couponRaw) throw new Error("Cupom não encontrado");

        const currentUtilizadores = couponRaw['Utilizadores'] || [];

        // Adiciona ID da empresa na lista de quem JÁ USOU o cupom
        if (companyId && !currentUtilizadores.includes(companyId)) {
            const newUtilizadores = [...currentUtilizadores, companyId];
            await fetchWithFallback(`${BUBBLE_API_ROOT}/Cupom/${couponId}`, undefined, 'PATCH', {
                Utilizadores: newUtilizadores
            });
            return true;
        } else if (currentUtilizadores.includes(companyId)) {
            // Já foi usado
            return true;
        }
        return false;
    } catch(e) {
        console.error("Erro ao registrar uso:", e);
        return false;
    }
}

// Mantido para compatibilidade, mas redireciona para addToWallet por padrão
export const claimCoupon = async (couponId: string, inputId: string, _knownUtilizadores: string[] = []): Promise<boolean> => {
    return addToWallet(couponId, inputId);
}

export const fetchClaimedCoupons = async (companyId: string): Promise<Coupon[]> => {
    try {
        const user = await fetchCompanyById(companyId);
        const couponIds = user?.carteira_cupons || [];
        
        if (couponIds.length === 0) return [];

        const promises = couponIds.map(id => fetchFromTableVariants(id, 'Cupom'));
        const results = await Promise.all(promises);
        
        const coupons = results.filter(r => r).map(c => mapBubbleToCoupon(c));

        // Enriquece com dados do Dono
        if (coupons.length > 0) {
            const allCompanies = await fetchCompanies(); // Cacheado idealmente
            return coupons.map(c => {
                const owner = allCompanies.find(comp => comp._id === c.Dono);
                if (owner) c.ownerData = { name: owner.Name, logo: owner.Logo || '' };
                return c;
            });
        }
        return coupons;
    } catch (e) {
        return [];
    }
};

export const processQrCode = async (dataString: string, scannerOwnerId?: string): Promise<{valid: boolean, message: string, coupon?: Coupon}> => {
    try {
        if (!scannerOwnerId) return { valid: false, message: "ID da sua empresa não identificado. Recarregue a página." };

        let couponId = "";
        let clientId = "";
        const cleanData = dataString.trim();
        
        if (cleanData.includes(":")) {
            const parts = cleanData.split(":");
            couponId = parts[0];
            clientId = parts[1];
        } else {
            const preview = cleanData.length > 20 ? cleanData.substring(0, 20) + '...' : cleanData;
            return { 
                valid: false, 
                message: `Formato inválido. Lido: "${preview}". O QR deve ser do app Workly (Cupom:Cliente).` 
            };
        }

        if (!couponId || !clientId) return { valid: false, message: "Dados do QR incompletos ou corrompidos." };

        // 1. Busca Cupom
        const couponData = await fetchFromTableVariants(couponId, 'Cupom');
        if (!couponData) return { valid: false, message: "Cupom não encontrado no sistema." };

        const coupon = mapBubbleToCoupon(couponData);

        // 2. Valida Propriedade
        if (coupon.Dono !== scannerOwnerId) {
             return { valid: false, message: "Este cupom pertence a outra empresa. Você só pode validar seus próprios cupons." };
        }

        if (coupon.status !== 'active') return { valid: false, message: "Este cupom está pausado ou expirado." };

        // 3. Valida se JÁ FOI USADO pelo cliente
        if (coupon.utilizadores?.includes(clientId)) {
            return { valid: false, message: "Este cliente já utilizou este cupom anteriormente." };
        }

        // 4. Registra Uso (Queima o cupom)
        const success = await registerUsage(couponId, clientId);
        
        if (success) {
            return { valid: true, message: `Sucesso! Uso registrado para o cliente.`, coupon };
        } else {
            return { valid: false, message: "Erro ao registrar o uso no banco de dados." };
        }

    } catch (e) {
        return { valid: false, message: "Erro de conexão ao validar o código." };
    }
};
