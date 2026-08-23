
import { useState, useEffect } from 'react';
import { DbType, Table, Query, Relationship, Report, Form, SelectQuery, Project, BackendConfig, FormElement, Workflow, TableNode } from '../types/index';
import { executeSelectQuery } from '../features/queries/utils/queryExecution';
import { saveProjectToStorage } from '../services/storageService';
import { sanitizeProjectName } from '../utils/nameUtils';

export const useDatabase = () => {
  // Project State
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const [isCloud, setIsCloud] = useState<boolean>(false);
  const [owner, setOwner] = useState<string | undefined>(undefined);

  const [dbType, setDbType] = useState<DbType | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]); // NEW
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [layout, setLayout] = useState<TableNode[]>([]); // NEW
  
  const [loadedBackendConfig, setLoadedBackendConfig] = useState<BackendConfig | null>(null);

  // Define Demo Data Structure (IT Notebook Lending)
  const getDemoData = () => {
      // 1. Tables
      const tables: Table[] = [
        { 
          id: 't_ma', 
          name: 'Mitarbeiter', 
          fields: [
            { id: 'f_ma_1', name: 'MitarbeiterID', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'f_ma_2', name: 'Vorname', type: 'VARCHAR', length: 50 },
            { id: 'f_ma_3', name: 'Nachname', type: 'VARCHAR', length: 50 },
            { id: 'f_ma_4', name: 'Abteilung', type: 'VARCHAR', length: 50 },
            { id: 'f_ma_5', name: 'Email', type: 'VARCHAR', length: 100 }
          ],
          data: [
            { MitarbeiterID: 1, Vorname: 'Max', Nachname: 'Mustermann', Abteilung: 'Vertrieb', Email: 'max.mustermann@firma.de' },
            { MitarbeiterID: 2, Vorname: 'Erika', Nachname: 'Gabler', Abteilung: 'Marketing', Email: 'erika.gabler@firma.de' },
            { MitarbeiterID: 3, Vorname: 'Klaus', Nachname: 'Kleber', Abteilung: 'IT-Support', Email: 'klaus.kleber@firma.de' },
            { MitarbeiterID: 4, Vorname: 'Julia', Nachname: 'Sommer', Abteilung: 'HR', Email: 'julia.sommer@firma.de' },
          ]
        },
        { 
          id: 't_nb', 
          name: 'Notebooks', 
          fields: [
            { id: 'f_nb_1', name: 'GeraeteID', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'f_nb_2', name: 'Modell', type: 'VARCHAR', length: 100 },
            { id: 'f_nb_3', name: 'Seriennummer', type: 'VARCHAR', length: 50 },
            { id: 'f_nb_4', name: 'Kaufdatum', type: 'DATE' },
            { id: 'f_nb_5', name: 'Status', type: 'VARCHAR', length: 20, defaultValue: 'Verfügbar' } 
          ],
           data: [
            { GeraeteID: 101, Modell: 'Dell XPS 13', Seriennummer: 'DX13-998877', Kaufdatum: '2023-01-15', Status: 'Verliehen' },
            { GeraeteID: 102, Modell: 'MacBook Pro 14', Seriennummer: 'MBP-2023-AA', Kaufdatum: '2023-03-10', Status: 'Verliehen' },
            { GeraeteID: 103, Modell: 'Lenovo ThinkPad X1', Seriennummer: 'TP-X1-5544', Kaufdatum: '2022-11-05', Status: 'Verfügbar' },
            { GeraeteID: 104, Modell: 'Dell Latitude 5520', Seriennummer: 'DL-5520-1122', Kaufdatum: '2022-06-20', Status: 'Reparatur' },
          ]
        },
        { 
          id: 't_vl', 
          name: 'Verleihliste', 
          fields: [
            { id: 'f_vl_1', name: 'VerleihID', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'f_vl_2', name: 'MitarbeiterID', type: 'INTEGER' }, // FK
            { id: 'f_vl_3', name: 'GeraeteID', type: 'INTEGER' }, // FK
            { id: 'f_vl_4', name: 'Ausgabedatum', type: 'DATE' },
            { id: 'f_vl_5', name: 'Rueckgabedatum', type: 'DATE', allowNull: true }
          ],
           data: [
            { VerleihID: 1, MitarbeiterID: 1, GeraeteID: 101, Ausgabedatum: '2023-10-01', Rueckgabedatum: '' },
            { VerleihID: 2, MitarbeiterID: 2, GeraeteID: 102, Ausgabedatum: '2023-10-15', Rueckgabedatum: '' },
            { VerleihID: 3, MitarbeiterID: 3, GeraeteID: 103, Ausgabedatum: '2023-09-01', Rueckgabedatum: '2023-09-15' }, 
          ]
        }
      ];
      
      // 2. Relationships
      const relationships: Relationship[] = [
        { id: 'r1', fromTableId: 't_ma', fromFieldId: 'f_ma_1', toTableId: 't_vl', toFieldId: 'f_vl_2', type: '1:n', referentialIntegrity: true },
        { id: 'r2', fromTableId: 't_nb', fromFieldId: 'f_nb_1', toTableId: 't_vl', toFieldId: 'f_vl_3', type: '1:n', referentialIntegrity: true }
      ];

      // 3. Queries
      const queries: Query[] = [
          {
              id: 'q_active',
              type: 'SELECT',
              name: 'Aktive Ausleihen',
              nodes: [
                  { id: 'n1', tableId: 't_vl', x: 250, y: 50 },
                  { id: 'n2', tableId: 't_ma', x: 50, y: 50 },
                  { id: 'n3', tableId: 't_nb', x: 450, y: 50 }
              ],
              columns: [
                  { id: 'qc1', tableId: 't_ma', fieldId: 'f_ma_2', tableName: 'Mitarbeiter', fieldName: 'Vorname', sort: '', show: true, criteria: [''] },
                  { id: 'qc2', tableId: 't_ma', fieldId: 'f_ma_3', tableName: 'Mitarbeiter', fieldName: 'Nachname', sort: 'ASC', show: true, criteria: [''] },
                  { id: 'qc3', tableId: 't_nb', fieldId: 'f_nb_2', tableName: 'Notebooks', fieldName: 'Modell', sort: '', show: true, criteria: [''] },
                  { id: 'qc4', tableId: 't_vl', fieldId: 'f_vl_4', tableName: 'Verleihliste', fieldName: 'Ausgabedatum', sort: '', show: true, criteria: [''] },
                  { id: 'qc5', tableId: 't_vl', fieldId: 'f_vl_5', tableName: 'Verleihliste', fieldName: 'Rueckgabedatum', sort: '', show: false, criteria: ['is null'] }
              ],
          }
      ];

      const reports: Report[] = [];
      const forms: Form[] = [];
      const workflows: Workflow[] = [];
      
      return { tables, relationships, queries, reports, forms, workflows };
  };

  const createNewDatabase = (type: DbType, name: string, config?: BackendConfig, options?: any) => {
      const newProjectId = crypto.randomUUID();
      setCurrentProjectId(newProjectId);
      setCurrentProjectName(name);
      setDbType(type);

      const isCloudVal = typeof options === 'object' ? Boolean(options?.isCloud) : false;
      const ownerVal = typeof options === 'object' ? options?.owner : undefined;
      const isDemo = typeof options === 'boolean' ? options : false;

      setIsCloud(isCloudVal);
      setOwner(ownerVal);

      let initialTables: Table[] = [];

      if (isDemo) {
          const demoData = getDemoData();
          initialTables = demoData.tables;
          setTables(demoData.tables);
          setRelationships(demoData.relationships);
          setQueries(demoData.queries);
          setForms(demoData.forms);
          setReports(demoData.reports);
          setWorkflows(demoData.workflows);
          setLayout([]);
      } else if (options && typeof options === 'object' && options.tables) {
          initialTables = options.tables || [];
          setTables(options.tables || []);
          setRelationships(options.relationships || []);
          setQueries(options.queries || []);
          setForms(options.forms || []);
          setReports(options.reports || []);
          setWorkflows(options.workflows || []);
          setLayout(options.layout || []);
      } else {
          // Initialize empty lists
          if (config?.authConfig?.useUserLogin) {
              initialTables.push({
                  id: 'sys_users',
                  name: 'Users',
                  fields: [
                      { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }, // Explicit AutoInc
                      { id: 'u2', name: 'Username', type: 'VARCHAR', length: 50, allowNull: false },
                      { id: 'u3', name: 'PasswordHash', type: 'VARCHAR', length: 255, allowNull: false },
                      { id: 'u4', name: 'Email', type: 'VARCHAR', length: 100, allowNull: true },
                      { id: 'u5', name: 'Role', type: 'VARCHAR', length: 20, defaultValue: 'User' }
                  ],
                  data: []
              });
          }

          setTables(initialTables);
          setRelationships([]);
          setQueries([]);
          setForms([]);
          setReports([]);
          setWorkflows([]);
          setLayout([]);
      }
      
      // Store the config passed from Selector
      setLoadedBackendConfig(config || null);

      // Save initial project metadata immediately
      const initialProject: Project = {
          id: newProjectId,
          name: name,
          lastModified: Date.now(),
          isCloud: isCloudVal,
          owner: ownerVal,
          data: {
              tables: initialTables,
              queries: [],
              reports: [],
              forms: [],
              workflows: [],
              relationships: [],
              layout: [],
              tableGroups: [],
              backendConfig: config || {
                  language: 'dotnet',
                  dbType: type,
                  projectName: sanitizeProjectName(name),
                  port: 5000,
                  dbConnection: '',
                  useSwagger: true,
                  frontendFramework: 'react'
              }
          }
      };
      saveProjectToStorage(initialProject);
  };
  
  const loadProject = (project: Project) => {
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setDbType(project.data.backendConfig.dbType);
      setIsCloud(Boolean(project.isCloud));
      setOwner(project.owner);
      setTables(project.data.tables || []);
      setQueries(project.data.queries || []);
      setRelationships(project.data.relationships || []);
      setForms(project.data.forms || []);
      setReports(project.data.reports || []);
      setWorkflows(project.data.workflows || []);
      setLayout(project.data.layout || []);
      setLoadedBackendConfig(project.data.backendConfig);
  };

  const persistProject = async (backendConfig: BackendConfig) => {
      if (!currentProjectId || !currentProjectName || !dbType) return;
      const project: Project = {
          id: currentProjectId,
          name: currentProjectName,
          lastModified: Date.now(),
          isCloud,
          owner,
          data: {
              tables,
              queries,
              reports,
              forms,
              workflows,
              relationships,
              layout,
              tableGroups: [],
              backendConfig
          }
      };
      await saveProjectToStorage(project);
  };
  
  const exportProject = async (backendConfig: BackendConfig) => {
    if (!currentProjectId) return;
    const project: Project = {
          id: currentProjectId,
          name: currentProjectName,
          lastModified: Date.now(),
          isCloud,
          owner,
          data: { tables, queries, reports, forms, workflows, relationships, layout, tableGroups: [], backendConfig }
      };
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${currentProjectName}.dbsp`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const resetDatabase = () => {
    setCurrentProjectId(null);
    setCurrentProjectName('');
    setDbType(null);
    setTables([]);
    setQueries([]);
    setRelationships([]);
    setForms([]);
    setReports([]);
    setWorkflows([]);
    setLayout([]);
  };

  // Table operations
  const saveTable = (table: Table, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setTables(prev => [...prev, table]);
    } else {
      setTables(prev => prev.map(t => t.id === table.id ? table : t));
    }
  };
  
  const renameTable = (id: string, newName: string) => {
      setTables(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };
  
  const deleteTable = (id: string) => {
      setTables(prev => prev.filter(t => t.id !== id));
      setRelationships(prev => prev.filter(r => r.fromTableId !== id && r.toTableId !== id));
  };

  // Query Operations
  const saveQuery = (query: Query) => {
      const exists = queries.some(q => q.id === query.id);
      if (exists) {
          setQueries(prev => prev.map(q => q.id === query.id ? query : q));
      } else {
          setQueries(prev => [...prev, query]);
      }
  };

  const renameQuery = (id: string, newName: string) => {
      setQueries(prev => prev.map(q => q.id === id ? { ...q, name: newName } : q));
  };

  const deleteQuery = (id: string) => {
      setQueries(prev => prev.filter(q => q.id !== id));
  };

  // Report Operations
  const saveReport = (report: Report) => {
      const exists = reports.some(r => r.id === report.id);
      if(exists) setReports(prev => prev.map(r => r.id === report.id ? report : r));
      else setReports(prev => [...prev, report]);
  };
  const renameReport = (id: string, newName: string) => setReports(prev => prev.map(r => r.id === id ? {...r, name: newName} : r));
  const deleteReport = (id: string) => setReports(prev => prev.filter(r => r.id !== id));

  // Form Operations
  const saveForm = (form: Form) => {
      const exists = forms.some(f => f.id === form.id);
      if(exists) setForms(prev => prev.map(f => f.id === form.id ? form : f));
      else setForms(prev => [...prev, form]);
  };
  const renameForm = (id: string, newName: string) => setForms(prev => prev.map(f => f.id === id ? {...f, name: newName} : f));
  const deleteForm = (id: string) => setForms(prev => prev.filter(f => f.id !== id));

  // Workflow Operations
  const saveWorkflow = (workflow: Workflow) => {
      const exists = workflows.some(w => w.id === workflow.id);
      if(exists) setWorkflows(prev => prev.map(w => w.id === workflow.id ? workflow : w));
      else setWorkflows(prev => [...prev, workflow]);
  }

  const executeQuery = (query: Query): Record<string, any>[] => {
      if (query.type === 'SELECT') {
          return executeSelectQuery(query as SelectQuery, tables, relationships);
      }
      return [];
  };

  // Relationship Operations
  const deleteRelationship = (id: string) => {
      setRelationships(prev => prev.filter(r => r.id !== id));
  };
  const updateRelationship = (rel: Relationship) => {
      setRelationships(prev => prev.map(r => r.id === rel.id ? rel : r));
  };
  
  return {
    currentProjectId,
    currentProjectName,
    loadedBackendConfig,
    dbType,
    tables,
    queries,
    reports,
    forms,
    workflows,
    relationships,
    layout,
    setRelationships,
    setLayout,
    saveTable,
    saveQuery,
    saveReport,
    saveForm,
    saveWorkflow,
    createNewDatabase,
    loadProject,
    persistProject,
    resetDatabase,
    deleteRelationship,
    updateRelationship,
    renameTable,
    renameQuery,
    renameReport,
    renameForm,
    deleteTable,
    deleteQuery,
    deleteReport,
    deleteForm,
    executeQuery,
    exportProject
  };
};
