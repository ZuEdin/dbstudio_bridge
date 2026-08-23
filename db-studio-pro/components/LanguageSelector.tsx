
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'de', label: 'DE' },
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'it', label: 'IT' },
    { code: 'no', label: 'NO' },
    { code: 'bs', label: 'BS' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-700 rounded px-2 py-0.5 ml-2">
      <Globe size={12} className="text-slate-400" />
      <select 
        value={i18n.language} 
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer border-none"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code} className="text-slate-800">
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
