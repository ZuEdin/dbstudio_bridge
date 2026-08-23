import React, { useState } from 'react';
import { CustomPage } from '../../../types/index';

interface PageExpectedParamsEditorProps {
    page: CustomPage;
    onPageChange: (p: CustomPage) => void;
}

export const PageExpectedParamsEditor: React.FC<PageExpectedParamsEditorProps> = ({ page, onPageChange }) => {
    const [newParam, setNewParam] = useState('');
    const expected = page.expectedParams || [];

    const handleAdd = () => {
        if (newParam.trim() && !expected.includes(newParam.trim())) {
            onPageChange({
                ...page,
                expectedParams: [...expected, newParam.trim()]
            });
            setNewParam('');
        }
    };

    const handleRemove = (p: string) => {
        onPageChange({
            ...page,
            expectedParams: expected.filter(x => x !== p)
        });
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                <input 
                    type="text"
                    value={newParam}
                    onChange={(e) => setNewParam(e.target.value)}
                    placeholder="z.B. customerId"
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                />
                <button 
                    type="button"
                    onClick={handleAdd}
                    className="px-2 py-1 bg-slate-800 text-white rounded text-xs font-bold hover:bg-slate-700"
                >
                    +
                </button>
            </div>
            {expected.length === 0 ? (
                <div className="text-[10px] text-slate-400 italic">Keine Parameter definiert.</div>
            ) : (
                <div className="flex flex-wrap gap-1 pt-1">
                    {expected.map(p => (
                        <span key={p} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-100">
                            {p}
                            <button type="button" onClick={() => handleRemove(p)} className="text-emerald-500 hover:text-emerald-800 font-bold focus:outline-none">×</button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
