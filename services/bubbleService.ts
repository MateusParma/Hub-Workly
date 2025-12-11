import { Company, BubbleResponse } from '../types';

// CONFIGURAÇÃO: URL oficial baseada no seu app Workly
const BUBBLE_API_URL = "https://workly.pt/version-test/api/1.1/obj/Empresa";

// Mock Data (Dados de teste para quando a API falhar)
const MOCK_COMPANIES: Company[] = [
  {
    _id: "mock1",
    Name: "Tech Solutions (Demo)",
    Description: "Empresa de tecnologia focada em inovação. (Dados exibidos pois a conexão com Bubble não retornou resultados)",
    Logo: "https://ui-avatars.com/api/?name=Tech+Solutions&background=0D8ABC&color=fff",
    Category: "Tecnologia",
    IsPartner: true,
    Coupons: [
      { id: 'c1', code: 'TECH10', description: '10% OFF em serviços', discountValue: '10%' }
    ]
  },
  {
    _id: "mock2",
    Name: "Café & Co (Demo)",
    Description: "O melhor café da cidade para suas reuniões.",
    Logo: "https://ui-avatars.com/api/?name=Cafe+Co&background=D35400&color=fff",
    Category: "Alimentação",
    Website: "https://cafe.com",
    IsPartner: true,
    Coupons: []
  }
];

// Helper para limpar URLs de imagem do Bubble
const cleanImageUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith('//') ? `https:${url}` : url;
};

// Helper para mapear resposta crua do Bubble para nosso tipo Company
const mapBubbleToCompany = (item: any): Company => {
  const generatedCoupons = [];
  // Verifica diferentes grafias possíveis vindas do Bubble
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
    IsPartner: true, // Assumimos true se está na lista
    Coupons: generatedCoupons
  };
};

export const fetchCompanies = async (): Promise<Company[]> => {
  try {
    const response = await fetch(BUBBLE_API_URL);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const json: BubbleResponse<any> = await response.json();
    const results = json.response.results || [];
    
    if (results.length === 0) {
        console.warn("API Bubble retornou lista vazia. Usando Mock para demonstração.");
        return MOCK_COMPANIES;
    }

    return results.map(mapBubbleToCompany);
  } catch (error) {
    console.warn("Falha na conexão com Bubble (provavelmente CORS ou URL incorreta). Usando dados de teste.", error);
    // Fallback silencioso para dados de teste para não quebrar a UI
    return MOCK_COMPANIES;
  }
};

export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  // Se o ID for de teste, retorna mock direto
  if (id === 'mock_user' || id.startsWith('test')) {
      return { ...MOCK_COMPANIES[0], _id: id, Name: "Minha Empresa (Teste)" };
  }

  try {
    const url = `${BUBBLE_API_URL}/${id}`;
    console.log("Tentando login no Bubble via:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
       console.warn(`Erro ao buscar empresa ${id}: ${response.status}`);
       // Se der erro na API, tentamos retornar um usuário "Mock" temporário
       // para que você consiga ver o painel mesmo se o login falhar
       return { 
         ...MOCK_COMPANIES[0], 
         _id: id, 
         Name: "Usuário Visitante (API Offline)", 
         Description: "Não foi possível carregar seus dados reais do Bubble. Verifique o console." 
       };
    }

    const json = await response.json();
    return mapBubbleToCompany(json.response);

  } catch (error) {
    console.error("Erro fatal no login:", error);
    // Retorna um usuário de fallback para não travar na tela de login
    return { 
        ...MOCK_COMPANIES[0], 
        _id: id, 
        Name: "Modo Offline", 
        Description: "Conexão com Bubble falhou." 
    };
  }
};