
import React from 'react';
import { Type, Box, Columns, Download, Zap, ChevronDown, Layout } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface FormDesignTabProps {
  onAction: (action: string) => void;
}

export const FormDesignTab: React.FC<FormDesignTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 h-full">
      {/* Controls Group */}
      <RibbonGroup label={t('ribbon.groups.controls')}>
        <RibbonButton icon={<Type />} label={t('ribbon.actions.label')} onClick={() => onAction('form_add_label')} />
        <RibbonButton icon={<Zap className="text-amber-500 fill-amber-400" />} label="Schaltfläche (Makro)" onClick={() => onAction('form_add_button')} />
        <RibbonButton icon={<div className="flex items-center gap-0.5"><Zap size={14} className="text-indigo-500 fill-indigo-400" /><ChevronDown size={12} className="text-indigo-600" /></div>} label="Dropdown-Schaltfläche" onClick={() => onAction('form_add_dropdown_button')} />
        <RibbonButton icon={<Box />} label={t('ribbon.actions.container')} onClick={() => onAction('form_add_container')} />
        <RibbonButton icon={<Columns />} label={t('ribbon.actions.columns_2')} onClick={() => onAction('form_add_2col')} />
        <RibbonButton icon={<Layout className="text-emerald-600" />} label="Registerkarten (Tabs)" onClick={() => onAction('form_add_tabs')} />
      </RibbonGroup>
      
      {/* Tools */}
      <RibbonGroup label={t('ribbon.groups.export')} isLast>
        <RibbonButton icon={<Download />} label={t('ribbon.actions.export')} onClick={() => onAction('export_form')} />
      </RibbonGroup>
    </div>
  );
};
