import React from 'react';
import { Layers, Settings, ShieldCheck, Box, PlusCircle, Route, Zap, Users, Database, Briefcase, Wand2 } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface PagesTabProps {
  onAction: (action: string) => void;
}

export const PagesTab: React.FC<PagesTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 h-full">
      <RibbonGroup label="App-Struktur & Seiten">
        <RibbonButton icon={<Layers className="text-indigo-600" />} label="Navigation & Seiten" onClick={() => onAction('navigation_designer')} size="large" />
      </RibbonGroup>

      <RibbonGroup label="Custom Components (SDUI)">
        <RibbonButton icon={<PlusCircle className="text-emerald-600" />} label="Komponente erstellen" onClick={() => onAction('create_custom_component')} size="large" />
        <RibbonButton icon={<Box className="text-blue-600" />} label="Meine Komponenten" onClick={() => onAction('manage_custom_components')} size="large" />
      </RibbonGroup>

      <RibbonGroup label="App Einstellungen">
        <RibbonButton icon={<Settings className="text-slate-600" />} label="Globale Logik" onClick={() => onAction('logic_designer')} />
        <RibbonButton icon={<ShieldCheck className="text-emerald-600" />} label="Sicherheit" onClick={() => onAction('security_manager')} />
      </RibbonGroup>

      <RibbonGroup label="Architektur (Engine)">
        <RibbonButton icon={<Route className="text-cyan-600" />} label="API Router" onClick={() => onAction('api_routing_designer')} />
        <RibbonButton icon={<Zap className="text-purple-600" />} label="Lifecycle (States)" onClick={() => onAction('lifecycle_designer')} />
        <RibbonButton icon={<Users className="text-amber-600" />} label="Multi-Tenant" onClick={() => onAction('multi_tenancy_wizard')} />
        <RibbonButton icon={<Database className="text-emerald-600" />} label="Daten-Seeder" onClick={() => onAction('data_seeder_view')} />
      </RibbonGroup>

      <RibbonGroup label="Personalisierung">
        <RibbonButton icon={<Briefcase className="text-pink-600" />} label="Branding & Theme" onClick={() => onAction('theme_designer')} />
      </RibbonGroup>

      <RibbonGroup label="Testdaten" isLast>
        <RibbonButton icon={<Wand2 className="text-purple-600" />} label="Testdaten Gen" onClick={() => onAction('generate_dummy')} />
      </RibbonGroup>
    </div>
  );
};
