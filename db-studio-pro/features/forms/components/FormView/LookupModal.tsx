import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Form, Table, Query } from '../../../../types/index';

interface LookupModalProps {
  isOpen: boolean;
  lookupModal: { targetTableId: string; sourceFieldName: string; formId?: string } | null;
  onClose: () => void;
  allTables: Table[];
  allForms: Form[];
  queries?: Query[];
  executeQuery?: (q: Query) => Record<string, any>[];
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    confirmClass?: string
  ) => void;
  handleQuickCreateSave: (updatedTable: Table) => void;
  FormViewComponent: React.ComponentType<any>;
}

export const LookupModal: React.FC<LookupModalProps> = ({
  isOpen,
  lookupModal,
  onClose,
  allTables,
  allForms,
  queries,
  executeQuery,
  showConfirmation,
  handleQuickCreateSave,
  FormViewComponent,
}) => {
  if (!isOpen || !lookupModal) return null;
  const targetTable = allTables.find((t) => t.id === lookupModal.targetTableId);
  if (!targetTable) return null;
  let targetForm = lookupModal.formId ? allForms.find((f) => f.id === lookupModal.formId) : undefined;

  if (!targetForm) {
    targetForm = {
      id: 'temp_qc_' + crypto.randomUUID(),
      name: `Neu: ${targetTable.name}`,
      sourceType: 'table',
      sourceId: targetTable.id,
      layout: {
        id: 'root',
        type: 'container',
        className: 'p-6 space-y-4',
        children: targetTable.fields
          .filter((f) => !f.isAutoIncrement)
          .map((f) => ({
            id: f.id,
            type: 'field',
            fieldId: f.id,
            label: f.name,
            className: 'mb-4',
          })),
      },
      fields: [],
    };
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200" id="form-lookup-modal">
      <div className="bg-white w-full max-w-3xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-300">
        <div className="flex justify-between items-center bg-slate-100 p-2 px-4 border-b border-slate-200 shrink-0">
          <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
            <ExternalLink size={14} /> Quick Create: {targetTable.name}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <FormViewComponent
            form={targetForm}
            allForms={allForms}
            allTables={allTables}
            queries={queries}
            executeQuery={executeQuery}
            onTableChange={handleQuickCreateSave}
            showConfirmation={showConfirmation}
            isSubform={false}
            onClose={onClose}
            linkConfig={undefined}
          />
        </div>
      </div>
    </div>
  );
};
