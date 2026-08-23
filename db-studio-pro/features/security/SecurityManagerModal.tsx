
import React, { useState, useEffect } from 'react';
import { Table, Form, Report, BackendConfig, Field, Query } from '../../types/index';
import { X, Shield, Lock, Unlock, Eye, Edit2, Trash2, Check, AlertTriangle, ChevronRight, ChevronDown, Table as TableIcon, Hash, Type, Users, Key, Plus, UserCog, Wand2, RefreshCw, Database, Folder } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { RolesTab } from './components/RolesTab';
import { AuthTab } from './components/AuthTab';
import { ScriptGeneratorTab } from './components/ScriptGeneratorTab';

interface SecurityManagerModalProps {
  tables: Table[];
  queries: Query[];
  forms: Form[];
  reports: Report[];
  onUpdateTable: (table: Table) => void;
  onCreateTable: (table: Table) => void;
  onClose: () => void;
  backendConfig?: BackendConfig;
  onUpdateBackendConfig?: (config: BackendConfig) => void;
}

export const SecurityManagerModal: React.FC<SecurityManagerModalProps> = ({ tables, queries, forms, reports, onUpdateTable, onCreateTable, onClose, backendConfig, onUpdateBackendConfig }) => {
  // Find system tables
  const rolesTable = tables.find(t => t.name === 'sys_roles');
  const permTable = tables.find(t => t.name === 'sys_permissions');

  const [activeTab, setActiveTab] = useState<'matrix' | 'roles' | 'auth' | 'script_generator'>('matrix');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  // Local state for Auth settings
  const [authConfig, setAuthConfig] = useState(backendConfig?.authConfig || { 
      useWindowsAuth: false, 
      useAdGroups: false, 
      adGroups: '', 
      adMapping: [],
      useUserLogin: false, 
      isMobileReady: false, 
      devBypass: true 
  });

  const { layout, tableGroups } = useProjectStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const saveAuthChanges = () => {
      if (backendConfig && onUpdateBackendConfig) {
          onUpdateBackendConfig({ ...backendConfig, authConfig });
      }

      if (authConfig.useUserLogin) {
          const hasUserTable = tables.some(t => t.name.toLowerCase() === 'sys_users' || t.name.toLowerCase() === 'users');
          if (!hasUserTable) {
              const usersPk = crypto.randomUUID();
              const usersFields: Field[] = [
                  { id: usersPk, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                  { id: crypto.randomUUID(), name: 'Username', type: 'VARCHAR', length: 50, allowNull: false },
                  { id: crypto.randomUUID(), name: 'PasswordHash', type: 'VARCHAR', length: 255, allowNull: false },
                  { id: crypto.randomUUID(), name: 'Email', type: 'VARCHAR', length: 100, allowNull: true },
                  { id: crypto.randomUUID(), name: 'RoleId', type: 'INTEGER', allowNull: false, defaultValue: '4' },
                  { id: crypto.randomUUID(), name: 'IsActive', type: 'BOOLEAN', allowNull: false, defaultValue: 'true' }
              ];

              const usersData = [
                  { Id: 1, Username: 'admin', PasswordHash: 'admin123', Email: 'admin@demo.com', RoleId: 1, IsActive: true },
                  { Id: 2, Username: 'manager', PasswordHash: 'manager123', Email: 'manager@demo.com', RoleId: 2, IsActive: true },
                  { Id: 3, Username: 'editor', PasswordHash: 'editor123', Email: 'editor@demo.com', RoleId: 3, IsActive: true },
                  { Id: 4, Username: 'user', PasswordHash: 'user123', Email: 'user@demo.com', RoleId: 4, IsActive: true }
              ];

              onCreateTable({
                  id: 'sys_users',
                  name: 'sys_users',
                  fields: usersFields,
                  data: usersData,
                  description: 'System-Benutzertabelle für Logins und Authentifizierung'
              });
          }
      }
  };

  const handleInitialize = () => {
      // 1. Create sys_roles with Standard Roles
      const rolesPk = crypto.randomUUID();
      const rolesFields: Field[] = [
          { id: rolesPk, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
          { id: crypto.randomUUID(), name: 'Name', type: 'VARCHAR', length: 50 },
          { id: crypto.randomUUID(), name: 'Description', type: 'VARCHAR', length: 255 }
      ];
      
      const rolesData = [
          { Id: 1, Name: 'Administrator', Description: 'Vollzugriff auf alle Bereiche (System)' },
          { Id: 2, Name: 'Manager', Description: 'Darf Inhalte verwalten und bearbeiten' },
          { Id: 3, Name: 'Editor', Description: 'Darf Daten bearbeiten, aber nicht löschen' },
          { Id: 4, Name: 'User', Description: 'Nur Lesezugriff' },
          { Id: 5, Name: 'Guest', Description: 'Eingeschränkter Zugriff' }
      ];

      onCreateTable({
          id: 'sys_roles',
          name: 'sys_roles',
          fields: rolesFields,
          data: rolesData
      });

      // 2. Create sys_users with default users
      const usersPk = crypto.randomUUID();
      const usersFields: Field[] = [
          { id: usersPk, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
          { id: crypto.randomUUID(), name: 'Username', type: 'VARCHAR', length: 50, allowNull: false },
          { id: crypto.randomUUID(), name: 'PasswordHash', type: 'VARCHAR', length: 255, allowNull: false },
          { id: crypto.randomUUID(), name: 'Email', type: 'VARCHAR', length: 100, allowNull: true },
          { id: crypto.randomUUID(), name: 'RoleId', type: 'INTEGER', allowNull: false, defaultValue: '4' },
          { id: crypto.randomUUID(), name: 'IsActive', type: 'BOOLEAN', allowNull: false, defaultValue: 'true' }
      ];

      const usersData = [
          { Id: 1, Username: 'admin', PasswordHash: 'admin123', Email: 'admin@demo.com', RoleId: 1, IsActive: true },
          { Id: 2, Username: 'manager', PasswordHash: 'manager123', Email: 'manager@demo.com', RoleId: 2, IsActive: true },
          { Id: 3, Username: 'editor', PasswordHash: 'editor123', Email: 'editor@demo.com', RoleId: 3, IsActive: true },
          { Id: 4, Username: 'user', PasswordHash: 'user123', Email: 'user@demo.com', RoleId: 4, IsActive: true }
      ];

      onCreateTable({
          id: 'sys_users',
          name: 'sys_users',
          fields: usersFields,
          data: usersData,
          description: 'System-Benutzertabelle für Logins und Authentifizierung'
      });

      // 3. Create sys_permissions AND pre-fill for existing tables
      const permPk = crypto.randomUUID();
      const permFields: Field[] = [
          { id: permPk, name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
          { id: crypto.randomUUID(), name: 'RoleId', type: 'INTEGER' },
          { id: crypto.randomUUID(), name: 'ObjectType', type: 'VARCHAR', length: 50 }, // Table, Field
          { id: crypto.randomUUID(), name: 'ObjectId', type: 'VARCHAR', length: 50 },
          { id: crypto.randomUUID(), name: 'CanRead', type: 'BOOLEAN' },
          { id: crypto.randomUUID(), name: 'CanWrite', type: 'BOOLEAN' },
          { id: crypto.randomUUID(), name: 'CanDelete', type: 'BOOLEAN' }
      ];

      const initialPerms: any[] = [];
      let permCounter = 1;

      // Generate Defaults for ALL existing non-system tables
      const contentTables = tables.filter(t => !t.name?.startsWith('sys_'));
      
      contentTables.forEach(table => {
          // Admin (1): Full Access
          initialPerms.push({ Id: permCounter++, RoleId: 1, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: true });
          initialPerms.push({ Id: permCounter++, RoleId: 2, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: true });
          initialPerms.push({ Id: permCounter++, RoleId: 3, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 4, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: false, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 5, ObjectType: 'Table', ObjectId: table.id, CanRead: false, CanWrite: false, CanDelete: false });
      });

      // Add explicit default permissions for sys_users itself
      initialPerms.push({ Id: permCounter++, RoleId: 1, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: true, CanWrite: true, CanDelete: true });
      initialPerms.push({ Id: permCounter++, RoleId: 2, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: true, CanWrite: true, CanDelete: false });
      initialPerms.push({ Id: permCounter++, RoleId: 3, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: true, CanWrite: false, CanDelete: false });
      initialPerms.push({ Id: permCounter++, RoleId: 4, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: true, CanWrite: false, CanDelete: false });
      initialPerms.push({ Id: permCounter++, RoleId: 5, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: false, CanWrite: false, CanDelete: false });

      queries?.forEach(query => {
          initialPerms.push({ Id: permCounter++, RoleId: 1, ObjectType: 'Query', ObjectId: query.id, CanRead: true, CanWrite: false, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 2, ObjectType: 'Query', ObjectId: query.id, CanRead: true, CanWrite: false, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 3, ObjectType: 'Query', ObjectId: query.id, CanRead: true, CanWrite: false, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 4, ObjectType: 'Query', ObjectId: query.id, CanRead: true, CanWrite: false, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 5, ObjectType: 'Query', ObjectId: query.id, CanRead: false, CanWrite: false, CanDelete: false });
      });

      onCreateTable({
          id: 'sys_permissions',
          name: 'sys_permissions',
          fields: permFields,
          data: initialPerms
      });

      if(backendConfig) {
          setAuthConfig({...authConfig, useUserLogin: true});
      }
  };

  const handleResetDefaults = () => {
      if(!confirm("Möchten Sie wirklich alle Rollen und Rechte auf den Standard zurücksetzen? Ihre Anpassungen gehen verloren.")) return;
      
      // Delete existing system tables first (handled by create overwriting or we'd need delete logic)
      // Since onCreateTable usually appends or updates, for a full reset in this prototype context:
      // We will re-run the logic which will push new tables. 
      // Ideally we should clear data first.
      
      // Simplified: Just re-run logic, assumes onCreateTable handles ID collision or we manually update data.
      // Better: Manually update the data of existing sys tables.
      
      if (rolesTable && permTable) {
          // Reset Roles
           const rolesData = [
              { Id: 1, Name: 'Administrator', Description: 'Vollzugriff auf alle Bereiche (System)' },
              { Id: 2, Name: 'Manager', Description: 'Darf Inhalte verwalten und bearbeiten' },
              { Id: 3, Name: 'Editor', Description: 'Darf Daten bearbeiten, aber nicht löschen' },
              { Id: 4, Name: 'User', Description: 'Nur Lesezugriff' },
              { Id: 5, Name: 'Guest', Description: 'Eingeschränkter Zugriff' }
          ];
          onUpdateTable({ ...rolesTable, data: rolesData });

          // Reset Permissions
          const initialPerms: any[] = [];
          let permCounter = 1;
          const contentTables = tables.filter(t => !t.name?.startsWith('sys_'));
          
          contentTables.forEach(table => {
              initialPerms.push({ Id: permCounter++, RoleId: 1, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: true });
              initialPerms.push({ Id: permCounter++, RoleId: 2, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: true });
              initialPerms.push({ Id: permCounter++, RoleId: 3, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: true, CanDelete: false });
              initialPerms.push({ Id: permCounter++, RoleId: 4, ObjectType: 'Table', ObjectId: table.id, CanRead: true, CanWrite: false, CanDelete: false });
              initialPerms.push({ Id: permCounter++, RoleId: 5, ObjectType: 'Table', ObjectId: table.id, CanRead: false, CanWrite: false, CanDelete: false });
          });

          // Add explicit default permissions for sys_users itself
          initialPerms.push({ Id: permCounter++, RoleId: 1, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: true, CanWrite: true, CanDelete: true });
          initialPerms.push({ Id: permCounter++, RoleId: 2, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: true, CanWrite: true, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 3, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: true, CanWrite: false, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 4, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: true, CanWrite: false, CanDelete: false });
          initialPerms.push({ Id: permCounter++, RoleId: 5, ObjectType: 'Table', ObjectId: 'sys_users', CanRead: false, CanWrite: false, CanDelete: false });

          queries?.forEach(query => {
              initialPerms.push({ Id: permCounter++, RoleId: 1, ObjectType: 'Query', ObjectId: query.id, CanRead: true, CanWrite: false, CanDelete: false });
              initialPerms.push({ Id: permCounter++, RoleId: 2, ObjectType: 'Query', ObjectId: query.id, CanRead: true, CanWrite: false, CanDelete: false });
              initialPerms.push({ Id: permCounter++, RoleId: 3, ObjectType: 'Query', ObjectId: query.id, CanRead: true, CanWrite: false, CanDelete: false });
              initialPerms.push({ Id: permCounter++, RoleId: 4, ObjectType: 'Query', ObjectId: query.id, CanRead: true, CanWrite: false, CanDelete: false });
              initialPerms.push({ Id: permCounter++, RoleId: 5, ObjectType: 'Query', ObjectId: query.id, CanRead: false, CanWrite: false, CanDelete: false });
          });

          onUpdateTable({ ...permTable, data: initialPerms });
      } else {
          handleInitialize();
      }
  };

  // If system tables don't exist, show initialization screen
  if (!rolesTable || !permTable) {
      return (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25">
              <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-2xl border border-slate-200">
                  <div className="flex justify-center mb-6 text-blue-600">
                      <div className="bg-blue-100 p-4 rounded-full">
                        <Shield size={48}/>
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-slate-800">Sicherheits-System einrichten</h2>
                  <p className="text-slate-600 mb-6 text-sm">
                      Die notwendigen Systemtabellen für das Rollenmanagement (RBAC) fehlen noch. 
                      Das System wird diese erstellen und für Ihre <strong>{tables.length} existierenden Tabellen</strong> Standardrechte vergeben.
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 text-left text-xs text-slate-500 mb-6 space-y-2">
                      <p className="font-bold text-slate-700">Wird erstellt:</p>
                      <ul className="list-disc pl-4 space-y-1">
                          <li>Tabelle <code>sys_roles</code> (Admin, Manager, Editor, User, Guest)</li>
                          <li>Tabelle <code>sys_permissions</code> (Matrix)</li>
                          <li>Automatische <strong>Lese/Schreib-Regeln</strong> für alle aktuellen Tabellen.</li>
                      </ul>
                  </div>

                  <div className="flex gap-3 justify-center">
                      <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Abbrechen</button>
                      <button 
                        onClick={handleInitialize} 
                        className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30"
                      >
                          <Wand2 size={18}/> Initialisieren
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  const roles = rolesTable?.data || [];
  const permissions = permTable?.data || [];

  // --- Permission Logic ---
  const togglePermission = (roleId: any, objectType: string, objectId: string, permType: 'CanRead' | 'CanWrite' | 'CanDelete') => {
      if (!permTable) return;
      // Find existing permission row
      const existingIdx = permissions.findIndex(p => 
          String(p.RoleId) === String(roleId) && 
          p.ObjectType === objectType && 
          p.ObjectId === objectId
      );

      const newPermissions = [...permissions];

      if (existingIdx > -1) {
          // Update
          const row = { ...newPermissions[existingIdx] };
          row[permType] = !row[permType];
          
          // Auto-Enforce Logic: Write/Delete implies Read
          if ((permType === 'CanWrite' || permType === 'CanDelete') && row[permType]) {
              row.CanRead = true;
          }
          // Turning off Read implies turning off Write/Delete
          if (permType === 'CanRead' && !row.CanRead) {
              row.CanWrite = false;
              row.CanDelete = false;
          }

          newPermissions[existingIdx] = row;
      } else {
          // Insert new rule
          const newRow: any = {
              Id: (permissions.length > 0 ? Math.max(...permissions.map(p => Number(p.Id))) : 0) + 1,
              RoleId: roleId,
              ObjectType: objectType,
              ObjectId: objectId,
              CanRead: true, // Default read true if creating entry via toggle
              CanWrite: false,
              CanDelete: false
          };
          if (permType !== 'CanRead') newRow[permType] = true;
          else newRow.CanRead = true; 

          newPermissions.push(newRow);
      }

      onUpdateTable({ ...permTable, data: newPermissions });
  };

  const getPerm = (roleId: any, objectType: string, objectId: string) => {
      // DEFAULT LOGIC IF NO RECORD EXISTS:
      // Admin (1) -> Allow All
      // Others -> Deny All (Secure by default, unless initialized)
      const entry = permissions.find(p => String(p.RoleId) === String(roleId) && p.ObjectType === objectType && p.ObjectId === objectId);
      if (entry) return entry;

      if (String(roleId) === '1') return { CanRead: true, CanWrite: true, CanDelete: true };
      return { CanRead: false, CanWrite: false, CanDelete: false };
  };

  const toggleTableExpand = (tableId: string) => {
      setExpandedTables(prev => ({ ...prev, [tableId]: !prev[tableId] }));
  };

  // --- Role Management Handlers ---
  const handleAddRoleWithNameAndDesc = (name: string, desc: string) => {
      if (!rolesTable || !name) return;
      const currentRoles = rolesTable.data || [];
      const nextId = currentRoles.length > 0 ? Math.max(...currentRoles.map((r: any) => parseInt(r.Id || 0))) + 1 : 1;

      const newRole = {
          Id: nextId,
          Name: name,
          Description: desc
      };

      onUpdateTable({ ...rolesTable, data: [...currentRoles, newRole] });
  };

  const handleDeleteRole = (roleId: any) => {
      if (!rolesTable) return;
      if (String(roleId) === '1') {
          alert("Die Admin-Rolle (ID 1) kann nicht gelöscht werden.");
          return;
      }
      if (confirm("Rolle wirklich löschen? Dies entfernt auch alle zugehörigen Berechtigungen.")) {
          const newRoles = (rolesTable.data || []).filter((r: any) => String(r.Id) !== String(roleId));
          onUpdateTable({ ...rolesTable, data: newRoles });
          
          if (permTable) {
              const newPerms = (permTable.data || []).filter((p: any) => String(p.RoleId) !== String(roleId));
              onUpdateTable({ ...permTable, data: newPerms });
          }
      }
  };

  const businessTables = tables.filter(t => !t.name?.startsWith('sys_'));

  const toggleGroupExpand = (groupId: string) => {
      setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const groupedTablesMap = new Map<string | undefined, Table[]>();
  const tableToGroupMap = new Map<string, string>();

  layout.forEach(node => {
      if (node.groupId) {
          tableToGroupMap.set(node.tableId, node.groupId);
      }
  });

  businessTables.forEach(table => {
      const groupId = tableToGroupMap.get(table.id);
      if (!groupedTablesMap.has(groupId)) {
          groupedTablesMap.set(groupId, []);
      }
      groupedTablesMap.get(groupId)!.push(table);
  });

  groupedTablesMap.forEach(groupTables => {
      groupTables.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  });

  const groupsToRender = Array.from(groupedTablesMap.entries()).map(([groupId, groupTables]) => {
      const groupInfo = groupId ? tableGroups.find(g => g.id === groupId) : undefined;
      return {
          id: groupId || 'ungrouped',
          name: groupInfo?.name || 'Ohne Gruppe',
          tables: groupTables,
          isUngrouped: !groupId
      };
  });

  groupsToRender.sort((a, b) => {
      if (a.isUngrouped && !b.isUngrouped) return 1;
      if (!a.isUngrouped && b.isUngrouped) return -1;
      return (a.name || '').localeCompare(b.name || '');
  });

  const toggleGroupPermission = (roleId: any, groupId: string, groupTables: Table[], permType: 'CanRead' | 'CanWrite' | 'CanDelete') => {
      if (!permTable) return;
      
      const newPermissions = [...permissions];
      
      // Determine target state (if any table misses the perm, we set to true; else false)
      let allHavePerm = true;
      for (const t of groupTables) {
          const p = getPerm(roleId, 'Table', t.id);
          if (!p[permType]) {
              allHavePerm = false;
              break;
          }
      }
      const targetState = !allHavePerm;

      groupTables.forEach(t => {
          const existingIdx = newPermissions.findIndex(p => 
              String(p.RoleId) === String(roleId) && 
              p.ObjectType === 'Table' && 
              p.ObjectId === t.id
          );

          if (existingIdx > -1) {
              const row = { ...newPermissions[existingIdx] };
              row[permType] = targetState;
              
              if ((permType === 'CanWrite' || permType === 'CanDelete') && row[permType]) {
                  row.CanRead = true;
              }
              if (permType === 'CanRead' && !row.CanRead) {
                  row.CanWrite = false;
                  row.CanDelete = false;
              }
              newPermissions[existingIdx] = row;
          } else {
              const newRow: any = {
                  Id: (newPermissions.length > 0 ? Math.max(...newPermissions.map(p => Number(p.Id))) : 0) + 1,
                  RoleId: roleId,
                  ObjectType: 'Table',
                  ObjectId: t.id,
                  CanRead: true,
                  CanWrite: false,
                  CanDelete: false
              };
              if (permType !== 'CanRead') newRow[permType] = targetState;
              else newRow.CanRead = targetState;

              if ((permType === 'CanWrite' || permType === 'CanDelete') && newRow[permType]) {
                  newRow.CanRead = true;
              }

              newPermissions.push(newRow);
          }
      });

      onUpdateTable({ ...permTable, data: newPermissions });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[90vw] h-[90vh] flex flex-col border border-slate-300 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-slate-800 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Shield className="text-emerald-400"/> Sicherheits-Manager (RBAC)
            </h2>
            <p className="text-slate-300 text-sm mt-1">Granulare Rechteverwaltung für Tabellen und Felder.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 border-b border-slate-200 px-4 pt-4 gap-4 shrink-0">
            <button 
                onClick={() => setActiveTab('matrix')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'matrix' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Berechtigungs-Matrix
            </button>
            <button 
                onClick={() => setActiveTab('roles')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'roles' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Rollen definieren
            </button>
            <button 
                onClick={() => setActiveTab('auth')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'auth' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Authentifizierung (AD/Login)
            </button>
            <button 
                onClick={() => setActiveTab('script_generator')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'script_generator' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Skripte & RLS Policies
            </button>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-50 p-0">
            {activeTab === 'matrix' ? (
                <div className="bg-white h-full flex flex-col overflow-hidden">
                    {/* Matrix View */}
                    <div className="overflow-auto flex-1 pb-20">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="p-3 text-left font-bold text-slate-700 border-b w-80 bg-slate-100 z-30 sticky left-0 border-r">Objekt / Feld</th>
                                    {roles.map((role: any) => (
                                        <th key={role.Id} className="p-3 text-center border-b border-r border-slate-200 min-w-[140px]">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-slate-800">{role.Name}</span>
                                                <span className="text-[10px] text-slate-500 font-normal">{role.Description}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {groupsToRender.map(group => {
                                    const isGroupExpanded = expandedGroups[group.id];
                                    return (
                                        <React.Fragment key={group.id}>
                                            <tr className="hover:bg-slate-100 border-b border-slate-300 bg-slate-200/50">
                                                <td className="p-2 pl-3 border-r border-slate-300 bg-slate-100 sticky left-0 font-bold text-slate-800 flex items-center gap-2 z-10">
                                                    <button onClick={() => toggleGroupExpand(group.id)} className="text-slate-500 hover:text-slate-800">
                                                        {isGroupExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                                    </button>
                                                    <div className="flex items-center gap-2">
                                                        <Folder size={14} className="text-slate-600"/>
                                                        {group.name}
                                                    </div>
                                                </td>
                                                {roles.map((role: any) => {
                                                    let allRead = true, someRead = false;
                                                    let allWrite = true, someWrite = false;
                                                    let allDelete = true, someDelete = false;

                                                    if (group.tables.length === 0) {
                                                        allRead = false; allWrite = false; allDelete = false;
                                                    } else {
                                                        group.tables.forEach(t => {
                                                            const p = getPerm(role.Id, 'Table', t.id);
                                                            if (p.CanRead) someRead = true; else allRead = false;
                                                            if (p.CanWrite) someWrite = true; else allWrite = false;
                                                            if (p.CanDelete) someDelete = true; else allDelete = false;
                                                        });
                                                    }

                                                    return (
                                                        <td key={role.Id} className="p-2 border-r border-slate-300 text-center align-middle bg-slate-100/50">
                                                            <div className="flex justify-center items-center gap-2 h-full">
                                                                <button 
                                                                    onClick={() => toggleGroupPermission(role.Id, group.id, group.tables, 'CanRead')}
                                                                    className={`p-1.5 rounded-full transition-colors ${allRead ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : someRead ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                    title="Gruppen-Leserecht umschalten"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => toggleGroupPermission(role.Id, group.id, group.tables, 'CanWrite')}
                                                                    className={`p-1.5 rounded-full transition-colors ${allWrite ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' : someWrite ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                    title="Gruppen-Schreibrecht umschalten"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => toggleGroupPermission(role.Id, group.id, group.tables, 'CanDelete')}
                                                                    className={`p-1.5 rounded-full transition-colors ${allDelete ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : someDelete ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                    title="Gruppen-Löschrecht umschalten"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                            {isGroupExpanded && group.tables.map(table => {
                                                const isTableExpanded = expandedTables[table.id];
                                                return (
                                                    <React.Fragment key={table.id}>
                                                        <tr className="hover:bg-slate-50 border-b border-slate-200 bg-slate-50/30">
                                                            <td className="p-2 pl-8 border-r border-slate-200 bg-white sticky left-0 font-bold text-slate-800 flex items-center gap-2 z-10">
                                                                <button onClick={() => toggleTableExpand(table.id)} className="text-slate-400 hover:text-slate-700">
                                                                    {isTableExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                                                </button>
                                                                <div className="flex items-center gap-2">
                                                                    <TableIcon size={14} className="text-orange-600"/>
                                                                    {table.name}
                                                                </div>
                                                            </td>
                                                            {roles.map((role: any) => {
                                                                const p = getPerm(role.Id, 'Table', table.id);
                                                                return (
                                                                    <PermissionCell 
                                                                        key={role.Id} 
                                                                        roleId={role.Id} 
                                                                        objectType="Table" 
                                                                        objectId={table.id} 
                                                                        perm={p} 
                                                                        onToggle={togglePermission} 
                                                                    />
                                                                );
                                                            })}
                                                        </tr>
                                                        {isTableExpanded && table.fields.map(field => (
                                                            <tr key={field.id} className="hover:bg-slate-50 border-b border-slate-100">
                                                                <td className="p-2 pl-16 border-r border-slate-200 bg-slate-50/50 sticky left-0 text-slate-600 flex items-center gap-2 text-xs z-10">
                                                                    {field.type === 'INTEGER' ? <Hash size={12} className="text-slate-400"/> : <Type size={12} className="text-slate-400"/>}
                                                                    {field.name}
                                                                </td>
                                                                {roles.map((role: any) => {
                                                                    const p = getPerm(role.Id, 'Field', field.id);
                                                                    return (
                                                                        <PermissionCell 
                                                                            key={role.Id} 
                                                                            roleId={role.Id} 
                                                                            objectType="Field" 
                                                                            objectId={field.id} 
                                                                            perm={p} 
                                                                            onToggle={togglePermission}
                                                                            isField={true}
                                                                        />
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                                
                                {/* Queries Section */}
                                {queries?.length > 0 && (
                                    <tr className="bg-slate-200/50 border-b-2 border-slate-300">
                                        <td colSpan={roles.length + 1} className="p-3 pl-3 font-bold text-slate-700">
                                            Abfragen (Queries)
                                        </td>
                                    </tr>
                                )}
                                {queries?.map((query) => {
                                    return (
                                        <tr key={query.id} className="hover:bg-slate-50 border-b border-slate-200 bg-white">
                                            <td className="p-2 pl-6 border-r border-slate-200 bg-white sticky left-0 font-bold text-slate-800 flex items-center gap-2 z-10">
                                                <div className="flex items-center gap-2">
                                                    <Eye size={14} className="text-purple-600"/>
                                                    {query.name}
                                                </div>
                                            </td>
                                            {roles.map((role: any) => {
                                                const p = getPerm(role.Id, 'Query', query.id);
                                                return (
                                                    <td key={role.Id} className="p-2 border-r border-slate-200 text-center align-middle hover:bg-slate-50 transition-colors">
                                                        <div className="flex justify-center items-center gap-2 h-full">
                                                            <button 
                                                                onClick={() => togglePermission(role.Id, 'Query', query.id, 'CanRead')}
                                                                className={`p-1.5 rounded-full transition-colors ${!!p.CanRead ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                title="Lesen"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center shrink-0 h-12">
                        <span>Rechte werden in <code>sys_permissions</code> gespeichert.</span>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><Eye size={12}/> Lesen</span>
                            <span className="flex items-center gap-1"><Edit2 size={12}/> Schreiben</span>
                            <span className="flex items-center gap-1"><Trash2 size={12}/> Löschen</span>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'roles' ? (
                <RolesTab
                    roles={roles}
                    onResetDefaults={handleResetDefaults}
                    onDeleteRole={handleDeleteRole}
                    onAddRole={handleAddRoleWithNameAndDesc}
                />
            ) : activeTab === 'auth' ? (
                <AuthTab
                    authConfig={authConfig}
                    setAuthConfig={setAuthConfig}
                    roles={roles}
                />
            ) : (
                <ScriptGeneratorTab
                    businessTables={businessTables}
                    roles={roles}
                    getPerm={getPerm}
                />
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
            <button onClick={() => { saveAuthChanges(); onClose(); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded font-semibold shadow-sm flex items-center gap-2">
                <Check size={18}/> Fertig
            </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual permission cells
const PermissionCell: React.FC<{
    roleId: any, 
    objectType: string, 
    objectId: string, 
    perm: any, 
    onToggle: any,
    isField?: boolean
}> = ({ roleId, objectType, objectId, perm, onToggle, isField }) => {
    const isRead = !!perm.CanRead;
    const isWrite = !!perm.CanWrite;
    const isDelete = !!perm.CanDelete;

    return (
        <td className="p-2 border-r border-slate-200 text-center bg-white hover:bg-slate-50 transition-colors">
            <div className="flex justify-center gap-1.5">
                <button 
                    onClick={() => onToggle(roleId, objectType, objectId, 'CanRead')}
                    className={`p-1 rounded transition-all border ${isRead ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300 opacity-60'}`}
                    title="Lesen"
                >
                    <Eye size={14} />
                </button>
                <button 
                    onClick={() => onToggle(roleId, objectType, objectId, 'CanWrite')}
                    className={`p-1 rounded transition-all border ${isWrite ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300 opacity-60'}`}
                    title="Schreiben"
                >
                    <Edit2 size={14} />
                </button>
                {!isField && (
                    <button 
                        onClick={() => onToggle(roleId, objectType, objectId, 'CanDelete')}
                        className={`p-1 rounded transition-all border ${isDelete ? 'bg-red-100 border-red-300 text-red-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300 opacity-60'}`}
                        title="Löschen"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </td>
    );
};
