import { VirtualFile, BackendConfig } from '../../../types/index';

export const generateAngularModernCore = (config: BackendConfig, appRoot: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  // 1. main.ts
  const mainTs = `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
`;
  files.push({
    name: 'main.ts',
    path: `${appRoot}/../main.ts`,
    content: mainTs,
    language: 'typescript'
  });

  // 2. app.config.ts
  const appConfigTs = `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { appRoutes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideAnimationsAsync()
  ]
};
`;
  files.push({
    name: 'app.config.ts',
    path: `${appRoot}/app.config.ts`,
    content: appConfigTs,
    language: 'typescript'
  });

  // 3. app.component.ts (Standalone)
  const appComponentTs = `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/components/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <router-outlet />
    <app-toast-container />
  \`
})
export class AppComponent {}
`;
  files.push({
    name: 'app.component.ts',
    path: `${appRoot}/app.component.ts`,
    content: appComponentTs,
    language: 'typescript'
  });

  // 4. auth.interceptor.ts (Functional Interceptor)
  const authInterceptorTs = `import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: \`Bearer \${token}\`
      }
    });
    return next(cloned);
  }

  return next(req);
};
`;
  files.push({
    name: 'auth.interceptor.ts',
    path: `${appRoot}/core/interceptors/auth.interceptor.ts`,
    content: authInterceptorTs,
    language: 'typescript'
  });

  // 5. auth.guard.ts (Functional Guard with Signals)
  const authGuardTs = `import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const requiredRoles = route.data?.['roles'] as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = authService.currentUser()?.role || 'user';
      if (!requiredRoles.includes(userRole)) {
        router.navigate(['/forbidden']);
        return false;
      }
    }
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
`;
  files.push({
    name: 'auth.guard.ts',
    path: `${appRoot}/core/guards/auth.guard.ts`,
    content: authGuardTs,
    language: 'typescript'
  });

  // 6. auth.service.ts (Signal-based Auth State)
  const authServiceTs = `import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;

  // Signal State
  private readonly _currentUser = signal<UserProfile | null>(this.getStoredUser());
  private readonly _token = signal<string | null>(localStorage.getItem('auth_token'));

  // Public Readonly Signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser() && !!this._token());
  readonly isAdmin = computed(() => this._currentUser()?.role === 'Admin');

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ token: string; user: UserProfile }>(\`\${this.baseUrl}auth/login\`, credentials);
  }

  setSession(token: string, user: UserProfile) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    this._token.set(token);
    this._currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private getStoredUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
`;
  files.push({
    name: 'auth.service.ts',
    path: `${appRoot}/core/services/auth.service.ts`,
    content: authServiceTs,
    language: 'typescript'
  });

  // 7. toast.service.ts (Signal-based Toast Manager)
  const toastServiceTs = `import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<ToastMessage, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    
    this._toasts.update(current => [...current, newToast]);

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(title: string, message?: string) {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string) {
    this.show({ type: 'error', title, message });
  }

  warning(title: string, message?: string) {
    this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string) {
    this.show({ type: 'info', title, message });
  }

  dismiss(id: string) {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }
}
`;
  files.push({
    name: 'toast.service.ts',
    path: `${appRoot}/core/services/toast.service.ts`,
    content: toastServiceTs,
    language: 'typescript'
  });

  // 8. toast-container.component.ts (Standalone with modern @for control flow)
  const toastContainerTs = `import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5"
          [class.bg-emerald-50]="toast.type === 'success'"
          [class.border-emerald-200]="toast.type === 'success'"
          [class.text-emerald-900]="toast.type === 'success'"
          [class.bg-rose-50]="toast.type === 'error'"
          [class.border-rose-200]="toast.type === 'error'"
          [class.text-rose-900]="toast.type === 'error'"
          [class.bg-amber-50]="toast.type === 'warning'"
          [class.border-amber-200]="toast.type === 'warning'"
          [class.text-amber-900]="toast.type === 'warning'"
          [class.bg-blue-50]="toast.type === 'info'"
          [class.border-blue-200]="toast.type === 'info'"
          [class.text-blue-900]="toast.type === 'info'"
        >
          <div class="flex-1 min-w-0">
            <div class="font-bold text-xs">{{ toast.title }}</div>
            @if (toast.message) {
              <div class="text-[11px] opacity-80 mt-0.5">{{ toast.message }}</div>
            }
          </div>
          <button 
            (click)="toastService.dismiss(toast.id)"
            class="text-xs opacity-50 hover:opacity-100 transition-opacity p-0.5"
          >
            ✕
          </button>
        </div>
      }
    </div>
  \`
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
`;
  files.push({
    name: 'toast-container.component.ts',
    path: `${appRoot}/core/components/toast-container.component.ts`,
    content: toastContainerTs,
    language: 'typescript'
  });

  return files;
};
