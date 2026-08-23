import { Report, Table, Query, VirtualFile, SelectQuery } from '../../../../types/index';
import { toCamelCase, toPascalCase } from '../../common';

export const generateReportPage = (
  report: Report,
  tables: Table[],
  queries: Query[],
  root: string
): VirtualFile => {
  const compName = `${toPascalCase(report.name)}ReportPage`;
  const orientation = report.settings?.orientation || 'portrait';
  const widthClass = orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]';
  
  // Determine endpoint: Table or Query
  let endpoint = '';
  let fields: any[] = [];
  
  if (report.sourceType === 'table') {
      const table = tables.find(t => t.id === report.sourceId);
      if (table) {
          endpoint = toCamelCase(table.name);
          fields = table.fields.map(f => ({ name: f.name, prop: toCamelCase(f.name) }));
      }
  } else {
      const query = queries.find(q => q.id === report.sourceId);
      if (query) {
          endpoint = `queries/${toCamelCase(query.name)}`;
          fields = (query as SelectQuery).columns.map(c => ({ name: c.alias || c.fieldName, prop: toCamelCase(c.alias || c.fieldName) }));
      }
  }

  // Grouping Field
  const groupingFieldObj = fields.find(f => {
      if (report.sourceType === 'table') {
          const t = tables.find(t => t.id === report.sourceId);
          return t?.fields.find(field => field.id === report.groupingFieldId)?.name === f.name;
      }
      return false;
  });
  const groupingProp = groupingFieldObj ? groupingFieldObj.prop : null;

  // Summary Logic
  const summaryLogic = report.summaries.map(s => {
      const prop = toCamelCase(s.fieldName);
      if (s.calculation === 'COUNT') return `sum['${s.fieldName}'] = items.length;`;
      if (s.calculation === 'SUM') return `sum['${s.fieldName}'] = items.reduce((acc, curr) => acc + (Number(curr.${prop}) || 0), 0);`;
      return '';
  }).join('\n');

  const content = `import React, { useEffect, useState, useMemo } from 'react';
import { get } from '../../services/api';
import { FileText, Printer } from 'lucide-react';

export const ${compName} = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const load = async () => {
          try {
              const res = await get<any>('${endpoint}', { pageSize: 10000 }); // Fetch all for report
              const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || res?.Items || []);
              setData(items);
          } finally { setLoading(false); }
      };
      load();
  }, []);

  const groupedData = useMemo(() => {
      if (!data.length) return [];
      const groupBy: string | null = ${groupingProp ? `'${groupingProp}'` : 'null'};
      
      if (!groupBy) {
          return [{ key: 'Gesamt', items: data, summaries: calculateSummaries(data) }];
      }

      const groups: Record<string, any[]> = {};
      data.forEach(item => {
          const val = item[groupBy] || 'Unbekannt';
          if (!groups[val]) groups[val] = [];
          groups[val].push(item);
      });

      return Object.keys(groups).sort().map(key => ({
          key,
          items: groups[key],
          summaries: calculateSummaries(groups[key])
      }));
  }, [data]);

  function calculateSummaries(items: any[]) {
      const sum: any = {};
      ${summaryLogic}
      return sum;
  }

  const handlePrint = () => window.print();

  return (
    <div className="p-8 ${widthClass} mx-auto min-h-screen bg-white shadow-xl my-8 print:shadow-none print:m-0 text-slate-800">
        <style dangerouslySetInnerHTML={{ __html: \`
            @media print {
                @page {
                    size: ${orientation};
                    margin: 15mm;
                }
                body {
                    -webkit-print-color-adjust: exact;
                }
            }
        \` }} />
        <div className="flex justify-between items-start border-b-4 border-slate-800 pb-6 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">${report.name}</h1>
                <p className="text-slate-500 mt-1">Erstellt am: {new Date().toLocaleDateString()}</p>
            </div>
            <button onClick={handlePrint} className="print:hidden bg-slate-100 hover:bg-slate-200 p-2 rounded text-slate-600"><Printer size={20}/></button>
        </div>

        <div>
            {groupedData.map((group, idx) => (
                <div key={idx} className="mb-8 break-inside-avoid">
                    {group.key !== 'Gesamt' && (
                        <div className="bg-slate-100 p-2 font-bold text-lg text-slate-700 border-l-4 border-slate-400 mb-2">
                            {group.key}
                        </div>
                    )}
                    
                    <table className="w-full text-sm text-left mb-2">
                        <thead className="border-b border-slate-300">
                            <tr>
                                ${report.columns?.filter(c=>c.visible).map(c => `<th className="py-2 font-semibold uppercase text-xs text-slate-500">${c.label}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            {group.items.map((item, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0">
                                    ${report.columns?.filter(c=>c.visible).map(c => {
                                        const foundField = fields.find(f => f.name === c.label);
                                        const prop = foundField ? foundField.prop : toCamelCase(c.label);
                                        const pascalProp = toPascalCase(c.label);
                                        return `<td className="py-2">{item['${prop}'] ?? item['${pascalProp}'] ?? item['${c.label}'] ?? ''}</td>`;
                                    }).join('')}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {Object.keys(group.summaries).length > 0 && (
                        <div className="bg-slate-50 p-3 flex justify-end gap-6 text-sm border-t border-slate-200">
                            {Object.entries(group.summaries).map(([k, v]: any) => (
                                <div key={k}><strong>{k}:</strong> {v}</div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};`;

  return { name: `${compName}.tsx`, path: `${root}/src/pages/reports/${compName}.tsx`, content, language: 'typescript' };
};
