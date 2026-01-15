
import React, { useState, useMemo } from 'react';
import { 
  Upload, AlertCircle, Database, ArrowRight, ArrowLeft, 
  Sparkles, Loader2, Activity, Check, Wand2, PlayCircle, Layers
} from 'lucide-react';
import { Dataset, DataPoint, ColumnMetadata, Language, DataIssue } from '../types';
import { interpretMetadata } from '../services/geminiService';
import { getSampleDatasets } from '../services/sampleData';
import * as XLSX from 'xlsx';

interface DataUploadProps {
  onUpload: (dataset: Dataset) => void;
  lang: Language;
}

const uiTranslations = {
  he: {
    title: 'Nexus Analytics AI',
    subtitle: 'הפוך נתונים גולמיים לתובנות אסטרטגיות בשניות',
    dragDrop: 'גרור קובץ Excel או CSV לכאן',
    support: 'תומך בפורמטים .xlsx, .xls, .csv',
    or: 'או',
    samplesTitle: 'התחל עם דאטה לדוגמה',
    samplesDesc: 'בחר אחד מהמאגרים הבאים כדי לראות את כוח ה-AI בפעולה',
    discoveryTitle: 'גילוי נתונים ראשוני (AI Insight)',
    discoverySub: 'הנה מה ש-Gemini מבין מהנתונים שלך:',
    launch: 'הפעל לוח בקרה',
    errorParse: 'נכשל פענוח הקובץ. נסה שוב.',
    stepBack: 'חזרה',
    interpreting: 'Gemini מנתח את ההקשר...',
    proceed: 'המשך להגדרות טכניות'
  },
  en: {
    title: 'Nexus Analytics AI',
    subtitle: 'Turn raw data into strategic insights in seconds',
    dragDrop: 'Drop Excel or CSV here',
    support: 'Formats: .xlsx, .xls, .csv',
    or: 'OR',
    samplesTitle: 'Quick Start with Samples',
    samplesDesc: 'Choose a dataset to see the AI power in action',
    discoveryTitle: 'Initial Discovery',
    discoverySub: 'What Gemini understands:',
    launch: 'Launch Dashboard',
    errorParse: 'Failed to parse file.',
    stepBack: 'Back',
    interpreting: 'Analyzing context...',
    proceed: 'Proceed to Setup'
  }
};

const DataUpload: React.FC<DataUploadProps> = ({ onUpload, lang }) => {
  const t = useMemo(() => uiTranslations[lang], [lang]);
  const samples = useMemo(() => getSampleDatasets(), []);
  
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'discovery'>('upload');
  const [tempDataset, setTempDataset] = useState<Dataset | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [discoveryInfo, setDiscoveryInfo] = useState<any>(null);

  const processFile = async (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        let workbook;
        if (file.name.endsWith('.csv')) {
          const text = new TextDecoder().decode(data as ArrayBuffer);
          workbook = XLSX.read(text, { type: 'string', raw: false });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        let jsonData = XLSX.utils.sheet_to_json(worksheet) as DataPoint[];
        if (jsonData.length === 0) throw new Error("Empty file");

        const rawHeaders = Object.keys(jsonData[0]);
        const cleanedHeaders = rawHeaders.map(h => h.trim().replace(/^"|"$/g, ''));
        jsonData = jsonData.map(row => {
          const newRow: DataPoint = {};
          rawHeaders.forEach((oldHeader, idx) => { newRow[cleanedHeaders[idx]] = row[oldHeader]; });
          return newRow;
        });

        const metadata: Record<string, ColumnMetadata> = {};
        cleanedHeaders.forEach(h => {
          const firstVal = jsonData.find(r => r[h] !== null)?.[h];
          const stringVal = String(firstVal || '').replace(/,/g, '').trim();
          const type = (!isNaN(parseFloat(stringVal)) && isFinite(Number(stringVal.replace(/%/g, '')))) ? 'number' : 'string';
          metadata[h] = { description: '', isFilter: type === 'string', isVisible: true, type, role: type === 'number' ? 'measure' : 'dimension' };
        });

        const newDs: Dataset = { id: Math.random().toString(36).substr(2, 9), name: file.name.replace(/\.[^/.]+$/, ""), data: jsonData, columns: cleanedHeaders, metadata, createdAt: Date.now() };
        setTempDataset(newDs);
        handleStartDiscovery(newDs);
      } catch (err) { setError(t.errorParse); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleStartDiscovery = async (ds: Dataset) => {
    setStep('discovery');
    setIsInterpreting(true);
    try {
      const result = await interpretMetadata(ds.columns, ds.data.slice(0, 5), lang);
      const updatedMetadata = { ...ds.metadata };
      Object.entries(result.metadata).forEach(([col, partial]) => {
        const target = Object.keys(updatedMetadata).find(k => k.trim() === col.trim());
        if (target) updatedMetadata[target] = { ...updatedMetadata[target], ...partial, interpreted: true };
      });
      setDiscoveryInfo({ summary: result.strategicSummary });
      setTempDataset({ ...ds, metadata: updatedMetadata });
    } catch (err) { console.error(err); } finally { setIsInterpreting(false); }
  };

  if (step === 'discovery' && tempDataset) {
    return (
      <div className="max-w-4xl w-full animate-in fade-in zoom-in-95 duration-500 text-start">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
          {isInterpreting ? (
            <div className="flex flex-col items-center justify-center space-y-8 py-20">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <p className="font-black text-xl text-indigo-700 dark:text-indigo-400">{t.interpreting}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-6 mb-12">
                <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl"><Sparkles size={32} /></div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{t.discoveryTitle}</h2>
                  <p className="text-slate-500 font-bold">{t.discoverySub}</p>
                </div>
              </div>
              <div className="p-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] mb-12 border border-indigo-100 dark:border-indigo-800">
                <p className="text-indigo-900 dark:text-indigo-300 font-black text-lg leading-relaxed italic">"{discoveryInfo?.summary}"</p>
              </div>
              <div className="flex gap-6">
                <button onClick={() => setStep('upload')} className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 font-black py-5 rounded-2xl hover:bg-slate-50 transition-all">{t.stepBack}</button>
                <button onClick={() => onUpload(tempDataset)} className="flex-[2] bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 text-lg transition-all">
                  {t.launch} <PlayCircle size={24} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full text-center space-y-20 pb-20">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-4">
          <Layers size={14} /> Intelligence Platform
        </div>
        <h2 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{t.title}</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Upload Card */}
        <div onDragEnter={() => setDragActive(true)} onDragLeave={() => setDragActive(false)} onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDrop={(e) => {
          e.preventDefault(); setDragActive(false);
          const file = e.dataTransfer.files?.[0]; if (file) processFile(file);
        }} className={`relative group bg-white dark:bg-slate-900 border-4 border-dashed rounded-[3.5rem] p-16 flex flex-col items-center justify-center transition-all cursor-pointer ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-2xl'}`}>
          <div className={`p-8 rounded-[2.5rem] mb-8 transition-all ${dragActive ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'}`}>
            <Upload size={56} />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{t.dragDrop}</p>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t.support}</p>
          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv,.xlsx,.xls" onChange={(e) => {
            const file = e.target.files?.[0]; if (file) processFile(file);
          }} />
        </div>

        {/* Samples Section */}
        <div className="flex flex-col justify-center text-start space-y-8">
           <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{t.samplesTitle}</h3>
              <p className="text-slate-500 font-bold">{t.samplesDesc}</p>
           </div>
           <div className="grid grid-cols-1 gap-6">
              {samples.map((sample, idx) => (
                <button key={idx} onClick={() => onUpload(sample)} className="group flex items-center justify-between p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-600 hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Database size={28} /></div>
                    <div>
                      <p className="font-black text-xl text-slate-900 dark:text-white">{sample.name}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">{sample.data.length} Records • {sample.columns.length} Dimensions</p>
                    </div>
                  </div>
                  <ArrowRight className={`text-slate-300 group-hover:text-indigo-600 transition-all ${lang === 'he' ? 'rotate-180' : ''}`} />
                </button>
              ))}
           </div>
        </div>
      </div>
      
      {error && <div className="p-6 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center gap-4 font-black shadow-lg border border-red-100 animate-bounce"><AlertCircle size={24} />{error}</div>}
    </div>
  );
};

export default DataUpload;
