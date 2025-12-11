import { GoogleGenAI } from "@google/genai";

// Variável para armazenar a instância da IA
let aiInstance: GoogleGenAI | null = null;

// Função segura para obter o cliente de IA
const getAiClient = () => {
  if (aiInstance) return aiInstance;

  // SAFE ACCESS: Verifica se 'process' existe antes de acessar para evitar crash no navegador.
  // A chave API deve ser configurada nas Variáveis de Ambiente do seu servidor (Vercel/Netlify) como 'API_KEY'.
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : null;

  if (!apiKey) {
    // Falha silenciosa para não quebrar o app se a chave não estiver configurada
    console.warn("API_KEY não encontrada nas variáveis de ambiente. As funcionalidades de IA (Dicas/Tags) ficarão indisponíveis.");
    return null;
  }

  try {
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (error) {
    console.error("Erro ao inicializar IA:", error);
    return null;
  }
};

export const generateCompanyInsight = async (companyName: string, description: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Se não tiver IA configurada, retorna string vazia sem erro
    if (!ai) return "";

    const model = "gemini-2.5-flash";
    const prompt = `
      Analise a seguinte empresa e crie uma frase curta e persuasiva (máximo 20 palavras) 
      explicando por que ela é uma excelente parceira de negócios.
      
      Empresa: ${companyName}
      Descrição: ${description}
      
      Responda em Português do Brasil. Use um tom profissional e entusiasmado.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    return "";
  }
};

export const generateSmartTags = async (description: string): Promise<string[]> => {
  try {
    const ai = getAiClient();
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Gere 3 tags curtas (uma palavra cada) para categorizar esta empresa baseada na descrição: "${description}". Retorne apenas as palavras separadas por vírgula.`,
    });
    
    const text = response.text;
    return text.split(',').map(t => t.trim());
  } catch (error) {
    return [];
  }
}