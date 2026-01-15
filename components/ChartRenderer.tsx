
import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { WidgetConfig, DataPoint } from '../types';

interface ChartRendererProps {
  widget: WidgetConfig;
  data: DataPoint[];
  viewMode?: 'chart' | 'table';
}

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#fb923c', '#10b981', '#06b6d4'];

const cleanNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').replace(/"/g, '').replace(/%/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getValueByKey = (obj: any, key: string) => {
  if (!obj) return undefined;
  if (obj[key] !== undefined) return obj[key];
  const keys = Object.keys(obj);
  const trimmedKey = key.trim().toLowerCase();
  const foundKey = keys.find(k => k.trim().toLowerCase() === trimmedKey);
  return foundKey ? obj[foundKey] : undefined;
};

const ChartRenderer: React.FC<ChartRendererProps> = ({ widget, data, viewMode = 'chart' }) => {
  const aggregatedData = useMemo(() => {
    if (!data.length) return [];

    const groups: Record<string, number> = {};
    data.forEach(item => {
      const xRaw = getValueByKey(item, widget.xAxis);
      const yRaw = getValueByKey(item, widget.yAxis);
      
      const key = String(xRaw || 'אחר').trim();
      const val = cleanNumber(yRaw);
      groups[key] = (groups[key] || 0) + val;
    });

    const result = Object.entries(groups).map(([name, value]) => ({
      [widget.xAxis]: name,
      [widget.yAxis]: value
    }));

    if (widget.type === 'bar' || widget.type === 'pie') {
      result.sort((a, b) => (Number(b[widget.yAxis]) || 0) - (Number(a[widget.yAxis]) || 0));
    } else {
      result.sort((a, b) => String(a[widget.xAxis]).localeCompare(String(b[widget.xAxis]), undefined, {numeric: true}));
    }

    return result.slice(0, 50); // Limit to 50 for performance
  }, [data, widget]);

  const axisStyle = {
    fontSize: 10,
    fontWeight: 700,
    tickLine: false,
    axisLine: false,
    fill: 'currentColor'
  };

  if (viewMode === 'table') {
    return (
      <div className="h-full w-full overflow-y-auto custom-scrollbar pr-2">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg">{widget.xAxis}</th>
              <th className="px-4 py-3 text-right rounded-tr-lg rounded-br-lg">{widget.yAxis}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {aggregatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700 truncate max-w-[150px]" title={String(row[widget.xAxis])}>
                  {String(row[widget.xAxis])}
                </td>
                <td className="px-4 py-3 text-right font-bold text-indigo-600">
                  {Number(row[widget.yAxis]).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const renderChart = () => {
    if (!aggregatedData.length) return <div className="h-full flex items-center justify-center text-slate-400 italic">לא נמצאו נתונים להצגה</div>;

    const commonProps = {
      width: "100%",
      height: "100%",
      data: aggregatedData,
      margin: { top: 10, right: 10, left: 0, bottom: 40 }
    };

    switch (widget.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
            <XAxis dataKey={widget.xAxis} {...axisStyle} angle={-30} textAnchor="end" height={60} interval={0} />
            <YAxis {...axisStyle} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
            />
            <Bar dataKey={widget.yAxis} fill="#6366f1" radius={[6, 6, 0, 0]} barSize={35} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
            <XAxis dataKey={widget.xAxis} {...axisStyle} />
            <YAxis {...axisStyle} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip />
            <Line type="monotone" dataKey={widget.yAxis} stroke="#6366f1" strokeWidth={4} dot={{ r: 5, fill: '#fff', strokeWidth: 3, stroke: '#6366f1' }} activeDot={{ r: 8 }} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey={widget.xAxis} {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip />
            <Area type="monotone" dataKey={widget.yAxis} stroke="#6366f1" fill="url(#areaGradient)" strokeWidth={4} />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={aggregatedData}
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={5}
              dataKey={widget.yAxis}
              nameKey={widget.xAxis}
              animationDuration={1000}
            >
              {aggregatedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full text-slate-600 dark:text-slate-400 animate-in fade-in duration-500">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartRenderer;
