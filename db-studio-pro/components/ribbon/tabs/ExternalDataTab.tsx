import React from 'react';
import { FileSpreadsheet, Database, Globe, Share2, FileCode, RefreshCw, Download, Save, Upload } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface ExternalDataTabProps {
  onAction: (action: string) => void;
}

export const ExternalDataTab: React.FC<ExternalDataTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 h-full">
      <RibbonGroup label="Lokaler Import">
        <RibbonButton icon={<FileSpreadsheet className="text-green-600" />} label="Excel Import" onClick={() => onAction('import_excel')} />
        <RibbonButton icon={<Database className="text-red-700" />} label="XML Import" onClick={() => onAction('import_access')} />
        <RibbonButton icon={<FileCode className="text-purple-600" />} label="Schema/SQL/JSON" onClick={() => onAction('import_schema')} />
      </RibbonGroup>

      <RibbonGroup label="Lokaler Export">
        <RibbonButton icon={<FileSpreadsheet className="text-emerald-700" />} label="Excel Export" onClick={() => onAction('export_excel')} />
        <RibbonButton icon={<Database className="text-orange-700" />} label="XML Export" onClick={() => onAction('export_access')} />
        <RibbonButton icon={<FileCode className="text-indigo-600" />} label="SQL Dump / Schema" onClick={() => onAction('export_sql')} />
      </RibbonGroup>

      <RibbonGroup label="Cloud & APIs">
        <RibbonButton icon={<Globe className="text-blue-600" />} label="API Import" onClick={() => onAction('api_import')} />
        <RibbonButton icon={<Share2 className="text-teal-600" />} label="SharePoint" onClick={() => onAction('sharepoint_import')} />
        <RibbonButton icon={<RefreshCw className="text-cyan-600" />} label="Live DB Sync" onClick={() => onAction('live_sync')} />
      </RibbonGroup>

      <RibbonGroup label="Speichern & Sichern" isLast>
        <RibbonButton icon={<Save className="text-blue-700 font-bold" />} label="Daten speichern" onClick={() => onAction('save')} />
        <RibbonButton icon={<Download className="text-violet-600" />} label="Backup laden" onClick={() => onAction('load_backup')} />
      </RibbonGroup>
    </div>
  );
};
