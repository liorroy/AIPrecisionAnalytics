
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, X, User, Bot, Loader2, Sparkles, Plus, Brain } from 'lucide-react';
import { Dataset, ChatMessage, Language, WidgetConfig } from '../types';
import { chatWithData } from '../services/geminiService';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeDataset: Dataset | null;
  lang: Language;
  onAddWidget: (widget: WidgetConfig) => void;
}

const uiTranslations = {
  he: {
    title: 'עוזר התובנות של AI',
    welcome: 'איך אוכל לעזור לך?',
    intro: 'אני יכול להסביר מגמות, להציע גרפים או לחשב מדדים.',
    suggest1: 'סכם מגמות עיקריות בנתונים',
    suggest2: 'מה הקשר בין העמודות?',
    thinking: 'מפעיל Deep Reasoning...',
    placeholder: 'שאל על הנתונים שלך...',
    error: 'שגיאה בתקשורת עם ה-AI',
    addWidget: 'הוסף לדשבורד'
  },
  en: {
    title: 'AI Insight Assistant',
    welcome: 'How can I help you?',
    intro: 'I can explain trends, suggest visualizations, or calculate metrics.',
    suggest1: 'Summarize key trends in data',
    suggest2: 'What is the correlation between columns?',
    thinking: 'Executing Deep Reasoning...',
    placeholder: 'Ask about your data...',
    error: 'Error communicating with AI',
    addWidget: 'Add to Dashboard'
  }
};

const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose, activeDataset, lang, onAddWidget }) => {
  const t = useMemo(() => uiTranslations[lang], [lang]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || !activeDataset || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithData(activeDataset, inputValue, history, lang);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
        suggestedWidget: response.newWidget
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`absolute ${lang === 'he' ? 'left-6' : 'right-6'} bottom-20 w-96 h-[600px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50`}>
      <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={20} className="animate-pulse" />
          <h3 className="font-semibold">{t.title}</h3>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={20} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="bg-white p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 text-indigo-600">
              <Brain className="animate-pulse" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-1">{t.welcome}</h4>
            <p className="text-xs text-slate-500 mb-4">{t.intro}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${m.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-indigo-600 shadow-sm'}`}>
                {m.role === 'user' ? 'U' : <Brain size={14} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm max-w-[280px] shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'} whitespace-pre-wrap text-start`}>
                {m.content}
              </div>
            </div>
            {m.suggestedWidget && (
              <div className="ml-9 p-3 bg-white border-2 border-dashed border-indigo-200 rounded-xl max-w-[250px] animate-in zoom-in-95 duration-200">
                <div className="text-[10px] font-bold text-indigo-500 uppercase mb-2">Suggested Visualization</div>
                <div className="font-bold text-xs mb-1 truncate">{m.suggestedWidget.title}</div>
                <div className="text-[10px] text-slate-400 mb-3 truncate">{m.suggestedWidget.description}</div>
                <button 
                  onClick={() => {
                    onAddWidget(m.suggestedWidget!);
                    setMessages(prev => prev.map((msg, idx) => idx === i ? { ...msg, suggestedWidget: undefined } : msg));
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={14} /> {t.addWidget}
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="shrink-0 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Loader2 size={12} className="animate-spin text-indigo-600" /></div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm rounded-2xl italic text-[10px] flex items-center gap-2">
              <Brain size={12} className="animate-pulse" />
              {t.thinking}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.placeholder}
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
        />
        <button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0">
          <Send size={18} className={lang === 'he' ? 'rotate-180' : ''} />
        </button>
      </div>
    </div>
  );
};

export default AIChatPanel;
