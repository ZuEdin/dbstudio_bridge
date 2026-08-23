import { create } from 'zustand';
import { AuthState, User } from '../types';
import { getApiUrl } from './useConfigStore';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  whoamiData: null,
  isAdConfigured: false,
  adUser: null,
  
  checkAdSession: async () => {
    try {
      const res = await fetch(getApiUrl('/api/ad/whoami'), { credentials: 'include' });
      if (res.ok) {
        const whoami = await res.json();
        const username = whoami.username || whoami.Username || 'Zubeyr';
        const displayName = whoami.displayName || whoami.DisplayName || username;
        const userId = whoami.userId || whoami.UserId || 'ad_user_01';
        const rawAuth = whoami.isAuthenticated ?? whoami.IsAuthenticated;
        const isAuth = rawAuth !== undefined ? Boolean(rawAuth) : Boolean(username);
        const roles: string[] = whoami.roles || whoami.Roles || (isAuth ? ['ADMIN', 'ENTWICKLER'] : ['GAST']);
        const userLevels: string[] = whoami.userLevels || whoami.UserLevels || (roles.length > 0 ? roles : ['System Admin', 'Level 10']);

        const userEmail = whoami.email || whoami.Email || (username.includes('@') ? username : `${username.toLowerCase().replace(/[^a-z0-9.]/g, '')}@firma.de`);

        const userObj: User = {
          id: userId,
          name: displayName,
          displayName: displayName,
          email: userEmail,
          role: roles.some(r => r.toLowerCase().includes('admin')) ? 'admin' : (roles.some(r => r.toLowerCase().includes('manager')) ? 'manager' : 'user'),
          roles: roles,
          userLevels: userLevels,
          isAuthenticated: true,
          isAdUser: true
        };

        set({ 
          whoamiData: {
            username,
            displayName,
            userId,
            email: userEmail,
            isAuthenticated: true,
            roles,
            userLevels
          },
          user: userObj,
          isAdConfigured: true
        });

        if (isAuth) {
          const meRes = await fetch(getApiUrl('/api/ad/me'), { credentials: 'include' }).catch(() => null);
          if (meRes && meRes.ok) {
            const adMe = await meRes.json();
            set({ adUser: adMe });
          }
        }
        return true;
      }
      set({ isAdConfigured: false, adUser: null, whoamiData: null });
      return false;
    } catch (e) {
      console.warn('AD session check failed (expected when offline or custom server not running):', e);
      set({ isAdConfigured: false, adUser: null, whoamiData: null });
      return false;
    }
  },
  
  login: async (email, password) => {
    if (!email.trim() || !password.trim()) return false;
    
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        const user: User = {
          id: data.user?.id,
          name: data.user?.name,
          email: data.user?.email,
          role: data.user?.role === 'ADMIN' ? 'admin' : 'user',
          isAuthenticated: true
        };
        set({ user });
        return true;
      } else {
        console.error("Login failed:", await res.text());
        return false;
      }
    } catch (e) {
      console.error('Real backend login failed:', e);
      return false;
    }
  },

  register: async (email, password, name) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include'
      });
      if (res.ok) {
         return true;
      }
      return false;
    } catch(e) {
      console.error('Registration failed:', e);
      return false;
    }
  },


  logout: () => set({ user: null }),
  isAdmin: () => get().user?.role === 'admin',
  isManager: () => get().user?.role === 'manager' || get().user?.role === 'admin'
}));
