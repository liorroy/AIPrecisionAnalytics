
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  LayoutDashboard, 
  Database, 
  Settings, 
  Upload, 
  MessageSquare, 
  TrendingUp, 
  Trash2,
  Plus,
  Globe,
  Search,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  Share2,
  Brain,
  Check,
  RefreshCw,
  Download,
  Moon,
  Sun,
  Presentation,
  Maximize2,
  X,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Dataset, Dashboard, AIInsight, Language, ColumnMetadata, WidgetConfig } from './types';
import DataUpload from './components/DataUpload';
import DashboardView from './components/DashboardView';
import DataTableView from './components/DataTableView';
import AIChatPanel from './components/AIChatPanel';
import InsightSidebar from './components/InsightSidebar';
import { analyzeDataset } from './services/geminiService';
import { getSampleDatasets } from './services/sampleData';

export const translations = {
  he: {
    title: 'Nexus AI',
    subtitle: 'Precision Analytics',
    manage: 'ניהול פרויקט',
    dashboards: 'לוחות בקרה',
    datasets: 'מאגרי נתונים',
    addDataset: 'הוסף מאגר',
    settings: 'הגדרות',
    welcome: 'ברוכים הבאים ל-Nexus',
    askAI: 'שאל את ה-AI',
    shareReport: 'שתף דוח חי',
    sharing: 'מייצר קישור...',
    shared: 'הקישור הועתק!',
    analyzing: 'Gemini מבצע Deep Analysis...',
    scanning: 'מגדיר שאלות מחקר',
    detecting: 'מנתח מגמות עומק',
    generating: 'בונה דשבורד מבוסס תובנות',
    dashboard: 'לוח בקרה',
    dataExplorer: 'סייר נתונים',
    changeLang: 'English',
    refreshing: 'מעדכן תובנות...',
    exportFull: 'ייצא דוח אקסל מלא',
    presentation: 'מצב מצגת',
    errorTitle: 'שגיאת ניתוח',
    errorDesc: 'לא הצלחנו לנתח את הנתונים. וודא שהקובץ תקין ונסה שוב.',
    linkTooLong: 'מאגר הנתונים גדול מדי לשיתוף בקישור. ייצא לקובץ.',
    rows: 'שורות',
    cols: 'עמודות'
  },
  en: {
    title: 'Nexus AI',
    subtitle: 'Precision Analytics',
    manage: 'Project Management',
    dashboards: 'Dashboards',
    datasets: 'Datasets',
    addDataset: 'Add Dataset',
    settings: 'Settings',
    welcome: 'Welcome to Nexus',
    askAI: 'Ask AI',
    shareReport: 'Share Live Link',
    sharing: 'Creating link...',
    shared: 'Link Copied!',
    analyzing: 'Gemini Deep Analysis...',
    scanning: 'Formulating questions',
    detecting: 'Analyzing deep patterns',
    generating: 'Building insights dashboard',
    dashboard: 'Dashboard',
    dataExplorer: 'Data Explorer',
    changeLang: 'עברית',
    refreshing: 'Refreshing insights...',
    exportFull: 'Export Full Excel',
    presentation: 'Presentation Mode',
    errorTitle: 'Analysis Error',
    errorDesc: 'We could not analyze the data.',
    linkTooLong: 'Dataset is too large for a direct link.',
    rows: 'Rows',
    cols: 'Columns'
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('he');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [highlightedWidgetId, setHighlightedWidgetId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any[]>>({});
  const [errorState, setErrorState] = useState<{title: string, desc: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSharedMode, setIsSharedMode] = useState(false);

  const t = useMemo(() => translations[lang], [lang]);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);
  const toggleLang = useCallback(() => setLang(prev => prev === 'he' ? 'en' : 'he'), []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Decode Share URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedToken = params.get('share');
    if (sharedToken) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(sharedToken))));
        setDatasets([decoded.dataset]);
        setActiveDatasetId(decoded.dataset.id);
        setActiveDashboard(decoded.dashboard);
        setInsights(decoded.insights);
        setIsSharedMode(true);
        setIsSidebarOpen(false);
      } catch (e) { console.error(e); }
    }
  }, []);

  const activeDataset = useMemo(() => 
    datasets.find(d => d.id === activeDatasetId) || null
  , [datasets, activeDatasetId]);

  const startAnalysis = useCallback(async (isRefresh = false) => {
    if (!activeDataset) return;
    if (isRefresh) setIsRefreshingInsights(true);
    else setIsAnalyzing(true);
    setErrorState(null);

    try {
      const result = await analyzeDataset(activeDataset, lang);
      setInsights(result.insights);
      if (!isRefresh) {
        setActiveDashboard({
          id: Math.random().toString(36).substr(2, 9),
          name: activeDataset.name,
          datasetId: activeDataset.id,
          widgets: result.suggestedWidgets,
          strategy: result.strategy
        });
      }
    } catch (error) {
      setErrorState({ title: t.errorTitle, desc: t.errorDesc });
    } finally {
      setIsAnalyzing(false);
      setIsRefreshingInsights(false);
    }
  }, [activeDataset, lang, t]);

  useEffect(() => {
    if (activeDataset && !activeDashboard && !isAnalyzing && !isSharedMode) {
      startAnalysis();
    }
  }, [activeDatasetId, activeDashboard, startAnalysis, isAnalyzing, isSharedMode, activeDataset]);

  const handleAddWidget = (widget: WidgetConfig) => {
    if (activeDashboard) {
      setActiveDashboard({
        ...activeDashboard,
        widgets: [...activeDashboard.widgets, widget]
      });
      setToast('Widget added successfully');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const shareWorkspace = async () => {
    if (!activeDataset || !activeDashboard) return;
    setIsSharing(true);
    const payload = JSON.stringify({ dataset: activeDataset, dashboard: activeDashboard, insights });
    if (payload.length > 3000) {
      setToast(t.linkTooLong);
      setIsSharing(false);
      return;
    }
    const encoded = btoa(unescape(encodeURIComponent(payload)));
    await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?share=${encoded}`);
    setToast(t.shared);
    setTimeout(() => setIsSharing(false), 2000);
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {!isSharedMode && (
        <aside className={`bg-white dark:bg-slate-900 border-inline transition-all duration-300 flex flex-col ${lang === 'he' ? 'border-l' : 'border-r'} border-slate-200 dark:border-slate-800 shadow-2xl z-50 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 h-20 shrink-0">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shrink-0"><BarChart3 size={28} /></div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter leading-none">{t.title}</span>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t.subtitle}</span>
              </div>
            )}
          </div>
          <nav className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            <button onClick={() => setViewMode('dashboard')} className={`flex items-center gap-4 p-4 rounded-2xl transition-all w-full text-start ${viewMode === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              <LayoutDashboard size={20} />
              {isSidebarOpen && <span className="font-bold">{t.dashboards}</span>}
            </button>
            <div className={`mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2 ${!isSidebarOpen && 'text-center'}`}>
              {isSidebarOpen ? t.datasets : '...'}
            </div>
            {datasets.map(ds => (
              <button key={ds.id} onClick={() => { setActiveDatasetId(ds.id); setViewMode('dashboard'); setActiveDashboard(null); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all truncate ${activeDatasetId === ds.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                <Database size={20} className="shrink-0" />
                {isSidebarOpen && <span className="truncate text-xs">{ds.name}</span>}
              </button>
            ))}
            <button onClick={() => { setActiveDatasetId(null); setActiveDashboard(null); }} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-400 transition-all mt-4">
              <Plus size={20} />
              {isSidebarOpen && <span className="font-bold">{t.addDataset}</span>}
            </button>
          </nav>
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <button onClick={toggleTheme} className="flex items-center gap-4 p-3 w-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              {isSidebarOpen && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
            </button>
            <button onClick={toggleLang} className="flex items-center gap-4 p-3 w-full text-indigo-600 font-black hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
              <Globe size={20} />
              {isSidebarOpen && <span>{t.changeLang}</span>}
            </button>
          </div>
        </aside>
      )}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeDataset && (
          <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-30 shadow-sm">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{activeDataset.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mr-4">
                <button onClick={() => setViewMode('dashboard')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600' : 'text-slate-500'}`}>
                  {t.dashboard}
                </button>
                <button onClick={() => setViewMode('table')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600' : 'text-slate-500'}`}>
                  {t.dataExplorer}
                </button>
              </div>
              {!isSharedMode && (
                <button onClick={shareWorkspace} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl hover:opacity-90 transition-all">
                  <LinkIcon size={18} /> {isSharing ? t.shared : t.shareReport}
                </button>
              )}
              {!isSharedMode && (
                 <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-3 rounded-2xl flex items-center gap-3 px-6 ${isChatOpen ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <MessageSquare size={20} /> <span className="text-sm font-black">{t.askAI}</span>
                </button>
              )}
            </div>
          </header>
        )}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto p-10 custom-scrollbar">
            {!activeDataset ? (
              <div className="h-full flex items-center justify-center">
                <DataUpload onUpload={(ds) => { setDatasets(p => [...p, ds]); setActiveDatasetId(ds.id); setActiveDashboard(null); }} lang={lang} />
              </div>
            ) : isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-12">
                <div className="w-32 h-32 border-[8px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{t.analyzing}</p>
                <p className="text-slate-400 font-bold max-w-sm text-center">Gemini 3 Pro מנתח עכשיו את כל ההקשרים והמגמות בדאטה שלך...</p>
              </div>
            ) : (
              viewMode === 'dashboard' 
                ? <DashboardView dashboard={activeDashboard} dataset={activeDataset} lang={lang} highlightedWidgetId={highlightedWidgetId} activeFilters={activeFilters} onFiltersChange={setActiveFilters} onUpdateWidget={() => {}} onDuplicateWidget={() => {}} onDeleteWidget={() => {}} onAddWidget={handleAddWidget} />
                : <DataTableView dataset={activeDataset} lang={lang} onUpdateMetadata={() => {}} />
            )}
          </div>
        </div>
        <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} activeDataset={activeDataset} lang={lang} onAddWidget={handleAddWidget} />
      </main>
      {activeDataset && insights.length > 0 && !isAnalyzing && !isSharedMode && (
        <InsightSidebar insights={insights} lang={lang} onInsightClick={(id, wid) => setHighlightedWidgetId(wid)} onRefresh={() => startAnalysis(true)} isRefreshing={isRefreshingInsights} />
      )}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl z-[100] animate-in slide-in-from-bottom-6">{toast}</div>
      )}
    </div>
  );
};

export default App;
