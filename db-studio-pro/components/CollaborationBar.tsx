
import React from 'react';
import { Collaborator } from '../types/index';

interface CollaborationBarProps {
    collaborators: Collaborator[];
}

export const CollaborationBar: React.FC<CollaborationBarProps> = ({ collaborators }) => {
    return (
        <div className="flex items-center -space-x-1.5 mr-3">
            {collaborators.filter(c => c.isOnline).map((user) => {
                const parts = (user.name || 'Ich').trim().split(/\s+/);
                const initials = parts.length > 1 
                    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                    : (parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'U');

                return (
                    <div 
                        key={user.id} 
                        className="relative group cursor-default"
                        title={user.currentAction ? `${user.name} (${user.currentAction})` : user.name}
                    >
                        <div 
                            className="w-7 h-7 rounded-full border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform group-hover:scale-105"
                            style={{ backgroundColor: user.color || '#3b82f6' }}
                        >
                            {initials}
                        </div>
                        {/* Status Dot */}
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-slate-800 rounded-full"></div>
                        
                        {/* Tooltip */}
                        <div className="absolute top-full mt-1.5 right-0 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-md whitespace-nowrap z-50 shadow-xl border border-slate-700">
                            <p className="font-bold text-slate-200">{user.name}</p>
                            {user.currentAction && <p className="font-normal text-slate-400 text-[9px]">{user.currentAction}</p>}
                        </div>
                    </div>
                );
            })}
            {collaborators.length > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-sm">
                    +{collaborators.length - 3}
                </div>
            )}
        </div>
    );
};
