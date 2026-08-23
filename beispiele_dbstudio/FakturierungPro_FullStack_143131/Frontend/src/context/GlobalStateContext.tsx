import React, { createContext, useContext, useState } from 'react';
import { executeGeneratedMacro } from '../services/macroService';

export const GlobalStateContext = createContext<any>(null);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [states, setStates] = useState<Record<string, any>>({});
  
  const setGlobalState = (key: string, value: any) => {
      setStates(prev => ({ ...prev, [key]: value }));
  };

  // Phase 6 Toast
  const [toasts, setToasts] = useState<any[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const executeMacro = (macroId: string, contextData?: any) => {
      executeGeneratedMacro(macroId, contextData, addToast);
  };
  
  return (
      <GlobalStateContext.Provider value={{ states, setGlobalState, addToast, executeMacro }}>
          {children}
          {/* Toast Container */}
          <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
            {toasts.map(t => (
                <div key={t.id} className={`px-4 py-3 rounded-lg shadow-xl text-white ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-blue-600'} flex items-center gap-2 animate-in slide-in-from-right-4`}>
                    {t.message}
                </div>
            ))}
          </div>
      </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);
