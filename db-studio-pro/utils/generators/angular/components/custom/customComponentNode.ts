import { NodeGeneratorContext } from './types';
import { toCamelCase, toKebabCase, toPascalCase } from '../../../common';

export const generateCustomComponentNode = (node: any, context: NodeGeneratorContext): string => {
    const comp = (context.customComponents || []).find(c => c.id === node.props?.customComponentId);
    if (!comp) {
        return `<div class="p-3 bg-warning text-dark text-center border rounded">Custom Component nicht verknüpft oder nicht gefunden</div>`;
    }
    
    const conf = comp.configuration || {};
    const suffix = node.id.replace(/-/g, '_');
    const stateName = `compData_${suffix}`;
    const loadingState = `compLoading_${suffix}`;
    
    const dsType = conf.dataSourceType || (conf.tableId ? 'table' : '');
    const dsId = conf.dataSourceId || conf.tableId;
    const tbl = dsType === 'table' && dsId ? context.tables.find(t => t.id === dsId) : null;

    let fetchUrl = '';
    if (dsType === 'table' && dsId) {
        const tObj = context.tables.find(t => t.id === dsId);
        if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
    } else if (dsType === 'query' && dsId) {
        const qObj = context.queries.find(q => q.id === dsId);
        if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
    }
    
    if (fetchUrl) {
        context.states.push(`${stateName}: any[] = [];`);
        context.states.push(`${loadingState} = false;`);
        context.initCalls.push(`this.loadComp_${suffix}();`);
        
        
        let kanbanInitLogic = '';
        if (comp.type === 'calendar_view') {
            const titleField = conf.titleField || 'name';
            const startField = conf.startDateField || 'date';
            const endField = conf.endDateField || startField;
            const colorField = conf.colorField || '';
            const defaultView = conf.defaultView || 'month';
            let fcDefaultView = 'dayGridMonth';
            if (defaultView === 'week') fcDefaultView = 'timeGridWeek';
            if (defaultView === 'day') fcDefaultView = 'timeGridDay';

            context.states.push(`calendarOptions_${suffix}: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: '${fcDefaultView}',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: [],
    height: '600px',
    eventClick: this.handleEventClick_${suffix}.bind(this)
  };`);

            kanbanInitLogic = `
        const combineDateTime = (dateVal: any, timeVal: any) => {
            if (!dateVal) return undefined;
            if (!timeVal) return dateVal;
            let dateStr = '';
            if (typeof dateVal === 'string') {
                dateStr = dateVal.split('T')[0].split(' ')[0];
            } else if (dateVal instanceof Date) {
                dateStr = dateVal.toISOString().split('T')[0];
            } else {
                dateStr = String(dateVal).split(' ')[0];
            }
            let timeStr = String(timeVal);
            const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
            if (match) {
                const h = match[1].padStart(2, '0');
                const m = match[2].padStart(2, '0');
                const s = match[3] ? match[3].padStart(2, '0') : '00';
                return dateStr + 'T' + h + ':' + m + ':' + s;
            }
            return dateStr;
        };

        const events = this.${stateName}.map((row: any) => {
            const startVal = row['${startField}'];
            const startTimeVal = '${conf.startTimeField || ""}' ? row['${conf.startTimeField || ""}'] : undefined;
            const endVal = '${conf.endDateField || ""}' ? row['${conf.endDateField || ""}'] : startVal;
            const endTimeVal = '${conf.endTimeField || ""}' ? row['${conf.endTimeField || ""}'] : undefined;

            return {
                title: row['${titleField}'] || 'Termin',
                start: combineDateTime(startVal, startTimeVal),
                end: combineDateTime(endVal, endTimeVal),
                color: '${colorField}' ? row['${colorField}'] : undefined,
                extendedProps: { ...row }
            };
        });
        this.calendarOptions_${suffix} = { ...this.calendarOptions_${suffix}, events };
`;
            
            context.methods.push(`
  handleEventClick_${suffix}(arg: any) {
    console.log('Event clicked:', arg.event);
  }
`);
            
            context.methods.push(`
  loadComp_${suffix}() {
    this.${loadingState} = true;
    this.api.getAll('${fetchUrl}', 1, ${conf.pageSize || 10000}).subscribe({
      next: (res: any) => {
        this.${stateName} = res.data || res || [];
        this.${loadingState} = false;
        ${kanbanInitLogic}
      },
      error: (err) => {
        console.error(err);
        this.${loadingState} = false;
      }
    });
  }`);
            
            if (context.isBootstrap) {
                return `
                <div class="card mb-4">
                    <div class="card-header bg-white">
                        <h5 class="mb-0">${conf.title || 'Kalender'}</h5>
                    </div>
                    <div class="card-body p-0">
                        <full-calendar [options]="calendarOptions_${suffix}"></full-calendar>
                    </div>
                </div>`;
            } else {
                return `
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[650px] flex flex-col space-y-4 p-4">
                    <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2 shrink-0">
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">${conf.title || 'Kalender'}</h4>
                    </div>
                    <div class="flex-1 overflow-hidden" style="min-height: 0;">
                        <full-calendar [options]="calendarOptions_${suffix}"></full-calendar>
                    </div>
                </div>`;
            }
        }
        
        if (comp.type === 'kanban_board') {
            const groupBy = toCamelCase(conf.groupByField || 'status');
            const tblField = tbl ? tbl.fields.find((f: any) => toCamelCase(f.name) === groupBy || f.name.toLowerCase() === groupBy.toLowerCase()) : null;
            const isNumericGroup = tblField && ['INTEGER', 'DECIMAL', 'DOUBLE'].includes(tblField.type);
            const defaultCols = isNumericGroup ? '[]' : "['Offen', 'In Arbeit', 'Erledigt']";
            
            context.states.push(`kanbanTasks_${suffix}: any[] = [];`);
            context.states.push(`kanbanColumns_${suffix}: string[] = ${defaultCols};`);
            context.states.push(`kanbanStatusField_${suffix} = '${groupBy}';`);
            context.states.push(`kanbanIsNumericGroup_${suffix} = ${isNumericGroup ? 'true' : 'false'};`);
            context.states.push(`kanbanFallbackOld_${suffix} = ${isNumericGroup ? "'Unassigned'" : "'Offen'"};`);
            context.states.push(`kanbanNotification_${suffix} = '';`);
            context.states.push(`activeDragItem_${suffix}: any = null;`);
            context.states.push(`targetDragOverItem_${suffix}: any = null;`);
            context.states.push(`kanbanLookupData_${suffix}: any[] = [];`);
            
            let lookupLogic = '';
            if (conf.columnSourceTableId && conf.columnDisplayField) {
                const lookupTable = context.tables.find((t) => t.id === conf.columnSourceTableId);
                if (lookupTable) {
                    const lookupTableVar = toCamelCase(lookupTable.name);
                    lookupLogic = `
        this.api.getAll('${lookupTableVar}', 1, 1000).subscribe({
            next: (lres: any) => {
                this.kanbanLookupData_${suffix} = lres.data || lres || [];
                if (this.kanbanLookupData_${suffix}.length > 0) {
                    const uniqueVals = this.kanbanLookupData_${suffix}.map((r: any) => String(r.id || r.Id));
                    this.kanbanColumns_${suffix} = [...new Set([...this.kanbanColumns_${suffix}.map(String), ...uniqueVals])];
                }
            }
        });
                    `;
                }
            }

            kanbanInitLogic = `
        this.kanbanTasks_${suffix} = [...this.${stateName}];
        
        ${lookupLogic}
        
        const uniqueVals = [...new Set(this.${stateName}.map((d: any) => d[this.kanbanStatusField_${suffix}] || d[this.kanbanStatusField_${suffix}.toLowerCase()]))].filter(Boolean).map(String);
        
        const allCols = new Set([...this.kanbanColumns_${suffix}.map(String), ...uniqueVals]);
        if (allCols.size > 0) {
            this.kanbanColumns_${suffix} = Array.from(allCols);
        }
            `;
        }


        context.methods.push(`
  loadComp_${suffix}() {
    this.${loadingState} = true;
    this.api.getAll('${fetchUrl}', 1, ${conf.pageSize || 10000}).subscribe({
      next: (res: any) => {
        this.${stateName} = res.data || res || [];
        this.${loadingState} = false;
        ${kanbanInitLogic}
      },
      error: (err) => {
        console.error(err);
        this.${loadingState} = false;
      }
    });
  }`);
    }

    if (comp.type === 'kanban_board') {
        context.methods.push(`
  
  getKanbanColumnName_${suffix}(col: string): string {
    if (this.kanbanLookupData_${suffix} && this.kanbanLookupData_${suffix}.length > 0) {
        const match = this.kanbanLookupData_${suffix}.find((r: any) => String(r.id || r.Id) === String(col));
        if (match) {
            const disp = '${toCamelCase(conf.columnDisplayField || '')}';
            const dispLower = disp.toLowerCase();
            const dispCap = disp.charAt(0).toUpperCase() + disp.slice(1);
            const val = match[disp] !== undefined ? match[disp] : (match[dispLower] !== undefined ? match[dispLower] : match[dispCap]);
            if (val !== undefined && val !== null) {
                return String(val);
            }
        }
    }
    return col;
  }

  getTasksByStatus_${suffix}(column: string): any[] {

    const statusKey = this.kanbanStatusField_${suffix};
    const statusKeyLower = statusKey.toLowerCase();
    return this.kanbanTasks_${suffix}.filter(item => {
        const val = item[statusKey] !== undefined ? item[statusKey] : item[statusKeyLower];
        if (!val && column === 'Offen') return true;
        return String(val).toLowerCase() === String(column).toLowerCase();
    });
  }

  onDragStart_${suffix}(event: DragEvent, item: any) {
    this.activeDragItem_${suffix} = item;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id || item.Id || '');
    }
  }

  onDragEnterItem_${suffix}(event: DragEvent, item: any) {
    event.preventDefault();
    this.targetDragOverItem_${suffix} = item;
  }

  onDragOver_${suffix}(event: DragEvent) {
    event.preventDefault();
  }

  onDrop_${suffix}(event: DragEvent, targetColumn: string) {
    event.preventDefault();
    const item = this.activeDragItem_${suffix};
    if (!item) return;

    const statusKey = this.kanbanStatusField_${suffix};
    const statusKeyLower = statusKey.toLowerCase();
    const currentStatusKey = item[statusKey] !== undefined ? statusKey : (item[statusKeyLower] !== undefined ? statusKeyLower : statusKey);
    const oldColumn = item[currentStatusKey] || this.kanbanFallbackOld_${suffix};
    
    // Update local status
    item[currentStatusKey] = this.kanbanIsNumericGroup_${suffix} ? (isNaN(Number(targetColumn)) ? targetColumn : Number(targetColumn)) : targetColumn;

    // Handle array reordering
    const listWithoutItem = this.kanbanTasks_${suffix}.filter(t => (t.id || t.Id) !== (item.id || item.Id));
    let newIndex = listWithoutItem.length;
    
    if (this.targetDragOverItem_${suffix}) {
        const idx = listWithoutItem.findIndex(t => (t.id || t.Id) === (this.targetDragOverItem_${suffix}.id || this.targetDragOverItem_${suffix}.Id));
        if (idx !== -1) {
            newIndex = idx;
        }
    }
    
    listWithoutItem.splice(newIndex, 0, item);
    this.kanbanTasks_${suffix} = listWithoutItem;

    // Check if table schema contains any sort or position field
    ${tbl ? `
    // Look for a sort order or position field
    const positionField = ${JSON.stringify(tbl.fields)}.find((f: any) => 
        ['position', 'sort_order', 'sort', 'order', 'priority_order', 'sortorder'].includes(f.name.toLowerCase())
    );
    if (positionField) {
        // Re-calculate positions for all items in the target column
        let posCounter = 0;
        this.kanbanTasks_${suffix}.forEach((t: any) => {
            const tVal = t[currentStatusKey];
            if (String(tVal).toLowerCase() === String(targetColumn).toLowerCase()) {
                t[positionField.name] = posCounter++;
            }
        });
    }
    ` : ''}

    const itemTitle = item.name || item.title || 'ID: ' + (item.id || item.Id);
    let notificationMsg = '';
    if (oldColumn === targetColumn) {
        notificationMsg = "Reihenfolge geändert: '" + itemTitle + "' innerhalb von '" + targetColumn + "' auf Position " + (newIndex + 1) + " verschoben.";
    } else {
        notificationMsg = "Erfolgreich verschoben: '" + itemTitle + "' von '" + oldColumn + "' nach '" + targetColumn + "' auf Position " + (newIndex + 1) + ".";
    }

    ${tbl ? `
    this.api.update('${toPascalCase(tbl.name)}', item.id || item.Id, item).subscribe({
      next: () => {
        this.showKanbanNotification_${suffix}(notificationMsg);
      },
      error: (err) => {
        console.error(err);
        this.showKanbanNotification_${suffix}("Fehler beim Verschieben von '" + itemTitle + "'", true);
        // Rollback status
        item[currentStatusKey] = oldColumn;
        this.loadComp_${suffix}();
      }
    });
    ` : `
    this.showKanbanNotification_${suffix}(notificationMsg);
    `}

    this.activeDragItem_${suffix} = null;
    this.targetDragOverItem_${suffix} = null;
  }

  showKanbanNotification_${suffix}(msg: string, isError = false) {
    this.kanbanNotification_${suffix} = msg;
    setTimeout(() => {
        if (this.kanbanNotification_${suffix} === msg) {
            this.kanbanNotification_${suffix} = '';
        }
    }, 4000);
  }
        `);
    }
    
    if (comp.type === 'table_view') {
        const searchState = `search_${suffix}`;
        context.states.push(`${searchState} = '';`);
        
        const cols = conf.columns || [];
        let tableHeaderHtml = '';
        let tableBodyHtml = '';
        if (cols.length > 0) {
            tableHeaderHtml = cols.map((col: any) => `<th class="p-3">${col.title || col.field}</th>`).join('');
            tableBodyHtml = cols.map((col: any) => `<td class="p-3">{{row['${col.field}']}}</td>`).join('');
        } else {
            tableHeaderHtml = `<th class="p-3">Daten</th>`;
            tableBodyHtml = `<td class="p-3">{{row | json}}</td>`;
        }
        
        return `
        <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="h5 mb-0">${conf.title || comp.name}</h4>
                ${conf.enableSearch ? `
                <input type="text" class="form-control form-control-sm max-w-xs" style="max-width:200px;" placeholder="Suchen..." [(ngModel)]="${searchState}">` : ''}
            </div>
            <div *ngIf="${loadingState}" class="text-center py-4">Lade Daten...</div>
            <div *ngIf="!${loadingState} && ${stateName}.length === 0" class="text-muted text-center py-4">Keine Daten vorhanden.</div>
            <div *ngIf="!${loadingState} && ${stateName}.length > 0" class="table-responsive border rounded bg-white">
                <table class="table table-hover mb-0 align-middle">
                    <thead class="table-light">
                        <tr>
                            ${tableHeaderHtml}
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let row of ${stateName}">
                            ${tableBodyHtml}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>`;
    }
    
    if (comp.type === 'form_view') {
        const formObj = context.forms.find(f => f.id === conf.formId);
        const tbl = formObj ? context.tables.find(t => t.id === formObj.sourceId) : null;
        if (tbl) {
            const tblPascal = toPascalCase(tbl.name);
            const fieldsToRender = tbl.fields.filter(f => !f.isAutoIncrement);
            const formDataState = `formData_${suffix}`;
            context.states.push(`${formDataState}: Record<string, any> = {};`);
            
            context.methods.push(`
  submitForm_${suffix}() {
    this.api.create('${tblPascal}', this.${formDataState}).subscribe({
      next: () => {
        alert('Erfolgreich gespeichert!');
        this.${formDataState} = {};
      },
      error: (err) => {
        console.error(err);
        alert('Fehler beim Speichern.');
      }
    });
  }`);
            
            return `
            <div class="card p-4 mb-4 bg-white shadow-xs border">
                <h4 *ngIf="!${conf.hideHeader ? 'true' : 'false'}" class="h5 mb-3">${formObj?.name || comp.name}</h4>
                <form (ngSubmit)="submitForm_${suffix}()" class="row g-3">
                    ${fieldsToRender.map(f => {
                        const fCamel = toCamelCase(f.name);
                        return `
                        <div class="col-md-6 text-start">
                            <label class="form-label text-muted small uppercase fw-bold">${f.name}</label>
                            <input type="text" class="form-control" [(ngModel)]="${formDataState}['${fCamel}']" name="${fCamel}_${suffix}">
                        </div>`;
                    }).join('\n')}
                    <div *ngIf="!${conf.hideActions ? 'true' : 'false'}" class="col-12 d-flex justify-content-end mt-3">
                        <button type="submit" class="btn btn-primary">Speichern</button>
                    </div>
                </form>
            </div>`;
        } else {
            return `<div class="p-3 text-muted text-center border rounded">Formular-Datenquelle nicht gefunden</div>`;
        }
    }
    
    if (comp.type === 'text') {
        const escapedText = (conf.text || '').replace(/'/g, "\\'");
        return `<div class="w-full text-start p-2 text-dark">${escapedText}</div>`;
    }
    
    if (comp.type === 'button') {
        return `<button class="btn btn-primary m-2">${conf.label || 'Aktions-Button'}</button>`;
    }
    
    if (comp.type === 'dropdown') {
        const valF = toCamelCase(conf.valueField || 'id');
        const dspF = toCamelCase(conf.displayField || 'name');
        return `
        <div class="mb-3 text-start">
            <label *ngIf="'${conf.label || ''}'" class="form-label text-muted small uppercase fw-bold">${conf.label}</label>
            <select class="form-select max-w-xs" style="max-width: 250px;">
                <option value="">${conf.placeholder || '-- Bitte wählen --'}</option>
                <option *ngIf="${loadingState}" disabled>Lade Daten...</option>
                <ng-container *ngIf="!${loadingState}">
                    <option *ngFor="let row of ${stateName}" [value]="row['${valF}'] || row.id">{{row['${dspF}'] || row.name}}</option>
                </ng-container>
            </select>
        </div>`;
    }
    
    if (comp.type === 'metric_card') {
        return `
        <div class="card p-4 border text-start bg-light mb-4" style="max-width: 320px;">
            <div class="text-muted text-uppercase small fw-bold">${conf.title || 'Kennzahl'}</div>
            <div class="h2 mb-1 text-dark">${conf.prefix || ''}12.345${conf.suffix || ''}</div>
            <div class="text-muted small">${conf.subtext || 'Auswertung geladen'}</div>
        </div>`;
    }
    
    if (comp.type === 'kanban_board') {
        const titleField = toCamelCase(conf.titleField || 'name');
        const descField = toCamelCase(conf.descField || 'description');
        
        if (context.isBootstrap) {
            return `
            <div class="mb-5 text-start">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 class="h4 mb-1 text-dark">${conf.title || comp.name}</h3>
                        <p class="text-muted small mb-0">Ziehen Sie Elemente zwischen den Spalten per Drag & Drop, um deren Status zu ändern und zu speichern.</p>
                    </div>
                </div>
                
                <!-- Notification toast -->
                <div *ngIf="kanbanNotification_${suffix}" class="alert alert-info alert-dismissible fade show shadow-sm border-start border-4 border-info py-2 px-3 mb-3 animate-in fade-in" role="alert">
                    <div class="d-flex align-items-center">
                        <span class="spinner-grow spinner-grow-sm me-2 text-info" role="status" aria-hidden="true" style="width: 8px; height: 8px;"></span>
                        <span class="small fw-semibold">{{ kanbanNotification_${suffix} }}</span>
                    </div>
                </div>

                <div *ngIf="${loadingState}" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Lade Kanban-Board...</span>
                    </div>
                </div>

                <div *ngIf="!${loadingState}" class="row g-3">
                    <!-- Column loop -->
                    <div *ngFor="let col of kanbanColumns_${suffix}" class="col-md-4">
                        <div class="card bg-light border-0 h-100" style="min-height: 500px;" (dragover)="onDragOver_${suffix}($event)" (drop)="onDrop_${suffix}($event, col)">
                            <!-- Column Header -->
                            <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3 pb-2 px-3">
                                <span class="fw-bold text-dark text-uppercase tracking-wider small">{{ getKanbanColumnName_${suffix}(col) }}</span>
                                <span class="badge bg-secondary rounded-pill small">{{ getTasksByStatus_${suffix}(col).length }}</span>
                            </div>
                            <!-- Cards List -->
                            <div class="card-body p-2 d-flex flex-column gap-2" style="overflow-y: auto;">
                                <div *ngFor="let item of getTasksByStatus_${suffix}(col)" 
                                     class="card bg-white border shadow-xs p-3 rounded-lg select-none hover-shadow transition" 
                                     draggable="true" 
                                     (dragstart)="onDragStart_${suffix}($event, item)"
                                     (dragenter)="onDragEnterItem_${suffix}($event, item)"
                                     style="cursor: grab;">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h5 class="card-title h6 mb-0 text-dark fw-semibold">{{ item['${titleField}'] || item['name'] || item['title'] || 'Unbenannt' }}</h5>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="text-muted" viewBox="0 0 16 16">
                                            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM3 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM3 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                        </svg>
                                    </div>
                                    <p class="card-text text-muted small mb-2 text-truncate-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">{{ item['${descField}'] || item['description'] || item['info'] || 'Keine Beschreibung vorhanden' }}</p>
                                    <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                        <span class="text-muted small">#{{ item.id || item.Id || 'N/A' }}</span>
                                        <span *ngIf="item.priority" class="badge" [class.bg-danger]="item.priority === 'High'" [class.bg-warning]="item.priority === 'Medium'" [class.bg-info]="item.priority === 'Low'">{{item.priority}}</span>
                                    </div>
                                </div>
                                <!-- Empty column placeholder -->
                                <div *ngIf="getTasksByStatus_${suffix}(col).length === 0" class="text-center text-muted py-4 small border border-dashed rounded bg-white bg-opacity-50">
                                    Keine Elemente vorhanden. Hierher ziehen.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        } else {
            // Tailwind implementation
            return `
            <div class="mb-8 text-left">
                <div class="mb-6">
                    <h3 class="text-xl font-bold text-slate-800">${conf.title || comp.name}</h3>
                    <p class="text-slate-500 text-sm">Ziehen Sie Elemente per Drag-and-Drop, um Statusänderungen direkt zu speichern.</p>
                </div>

                <!-- Notification Toast -->
                <div *ngIf="kanbanNotification_${suffix}" class="mb-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-sm flex items-center gap-2 animate-pulse">
                    <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span class="text-sm font-semibold">{{ kanbanNotification_${suffix} }}</span>
                </div>

                <div *ngIf="${loadingState}" class="flex justify-center items-center py-12">
                    <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>

                <div *ngIf="!${loadingState}" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Columns -->
                    <div *ngFor="let col of kanbanColumns_${suffix}" class="bg-slate-100 rounded-lg p-4 flex flex-col min-h-[500px]" (dragover)="onDragOver_${suffix}($event)" (drop)="onDrop_${suffix}($event, col)">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">{{ getKanbanColumnName_${suffix}(col) }}</span>
                            <span class="bg-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">{{ getTasksByStatus_${suffix}(col).length }}</span>
                        </div>
                        
                        <div class="flex-1 flex flex-col gap-3">
                            <div *ngFor="let item of getTasksByStatus_${suffix}(col)" 
                                 class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing" 
                                 draggable="true" 
                                 (dragstart)="onDragStart_${suffix}($event, item)"
                                 (dragenter)="onDragEnterItem_${suffix}($event, item)">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="text-sm font-bold text-slate-800">{{ item['${titleField}'] || item['name'] || item['title'] || 'Unbenannt' }}</h4>
                                    <svg class="w-4 h-4 text-slate-400 cursor-move" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"></path></svg>
                                </div>
                                <p class="text-xs text-slate-500 mb-3 line-clamp-3">{{ item['${descField}'] || item['description'] || item['info'] || 'Keine Beschreibung' }}</p>
                                <div class="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                                    <span>#{{ item.id || item.Id || 'N/A' }}</span>
                                    <span *ngIf="item.priority" class="px-2 py-0.5 rounded font-semibold uppercase tracking-wider" [ngClass]="{'bg-red-50 text-red-700': item.priority === 'High', 'bg-yellow-50 text-yellow-700': item.priority === 'Medium', 'bg-blue-50 text-blue-700': item.priority === 'Low'}">{{ item.priority }}</span>
                                </div>
                            </div>
                            
                            <!-- Empty Column Indicator -->
                            <div *ngIf="getTasksByStatus_${suffix}(col).length === 0" class="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-xs text-slate-400 bg-white bg-opacity-40">
                                Keine Elemente. Hierher ziehen.
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
    
    return `<div class="p-3 bg-light border rounded text-secondary text-center small">[Custom Component \${comp.name} geladen]</div>`;
};
