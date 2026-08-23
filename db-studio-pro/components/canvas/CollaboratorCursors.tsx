import React, { useState, useEffect } from 'react';
import { TableNode } from '../../types/index';

interface CollaboratorCursorsProps {
    nodes: TableNode[];
}

export const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({ nodes }) => {
    const [collaboratorCursors, setCollaboratorCursors] = useState<{
        u2: { name: string; color: string; x: number; y: number; active: boolean; currentAction?: string };
        u3: { name: string; color: string; x: number; y: number; active: boolean; currentAction?: string };
    }>({
        u2: { name: 'Sarah Lee', color: '#10b981', x: 250, y: 350, active: true, currentAction: 'Bearbeitet Customers' },
        u3: { name: 'Tom H.', color: '#f59e0b', x: 500, y: 150, active: true, currentAction: 'Bearbeitet Users (LOCKED)' }
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setCollaboratorCursors(prev => {
                const next = { ...prev };
                const customerNode = nodes.find(n => n.id.includes('customer') || n.id.includes('client') || n.id.includes('sys_customers')) || nodes[0];
                const userNode = nodes.find(n => n.id.includes('user') || n.id.includes('sys_users')) || nodes[1] || nodes[0];

                if (customerNode) {
                    next.u2 = {
                        ...prev.u2,
                        x: customerNode.x + 80 + Math.sin(Date.now() / 1500) * 40,
                        y: customerNode.y + 40 + Math.cos(Date.now() / 1500) * 30,
                    };
                } else {
                    next.u2 = {
                        ...prev.u2,
                        x: 250 + Math.sin(Date.now() / 2000) * 100,
                        y: 350 + Math.cos(Date.now() / 2000) * 100,
                    };
                }

                if (userNode) {
                    next.u3 = {
                        ...prev.u3,
                        x: userNode.x + 120 + Math.sin(Date.now() / 1800) * 30,
                        y: userNode.y + 50 + Math.cos(Date.now() / 1800) * 40,
                    };
                } else {
                    next.u3 = {
                        ...prev.u3,
                        x: 500 + Math.sin(Date.now() / 2500) * 80,
                        y: 150 + Math.cos(Date.now() / 2500) * 80,
                    };
                }

                return next;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [nodes]);

    return (
        <>
            {Object.entries(collaboratorCursors).map(([id, cursorObj]) => {
                const cursor = cursorObj as any;
                return (
                    <div 
                        key={id}
                        className="absolute pointer-events-none transition-all duration-100 ease-out z-40 select-none"
                        style={{ left: cursor.x, top: cursor.y }}
                    >
                        <svg 
                            width="14" 
                            height="18" 
                            viewBox="0 0 14 18" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className="drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.4)]"
                        >
                            <path 
                                d="M1 1V14.5L4.5 11L7.5 17L10.5 15.5L7.5 9.5L12 9.5L1 1Z" 
                                fill={cursor.color} 
                                stroke="white" 
                                strokeWidth="1.5" 
                                strokeLinejoin="round" 
                            />
                        </svg>
                        <div 
                            className="ml-3.5 mt-2.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-md flex flex-col min-w-[70px] leading-none border border-white/20"
                            style={{ backgroundColor: cursor.color }}
                        >
                            <span className="font-sans font-bold">{cursor.name}</span>
                            {cursor.currentAction && (
                                <span className="text-[7px] font-normal opacity-90 truncate max-w-[120px] mt-0.5">
                                    {cursor.currentAction}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
};
