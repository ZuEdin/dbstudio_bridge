import React from 'react';
import { X, Layout } from 'lucide-react';
import { Form, Table, Query } from '../../../../types/index';

interface SubformModalProps {
  isOpen: boolean;
  subformModal: {
    isOpen: boolean;
    formId: string;
    parentField: string;
    childField: string;
    linkValue: any;
    recordToEdit?: Record<string, any>;
  } | null;
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
  handleSubformSaveFromModal: (updatedTable: Table) => void;
  currentRecord: Record<string, any>;
  FormViewComponent: React.ComponentType<any>;
}

export const SubformModal: React.FC<SubformModalProps> = ({
  isOpen,
  subformModal,
  onClose,
  allTables,
  allForms,
  queries,
  executeQuery,
  showConfirmation,
  handleSubformSaveFromModal,
  currentRecord,
  FormViewComponent,
}) => {
  if (!isOpen || !subformModal) return null;
  const targetForm = allForms.find((f) => f.id === subformModal.formId);
  if (!targetForm) return null;
  const targetTable = allTables.find((t) => t.id === targetForm.sourceId);
  if (!targetTable) return null;

  const isEditing = !!subformModal.recordToEdit;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200" id="form-subform-modal">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-300">
        <div className="flex justify-between items-center bg-indigo-50 p-3 px-4 border-b border-indigo-100 shrink-0">
          <span className="text-sm font-bold text-indigo-800 flex items-center gap-2">
            <Layout size={14} /> {isEditing ? 'Eintrag bearbeiten' : 'Eintrag hinzufügen'}: {targetForm.name}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-indigo-100 rounded text-indigo-400">
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
            onTableChange={handleSubformSaveFromModal}
            showConfirmation={showConfirmation}
            isSubform={true}
            initialMode={isEditing ? 'edit' : 'create'}
            filteredData={isEditing ? [subformModal.recordToEdit] : undefined}
            parentRecord={currentRecord}
            linkConfig={{ masterFieldId: subformModal.parentField, childFieldId: subformModal.childField }}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
