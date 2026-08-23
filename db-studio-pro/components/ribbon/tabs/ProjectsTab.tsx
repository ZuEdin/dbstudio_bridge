import React from 'react';
import { Briefcase, ClipboardList, Route, Zap, Database, Layers, LogIn, Cloud, User as UserIcon } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useUIStore } from '../../../stores/useUIStore';

interface ProjectsTabProps {
  onAction: (action: string) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ onAction }) => {
  const { user } = useAuthStore();
  const { setIsChatOpen } = useUIStore();

  return (
    <div className="flex gap-4 h-full">
      <RibbonGroup label="Projektsteuerung">
        <RibbonButton 
          icon={<Briefcase className="text-emerald-600" />} 
          label="Dashboard & Stages" 
          onClick={() => onAction('project_dashboard')} 
          size="large" 
        />
        <RibbonButton 
          icon={<ClipboardList className="text-indigo-600" />} 
          label="Lasten-/Pflichtenheft" 
          onClick={() => onAction('project_requirements')} 
          size="large" 
        />
        <RibbonButton 
          icon={<Route className="text-blue-600" />} 
          label="V-Modell Designer" 
          onClick={() => onAction('project_vmodel')} 
          size="large" 
        />
      </RibbonGroup>

      <RibbonGroup label="System-Architektur">
        <RibbonButton 
          icon={<Zap className="text-amber-600" />} 
          label=".NET 10 & SignalR" 
          onClick={() => onAction('project_dotnet')} 
          size="large" 
        />
        <RibbonButton 
          icon={<Database className="text-teal-600" />} 
          label="Projekt SQLite DBs" 
          onClick={() => onAction('project_sqlite')} 
          size="large" 
        />
      </RibbonGroup>

      <RibbonGroup label="Self-Hosting">
        <RibbonButton 
          icon={<Layers className="text-purple-600" />} 
          label="DB Studio nachbauen" 
          onClick={() => onAction('project_rebuild')} 
          size="large" 
        />
      </RibbonGroup>

      <RibbonGroup label="Cloud & Account" isLast>
        {user?.isAuthenticated ? (
          <RibbonButton 
            icon={<Cloud className="text-blue-500" />} 
            label={`Cloud: ${user.name}`} 
            onClick={() => setIsChatOpen(true)} 
            size="large" 
            sublabel={user.role === 'admin' ? 'Administrator' : 'Benutzer'}
          />
        ) : (
          <RibbonButton 
            icon={<LogIn className="text-blue-600" />} 
            label="Cloud Login" 
            onClick={() => setIsChatOpen(true)} 
            size="large" 
            sublabel="Team-Features"
          />
        )}
      </RibbonGroup>
    </div>
  );
};
