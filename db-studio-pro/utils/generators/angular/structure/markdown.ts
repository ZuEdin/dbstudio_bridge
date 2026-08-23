import { VirtualFile, BackendConfig } from '../../../../types/index';

export const generateMarkdownComponents = (
    config: BackendConfig,
    appRoot: string
): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                        (config as any).frontendStyling?.toLowerCase() === 'bootstrap' || 
                        (config as any).styling?.toLowerCase() === 'bootstrap';

    // 1. Markdown Editor Component (Standalone Angular Component)
    const editorHtml = isBootstrap ? `
<div class="markdown-editor card border">
  <div class="card-header bg-light d-flex flex-wrap align-items-center justify-content-between py-1 px-2 gap-1">
    <div class="btn-group btn-group-sm" role="group">
      <button type="button" class="btn btn-outline-secondary" (click)="insertFormat('**', '**', 'Fetter Text')" title="Fett"><i class="fas fa-bold"></i></button>
      <button type="button" class="btn btn-outline-secondary" (click)="insertFormat('*', '*', 'Kursiver Text')" title="Kursiv"><i class="fas fa-italic"></i></button>
      <button type="button" class="btn btn-outline-secondary" (click)="insertFormat('### ', '', 'Überschrift')" title="Überschrift"><i class="fas fa-heading"></i></button>
      <button type="button" class="btn btn-outline-secondary" (click)="insertFormat('- ', '', 'Listenpunkt')" title="Aufzählung"><i class="fas fa-list-ul"></i></button>
      <button type="button" class="btn btn-outline-secondary" (click)="insertFormat('1. ', '', 'Nummerierter Punkt')" title="Nummerierung"><i class="fas fa-list-ol"></i></button>
      <button type="button" class="btn btn-outline-secondary" (click)="insertFormat('> ', '', 'Zitat')" title="Zitat"><i class="fas fa-quote-right"></i></button>
      <button type="button" class="btn btn-outline-secondary" (click)="insertFormat('\\\`\\\`\\\`\\n', '\\n\\\`\\\`\\\`', 'code')" title="Code-Block"><i class="fas fa-code"></i></button>
      <button type="button" class="btn btn-outline-secondary" (click)="insertTable()" title="Tabelle"><i class="fas fa-table"></i></button>
      <button type="button" class="btn btn-outline-secondary" (click)="insertFormat('[', '](https://example.com)', 'Linktext')" title="Link"><i class="fas fa-link"></i></button>
    </div>
    <div class="btn-group btn-group-sm" role="group">
      <button type="button" class="btn" [class.btn-primary]="activeView === 'edit'" [class.btn-outline-secondary]="activeView !== 'edit'" (click)="activeView = 'edit'">Bearbeiten</button>
      <button type="button" class="btn" [class.btn-primary]="activeView === 'split'" [class.btn-outline-secondary]="activeView !== 'split'" (click)="activeView = 'split'">Geteilt</button>
      <button type="button" class="btn" [class.btn-primary]="activeView === 'preview'" [class.btn-outline-secondary]="activeView !== 'preview'" (click)="activeView = 'preview'">Vorschau</button>
    </div>
  </div>

  <div class="card-body p-0">
    <div class="row g-0" [style.minHeight.px]="minHeight">
      <div *ngIf="activeView === 'edit' || activeView === 'split'" [class]="activeView === 'split' ? 'col-6 border-end' : 'col-12'">
        <textarea
          #editorTextarea
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          class="form-control border-0 font-monospace"
          [style.minHeight.px]="minHeight"
          [placeholder]="placeholder || 'Markdown-Inhalt hier eingeben...'"
        ></textarea>
      </div>
      <div *ngIf="activeView === 'preview' || activeView === 'split'" [class]="activeView === 'split' ? 'col-6 bg-light p-3 overflow-auto' : 'col-12 bg-light p-3 overflow-auto'" [style.minHeight.px]="minHeight">
        <app-markdown-viewer [content]="value"></app-markdown-viewer>
      </div>
    </div>
  </div>
</div>
` : `
<div class="markdown-editor rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
  <div class="flex flex-wrap items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 gap-2">
    <div class="flex items-center flex-wrap gap-1">
      <button type="button" (click)="insertFormat('**', '**', 'Fetter Text')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold" title="Fett">
        <i class="fas fa-bold"></i>
      </button>
      <button type="button" (click)="insertFormat('*', '*', 'Kursiver Text')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs" title="Kursiv">
        <i class="fas fa-italic"></i>
      </button>
      <button type="button" (click)="insertFormat('### ', '', 'Überschrift')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs" title="Überschrift">
        <i class="fas fa-heading"></i>
      </button>
      <div class="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
      <button type="button" (click)="insertFormat('- ', '', 'Listenpunkt')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs" title="Aufzählung">
        <i class="fas fa-list-ul"></i>
      </button>
      <button type="button" (click)="insertFormat('1. ', '', 'Nummerierter Punkt')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs" title="Nummerierung">
        <i class="fas fa-list-ol"></i>
      </button>
      <button type="button" (click)="insertFormat('> ', '', 'Zitat')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs" title="Zitat">
        <i class="fas fa-quote-right"></i>
      </button>
      <button type="button" (click)="insertFormat('\\\`\\\`\\\`\\n', '\\n\\\`\\\`\\\`', 'code')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono" title="Code">
        <i class="fas fa-code"></i>
      </button>
      <button type="button" (click)="insertTable()" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs" title="Tabelle">
        <i class="fas fa-table"></i>
      </button>
      <button type="button" (click)="insertFormat('[', '](https://example.com)', 'Linktext')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs" title="Link">
        <i class="fas fa-link"></i>
      </button>
    </div>

    <div class="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs font-medium">
      <button type="button" (click)="activeView = 'edit'" [class.bg-white]="activeView === 'edit'" [class.dark:bg-slate-800]="activeView === 'edit'" [class.shadow-sm]="activeView === 'edit'" class="px-2.5 py-1 rounded text-slate-700 dark:text-slate-200">Editor</button>
      <button type="button" (click)="activeView = 'split'" [class.bg-white]="activeView === 'split'" [class.dark:bg-slate-800]="activeView === 'split'" [class.shadow-sm]="activeView === 'split'" class="px-2.5 py-1 rounded text-slate-700 dark:text-slate-200">Split</button>
      <button type="button" (click)="activeView = 'preview'" [class.bg-white]="activeView === 'preview'" [class.dark:bg-slate-800]="activeView === 'preview'" [class.shadow-sm]="activeView === 'preview'" class="px-2.5 py-1 rounded text-slate-700 dark:text-slate-200">Vorschau</button>
    </div>
  </div>

  <div class="grid" [class.grid-cols-2]="activeView === 'split'" [class.grid-cols-1]="activeView !== 'split'" [style.minHeight.px]="minHeight">
    <div *ngIf="activeView === 'edit' || activeView === 'split'" [class.border-r]="activeView === 'split'" class="border-slate-200 dark:border-slate-700">
      <textarea
        #editorTextarea
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        class="w-full h-full p-4 bg-transparent text-slate-800 dark:text-slate-100 font-mono text-sm resize-y outline-none focus:ring-0 border-0"
        [style.minHeight.px]="minHeight"
        [placeholder]="placeholder || 'Markdown-Inhalt hier eingeben...'"
      ></textarea>
    </div>
    <div *ngIf="activeView === 'preview' || activeView === 'split'" class="p-4 bg-slate-50/50 dark:bg-slate-900/50 overflow-auto" [style.minHeight.px]="minHeight">
      <app-markdown-viewer [content]="value"></app-markdown-viewer>
    </div>
  </div>
</div>
`;

    const editorComponentTs = `import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MarkdownViewerComponent } from './markdown-viewer.component';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownViewerComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarkdownEditorComponent),
      multi: true
    }
  ],
  template: \`${editorHtml.replace(/`/g, '\\`')}\`
})
export class MarkdownEditorComponent implements ControlValueAccessor {
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() minHeight: number = 220;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('editorTextarea') textareaRef?: ElementRef<HTMLTextAreaElement>;

  activeView: 'edit' | 'split' | 'preview' = 'edit';
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onValueChange(val: string): void {
    this.value = val;
    this.onChange(val);
    this.valueChange.emit(val);
  }

  insertFormat(prefix: string, suffix: string = '', defaultText: string = ''): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) {
      this.value = (this.value || '') + prefix + defaultText + suffix;
      this.onValueChange(this.value);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = this.value || '';
    const selected = current.substring(start, end) || defaultText;

    const replacement = prefix + selected + suffix;
    this.value = current.substring(0, start) + replacement + current.substring(end);
    this.onValueChange(this.value);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  }

  insertTable(): void {
    const tableTemplate = '\\n| Spalte 1 | Spalte 2 | Spalte 3 |\\n| :--- | :--- | :--- |\\n| Daten 1 | Daten 2 | Daten 3 |\\n';
    this.insertFormat(tableTemplate, '', '');
  }
}
`;

    files.push({
        name: 'markdown-editor.component.ts',
        path: `${appRoot}/components/common/markdown-editor.component.ts`,
        content: editorComponentTs,
        language: 'typescript'
    });

    // 2. Markdown Viewer Component (Pure Angular Parser + Renderer)
    const viewerComponentTs = `import { Component, Input, OnChanges, SimpleChanges, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-markdown-viewer',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div *ngIf="parsedHtml" class="markdown-body prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 text-sm leading-relaxed" [innerHTML]="parsedHtml"></div>
    <div *ngIf="!parsedHtml" class="text-slate-400 italic text-sm">(Kein Inhalt)</div>
  \`,
  styles: [\`
    :host ::ng-deep .markdown-body h1 { font-size: 1.5rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; }
    :host ::ng-deep .markdown-body h2 { font-size: 1.25rem; font-weight: 700; margin-top: 0.85rem; margin-bottom: 0.4rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.2rem; }
    :host ::ng-deep .markdown-body h3 { font-size: 1.1rem; font-weight: 600; margin-top: 0.75rem; margin-bottom: 0.35rem; }
    :host ::ng-deep .markdown-body p { margin-bottom: 0.65rem; }
    :host ::ng-deep .markdown-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.65rem; }
    :host ::ng-deep .markdown-body ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.65rem; }
    :host ::ng-deep .markdown-body blockquote { border-left: 4px solid #3b82f6; padding-left: 0.75rem; color: #64748b; margin: 0.75rem 0; font-style: italic; background: rgba(59, 130, 246, 0.05); padding-top: 0.25rem; padding-bottom: 0.25rem; }
    :host ::ng-deep .markdown-body pre { background-color: #1e293b; color: #f8fafc; padding: 0.75rem 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 0.75rem; font-family: monospace; font-size: 0.85rem; }
    :host ::ng-deep .markdown-body code:not(pre code) { background-color: rgba(148, 163, 184, 0.2); color: #dc2626; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; }
    :host ::ng-deep .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.875rem; }
    :host ::ng-deep .markdown-body th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 0.5rem; font-weight: 600; text-align: left; }
    :host ::ng-deep .markdown-body td { border: 1px solid #cbd5e1; padding: 0.5rem; }
    :host ::ng-deep .markdown-body a { color: #2563eb; text-decoration: underline; }
  \`]
})
export class MarkdownViewerComponent implements OnChanges {
  @Input() content: string = '';
  parsedHtml: SafeHtml | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content']) {
      this.render();
    }
  }

  private render(): void {
    if (!this.content) {
      this.parsedHtml = null;
      return;
    }
    const html = this.parseMarkdown(this.content);
    this.parsedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private parseMarkdown(md: string): string {
    let raw = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    raw = raw.replace(/\\\`\\\`\\\`([\\s\\S]*?)\\\`\\\`\\\`/g, '<pre><code>$1</code></pre>');
    // Inline code
    raw = raw.replace(/\\\`([^\\\`]+)\\\`/g, '<code>$1</code>');

    // Headers
    raw = raw.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    raw = raw.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    raw = raw.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    raw = raw.replace(/^\\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold and Italic
    raw = raw.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');
    raw = raw.replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>');

    // Links
    raw = raw.replace(/\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Unordered lists
    raw = raw.replace(/^\\s*[-*+] (.*)$/gim, '<ul><li>$1</li></ul>');
    raw = raw.replace(/<\\/ul>\\s*<ul>/g, '');

    // Ordered lists
    raw = raw.replace(/^\\s*\\d+\\. (.*)$/gim, '<ol><li>$1</li></ol>');
    raw = raw.replace(/<\\/ol>\\s*<ol>/g, '');

    // Tables
    const lines = raw.split('\\n');
    let inTable = false;
    let tableHtml = '';
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHtml = '<table><thead><tr>';
          const headerCells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          headerCells.forEach(cell => {
            tableHtml += \`<th>\${cell.trim()}</th>\`;
          });
          tableHtml += '</tr></thead><tbody>';
          // Skip delimiter row if next
          if (i + 1 < lines.length && lines[i + 1].includes('---')) {
            i++;
          }
        } else {
          tableHtml += '<tr>';
          const bodyCells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          bodyCells.forEach(cell => {
            tableHtml += \`<td>\${cell.trim()}</td>\`;
          });
          tableHtml += '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table>';
          processedLines.push(tableHtml);
          tableHtml = '';
        }
        processedLines.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table>';
      processedLines.push(tableHtml);
    }

    raw = processedLines.join('\\n');

    // Paragraphs
    raw = raw.replace(/\\n{2,}/g, '</p><p>');
    raw = '<p>' + raw.replace(/\\n/g, '<br/>') + '</p>';
    raw = raw.replace(/<p><\\/p>/g, '');

    return raw;
  }
}
`;

    files.push({
        name: 'markdown-viewer.component.ts',
        path: `${appRoot}/components/common/markdown-viewer.component.ts`,
        content: viewerComponentTs,
        language: 'typescript'
    });

    return files;
};
