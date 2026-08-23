import { Table, Report, Query, VirtualFile, BackendConfig } from '../../../types/index';
import { toPascalCase, toKebabCase } from '../common';

export const generateAngularModernLayout = (
  config: BackendConfig,
  tables: Table[],
  reports: Report[],
  queries: Query[],
  appRoot: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  // 1. Standalone Dashboard / Home Component
  const dashboardComponentTs = `import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="p-6 space-y-6 max-w-7xl mx-auto">
      <!-- Welcome Hero -->
      <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="space-y-2">
          <span class="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-400/30">
            Angular Modern Edition (Signals & Standalone)
          </span>
          <h1 class="text-2xl md:text-3xl font-black tracking-tight">${config.projectName || 'Enterprise Portal'}</h1>
          <p class="text-xs text-slate-300 max-w-xl leading-relaxed">
            Willkommen in Ihrer modernen Datenbank- und Workflow-Oberfläche. Vollständig reaktiv mit Angular Signals, typsicheren REST-Services und nativer UI.
          </p>
        </div>

        <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-sm">
            ⚡
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-200">System-Status</div>
            <div class="text-xs font-black text-emerald-400">Online & Synchronisiert</div>
          </div>
        </div>
      </div>

      <!-- Quick Access Tables Grid -->
      <div class="space-y-3">
        <h2 class="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Verfügbare Tabellen & Datenquellen</h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          ${tables.map(t => `
          <a 
            routerLink="/${toKebabCase(t.name)}"
            class="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">${t.name}</span>
                <span class="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono font-bold">${t.fields.length} Spalten</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">CRUD-Verwaltung, Suche und Excel-Export.</p>
            </div>
            <div class="mt-4 text-[11px] font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Öffnen →
            </div>
          </a>`).join('')}
        </div>
      </div>
    </div>
  \`
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
}
`;
  files.push({
    name: 'dashboard.component.ts',
    path: `${appRoot}/pages/dashboard/dashboard.component.ts`,
    content: dashboardComponentTs,
    language: 'typescript'
  });

  // 2. Standalone Layout Component (Sidebar + Header + RouterOutlet)
  const layoutComponentTs = `import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <!-- Sidebar -->
      <aside 
        class="bg-slate-900 text-slate-300 w-64 flex flex-col border-r border-slate-800 transition-all duration-300 select-none z-30"
        [class.w-20]="isCollapsed()"
      >
        <!-- Logo / App Header -->
        <div class="p-5 flex items-center justify-between border-b border-slate-800">
          @if (!isCollapsed()) {
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-600/30">
                DB
              </div>
              <div class="truncate">
                <div class="font-black text-xs text-white truncate">${config.projectName || 'DB Studio'}</div>
                <div class="text-[9px] text-slate-400 font-mono">v19 Standalone</div>
              </div>
            </div>
          }
          <button 
            (click)="toggleSidebar()" 
            class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors text-xs"
          >
            {{ isCollapsed() ? '▶' : '◀' }}
          </button>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          <!-- Dashboard Link -->
          <a 
            routerLink="/" 
            routerLinkActive="bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-all"
          >
            <span>🏠</span>
            @if (!isCollapsed()) { <span>Dashboard</span> }
          </a>

          <!-- Section: Tables -->
          @if (!isCollapsed()) {
            <div class="pt-4 pb-1 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Tabellen
            </div>
          }
          ${tables.map(t => `
          <a 
            routerLink="/${toKebabCase(t.name)}" 
            routerLinkActive="bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-all truncate"
            title="${t.name}"
          >
            <span>📋</span>
            @if (!isCollapsed()) { <span class="truncate">${t.name}</span> }
          </a>`).join('')}

          ${reports.length > 0 ? `
          <!-- Section: Reports -->
          @if (!isCollapsed()) {
            <div class="pt-4 pb-1 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Berichte
            </div>
          }
          ${reports.map(r => `
          <a 
            routerLink="/reports/${toKebabCase(r.name)}" 
            routerLinkActive="bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-all truncate"
          >
            <span>📊</span>
            @if (!isCollapsed()) { <span class="truncate">${r.name}</span> }
          </a>`).join('')}
          ` : ''}
        </nav>

        <!-- User Profile Footer -->
        <div class="p-3 border-t border-slate-800">
          <div class="flex items-center justify-between p-2 rounded-xl bg-slate-800/60">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {{ authService.currentUser()?.name?.[0] || 'U' }}
              </div>
              @if (!isCollapsed()) {
                <div class="truncate">
                  <div class="text-[11px] font-bold text-white truncate">{{ authService.currentUser()?.name || 'Administrator' }}</div>
                  <div class="text-[9px] text-slate-400 truncate">{{ authService.currentUser()?.role || 'Admin' }}</div>
                </div>
              }
            </div>
            @if (!isCollapsed() && authService.isAuthenticated()) {
              <button 
                (click)="authService.logout()" 
                class="text-xs text-rose-400 hover:text-rose-300 p-1"
                title="Abmelden"
              >
                🚪
              </button>
            }
          </div>
        </div>
      </aside>

      <!-- Main Content Stage -->
      <main class="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <!-- Top App Header -->
        <header class="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div class="text-xs font-bold text-slate-600">
            Enterprise Portal
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-500">
            <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[10px] border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Angular 19 Signals
            </span>
          </div>
        </header>

        <!-- Dynamic Route Content -->
        <div class="flex-1 overflow-y-auto">
          <router-outlet />
        </div>
      </main>
    </div>
  \`
})
export class LayoutComponent {
  readonly authService = inject(AuthService);
  readonly isCollapsed = signal<boolean>(false);

  toggleSidebar() {
    this.isCollapsed.update(c => !c);
  }
}
`;
  files.push({
    name: 'layout.component.ts',
    path: `${appRoot}/components/layout/layout.component.ts`,
    content: layoutComponentTs,
    language: 'typescript'
  });

  // 3. Standalone Auth Pages (Login & Forbidden)
  const loginComponentTs = `import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div class="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full space-y-6">
        <div class="text-center space-y-1.5">
          <div class="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg mx-auto shadow-lg shadow-blue-600/30">
            DB
          </div>
          <h1 class="text-xl font-black text-slate-800">Anmeldung</h1>
          <p class="text-xs text-slate-500">Geben Sie Ihre Zugangsdaten ein, um fortzufahren</p>
        </div>

        <form (ngSubmit)="handleLogin()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">E-Mail</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email"
              required
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Passwort</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              required
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            [disabled]="loading()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {{ loading() ? 'Wird angemeldet...' : 'Anmelden' }}
          </button>
        </form>
      </div>
    </div>
  \`
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  email = 'admin@example.com';
  password = 'password';
  readonly loading = signal<boolean>(false);

  handleLogin() {
    this.loading.set(true);
    // Dev session fallback or API authentication
    setTimeout(() => {
      this.auth.setSession('mock_jwt_token', {
        id: '1',
        name: 'Administrator',
        email: this.email,
        role: 'Admin'
      });
      this.toast.success('Willkommen zurück!', 'Erfolgreich angemeldet.');
      this.router.navigate(['/']);
      this.loading.set(false);
    }, 600);
  }
}
`;
  files.push({
    name: 'login.component.ts',
    path: `${appRoot}/pages/auth/login.component.ts`,
    content: loginComponentTs,
    language: 'typescript'
  });

  const forbiddenComponentTs = `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div class="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full space-y-4">
        <div class="text-4xl">🚫</div>
        <h1 class="text-xl font-black text-slate-800">Keine Zugriffsberechtigung</h1>
        <p class="text-xs text-slate-500">Ihre aktuelle Rolle erlaubt keinen Zugriff auf diese Seite.</p>
        <a routerLink="/" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-all">
          Zurück zum Dashboard
        </a>
      </div>
    </div>
  \`
})
export class ForbiddenComponent {}
`;
  files.push({
    name: 'forbidden.component.ts',
    path: `${appRoot}/pages/auth/forbidden.component.ts`,
    content: forbiddenComponentTs,
    language: 'typescript'
  });

  return files;
};
