const fs = require('fs');
const path = './utils/generators/angular/components/custom/customComponentNode.ts';
let content = fs.readFileSync(path, 'utf8');

const oldStrStart = "if (comp.type === 'calendar_view') {";
const oldStrEnd = "if (comp.type === 'kanban_board') {";

const startIndex = content.indexOf(oldStrStart);
const endIndex = content.indexOf(oldStrEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const oldBlock = content.substring(startIndex, endIndex);
    
    const newBlock = `if (comp.type === 'calendar_view') {
            const titleField = conf.titleField || 'name';
            const startField = conf.startDateField || 'date';
            const endField = conf.endDateField || startField;
            const colorField = conf.colorField || '';
            const defaultView = conf.defaultView || 'month';
            let fcDefaultView = 'dayGridMonth';
            if (defaultView === 'week') fcDefaultView = 'timeGridWeek';
            if (defaultView === 'day') fcDefaultView = 'timeGridDay';

            context.states.push(\`calendarOptions_\${suffix}: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: '\${fcDefaultView}',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: [],
    height: '600px',
    eventClick: this.handleEventClick_\${suffix}.bind(this)
  };\`);

            kanbanInitLogic = \`
        const events = this.\${stateName}.map((row: any) => ({
            title: row['\${titleField}'] || 'Termin',
            start: row['\${startField}'],
            end: row['\${endField}'],
            color: '\${colorField}' ? row['\${colorField}'] : undefined,
            extendedProps: { ...row }
        }));
        this.calendarOptions_\${suffix} = { ...this.calendarOptions_\${suffix}, events };
\`;
            
            context.methods.push(\`
  handleEventClick_\${suffix}(arg: any) {
    console.log('Event clicked:', arg.event);
  }
\`);
            
            context.methods.push(\`
  loadComp_\${suffix}() {
    this.\${loadingState} = true;
    this.api.getAll('\${fetchUrl}', 1, \${conf.pageSize || 10000}).subscribe({
      next: (res: any) => {
        this.\${stateName} = res.data || res || [];
        this.\${loadingState} = false;
        \${kanbanInitLogic}
      },
      error: (err) => {
        console.error(err);
        this.\${loadingState} = false;
      }
    });
  }\`);
            
            if (context.isBootstrap) {
                return \`
                <div class="card mb-4">
                    <div class="card-header bg-white">
                        <h5 class="mb-0">\${conf.title || 'Kalender'}</h5>
                    </div>
                    <div class="card-body p-0">
                        <full-calendar [options]="calendarOptions_\${suffix}"></full-calendar>
                    </div>
                </div>\`;
            } else {
                return \`
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[650px] flex flex-col space-y-4 p-4">
                    <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2 shrink-0">
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">\${conf.title || 'Kalender'}</h4>
                    </div>
                    <div class="flex-1 overflow-hidden" style="min-height: 0;">
                        <full-calendar [options]="calendarOptions_\${suffix}"></full-calendar>
                    </div>
                </div>\`;
            }
        }
        
        `;
    
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(path, content);
    console.log('Replaced calendar logic');
}
