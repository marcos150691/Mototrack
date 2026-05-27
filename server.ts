import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for AI Moto Diagnóstico / Mecânico Inteligente
app.post("/api/gemini/diagnose", async (req, res): Promise<any> => {
  try {
    const { message, motorcycle, history, chatHistory } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Chave API do Gemini (GEMINI_API_KEY) não configurada no servidor. Por favor, configure-a no painel lateral de Secrets."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Construct high-context prompt
    const bikeContext = motorcycle 
      ? `Moto: ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year}), Motor: ${motorcycle.engineSize}cc, Quilometragem Atual: ${motorcycle.currentOdometer} km, Capacidade do Tanque: ${motorcycle.fuelCapacity}L.`
      : "O usuário não cadastrou nenhuma moto ainda.";

    const historyContext = history && history.length > 0
      ? `Histórico de manutenção recente: ${history.slice(-5).map((h: any) => `${h.itemName} em ${h.odometer} km (${h.date})`).join(", ")}`
      : "Sem histórico de manutenção registrado.";

    const systemInstruction = 
      "Você é o 'Mecânico de Bolso', um assistente virtual especialista em manutenção mecânica e preventiva de motocicletas. " +
      "Seu objetivo é ajudar proprietários de moto a diagnosticar barulhos, entender os prazos de manutenção, " +
      "receber dicas de economia de combustível e pilotagem defensiva. " +
      "Responda sempre com clareza, empatia e de forma estruturada em Português. " +
      "Use emojis moderadamente para tornar o papo agradável e destacar itens importantes. " +
      "Forneça instruções seguras: se o problema sugerir perigo (como freios, suspensão travada, vazamento de combustível na linha), recomende fortemente visitar um mecânico profissional imediatamente.";

    const messages = [];
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    // Append the latest user query as contents
    const userPrompt = `Contexto do Veículo:\n${bikeContext}\n${historyContext}\n\nPergunta do Usuário:\n${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text || "Desculpe, não consegui processar a resposta.";
    return res.json({ response: reply });

  } catch (error: any) {
    console.error("Erro na rota de diagnóstico:", error);
    return res.status(500).json({ error: error.message || "Erro desconhecido no servidor." });
  }
});

// Setup Vite Middleware or Static Assets serving
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando servidor em modo desenvolvimento com Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando servidor em modo produção...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando com sucesso no endereço http://0.0.0.0:${PORT}`);
  });
}

configureServer();
