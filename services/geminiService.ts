import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Generates a quick AI analysis of why this company is valuable
export const generateCompanyInsight = async (companyName: string, description: string): Promise<string> => {
  try {
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
    console.error("Gemini API Error:", error);
    return "Conheça esta empresa parceira e aproveite os benefícios exclusivos.";
  }
};

// Generates smart tags for filtering if they are missing
export const generateSmartTags = async (description: string): Promise<string[]> => {
  try {
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