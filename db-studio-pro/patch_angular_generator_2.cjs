const fs = require('fs');
const path = './utils/generators/angular/components/customComponentGenerator.ts';
let content = fs.readFileSync(path, 'utf8');

const oldTs = `      const customTs = \`
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-\${kebabName}-custom',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './\${kebabName}-custom.component.html'
})
export class \${pascalName}CustomComponent implements OnInit {
  \${states.join('\\n  ')}

  constructor(private api: ApiService) {}

  ngOnInit() {
    \${initCalls.join('\\n    ')}
  }

  \${methods.join('\\n\\n  ')}
}\`;`;

// Actually let's just do an index based replacement.
const startIdx = content.indexOf("const customTs = `");
if (startIdx !== -1) {
    const endIdx = content.indexOf("}`;", startIdx);
    if (endIdx !== -1) {
        let replacement = `
      const checkHasCalendar = (node: any): boolean => {
          if (!node) return false;
          if (node.type === 'calendar_view') return true;
          if (node.type === 'custom_component' && node.props?.customComponentId) {
              const comp = (customComponents || []).find(c => c.id === node.props.customComponentId);
              if (comp && comp.type === 'calendar_view') {
                  return true;
              }
          }
          if (node.children && Array.isArray(node.children)) {
              return node.children.some(checkHasCalendar);
          }
          return false;
      };
      const hasCalendar = checkHasCalendar(page.layout) || JSON.stringify(page.layout).includes('calendar_view');
      const calendarImports = hasCalendar ? 
        "import { FullCalendarModule } from '@fullcalendar/angular';\\n" +
        "import { CalendarOptions } from '@fullcalendar/core';\\n" +
        "import dayGridPlugin from '@fullcalendar/daygrid';\\n" +
        "import timeGridPlugin from '@fullcalendar/timegrid';\\n" +
        "import interactionPlugin from '@fullcalendar/interaction';\\n" +
        "import listPlugin from '@fullcalendar/list';" : '';
      const moduleImports = hasCalendar ? ', FullCalendarModule' : '';

      const customTs = \`
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
\${calendarImports}

@Component({
  selector: 'app-\${kebabName}-custom',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule\${moduleImports}],
  templateUrl: './\${kebabName}-custom.component.html'
})
export class \${pascalName}CustomComponent implements OnInit {
  \${states.join('\\n  ')}

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    \${initCalls.join('\\n    ')}
  }

  \${methods.join('\\n\\n  ')}
}\`;
`;
        content = content.substring(0, startIdx) + replacement + content.substring(endIdx + 3);
        fs.writeFileSync(path, content);
        console.log("Patched customComponentGenerator");
    }
}

