
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dashboard, Dataset, WidgetConfig, ColumnMetadata, Language, ChartType } from '../types';
import ChartRenderer from './ChartRenderer';
import { Filter, X, Target, ChevronDown, Check, Table as TableIcon, Sparkles, TrendingUp, BarChart3, Plus, Save, Layout } from 'lucide-react';

interface DashboardViewProps {
  dashboard: Dashboard | null;
  dataset: Dataset;
  lang: Language;
  highlightedWidgetId: string | null;
  activeFilters: Record<string, any[]>;
  onFiltersChange: (filters: Record<string, any[]>) => void;
  onUpdateWidget: (widget: WidgetConfig) => void;
  onDuplicateWidget: (id: string) => void;
  onDeleteWidget: (id: string) => void;
  onAddWidget: (widget: WidgetConfig) => void;
}

const uiTranslations = {
  he: {
    filters: 'מסנני חיתוך (Slicers)',
    clear: 'נקה הכל',
    all: 'כל הערכים',
    selected: 'נבחרו',
    strategyTitle: 'Roadmap אסטרטגי',
    strategyDesc: 'Nexus AI הגדיר את השאלות הקריטיות ביותר מהנתונים שלך.',
    insightTitle: 'תובנה חכמה',
    tableView: 'תצוגת טבלה',
    chartView: 'תצוגת גרף',
    addWidget: 'הוסף גרף חדש',
    builderTitle: 'בניית גרף מותאם אישית',
    chartType: 'סוג הגרף',
    xAxis: 'ציר X (קטגוריה)',
    yAxis: 'ציר Y (מדד/ערך)',
    chartTitle: 'כותרת הגרף',
    create: 'צור גרף',
    cancel: 'ביטול'
  },
  en: {
    filters: 'Slicing Filters (Slicers)',
    clear: 'Clear All',
    all: 'All Values',
    selected: 'Selected',
    strategyTitle: 'Strategic Roadmap',
    strategyDesc: 'Nexus AI identified key insights.',
    insightTitle: 'AI Smart Insight',
    tableView: 'Table View',
    chartView: 'Chart View',
    addWidget: 'Add New Widget',
    builderTitle: 'Custom Widget Builder',
    chartType: 'Chart Type',
    xAxis: 'X-Axis (Category)',
    yAxis: 'Y-Axis (Value/Measure)',
    chartTitle: 'Chart Title',
    create: 'Create Widget',
    cancel: 'Cancel'
  }
};

const MultiSelectDropdown: React.FC<{
  label: string;
  options: any[];
  selected: any[];
  onChange: (vals: any[]) => void;
  lang: Language;
}> = ({ label, options, selected, onChange, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = uiTranslations[lang];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full sm:w-64" ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block px-1">{label}</label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border ${isOpen ? 'border-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-900/20' : 'border-slate-200 dark:border-slate-700'} rounded-2xl px-5 py-3 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-sm`}
      >
        <span className="truncate font-bold">{selected.length === 0 ? t.all : `${selected.length} ${t.selected}`}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar flex flex-col gap-1">
            {options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => {
                  const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
                  onChange(next);
                }} 
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-start ${selected.includes(opt) ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
              >
                <span className="text-xs font-bold truncate">{String(opt)}</span>
                {selected.includes(opt) && <Check size={14} className="text-indigo-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardView: React.FC<DashboardViewProps> = ({ 
  dashboard, dataset, lang, highlightedWidgetId, activeFilters, onFiltersChange, onAddWidget
}) => {
  const t = useMemo(() => uiTranslations[lang], [lang]);
  const widgetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [flippedWidgets, setFlippedWidgets] = useState<Set<string>>(new Set());
  
  // Widget Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newWidget, setNewWidget] = useState<Partial<WidgetConfig>>({
    type: 'bar',
    title: ''
  });

  useEffect(() => {
    if (highlightedWidgetId && widgetRefs.current[highlightedWidgetId]) {
      widgetRefs.current[highlightedWidgetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedWidgetId]);

  const filterableColumns = useMemo(() => (Object.entries(dataset.metadata) as [string, ColumnMetadata][]).filter(([_, meta]) => meta.isFilter).map(([col]) => col), [dataset.metadata]);

  const uniqueValues = useMemo(() => {
    const vals: Record<string, any[]> = {};
    filterableColumns.forEach(col => {
      const allVals = dataset.data.map(d => d[col]);
      vals[col] = Array.from(new Set(allVals)).filter(v => v != null).sort().slice(0, 50);
    });
    return vals;
  }, [dataset.data, filterableColumns]);

  const filteredData = useMemo(() => {
    return dataset.data.filter(row => 
      Object.entries(activeFilters).every(([col, vals]) => {
        const v = vals as any[];
        return !v?.length || v.includes(row[col]);
      })
    );
  }, [dataset.data, activeFilters]);

  const toggleWidgetFlip = (id: string) => {
    setFlippedWidgets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateWidget = () => {
    if (!newWidget.title || !newWidget.xAxis || !newWidget.yAxis || !newWidget.type) return;
    
    onAddWidget({
      id: Math.random().toString(36).substr(2, 9),
      title: newWidget.title,
      type: newWidget.type as ChartType,
      xAxis: newWidget.xAxis,
      yAxis: newWidget.yAxis,
      description: 'Custom widget'
    });
    setIsBuilderOpen(false);
    setNewWidget({ type: 'bar', title: '' });
  };

  const dimensionCols = dataset.columns;
  // Naive check for measure columns (numbers)
  const measureCols = dataset.columns.filter(col => dataset.metadata[col]?.type === 'number');

  if (!dashboard) return null;

  return (
    <div className="space-y-16 pb-32 text-start relative">
      
      {/* Strategic Roadmap */}
      {dashboard.strategy && dashboard.strategy.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] p-12 shadow-2xl relative overflow-visible group">
          <div className="flex items-center gap-6 mb-14">
            <div className="bg-indigo-600 text-white p-4.5 rounded-[2rem] shadow-2xl"><Target size={36} /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{t.strategyTitle}</h2>
              <p className="text-sm text-indigo-500 font-black mt-3 uppercase tracking-[0.2em]">{t.strategyDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {dashboard.strategy.map((item, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <TrendingUp size={16} /> Objective {idx + 1}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white mb-6 text-xl leading-tight">{item.question}</h4>
                <div className="p-7 bg-white dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-3xl italic text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
                  "{item.answer}"
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Slicers */}
      {filterableColumns.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 shadow-2xl relative z-50 overflow-visible">
          <div className="flex items-center justify-between mb-12">
             <div className="flex items-center gap-5">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-4 rounded-2xl"><Filter size={28} /></div>
                <h3 className="font-black text-2xl tracking-tighter uppercase dark:text-white">{t.filters}</h3>
             </div>
             {Object.keys(activeFilters).length > 0 && (
               <button onClick={() => onFiltersChange({})} className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 px-7 py-3.5 bg-red-50 rounded-2xl border border-red-100 hover:bg-red-100 transition-all">
                 <X size={16}/> {t.clear}
               </button>
             )}
          </div>
          <div className="flex flex-wrap gap-10">
            {filterableColumns.map(col => (
              <MultiSelectDropdown key={col} label={col} options={uniqueValues[col] || []} selected={activeFilters[col] || []} onChange={(vals) => onFiltersChange({ ...activeFilters, [col]: vals })} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10">
        {dashboard.widgets.map((widget) => {
          const isFlipped = flippedWidgets.has(widget.id);
          return (
            <div 
              key={widget.id} 
              ref={el => { widgetRefs.current[widget.id] = el; }} 
              className={`bg-white dark:bg-slate-900 border transition-all duration-700 flex flex-col rounded-[3rem] p-12 shadow-lg ${highlightedWidgetId === widget.id ? 'border-indigo-600 ring-[12px] ring-indigo-500/10 scale-[1.03] z-20' : 'border-slate-200 dark:border-slate-800'}`}
            >
              <div className="flex items-start justify-between mb-12">
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter leading-tight">{widget.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{widget.xAxis} BY {widget.yAxis}</span>
                    </div>
                </div>
                <button 
                  onClick={() => toggleWidgetFlip(widget.id)}
                  className={`p-3 rounded-2xl shadow-sm transition-all ${isFlipped ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
                  title={isFlipped ? t.chartView : t.tableView}
                >
                  {isFlipped ? <BarChart3 size={20} /> : <TableIcon size={20} />}
                </button>
              </div>
              <div className="flex-1 min-h-[400px]">
                <ChartRenderer 
                  widget={widget} 
                  data={filteredData} 
                  viewMode={isFlipped ? 'table' : 'chart'}
                />
              </div>
              <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><Sparkles size={18} /></div>
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.insightTitle}</span>
              </div>
            </div>
          );
        })}

        {/* Add Widget Ghost Card */}
        <button 
          onClick={() => setIsBuilderOpen(true)}
          className="group flex flex-col items-center justify-center gap-6 min-h-[400px] rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer"
        >
          <div className="p-6 bg-white dark:bg-slate-800 rounded-full shadow-xl group-hover:scale-110 transition-transform text-indigo-600">
            <Plus size={40} />
          </div>
          <span className="text-xl font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">{t.addWidget}</span>
        </button>
      </div>

      {/* Widget Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white p-2 rounded-xl"><Layout size={20} /></div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{t.builderTitle}</h3>
              </div>
              <button onClick={() => setIsBuilderOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.chartTitle}</label>
                <input 
                  type="text" 
                  value={newWidget.title} 
                  onChange={e => setNewWidget({...newWidget, title: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  placeholder="e.g. Sales by Region"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.chartType}</label>
                <div className="grid grid-cols-3 gap-3">
                  {['bar', 'line', 'pie', 'area', 'scatter', 'radar'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setNewWidget({...newWidget, type: type as ChartType})}
                      className={`p-3 rounded-xl border-2 text-sm font-bold capitalize transition-all ${newWidget.type === type ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.xAxis}</label>
                  <select 
                    value={newWidget.xAxis || ''}
                    onChange={e => setNewWidget({...newWidget, xAxis: e.target.value})}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium appearance-none"
                  >
                    <option value="" disabled>Select Column</option>
                    {dimensionCols.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.yAxis}</label>
                  <select 
                    value={newWidget.yAxis || ''}
                    onChange={e => setNewWidget({...newWidget, yAxis: e.target.value})}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium appearance-none"
                  >
                    <option value="" disabled>Select Measure</option>
                    {measureCols.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleCreateWidget}
                disabled={!newWidget.title || !newWidget.xAxis || !newWidget.yAxis}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                <Save size={20} /> {t.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
