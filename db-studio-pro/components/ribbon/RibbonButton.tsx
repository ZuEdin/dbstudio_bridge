
import React from 'react';

interface RibbonButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  size?: 'normal' | 'large';
  className?: string;
  disabled?: boolean;
}

export const RibbonButton: React.FC<RibbonButtonProps> = ({ icon, label, sublabel, onClick, size = 'normal', className = '', disabled = false }) => (
  <button 
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center p-2 rounded transition-colors ${size === 'large' ? 'w-20' : 'w-16'} ${
      disabled 
        ? 'opacity-40 cursor-not-allowed text-slate-400 hover:bg-transparent' 
        : 'hover:bg-sky-100 hover:text-sky-900'
    } ${className}`}
  >
    <div className={`${size === 'large' ? 'scale-150 mb-2' : 'mb-1'}`}>
      {icon}
    </div>
    <span className="text-xs text-center leading-tight">{label}</span>
    {sublabel && <span className="text-[9px] text-slate-400 text-center leading-tight mt-0.5">{sublabel}</span>}
  </button>
);
