import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Motorcycle, MaintenanceHistoryLog } from '../types';
import { Send, Bot, User, Power, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

interface AiMechanicProps {
  activeMotorcycle: Motorcycle | null;
  historyLogs: MaintenanceHistoryLog[];
}

export default function AiMechanic({ activeMotorcycle, historyLogs }: AiMechanicProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'default-welcome',
      sender: 'assistant',
      text: `Olá! Sou o seu **Mecânico de Bolso** assistido por Inteligência Artificial. 🛠️🏍️\n\nEstou pronto para ajudar você com dicas de manutenção, economia, ou para analisar barulhos ou sintomas estranhos na sua moto!\n${
        activeMotorcycle
          ? `Vejo que estamos conectados à sua **${activeMotorcycle.brand} ${activeMotorcycle.model}** com **${activeMotorcycle.currentOdometer.toLocaleString('pt-BR')} km**. Como posso te ajudar hoje?`
          : 'Cadastre ou selecione uma moto nas abas acima para eu ter mais contexto nos diagnósticos.'
      }`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);
    setChatError(null);

    try {
      const response = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          motorcycle: activeMotorcycle,
          history: historyLogs,
          // Exclude first greeting message from API context to avoid system prompts leaking
          chatHistory: messages.slice(1).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível obter resposta do mecânico.');
      }

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'assistant',
        text: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || 'Erro de conexão com o servidor de IA.');
    } finally {
      setLoading(false);
    }
  };

  const formSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;
    handleSend(inputVal);
  };

  const suggestions = [
    'Quais cuidados essenciais devo ter aos 12.000 km?',
    'Como limpar e lubrificar a corrente corretamente?',
    'Barulho metálico áspero ao acelerar, o que pode ser?',
    'Conselhos simples para gastar menos gasolina?',
  ];

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col h-[580px]" id="ai-mechanic-container">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FFB300]/10 text-[#FFB300] rounded-xl border border-[#FFB300]/20 shadow-inner">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              Mecânico de Bolso IA
              <span className="flex items-center px-1.5 py-0.5 text-[8px] font-black tracking-widest text-[#FFB300] bg-[#FFB300]/10 rounded uppercase border border-[#FFB300]/20">
                Online
              </span>
            </h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">DIAGNÓSTICO PREVENTIVO E INTELIGENTE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/40 tracking-widest uppercase font-mono">MODEL: GEMINI AI</span>
        </div>
      </div>

      {/* Safety Alert Warning Banner */}
      <div className="bg-red-500/5 border border-red-500/15 text-[10px] text-red-300 rounded-lg p-2.5 flex items-start gap-2 mb-4">
        <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
        <p>
          <strong>Aviso de Segurança:</strong> Dicas automáticas geradas por IA. Em caso de dúvidas graves nos freios, suspensão ou vazamento de gasolina, procure uma oficina mecânica qualificada imediatamente.
        </p>
      </div>

      {/* Messages scrolling container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 select-text custom-scrollbar">
        {messages.map((msg) => {
          const isAi = msg.sender === 'assistant';
          return (
            <div key={msg.id} className={`flex items-start gap-2.5 ${!isAi ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  isAi
                    ? 'bg-[#FFB300]/10 text-[#FFB300] border-[#FFB300]/20'
                    : 'bg-white/5 text-white/60 border-white/5'
                }`}
              >
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs relative ${
                  isAi
                    ? 'bg-black/40 text-white/90 rounded-tl-none border border-white/5 shadow-sm'
                    : 'bg-[#FFB300] text-black font-semibold rounded-tr-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {/* Simplistic formatting support for bold tags rendered under assistant output */}
                  {msg.text.split('\n').map((line, i) => {
                    // Quick parse bold syntax markdown: **text**
                    const parts = line.split('**');
                    return (
                      <p key={i} className="mb-1 last:mb-0">
                        {parts.map((p, idx) => {
                          if (idx % 2 === 1) {
                            return <strong key={idx} className={isAi ? "text-[#FFB300] font-black" : "text-black font-black"}>{p}</strong>;
                          }
                          return p;
                        })}
                      </p>
                    );
                  })}
                </div>
                <span className={`block text-[8px] text-right mt-1.5 ${isAi ? 'text-white/30' : 'text-black/60'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFB300]/10 text-[#FFB300] border border-[#FFB300]/20 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-black/40 border border-white/5 rounded-2xl rounded-tl-none p-3.5 text-xs text-white/60 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#FFB300] rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-[#FFB300] rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-[#FFB300] rounded-full animate-bounce [animation-delay:0.4s]"></div>
              <span className="italic ml-1 text-[10px] font-mono tracking-wider uppercase text-white/40">Analisando telemetria...</span>
            </div>
          </div>
        )}

        {chatError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex flex-col gap-1">
            <p className="font-bold">Falha na Resposta:</p>
            <p>{chatError}</p>
            <p className="text-[10px] text-white/30 mt-1">
              Certifique-se de que a variável GEMINI_API_KEY esteja cadastrada no painel Secrets do AI Studio.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Clickable mechanic prompts */}
      {messages.length === 1 && !loading && (
        <div className="mb-4">
          <span className="block text-[9px] uppercase font-bold tracking-widest text-white/40 mb-2">Sugestões de Dúvidas:</span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(s)}
                className="px-2.5 py-1.5 text-[10px] bg-black/40 hover:bg-[#FFB300]/10 hover:border-[#FFB300]/40 text-white/70 hover:text-[#FFB300] rounded-lg text-left border border-white/5 transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls form */}
      <form onSubmit={formSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Escreva sua pergunta mecânica aqui..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-black border border-white/5 rounded-xl text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#FFB300] disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="p-2.5 bg-[#FFB300] hover:bg-[#FFC107] font-bold text-black rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
