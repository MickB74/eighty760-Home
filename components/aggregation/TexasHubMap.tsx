import React from 'react';

interface TexasHubMapProps {
    className?: string;
    selectedHub?: string; // 'North', 'South', 'West', 'Houston', 'Panhandle'
    onHubSelect?: (hub: string) => void;
}

const HUBS = [
    { id: 'North', x: 250, y: 120, label: 'North (DFW)' },
    { id: 'South', x: 230, y: 260, label: 'South (San Antonio)' },
    { id: 'West', x: 150, y: 180, label: 'West (Midland)' },
    { id: 'Houston', x: 290, y: 220, label: 'Houston' },
    { id: 'Panhandle', x: 175, y: 40, label: 'Panhandle' },
];

export default function TexasHubMap({ className = "", selectedHub, onHubSelect }: TexasHubMapProps) {
    return (
        <div className={`relative ${className}`}>
            <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-sm filter">
                {/* Texas Outline (Improved) */}
                <path
                    d="M 95,160 L 140,160 L 140,20 L 210,20 L 210,60 L 320,60 L 320,130 L 350,160 L 330,220 L 280,300 L 230,380 L 190,320 L 170,330 L 150,300 L 95,160 Z"
                    fill="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="text-gray-100 dark:text-slate-700 stroke-gray-300 dark:stroke-slate-600 transition-colors duration-300"
                />

                {/* Hub Markers */}
                {HUBS.map((hub) => {
                    const isSelected = selectedHub === hub.id;
                    return (
                        <g
                            key={hub.id}
                            onClick={() => onHubSelect && onHubSelect(hub.id)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <circle
                                cx={hub.x}
                                cy={hub.y}
                                r={isSelected ? 8 : 5}
                                className={`transition-all duration-300 ${isSelected ? 'fill-brand dark:fill-brand-light' : 'fill-gray-400 dark:fill-gray-500'}`}
                            />
                            <text
                                x={hub.x}
                                y={hub.y + 15}
                                textAnchor="middle"
                                className={`text-[10px] font-medium transition-colors duration-300 ${isSelected ? 'fill-brand dark:fill-brand-light font-bold' : 'fill-gray-500 dark:fill-gray-400'}`}
                            >
                                {hub.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
