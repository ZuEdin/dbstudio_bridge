import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { Project } from '../../../../types/index';

interface ManageMembersModalProps {
  project: Project;
  onClose: () => void;
  user: any;
  projectMembers: any[];
  adUsers: any[];
  memberSearchQuery: string;
  setMemberSearchQuery: (val: string) => void;
  addingMemberRole: string;
  setAddingMemberRole: (val: string) => void;
  filteredAdUsers: any[];
  onAddMember: (adUser: any) => void;
  onRemoveMember: (memberId: string) => void;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  project,
  onClose,
  user,
  projectMembers,
  memberSearchQuery,
  setMemberSearchQuery,
  addingMemberRole,
  setAddingMemberRole,
  filteredAdUsers,
  onAddMember,
  onRemoveMember
}) => {
  return (
    <div id="members-modal-backdrop" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-300 max-w-lg w-full mx-4 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              Mitglieder verwalten
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Projekt: <span className="font-semibold text-slate-700">{project.name}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
          >
            Schließen
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          
          {/* Section 1: Current Members */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktuelle Projekt-Mitglieder</h4>
            <div className="space-y-2">
              {projectMembers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Keine expliziten Mitglieder eingetragen. (Nur der Owner hat Zugriff)</p>
              ) : (
                projectMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-mono">
                        {m.name ? m.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200/70 text-slate-600 font-medium px-2 py-0.5 rounded-full capitalize">
                        {m.role}
                      </span>
                      {m.role !== 'Projekt-Owner' && m.role !== 'Owner' && (
                        <button 
                          onClick={() => onRemoveMember(m.id)}
                          className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Mitglied entfernen"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Add New Member */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Plus size={14} className="text-emerald-500" />
              Neues Mitglied hinzufügen (AD Suche)
            </h4>

            {/* Role Selection */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Rolle für neues Mitglied:</label>
              <select 
                value={addingMemberRole} 
                onChange={e => setAddingMemberRole(e.target.value)}
                className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="Entwickler">Entwickler</option>
                <option value="Architekt">Architekt</option>
                <option value="Manager">Manager</option>
                <option value="Gast">Gast</option>
              </select>
            </div>

            {/* Search AD User */}
            <div className="space-y-2">
              <input 
                type="text"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-400"
                placeholder="Nach Name, Username oder E-Mail suchen..."
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
              />

              {/* Search Results */}
              <div className="max-h-44 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/50 divide-y divide-slate-100">
                {filteredAdUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">Keine passenden AD-Benutzer gefunden.</p>
                ) : (
                  filteredAdUsers.map(userItem => {
                    const isAlreadyMember = projectMembers.some(m => m.email.toLowerCase() === userItem.email.toLowerCase());
                    return (
                      <div 
                        key={userItem.username} 
                        className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-100 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{userItem.displayName}</p>
                          <p className="text-[10px] text-slate-500">{userItem.username} ({userItem.email})</p>
                        </div>
                        <button 
                          disabled={isAlreadyMember}
                          onClick={() => onAddMember(userItem)}
                          className={`px-3 py-1 rounded font-bold text-[10px] transition-colors shadow-sm ${isAlreadyMember ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                        >
                          {isAlreadyMember ? 'Bereits Mitglied' : 'Hinzufügen'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
