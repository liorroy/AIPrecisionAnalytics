
import React, { useState, useMemo, useEffect } from 'react';
import { Dataset, Language, ColumnMetadata } from '../types';
import { Search, ArrowUpDown, FileSpreadsheet, Settings, Eye, EyeOff, Info, Filter as FilterIcon, X, Check, AlertCircle, BarChart3, Hash, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataTableViewProps {
  dataset: Dataset;
  lang: Language;
  onUpdateMetadata: (column: string, metadata: ColumnMetadata) => void;
}

const uiTranslations = {
  he: {
    search: 'חפש בכל הטבלה...',
    showing: 'מציג {count} מתוך {total} שורות',
    empty: 'לא נמצאו נתונים תואמים',
    colSettings: 'הגדרות עמודה',
    visible: 'הצג עמודה',
    isFilter: 'אפשר סינון (Slicing)',
    description: 'תיאור העמודה ל-AI',
    save: 'סגור ועדכן',
    type: 'סוג',
    role: 'תפקיד הנתונים (AI)',
    dimension: 'מימד',
    measure: 'מדד',
    filterBy: 'סנן לפי ערך:',
    clearFilter: 'נקה סינון',
    selectAll: 'בחר הכל',
    levelHint: 'רמת היררכיה',
    memberHint: 'פריט תלוי היררכיה',
    selectParentFirst: 'בחר {parent} תחילה',
    exportClean: 'הורד נתונים (CSV)'
  },
  en: {
    search: 'Search across table...',
    showing: 'Showing {count} of {total} rows',
    empty: 'No matching records found',
    colSettings: 'Column Settings',
    visible: 'Show Column',
    isFilter: 'Enable Slicing Filter',
    description: 'Column Description (for AI)',
    save: 'Close & Update',
    type: 'Type',
    role: 'Data Role (AI)',
    dimension: 'Dimension',
    measure: 'Measure',
    filterBy: 'Filter by value:',
    clearFilter: 'Clear filter',
    selectAll: 'Select All',
    levelHint: 'Hierarchy Level',
    memberHint: 'Hierarchy Member',
    selectParentFirst: 'Select {parent} first',
    exportClean: 'Download Data (CSV)'
  }
};

const DataTableView: React.FC<DataTableViewProps> = ({ dataset, lang, onUpdateMetadata }) => {
  const t = useMemo(() => uiTranslations[lang], [lang]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [filteringCol, setFilteringCol] = useState<string | null>(null);
  
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<any>>>({});

  useEffect(() => {
    setColumnFilters({});
  }, [dataset.id]);

  const filteredData = useMemo(() => {
    let data = [...dataset.data];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    Object.entries(columnFilters).forEach(([col, selectedValues]) => {
      // Fix: Ensure selectedValues is treated as a Set for .size and .has
      if (selectedValues instanceof Set && selectedValues.size > 0) {
        data = data.filter(row => selectedValues.has(row[col]));
      }
    });

    if (sortCol) {
      data.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        return sortDir === 'asc' ? 1 : -1;
      });
    }
    return data;
  }, [dataset.data, searchTerm, sortCol, sortDir, columnFilters]);

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const handleExportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CleanedData");
    XLSX.writeFile(workbook, `${dataset.name}_cleaned.csv`);
  };

  const uniqueValuesInColumn = (col: string) => {
    const meta = dataset.metadata[col];
    let dataForUnique = dataset.data;

    if (meta.hierarchyRole === 'member' && meta.hierarchyLinkedColumn) {
      const parentSelections = columnFilters[meta.hierarchyLinkedColumn];
      if (parentSelections && parentSelections.size > 0) {
        dataForUnique = dataForUnique.filter(row => parentSelections.has(row[meta.hierarchyLinkedColumn!]));
      } else {
        return [];
      }
    }

    const set = new Set();
    dataForUnique.forEach(row => {
      if (row[col] !== null && row[col] !== undefined) set.add(row[col]);
    });
    return Array.from(set).sort();
  };

  const toggleColumnFilter = (col: string, value: any) => {
    setColumnFilters(prev => {
      const current = new Set(prev[col] || []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      
      const next = { ...prev, [col]: current };

      const meta = dataset.metadata[col];
      if (meta.hierarchyRole === 'level' && meta.hierarchyLinkedColumn) {
        delete next[meta.hierarchyLinkedColumn];
      }

      return next;
    });
  };

  const clearColumnFilter = (col: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[col];
      
      const meta = dataset.metadata[col];
      if (meta.hierarchyRole === 'level' && meta.hierarchyLinkedColumn) {
        delete next[meta.hierarchyLinkedColumn];
      }

      return next;
    });
  };

  const visibleColumns = dataset.columns.filter(col => dataset.metadata[col]?.isVisible);

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 sticky top-0 bg-white z-20">
        <div className="relative flex-1 max-md">
          <Search className={`absolute ${lang === 'he' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} size={18} />
          <input 
            type="text" 
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${lang === 'he' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none`}
          />
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
          >
            <Download size={14} /> {t.exportClean}
          </button>
          {Object.keys(columnFilters).length > 0 && (
            <button 
              onClick={() => setColumnFilters({})}
              className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline"
            >
              <X size={14} /> {t.clearFilter}s
            </button>
          )}
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-slate-50 px-3 py-2 rounded-lg">
            <FileSpreadsheet size={16} />
            <span>{dataset.data.length} Rows</span>
            <span className="mx-2 opacity-20">|</span>
            <span>{visibleColumns.length} / {dataset.columns.length} Columns</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-start border-collapse table-fixed min-w-full">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
            <tr>
              {dataset.columns.map(col => {
                const meta = dataset.metadata[col];
                return (
                  <th 
                    key={col} 
                    className={`px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-start border-x border-slate-100 min-w-[220px] overflow-visible relative ${!meta?.isVisible ? 'bg-slate-100 opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 cursor-pointer group truncate" onClick={() => toggleSort(col)}>
                        {meta.hierarchyRole === 'level' && <AlertCircle size={12} className="text-indigo-500 shrink-0" />}
                        <span className="truncate">{col}</span>
                        <ArrowUpDown size={12} className={sortCol === col ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'} />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {meta?.isFilter && (
                          <button 
                            onClick={() => setFilteringCol(filteringCol === col ? null : col)}
                            className={`p-1.5 rounded-md transition-colors shrink-0 ${columnFilters[col]?.size ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 text-slate-400'}`}
                          >
                            <FilterIcon size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => setEditingCol(col)}
                          className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                    </div>

                    {filteringCol === col && (
                      <div className={`absolute top-full mt-2 ${lang === 'he' ? 'left-0' : 'right-0'} w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{t.filterBy}</span>
                          <button onClick={() => clearColumnFilter(col)} className="text-[10px] text-indigo-600 font-bold hover:underline">{t.clearFilter}</button>
                        </div>
                        
                        {meta.hierarchyRole === 'member' && (!columnFilters[meta.hierarchyLinkedColumn!] || columnFilters[meta.hierarchyLinkedColumn!]?.size === 0) ? (
                          <div className="p-4 text-center bg-slate-50 rounded-lg">
                            <p className="text-[10px] text-slate-400 italic">
                              {t.selectParentFirst.replace('{parent}', meta.hierarchyLinkedColumn!)}
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                            {uniqueValuesInColumn(col).map((val, idx) => (
                              <button
                                key={idx}
                                onClick={() => toggleColumnFilter(col, val)}
                                className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded-lg text-start group"
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${columnFilters[col]?.has(val) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                  {columnFilters[col]?.has(val) && <Check size={10} />}
                                </div>
                                <span className="text-xs text-slate-600 truncate">{String(val)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <button 
                          onClick={() => setFilteringCol(null)}
                          className="w-full mt-3 bg-slate-900 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          {t.save}
                        </button>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors group">
                {dataset.columns.map(col => (
                  <td key={col} className={`px-4 py-3 text-sm text-slate-600 truncate border-x border-slate-50 ${!dataset.metadata[col]?.isVisible ? 'bg-slate-50/50 opacity-30 italic font-light' : ''}`}>
                    {row[col] === null || row[col] === undefined ? <span className="text-slate-300 italic">null</span> : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={dataset.columns.length} className="px-6 py-12 text-center text-slate-400 italic">
                  {t.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {editingCol && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Settings size={18} />
                  <h3 className="font-bold">{t.colSettings}: {editingCol}</h3>
                </div>
                <button onClick={() => setEditingCol(null)}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4 text-start">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    {dataset.metadata[editingCol]?.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    {t.visible}
                  </div>
                  <button 
                    onClick={() => onUpdateMetadata(editingCol, { ...dataset.metadata[editingCol], isVisible: !dataset.metadata[editingCol].isVisible })}
                    className={`w-10 h-6 rounded-full transition-all relative ${dataset.metadata[editingCol]?.isVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${dataset.metadata[editingCol]?.isVisible ? (lang === 'he' ? 'right-5' : 'left-5') : (lang === 'he' ? 'right-1' : 'left-1')}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FilterIcon size={18} />
                    {t.isFilter}
                  </div>
                  <button 
                    onClick={() => onUpdateMetadata(editingCol, { ...dataset.metadata[editingCol], isFilter: !dataset.metadata[editingCol].isFilter })}
                    className={`w-10 h-6 rounded-full transition-all relative ${dataset.metadata[editingCol]?.isFilter ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${dataset.metadata[editingCol]?.isFilter ? (lang === 'he' ? 'right-5' : 'left-5') : (lang === 'he' ? 'right-1' : 'left-1')}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <BarChart3 size={14} /> {t.role}
                  </label>
                  <div className="flex bg-slate-50 p-1 rounded-xl">
                    <button 
                      onClick={() => onUpdateMetadata(editingCol, { ...dataset.metadata[editingCol], role: 'dimension' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${dataset.metadata[editingCol]?.role === 'dimension' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <BarChart3 size={16} /> {t.dimension}
                    </button>
                    <button 
                      onClick={() => onUpdateMetadata(editingCol, { ...dataset.metadata[editingCol], role: 'measure' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${dataset.metadata[editingCol]?.role === 'measure' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Hash size={16} /> {t.measure}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Info size={14} /> {t.description}
                  </label>
                  <textarea 
                    value={dataset.metadata[editingCol]?.description || ''}
                    onChange={(e) => onUpdateMetadata(editingCol, { ...dataset.metadata[editingCol], description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                  />
                </div>
                
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.type}</div>
                  <div className="flex gap-2">
                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase">{dataset.metadata[editingCol]?.type || 'Unknown'}</div>
                    {dataset.metadata[editingCol]?.hierarchyRole && (
                      <div className="inline-block px-3 py-1 bg-indigo-50 rounded-full text-xs font-bold text-indigo-500 uppercase">
                        {dataset.metadata[editingCol]?.hierarchyRole === 'level' ? t.levelHint : t.memberHint}
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setEditingCol(null)}
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg mt-4"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <span className="text-xs font-medium text-slate-500">
          {t.showing.replace('{count}', String(filteredData.length)).replace('{total}', String(dataset.data.length))}
        </span>
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-4">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-600 rounded-full"></div> Total Rows Loaded: {dataset.data.length}</div>
        </div>
      </div>
    </div>
  );
};

export default DataTableView;
