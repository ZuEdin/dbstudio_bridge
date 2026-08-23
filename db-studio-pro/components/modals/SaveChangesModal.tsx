import React from 'react';

interface SaveChangesModalProps {
  objectType: string;
  objectName: string;
  onYes: () => void;
  onNo: () => void;
  onCancel: () => void;
}

export const SaveChangesModal: React.FC<SaveChangesModalProps> = ({ objectType, objectName, onYes, onNo, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Änderungen speichern?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Möchten Sie die Änderungen an {objectType} "{objectName}" speichern?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onYes} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold">Ja</button>
          <button onClick={onNo} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm">Nein</button>
          <button onClick={onCancel} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">Abbrechen</button>
        </div>
      </div>
    </div>
  );
};
