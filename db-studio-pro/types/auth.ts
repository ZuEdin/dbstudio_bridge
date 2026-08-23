
export interface WhoAmIData {
  username?: string;
  displayName?: string;
  userId?: string;
  email?: string;
  isAuthenticated?: boolean;
  roles?: string[];
  userLevels?: string[];
  [key: string]: any;
}

export interface User {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  roles?: string[];
  userLevels?: string[];
  isAuthenticated: boolean;
  isAdUser?: boolean;
}

export interface AuthState {
  user: User | null;
  whoamiData: WhoAmIData | null;
  isAdConfigured?: boolean;
  adUser?: any;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
  checkAdSession?: () => Promise<boolean>;
}
