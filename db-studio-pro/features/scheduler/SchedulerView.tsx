
import React, { useState } from 'react';
import { Workflow } from '../../types/index';
import { CalendarClock, Play, Edit, Clock, AlertCircle } from 'lucide-react';
import { CronBuilderModal } from './CronBuilderModal';

interface SchedulerViewProps {
  workflows: Workflow[];
  onUpdateWorkflow: (workflow: Workflow) => void;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({ workflows, onUpdateWorkflow }) => {
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);

  // Filter workflows that have at least one schedule trigger node, and deduplicate by ID to prevent duplicate keys
  const scheduledWorkflows = workflows.filter((w, index, self) => 
      w.nodes.some(n => n.type === 'triggerNode' && (n.data?.triggerConfig?.event === 'onSchedule' || (n.data?.triggerConfig?.event as string) === 'schedule')) &&
      self.findIndex(t => t.id === w.id) === index
  );

  const getCronExpression = (wf: Workflow) => {
      const node = wf.nodes.find(n => n.type === 'triggerNode' && (n.data?.triggerConfig?.event === 'onSchedule' || (n.data?.triggerConfig?.event as string) === 'schedule'));
      return node?.data?.triggerConfig?.cronExpression || '* * * * *';
  };

  const updateCron = (cron: string) => {
      if (!editingWorkflowId) return;
      const wf = workflows.find(w => w.id === editingWorkflowId);
      if (!wf) return;

      const newNodes = wf.nodes.map(n => {
          if (n.type === 'triggerNode' && (n.data?.triggerConfig?.event === 'onSchedule' || (n.data?.triggerConfig?.event as string) === 'schedule')) {
              return { ...n, data: { ...n.data, triggerConfig: { ...n.data.triggerConfig, cronExpression: cron } } };
          }
          return n;
      });
      
      onUpdateWorkflow({ ...wf, nodes: newNodes });
      setEditingWorkflowId(null);
  };

  // Helper to describe cron (naive implementation)
  const describeCron = (cron: string) => {
      if (!cron) return 'Nicht konfiguriert';
      if (cron === '* * * * *') return 'Jede Minute';
      if (cron.startsWith('0 0 * * *')) return 'Täglich um Mitternacht';
      if (cron.startsWith('0 12 * * *')) return 'Täglich um 12:00';
      if (cron.startsWith('0 0 * * 1')) return 'Jeden Montag';
      return cron; // Fallback
  };

  return (
    <div className="p-8 h-full bg-slate-100 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-teal-600 rounded-lg text-white shadow-lg">
                    <CalendarClock size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Zeitplaner (Job Scheduler)</h1>
                    <p className="text-slate-500">Verwalten Sie automatisierte Aufgaben und Cron-Jobs.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">Aktive Jobs ({scheduledWorkflows.length})</span>
                </div>
                
                {scheduledWorkflows.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Clock size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Keine zeitgesteuerten Workflows gefunden.</p>
                        <p className="text-sm mt-2">Erstellen Sie einen Workflow mit dem Auslöser "Zeitplan" (Schedule).</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="p-4">Job Name (Workflow)</th>
                                <th className="p-4">Zeitplan (Cron)</th>
                                <th className="p-4">Beschreibung</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Aktion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {scheduledWorkflows.map((wf, index) => {
                                const cron = getCronExpression(wf);
                                return (
                                    <tr key={`${wf.id}-${index}`} className="hover:bg-slate-50 group">
                                        <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                                            <Play size={16} className="text-blue-500"/> {wf.name}
                                        </td>
                                        <td className="p-4 font-mono text-xs bg-slate-50 text-slate-600 rounded w-40">
                                            {cron}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {describeCron(cron)}
                                        </td>
                                        <td className="p-4">
                                            {wf.active ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Aktiv
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Inaktiv
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => setEditingWorkflowId(wf.id)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 ml-auto"
                                            >
                                                <Edit size={16}/> Zeitplan ändern
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-yellow-800">
                    <strong>Hinweis zur Ausführung:</strong> Die hier definierten Zeitpläne werden erst aktiv, wenn Sie das Backend generieren und starten.
                    <ul>
                        <li><strong>Node.js:</strong> Nutzt <code>node-cron</code> im generierten Server.</li>
                        <li><strong>.NET:</strong> Nutzt <code>Quartz.NET</code> als Hosted Service.</li>
                    </ul>
                </div>
            </div>
        </div>

        {editingWorkflowId && (
            <CronBuilderModal 
                initialValue={getCronExpression(workflows.find(w => w.id === editingWorkflowId)!)}
                onSave={updateCron}
                onClose={() => setEditingWorkflowId(null)}
            />
        )}
    </div>
  );
};
