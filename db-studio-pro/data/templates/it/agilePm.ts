
import { ProjectTemplate, DbType } from '../../../types/index';

const dict: Record<string, any> = {
    de: { name: 'Agile Projektplaner', desc: 'Projektmanagement mit User-Login, Tasks und Sprints.', t_proj: 'Projekte', t_task: 'Aufgaben', f_title: 'Titel', f_desc: 'Beschreibung', f_status: 'Status', f_est: 'Schaetzung', f_task_form: 'Aufgabe bearbeiten', q_todo: 'Offene Aufgaben', f_proj_form: 'Projekt Details' },
    en: { name: 'Agile Project Tracker', desc: 'Project management with user login, tasks and sprints.', t_proj: 'Projects', t_task: 'Tasks', f_title: 'Title', f_desc: 'Description', f_status: 'Status', f_est: 'Estimation', f_task_form: 'Edit Task', q_todo: 'Open Tasks', f_proj_form: 'Project Details' },
    fr: { name: 'Gestion Agile', desc: 'Gestion de projet avec tâches et sprints.', t_proj: 'Projets', t_task: 'Tâches', f_title: 'Titre', f_desc: 'Description', f_status: 'Statut', f_est: 'Estimation', f_task_form: 'Éditer Tâche', q_todo: 'Tâches Ouvertes', f_proj_form: 'Détails Projet' },
    it: { name: 'Tracker Agile', desc: 'Gestione progetti con task e sprint.', t_proj: 'Progetti', t_task: 'Attività', f_title: 'Titolo', f_desc: 'Descrizione', f_status: 'Stato', f_est: 'Stima', f_task_form: 'Modifica Task', q_todo: 'Task Aperti', f_proj_form: 'Dettagli Progetto' },
    no: { name: 'Agil Prosjektstyring', desc: 'Prosjektstyring med oppgaver.', t_proj: 'Prosjekter', t_task: 'Oppgaver', f_title: 'Tittel', f_desc: 'Beskrivelse', f_status: 'Status', f_est: 'Estimat', f_task_form: 'Rediger Oppgave', q_todo: 'Åpne Oppgaver', f_proj_form: 'Prosjektdetaljer' },
    bs: { name: 'Agilno Upravljanje', desc: 'Upravljanje projektima sa zadacima.', t_proj: 'Projekti', t_task: 'Zadaci', f_title: 'Naslov', f_desc: 'Opis', f_status: 'Status', f_est: 'Procjena', f_task_form: 'Uredi Zadatak', q_todo: 'Otvoreni Zadaci', f_proj_form: 'Detalji Projekta' }
};

export const getAgilePm = (lang: string): ProjectTemplate => {
    const t = dict[lang] || dict['en'];
    return {
        id: 'agile_pm',
        name: t.name,
        description: t.desc,
        icon: 'Kanban',
        category: 'IT',
        data: {
          backendConfig: {
            language: 'dotnet',
            dbType: DbType.SQL,
            projectName: 'AgileTracker',
            port: 5001,
            dbConnection: 'Server=.;Database=AgileTracker;Trusted_Connection=True;',
            useSwagger: true,
            frontendFramework: 'react',
            authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: false }
          },
          tables: [
            {
              id: 'sys_users', name: 'Users',
              fields: [
                { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'u2', name: 'Username', type: 'VARCHAR', length: 50 },
                { id: 'u3', name: 'PasswordHash', type: 'VARCHAR', length: 255 },
                { id: 'u4', name: 'Role', type: 'VARCHAR', length: 20 }
              ],
              data: [{ Id: 1, Username: 'admin', PasswordHash: 'hash123', Role: 'Admin' }]
            },
            {
              id: 't_proj', name: t.t_proj,
              fields: [
                { id: 'pr1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'pr2', name: t.f_title, type: 'VARCHAR', length: 100 },
                { id: 'pr3', name: t.f_desc, type: 'TEXT' },
                { id: 'pr4', name: 'StartDate', type: 'DATE' }
              ],
              data: [{ Id: 1, [t.f_title]: 'Website Relaunch', [t.f_desc]: 'New Design 2024', StartDate: '2024-01-01' }]
            },
            {
              id: 't_task', name: t.t_task,
              fields: [
                { id: 'tk1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                { id: 'tk2', name: 'ProjectId', type: 'INTEGER' },
                { id: 'tk3', name: 'AssignedUserId', type: 'INTEGER', allowNull: true },
                { id: 'tk4', name: t.f_title, type: 'VARCHAR', length: 200 },
                { id: 'tk5', name: t.f_status, type: 'VARCHAR', length: 20, defaultValue: 'Todo' },
                { id: 'tk6', name: t.f_est, type: 'INTEGER' } // Hours
              ],
              data: [
                { Id: 1, ProjectId: 1, AssignedUserId: 1, [t.f_title]: 'Setup Repo', [t.f_status]: 'Done', [t.f_est]: 2 },
                { Id: 2, ProjectId: 1, AssignedUserId: null, [t.f_title]: 'Design Mockups', [t.f_status]: 'In Progress', [t.f_est]: 8 }
              ]
            }
          ],
          relationships: [
            { id: 'rel_proj_task', fromTableId: 't_proj', fromFieldId: 'pr1', toTableId: 't_task', toFieldId: 'tk2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
            { id: 'rel_user_task', fromTableId: 'sys_users', fromFieldId: 'u1', toTableId: 't_task', toFieldId: 'tk3', type: '1:n', referentialIntegrity: false, onDelete: 'SET NULL' }
          ],
          queries: [
              {
                  id: 'q_todo', type: 'SELECT', name: t.q_todo,
                  nodes: [{id: 'n1', tableId: 't_task', x: 50, y: 50}],
                  columns: [
                      { id: 'c1', tableId: 't_task', fieldId: 'tk4', tableName: t.t_task, fieldName: t.f_title, sort: '', show: true, criteria: [''] },
                      { id: 'c2', tableId: 't_task', fieldId: 'tk5', tableName: t.t_task, fieldName: t.f_status, sort: '', show: true, criteria: ['!= "Done"'] },
                      { id: 'c3', tableId: 't_task', fieldId: 'tk6', tableName: t.t_task, fieldName: t.f_est, sort: 'DESC', show: true, criteria: [''] }
                  ]
              }
          ],
          forms: [
              {
                  id: 'f_proj', name: t.f_proj_form, sourceType: 'table', sourceId: 't_proj',
                  fields: [],
                  layout: {
                      id: 'root', type: 'container', className: 'space-y-4',
                      children: [
                          { id: 'l1', type: 'label', label: t.t_proj, className: 'text-2xl font-bold' },
                          { id: 'f1', type: 'field', fieldId: 'pr2', label: t.f_title },
                          { id: 'f2', type: 'field', fieldId: 'pr3', label: t.f_desc, widgetType: 'textarea' },
                          { 
                              id: 'sub_tasks', type: 'subform', label: t.t_task, className: 'mt-4 border-t pt-4',
                              subform: { formId: 'f_task', masterLinkFieldId: 'pr1', childLinkFieldId: 'tk2', canAdd: true, canEdit: true, canDelete: true }
                          }
                      ]
                  }
              },
              {
                  id: 'f_task', name: t.f_task_form, sourceType: 'table', sourceId: 't_task',
                  fields: [],
                  layout: {
                      id: 'root', type: 'container', className: 'grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded',
                      children: [
                          { id: 'f1', type: 'field', fieldId: 'tk4', label: t.f_title, className: 'col-span-2' },
                          { id: 'f2', type: 'field', fieldId: 'tk5', label: t.f_status, widgetType: 'select', lookup: { tableId: 't_task', valueFieldId: 'tk5', labelFields: ['tk5'], displayFormat: [{fieldId:'tk5'}] } }, // Self lookup for status options mock
                          { id: 'f3', type: 'field', fieldId: 'tk6', label: t.f_est, widgetType: 'number' },
                          { id: 'f4', type: 'field', fieldId: 'tk3', label: 'User', widgetType: 'select', lookup: { tableId: 'sys_users', valueFieldId: 'u1', labelFields: ['u2'] } }
                      ]
                  }
              }
          ],
          reports: [],
          layout: [],
          tableGroups: []
        }
    };
};
