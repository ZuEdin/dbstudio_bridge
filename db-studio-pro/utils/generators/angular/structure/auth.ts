import { VirtualFile, BackendConfig } from '../../../../types/index';

export const generateAuthComponents = (
    config: BackendConfig,
    appRoot: string
): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                        (config as any).frontendStyling?.toLowerCase() === 'bootstrap' || 
                        (config as any).styling?.toLowerCase() === 'bootstrap';

    if (!config.authConfig?.useUserLogin) {
        return [];
    }

    // 1. Forbidden Component
    let forbiddenHtml = '';
    if (isBootstrap) {
        forbiddenHtml = `
<div class="min-vh-100 bg-light d-flex flex-column align-items-center justify-center p-4 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-danger mb-4 shadow-sm">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
    </svg>
    <h1 class="display-4 fw-black text-dark tracking-widest mb-2 text-uppercase">KEIN ZUGRIFF</h1>
    <p class="lead text-muted mb-4 max-w-sm" style="max-width: 400px;">Sie haben keine Berechtigung, auf diese Seite zuzugreifen. Bitte kontaktieren Sie einen Administrator.</p>
    <a routerLink="/" class="btn btn-danger btn-lg px-4 shadow">
        Zurück zur Startseite
    </a>
</div>
        `;
    } else {
        forbiddenHtml = `
<div class="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans text-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 mb-6 drop-shadow-md">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
    </svg>
    <h1 class="text-5xl font-black text-slate-800 tracking-widest mb-2 uppercase">NO ACCESS</h1>
    <p class="text-lg font-medium text-slate-500 mb-8 max-w-sm">Sie haben keine Berechtigung, auf diese Seite zuzugreifen. Bitte kontaktieren Sie einen Administrator.</p>
    <a routerLink="/" class="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg hover:shadow-red-600/30 transform hover:-translate-y-1 inline-block">
        Zurück zur Startseite
    </a>
</div>
        `;
    }

    const forbiddenTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: \`${forbiddenHtml}\`
})
export class ForbiddenComponent {}
    `;
    files.push({ name: 'forbidden.component.ts', path: `${appRoot}/pages/auth/forbidden.component.ts`, content: forbiddenTs, language: 'typescript' });

    // 2. Login Component
    let loginHtml = '';
    if (isBootstrap) {
        loginHtml = `
<div class="min-vh-100 bg-dark d-flex align-items-center justify-center p-4">
  <div class="card p-4 shadow border-0" style="max-width: 400px; width: 100%;">
    <h2 class="h3 fw-bold text-center text-dark mb-4">Anmelden</h2>
    
    <div *ngIf="error" class="alert alert-danger mb-3 py-2 px-3 small">
      {{error}}
    </div>
    
    <form (ngSubmit)="onSubmit()" class="d-flex flex-column gap-3">
      <div>
        <label class="form-label text-muted small fw-bold text-uppercase mb-1">Benutzername</label>
        <input type="text" [(ngModel)]="username" name="username" required class="form-control" />
      </div>
      <div>
        <label class="form-label text-muted small fw-bold text-uppercase mb-1">Passwort</label>
        <input type="password" [(ngModel)]="password" name="password" required class="form-control" />
      </div>
      
      <button type="submit" [disabled]="loading" class="btn btn-primary py-2 fw-bold w-100">
        {{ loading ? 'Melde an...' : 'Einloggen' }}
      </button>
    </form>
    
    ${config.integrations?.sso && config.integrations.sso.length > 0 ? `
    <div class="border-top pt-3 mt-3">
        <div class="text-center text-muted small mb-3 text-uppercase fw-bold">Oder anmelden mit</div>
        <div class="d-flex flex-column gap-2">
            ${config.integrations.sso.map(sso => `
            <button (click)="loginWith('${sso.provider}')" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-center gap-2 fw-bold">
                ${sso.provider === 'google' ? '<svg style="width: 1.25rem; height: 1.25rem;" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' : ''}
                ${sso.provider === 'apple' ? '<svg style="width: 1.25rem; height: 1.25rem;" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.8-1.09 0-1.44-.65-2.7-.65-1.24 0-1.63.63-2.68.63-1.12 0-2.28-.95-3.13-1.93-2.7-3.1-3.6-7.88-1.28-10.4 1.13-1.22 2.76-1.88 4.22-1.88 1.13 0 2.21.57 2.83.57.65 0 2.03-.78 3.53-.78 1.5 0 2.9.48 3.65 1.13-2.3 1.18-2.68 3.65-1.3 5.08 1.12 1.18 2.5 1.48 2.75 1.5-.1.35-1.03 3.48-2.81 4.93zM14.62 4.41c.65-.89 1.15-2.18 1.05-3.41-1.08.06-2.5.7-3.23 1.63-.6.75-1.15 2.05-1 3.23 1.13.1 2.45-.63 3.18-1.45z"/></svg>' : ''}
                ${sso.provider === 'microsoft' ? '<svg style="width: 1.25rem; height: 1.25rem;" viewBox="0 0 24 24"><path fill="#f35325" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/></svg>' : ''}
                ${sso.provider === 'github' ? '<svg style="width: 1.25rem; height: 1.25rem;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>' : ''}
                Mit ${sso.provider.charAt(0).toUpperCase() + sso.provider.slice(1)} anmelden
            </button>
            `).join('')}
        </div>
    </div>
    ` : ''}
    
    <div class="d-flex justify-content-between mt-4 border-top pt-3 small">
      <a routerLink="/forgot-password" class="text-primary text-decoration-none">Passwort vergessen?</a>
      <a routerLink="/register" class="text-primary text-decoration-none">Konto erstellen</a>
    </div>
  </div>
</div>
        `;
    } else {
        loginHtml = `
<div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
  <div class="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
    <h2 class="text-3xl font-black text-slate-800 text-center mb-6">Anmelden</h2>
    
    <div *ngIf="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
      {{error}}
    </div>
    
    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Benutzername</label>
        <input type="text" [(ngModel)]="username" name="username" required
          class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Passwort</label>
        <input type="password" [(ngModel)]="password" name="password" required
          class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      
      <button type="submit" [disabled]="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50">
        {{ loading ? 'Melde an...' : 'Einloggen' }}
      </button>
    </form>
    
    ${config.integrations?.sso && config.integrations.sso.length > 0 ? `
    <div class="mt-4 pt-4 border-t border-slate-100">
        <div class="text-center text-xs text-slate-500 mb-4 uppercase tracking-wide font-bold">Oder anmelden mit</div>
        <div class="space-y-2">
            ${config.integrations.sso.map(sso => `
            <button (click)="loginWith('${sso.provider}')" class="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                ${sso.provider === 'google' ? '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' : ''}
                ${sso.provider === 'apple' ? '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.8-1.09 0-1.44-.65-2.7-.65-1.24 0-1.63.63-2.68.63-1.12 0-2.28-.95-3.13-1.93-2.7-3.1-3.6-7.88-1.28-10.4 1.13-1.22 2.76-1.88 4.22-1.88 1.13 0 2.21.57 2.83.57.65 0 2.03-.78 3.53-.78 1.5 0 2.9.48 3.65 1.13-2.3 1.18-2.68 3.65-1.3 5.08 1.12 1.18 2.5 1.48 2.75 1.5-.1.35-1.03 3.48-2.81 4.93zM14.62 4.41c.65-.89 1.15-2.18 1.05-3.41-1.08.06-2.5.7-3.23 1.63-.6.75-1.15 2.05-1 3.23 1.13.1 2.45-.63 3.18-1.45z"/></svg>' : ''}
                ${sso.provider === 'microsoft' ? '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#f35325" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/></svg>' : ''}
                ${sso.provider === 'github' ? '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>' : ''}
                Mit ${sso.provider.charAt(0).toUpperCase() + sso.provider.slice(1)} anmelden
            </button>
            `).join('')}
        </div>
    </div>
    ` : ''}
    
    <div class="mt-6 pt-6 border-t border-slate-100 flex justify-between text-xs text-blue-600 font-medium">
      <a routerLink="/forgot-password" class="hover:underline">Passwort vergessen?</a>
      <a routerLink="/register" class="hover:underline">Neues Konto erstellen</a>
    </div>
  </div>
</div>
        `;
    }

    const loginTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: \`${loginHtml}\`
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  loginWith(provider: string) {
    this.loading = true;
    this.error = '';
    this.auth.loginWithSso(provider).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'SSO Login fehlgeschlagen.';
      }
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Invalide Anmeldedaten oder Verbindung fehlgeschlagen.';
      }
    });
  }
}
    `;
    files.push({ name: 'login.component.ts', path: `${appRoot}/pages/auth/login.component.ts`, content: loginTs, language: 'typescript' });

    // 3. Register Component
    let registerHtml = '';
    if (isBootstrap) {
        registerHtml = `
<div class="min-vh-100 bg-dark d-flex align-items-center justify-center p-4">
  <div class="card p-4 shadow border-0" style="max-width: 400px; width: 100%;">
    <h2 class="h3 fw-bold text-center text-dark mb-4">Registrieren</h2>
    
    <div *ngIf="error" class="alert alert-danger mb-3 py-2 px-3 small">
      {{error}}
    </div>
    <div *ngIf="success" class="alert alert-success mb-3 py-2 px-3 small">
      Registrierung erfolgreich! Sie werden zur Anmeldung weitergeleitet.
    </div>
    
    <form (ngSubmit)="onSubmit()" class="d-flex flex-column gap-3">
      <div>
        <label class="form-label text-muted small fw-bold text-uppercase mb-1">Benutzername</label>
        <input type="text" [(ngModel)]="username" name="username" required class="form-control" />
      </div>
      <div>
        <label class="form-label text-muted small fw-bold text-uppercase mb-1">E-Mail</label>
        <input type="email" [(ngModel)]="email" name="email" required class="form-control" />
      </div>
      <div>
        <label class="form-label text-muted small fw-bold text-uppercase mb-1">Passwort</label>
        <input type="password" [(ngModel)]="password" name="password" required class="form-control" />
      </div>
      
      <button type="submit" [disabled]="loading" class="btn btn-primary py-2 fw-bold w-100">
        {{ loading ? 'Registriere...' : 'Konto erstellen' }}
      </button>
    </form>
    
    <div class="text-center mt-4 border-top pt-3 small">
      <a routerLink="/login" class="text-primary text-decoration-none">Bereits registriert? Zum Login</a>
    </div>
  </div>
</div>
        `;
    } else {
        registerHtml = `
<div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
  <div class="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
    <h2 class="text-3xl font-black text-slate-800 text-center mb-6">Registrieren</h2>
    
    <div *ngIf="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
      {{error}}
    </div>
    <div *ngIf="success" class="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
      Registrierung erfolgreich! Sie werden zur Anmeldung weitergeleitet.
    </div>
    
    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Benutzername</label>
        <input type="text" [(ngModel)]="username" name="username" required
          class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">E-Mail</label>
        <input type="email" [(ngModel)]="email" name="email" required
          class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Passwort</label>
        <input type="password" [(ngModel)]="password" name="password" required
          class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      
      <button type="submit" [disabled]="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50">
        {{ loading ? 'Registriere...' : 'Konto erstellen' }}
      </button>
    </form>
    
    <div class="mt-6 text-center text-xs text-blue-600 font-medium">
      <a routerLink="/login" class="hover:underline">Bereits registriert? Zum Login</a>
    </div>
  </div>
</div>
        `;
    }

    const registerTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: \`${registerHtml}\`
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  error = '';
  success = false;
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Registrierung fehlgeschlagen. Der Benutzername wird eventuell bereits verwendet.';
      }
    });
  }
}
    `;
    files.push({ name: 'register.component.ts', path: `${appRoot}/pages/auth/register.component.ts`, content: registerTs, language: 'typescript' });

    // 4. ForgotPassword Component
    let forgotPasswordHtml = '';
    if (isBootstrap) {
        forgotPasswordHtml = `
<div class="min-vh-100 bg-dark d-flex align-items-center justify-center p-4">
  <div class="card p-4 shadow border-0" style="max-width: 400px; width: 100%;">
    <h2 class="h3 fw-bold text-center text-dark mb-2">Passwort zurücksetzen</h2>
    <p class="text-muted small text-center mb-4">Geben Sie Ihren Namen oder Ihre E-Mail ein, um Ihr Passwort zurückzusetzen.</p>
    
    <div *ngIf="success" class="alert alert-success mb-3 py-2 px-3 small">
      Eine Zurücksetzungsanleitung wurde an Ihre E-Mail gesendet.
    </div>
    
    <form (ngSubmit)="onSubmit()" class="d-flex flex-column gap-3">
      <div>
        <label class="form-label text-muted small fw-bold text-uppercase mb-1">Benutzername oder E-Mail</label>
        <input type="text" [(ngModel)]="username" name="username" required class="form-control" />
      </div>
      
      <button type="submit" [disabled]="loading" class="btn btn-primary py-2 fw-bold w-100">
        {{ loading ? 'Sende...' : 'Zurücksetzen anfordern' }}
      </button>
    </form>
    
    <div class="text-center mt-4 border-top pt-3 small">
      <a routerLink="/login" class="text-primary text-decoration-none">Zurück zum Login</a>
    </div>
  </div>
</div>
        `;
    } else {
        forgotPasswordHtml = `
<div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
  <div class="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
    <h2 class="text-3xl font-black text-slate-800 text-center mb-4">Passwort zurücksetzen</h2>
    <p class="text-slate-500 text-sm text-center mb-6">Geben Sie Ihren Namen oder Ihre E-Mail ein, um Ihr Passwort zurückzusetzen.</p>
    
    <div *ngIf="success" class="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
      Eine Zurücksetzungsanleitung wurde an Ihre E-Mail gesendet.
    </div>
    
    <form (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Benutzername oder E-Mail</label>
        <input type="text" [(ngModel)]="username" name="username" required
          class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      
      <button type="submit" [disabled]="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50">
        {{ loading ? 'Sende...' : 'Zurücksetzen anfordern' }}
      </button>
    </form>
    
    <div class="mt-6 text-center text-xs text-blue-600 font-medium">
      <a routerLink="/login" class="hover:underline">Zurück zum Login</a>
    </div>
  </div>
</div>
        `;
    }

    const forgotPasswordTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: \`${forgotPasswordHtml}\`
})
export class ForgotPasswordComponent {
  username = '';
  loading = false;
  success = false;

  onSubmit() {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.success = true;
    }, 1000);
  }
}
    `;
    files.push({ name: 'forgot-password.component.ts', path: `${appRoot}/pages/auth/forgot-password.component.ts`, content: forgotPasswordTs, language: 'typescript' });

    // 5. Profile Component
    let profileHtml = '';
    if (isBootstrap) {
        profileHtml = `
<div class="container py-4" style="max-width: 600px;">
  <div class="card shadow border-0 overflow-hidden">
    <div class="card-header bg-dark text-white p-3">
      <h2 class="h5 mb-0 fw-bold">Profilübersicht</h2>
    </div>
    
    <div class="card-body p-4">
      <div class="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-center fw-bold shadow-inner" style="width: 64px; height: 64px; font-size: 1.5rem;">
          {{(user?.username || 'U').substring(0, 2).toUpperCase()}}
        </div>
        <div>
          <h3 class="h5 fw-bold text-dark mb-1">{{user?.username}}</h3>
          <p class="text-muted small mb-0">Rolle: <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill ml-1">{{user?.role}}</span></p>
        </div>
      </div>
      
      <div class="mb-4">
        <h4 class="h6 fw-bold text-dark mb-3">Passwort ändern</h4>
        <div class="mb-3">
           <label class="form-label text-muted small fw-bold text-uppercase mb-1">Neues Passwort</label>
           <input type="password" [(ngModel)]="newPassword" class="form-control" />
        </div>
        <button (click)="changePassword()" class="btn btn-primary px-4 fw-bold">
           Passwort aktualisieren
        </button>
      </div>
      
      <div class="border-top pt-3 d-flex justify-content-end">
          <button (click)="logout()" class="btn btn-outline-danger px-4">
             Ausloggen
          </button>
      </div>
    </div>
  </div>
</div>
        `;
    } else {
        profileHtml = `
<div class="p-8 max-w-2xl mx-auto font-sans">
  <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
    <div class="p-6 bg-slate-800 text-white">
      <h2 class="text-2xl font-bold flex items-center gap-2">Profilübersicht</h2>
    </div>
    
    <div class="p-6 space-y-6">
      <div class="flex items-center gap-4 border-b pb-6">
        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold shadow-inner">
          {{(user?.username || 'U').substring(0, 2).toUpperCase()}}
        </div>
        <div>
          <h3 class="text-lg font-bold text-slate-800">{{user?.username}}</h3>
          <p class="text-slate-500 text-sm">Rolle: <span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold ml-1">{{user?.role}}</span></p>
        </div>
      </div>
      
      <div class="pt-4">
        <h4 class="text-md font-bold text-slate-800 mb-4">Passwort ändern</h4>
        <div class="space-y-4">
            <div>
               <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Neues Passwort</label>
               <input type="password" [(ngModel)]="newPassword" class="w-full border rounded p-2 text-sm" />
            </div>
            <button (click)="changePassword()" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-colors">
               Passwort aktualisieren
            </button>
        </div>
      </div>
      
      <div class="border-t pt-6 flex justify-end">
          <button (click)="logout()" class="px-6 py-2 border rounded-lg text-red-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
             Ausloggen
          </button>
      </div>
    </div>
  </div>
</div>
        `;
    }

    const profileTs = `
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`${profileHtml}\`
})
export class ProfileComponent implements OnInit {
  user: any = null;
  newPassword = '';
  error = '';
  success = false;
  loading = false;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.user$.subscribe(user => this.user = user);
  }

  logout() {
    this.auth.logout();
  }

  changePassword() {
    if (!this.newPassword) return;
    this.loading = true;
    this.error = '';
    this.success = false;
    this.auth.changePassword({ newPassword: this.newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.newPassword = '';
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Passwortänderung fehlgeschlagen.';
      }
    });
  }
}
    `;
    files.push({ name: 'profile.component.ts', path: `${appRoot}/pages/auth/profile.component.ts`, content: profileTs, language: 'typescript' });

    return files;
};
