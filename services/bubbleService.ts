import { Company, BubbleResponse } from '../types';

// CONFIGURAÇÃO: URL oficial baseada no seu app Workly
const BUBBLE_API_URL = "https://workly.pt/version-test/api/1.1/obj/Empresa";

// DEFINIÇÃO: Mude para FALSE para usar os dados REAIS do seu Bubble
const USE_MOCK_DATA = false; 

// Mock Data (Mantido apenas como backup caso a API falhe)
const MOCK_COMPANIES: Company[] = [
  {
    _id: "mock1",
    Name: "Exemplo Bubble Offline",
    Description: "Se você está vendo isso, a conexão com o Bubble falhou ou não retornou dados.",
    Logo: "https://via.placeholder.com/150",
    Category: "Sistema",
    IsPartner: true,
    Coupons: []
  },
  {
    _id: "mock_user_1",
    Name: "Minha Empresa Demo",
    Description: "Empresa logada via URL para testes.",
    Logo: "",
    Category: "Tecnologia",
    Website: "https://demo.com",
    Phone: "1199999999",
    Address: "Rua Exemplo, 123",
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
  if (item['Codigo_Promocional']) {
    generatedCoupons.push({
      id: `coupon-${item._id}`,
      code: item['Codigo_Promocional'],
      description: 'Desconto Exclusivo Parceiro',
      discountValue: 'Verificar'
    });
  }

  return {
    _id: item._id,
    Name: item['Nome da empresa'] || item.Name || "Empresa Sem Nome",
    Description: item['Descricao'] || item.Description || "",
    Logo: cleanImageUrl(item['Logo']),
    Category: "Parceiro", 
    Website: item['website'] || "",
    Phone: item['Contato'] || "",
    Address: item['Morada'] || "",
    IsPartner: true,
    Coupons: generatedCoupons
  };
};

export const fetchCompanies = async (): Promise<Company[]> => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_COMPANIES), 800);
    });
  }

  try {
    const response = await fetch(BUBBLE_API_URL);
    if (!response.ok) throw new Error(`Erro na API Bubble (${response.status})`);
    const json: BubbleResponse<any> = await response.json();
    return json.response.results.map(mapBubbleToCompany);
  } catch (error) {
    console.error("ERRO CRÍTICO ao buscar empresas:", error);
    return [];
  }
};

// NOVA FUNÇÃO: Busca uma empresa específica pelo ID (Para Login)
export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = MOCK_COMPANIES.find(c => c._id === id) || MOCK_COMPANIES[1];
        resolve(found);
      }, 600);
    });
  }

  try {
    // Bubble Data API: Get Object by ID
    const url = `${BUBBLE_API_URL}/${id}`;
    console.log("Fazendo login via Bubble ID:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
       // Se der 404 ou erro, retorna null
       return null;
    }

    const json = await response.json();
    // A resposta de um único objeto no Bubble vem direto no json.response (sem results array)
    // *Nota: Dependendo da versão da API do Bubble, pode variar, mas geralmente é json.response
    return mapBubbleToCompany(json.response);

  } catch (error) {
    console.error("Erro ao buscar usuário logado:", error);
    return null;
  }
};