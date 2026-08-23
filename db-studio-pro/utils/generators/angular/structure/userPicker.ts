import { VirtualFile, BackendConfig } from '../../../../types/index';

export const generateUserPickerComponents = (
    config: BackendConfig,
    appRoot: string
): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                        (config as any).frontendStyling?.toLowerCase() === 'bootstrap' || 
                        (config as any).styling?.toLowerCase() === 'bootstrap';

    let userPickerHtml = '';
    if (isBootstrap) {
        userPickerHtml = `
<div *ngIf="isOpen" class="modal show d-block" style="background: rgba(0, 0, 0, 0.5); z-index: 1050;">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
        <div class="modal-content" style="height: 500px;">
            <!-- Header -->
            <div class="modal-header bg-dark text-white">
                <h5 class="modal-title">Benutzer auswählen</h5>
                <button type="button" class="btn-close btn-close-white" (click)="close()"></button>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs bg-light px-3 pt-2">
                <li class="nav-item">
                    <button (click)="activeTab='me'; loadMe()" [class.active]="activeTab==='me'" class="nav-link fw-bold">Aktueller User</button>
                </li>
                <li class="nav-item">
                    <button (click)="activeTab='search'" [class.active]="activeTab==='search'" class="nav-link fw-bold">Suchen</button>
                </li>
            </ul>

            <!-- Content -->
            <div class="modal-body bg-light overflow-auto position-relative p-4" style="height: calc(500px - 110px);">
                <div *ngIf="loading" class="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-center" style="z-index: 10;">Lade...</div>
                <div *ngIf="error" class="alert alert-warning mb-3 py-2 px-3 small">{{error}}</div>

                <div *ngIf="activeTab === 'me' && me" class="d-flex flex-column align-items-center justify-center h-100 text-center gap-3">
                    <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-center shadow-sm" style="width: 80px; height: 80px; font-size: 2rem; font-weight: bold;">
                        {{me.displayName?.substring(0,2).toUpperCase()}}
                    </div>
                    <div>
                        <h4 class="h5 mb-1 text-dark fw-bold">{{me.displayName}}</h4>
                        <p class="text-muted font-monospace small mb-0">{{me.username}}</p>
                    </div>
                    <button (click)="select(me.username, me.displayName)" class="btn btn-primary w-100 py-2 fw-bold mt-3">
                        Übernehmen
                    </button>
                </div>

                <div *ngIf="activeTab === 'search'" class="h-100 d-flex flex-column">
                    <div class="input-group mb-3">
                        <input type="text" [(ngModel)]="query" (keydown.enter)="search()" class="form-control" placeholder="Name..." autoFocus />
                        <button (click)="search()" class="btn btn-outline-secondary">Suchen</button>
                    </div>
                    
                    <div class="flex-grow-1 overflow-auto border rounded bg-white list-group">
                        <div *ngFor="let u of results" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center cursor-pointer" (click)="select(u.username, u.displayName)">
                            <div>
                                <div class="fw-bold text-dark small">{{u.displayName}}</div>
                                <div class="text-muted font-monospace small" style="font-size: 0.75rem;">{{u.username}}</div>
                            </div>
                            <button class="btn btn-sm btn-link text-primary text-decoration-none fw-bold">Wählen</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
        `;
    } else {
        userPickerHtml = `
<div *ngIf="isOpen" class="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 overflow-hidden flex flex-col h-[500px]">
        
        <!-- Header -->
        <div class="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
            <h3 class="font-bold flex items-center gap-2">Benutzer auswählen</h3>
            <button (click)="close()" class="text-slate-400 hover:text-white">X</button>
        </div>

        <!-- Tabs -->
        <div class="flex bg-slate-100 border-b border-slate-200">
            <button (click)="activeTab='me'; loadMe()" [class.bg-white]="activeTab==='me'" [class.text-blue-600]="activeTab==='me'" class="flex-1 py-3 text-sm font-bold border-t-2 border-transparent" [class.border-blue-600]="activeTab==='me'">Aktueller User</button>
            <button (click)="activeTab='search'" [class.bg-white]="activeTab==='search'" [class.text-blue-600]="activeTab==='search'" class="flex-1 py-3 text-sm font-bold border-t-2 border-transparent" [class.border-blue-600]="activeTab==='search'">Suchen</button>
        </div>

        <!-- Content -->
        <div class="flex-1 p-6 overflow-y-auto bg-slate-50 relative">
            <div *ngIf="loading" class="absolute inset-0 bg-white/50 flex items-center justify-center z-10">Lade...</div>
            <div *ngIf="error" class="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded text-xs">{{error}}</div>

            <div *ngIf="activeTab === 'me' && me" class="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div class="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
                    {{me.displayName?.substring(0,2).toUpperCase()}}
                </div>
                <div>
                    <h4 class="text-xl font-bold text-slate-800">{{me.displayName}}</h4>
                    <p class="text-slate-500 text-sm font-mono">{{me.username}}</p>
                </div>
                <button (click)="select(me.username, me.displayName)" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm mt-4">
                    Übernehmen
                </button>
            </div>

            <div *ngIf="activeTab === 'search'" class="h-full flex flex-col">
                <div class="flex gap-2 mb-4">
                    <input type="text" [(ngModel)]="query" (keydown.enter)="search()" class="flex-1 border border-slate-300 rounded p-2 text-sm" placeholder="Name..." autoFocus />
                    <button (click)="search()" class="bg-slate-700 text-white px-4 rounded hover:bg-slate-800">Suchen</button>
                </div>
                
                <div class="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded bg-white">
                    <div *ngFor="let u of results" class="p-3 hover:bg-blue-50 border-b border-slate-100 flex justify-between items-center cursor-pointer" (click)="select(u.username, u.displayName)">
                        <div>
                            <div class="font-bold text-slate-700 text-sm">{{u.displayName}}</div>
                            <div class="text-xs text-slate-500 font-mono">{{u.username}}</div>
                        </div>
                        <button class="text-blue-600 text-xs font-bold">Wählen</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
        `;
    }

    const userPickerTs = `
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-picker.component.html'
})
export class UserPickerComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() initialTab: 'me' | 'search' = 'me';
  @Output() userSelected = new EventEmitter<{username: string, displayName: string}>();
  @Output() closed = new EventEmitter<void>();

  activeTab = 'me';
  loading = false;
  error = '';
  me: any = null;
  query = '';
  results: any[] = [];

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges) {
      if (changes['isOpen']?.currentValue) {
          this.activeTab = this.initialTab;
          if (this.activeTab === 'me') this.loadMe();
      }
  }

  loadMe() {
      this.loading = true;
      this.error = '';
      this.api.get('ad/me').subscribe({
          next: (data) => { this.me = data; this.loading = false; },
          error: () => { this.error = 'Fehler beim Laden.'; this.loading = false; }
      });
  }

  search() {
      if (!this.query || this.query.length < 2) return;
      this.loading = true;
      this.error = '';
      this.api.get('ad/search', { q: this.query }).subscribe({
          next: (res: any) => { this.results = res; this.loading = false; },
          error: () => { this.error = 'Suche fehlgeschlagen.'; this.loading = false; }
      });
  }

  select(username: string, displayName: string) {
      this.userSelected.emit({ username, displayName });
      this.close();
  }

  close() {
      this.closed.emit();
  }
}
    `;

    files.push({ name: 'user-picker.component.html', path: `${appRoot}/components/user-picker/user-picker.component.html`, content: userPickerHtml, language: 'html' });
    files.push({ name: 'user-picker.component.ts', path: `${appRoot}/components/user-picker/user-picker.component.ts`, content: userPickerTs, language: 'typescript' });

    return files;
};
