import React from 'react';
import { Save, Plus, LayoutGrid, FileDown } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface ERDiagramTabProps {
  onAction: (action: string) => void;
}

export const ERDiagramTab: React.FC<ERDiagramTabProps> = ({ onAction }) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-1 h-full">
      <RibbonGroup label="Datenbank">
        <RibbonButton icon={<Save className="text-blue-600" />} label="Layout Speichern" onClick={() => onAction('save_relationships')} />
      </RibbonGroup>

      <RibbonGroup label="Aktionen">
        <RibbonButton icon={<Plus />} label="Neue Tabelle" onClick={() => onAction('create_table')} />
        <RibbonButton icon={<LayoutGrid />} label="Auto Layout" onClick={() => onAction('auto_layout')} />
      </RibbonGroup>

      <RibbonGroup label="Export" isLast>
        <RibbonButton icon={<FileDown />} label="Als Bild exportieren" onClick={() => onAction('export_er_image')} />
      </RibbonGroup>
    </div>
  );
};
