
import React, { useMemo } from 'react';
import { 
  Lightbulb, Info, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, 
  Target, Eye, RefreshCw, Loader2, Sparkles, Zap,
  // Fix: Added missing Brain icon import
  Brain 
} from 'lucide-react';
import { AIInsight, Language } from '../types';

interface InsightSidebarProps {
  insights: AIInsight[];
  lang: Language;
  onInsightClick: (id: string, linkedWidgetId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const uiTranslations = {
  he: {
    title: 'סיכום תובנות',
    subtitle: 'Nexus Intelligence',
    actions: 'פעולות מומלצות',
    decision: 'המלצת המערכת:',
    noInsights: 'ממתין לניתוח נתונים...',
    viewGraph: 'הצג תרשים תומך',
    observation: 'תצפית (AI)',
    interpretation: 'משמעות עסקית',
    implication: 'השפעה עתידית',
    refreshInsights: 'רענן תובנות',
    refreshing: 'מעדכן...',
    footer: 'נוצר ע"י Nexus AI - ללא מגע יד אדם.'
  },
  en: {
    title: 'Executive Insights',
    subtitle: 'Nexus Intelligence',
    actions: 'Recommended Actions',
    decision: 'AI Recommendation:',
    noInsights: 'Awaiting data analysis...',
    viewGraph: 'View Supporting Chart',
    observation: 'AI Observation',
    interpretation: 'Business Value',
    implication: 'Future Implication',
    refreshInsights: 'Refresh Analysis',
    refreshing: 'Updating...',
    footer: 'Autonomous analysis by Nexus AI.'
  }
};

const InsightSidebar: React.FC<InsightSidebarProps> = ({ insights, lang, onInsightClick, onRefresh, isRefreshing }) => {
  const t = useMemo(() => uiTranslations[lang], [lang]);

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'positive': return <Zap size={20} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
      default: return <Sparkles size={20} className="text-indigo-500" />;
    }
  };

  const getColors = (severity: string) => {
    switch (severity) {
      case 'positive': return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 hover:border-emerald-300 text-emerald-900 dark:text-emerald-100';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 hover:border-amber-300 text-amber-900 dark:text-amber-100';
      default: return 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 hover:border-indigo-300 text-indigo-900 dark:text-indigo-100';
    }
  };

  const parseContent = (content: string) => {
    const parts = {
      observation: '',
      interpretation: '',
      implication: ''
    };
    const observationMatch = content.match(/(?:Observation|תצפית)[:\s]+([^]*?)(?=(?:Interpretation|משמעות|פרשנות)|$)/i);
    const interpretationMatch = content.match(/(?:Interpretation|משמעות|פרשנות)[:\s]+([^]*?)(?=(?:Implication|השפעה|השלכה)|$)/i);
    const implicationMatch = content.match(/(?:Implication|השפעה|השלכה)[:\s]+([^]*?)$/i);
    if (observationMatch) parts.observation = observationMatch[1].trim();
    if (interpretationMatch) parts.interpretation = interpretationMatch[1].trim();
    if (implicationMatch) parts.implication = implicationMatch[1].trim();
    if (!parts.observation) parts.observation = content;
    return parts;
  };

  return (
    <aside className={`w-[400px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-inline p-10 overflow-y-auto custom-scrollbar flex flex-col shrink-0 ${lang === 'he' ? 'border-r' : 'border-l'} border-slate-200 dark:border-slate-800 shadow-2xl z-30`}>
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white p-3 rounded-[1rem] shadow-xl shadow-indigo-200 dark:shadow-none animate-bounce-subtle">
            <Brain size={28} />
          </div>
          <div>
            <h2 className="font-black text-2xl tracking-tighter text-slate-800 dark:text-white leading-none">{t.title}</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">{t.subtitle}</p>
          </div>
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            disabled={isRefreshing}
            className={`p-3 rounded-2xl transition-all shadow-md ${isRefreshing ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-indigo-50 active:scale-95'}`}
            title={t.refreshInsights}
          >
            {isRefreshing ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
          </button>
        )}
      </div>

      <div className="space-y-10 flex-1">
        {insights.map((insight) => {
          const { observation, interpretation, implication } = parseContent(insight.content);
          return (
            <div 
              key={insight.id} 
              onClick={() => insight.linkedWidgetId && onInsightClick(insight.id, insight.linkedWidgetId)}
              className={`relative p-8 rounded-[2rem] border-2 transition-all shadow-sm group cursor-pointer ${getColors(insight.severity)}`}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="shrink-0 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl shadow-sm">{getIcon(insight.severity)}</div>
                <h4 className="font-black text-base leading-tight group-hover:text-indigo-600 transition-colors">{insight.title}</h4>
              </div>
              
              <div className="space-y-6 mb-8">
                {observation && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.observation}</span>
                    <p className="text-xs font-bold leading-relaxed">{observation}</p>
                  </div>
                )}
                {interpretation && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.interpretation}</span>
                    <p className="text-xs font-bold leading-relaxed opacity-80">{interpretation}</p>
                  </div>
                )}
                {implication && (
                  <div className="space-y-2 p-3 bg-white/50 dark:bg-slate-900/30 rounded-xl border border-white/20">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{t.implication}</span>
                    <p className="text-xs font-black leading-relaxed text-indigo-700 dark:text-indigo-400">{implication}</p>
                  </div>
                )}
              </div>

              {insight.linkedWidgetId && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50">
                  <div className="flex items-center gap-3 text-[10px] font-black text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform uppercase tracking-widest">
                    <Eye size={16} />
                    {t.viewGraph}
                  </div>
                  {lang === 'he' ? <ArrowLeft size={20} className="text-indigo-400" /> : <ArrowRight size={20} className="text-indigo-400" />}
                </div>
              )}
            </div>
          );
        })}
        
        {insights.length === 0 && (
          <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-pulse">
            <Brain size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t.noInsights}</p>
          </div>
        )}
      </div>

      <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-900 dark:bg-indigo-600 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50"></div>
          <p className="text-[10px] text-white/70 leading-relaxed font-bold relative z-10 italic">
            {t.footer}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default InsightSidebar;
