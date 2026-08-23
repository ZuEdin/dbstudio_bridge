import React from 'react';
import { 
  Play, 
  Save, 
  Settings, 
  Plus, 
  TerminalSquare, 
  Mail, 
  FileSpreadsheet, 
  Database, 
  HelpCircle, 
  RotateCcw, 
  Globe, 
  CheckCircle2, 
  Terminal,
  Zap
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface WorkflowDesignTabProps {
  onAction: (action: string) => void;
}

export const WorkflowDesignTab: React.FC<WorkflowDesignTabProps> = ({ onAction }) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-1 h-full" id="workflow-design-tab">
      <RibbonGroup label="Ausführung &amp; Speichern">
        <RibbonButton 
          icon={<Save className="text-emerald-600" />} 
          label="Workflow Speichern" 
          onClick={() => onAction('save_workflow')} 
        />
        <RibbonButton 
          icon={<Play className="text-green-600" />} 
          label="Testlauf Starten" 
          onClick={() => onAction('test_workflow')} 
        />
        <RibbonButton 
          icon={<Terminal className="text-slate-700" />} 
          label="Debug-Konsole" 
          onClick={() => onAction('toggle_workflow_console')} 
        />
      </RibbonGroup>

      <RibbonGroup label="Knoten Einfügen">
        <RibbonButton 
          icon={<Zap className="text-indigo-600" />} 
          label="Trigger (Event)" 
          onClick={() => onAction('add_trigger_node')} 
        />
        <RibbonButton 
          icon={<Database className="text-emerald-600" />} 
          label="Datenbank Aktion" 
          onClick={() => onAction('add_db_action_node')} 
        />
        <RibbonButton 
          icon={<Mail className="text-blue-600" />} 
          label="E-Mail Senden" 
          onClick={() => onAction('add_email_node')} 
        />
        <RibbonButton 
          icon={<FileSpreadsheet className="text-purple-600" />} 
          label="PDF / Excel Export" 
          onClick={() => onAction('add_export_node')} 
        />
      </RibbonGroup>

      <RibbonGroup label="Logik &amp; Steuerung">
        <RibbonButton 
          icon={<HelpCircle className="text-amber-600" />} 
          label="Bedingung (IF)" 
          onClick={() => onAction('add_condition_node')} 
        />
        <RibbonButton 
          icon={<RotateCcw className="text-orange-600" />} 
          label="Schleife (Loop)" 
          onClick={() => onAction('add_loop_node')} 
        />
        <RibbonButton 
          icon={<Globe className="text-sky-600" />} 
          label="REST API Aufruf" 
          onClick={() => onAction('add_api_node')} 
        />
      </RibbonGroup>

      <RibbonGroup label="Status" isLast>
        <RibbonButton 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          label="Aktivieren / Umschalten" 
          onClick={() => onAction('toggle_workflow_active')} 
        />
      </RibbonGroup>
    </div>
  );
};
