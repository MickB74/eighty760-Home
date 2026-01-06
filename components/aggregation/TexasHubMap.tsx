import React from 'react';

interface TexasHubMapProps {
    className?: string;
    selectedHub?: string; // 'North', 'South', 'West', 'Houston', 'Panhandle'
    onHubSelect?: (hub: string) => void;
}

const HUBS = [
    { id: 'North', x: 230, y: 140, label: 'North (DFW)' },
    { id: 'South', x: 210, y: 260, label: 'South (San Antonio)' },
    { id: 'West', x: 120, y: 190, label: 'West (Midland)' },
    { id: 'Houston', x: 270, y: 230, label: 'Houston' },
    { id: 'Panhandle', x: 120, y: 60, label: 'Panhandle' },
];

export default function TexasHubMap({ className = "", selectedHub, onHubSelect }: TexasHubMapProps) {
    return (
        <div className={`relative ${className}`}>
            <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-sm filter">
                {/* Texas Outline (Simplified) */}
                <path
                    d="M100,20 L240,20 L240,90 L340,120 L380,150 L360,250 L280,380 L200,320 L130,260 L40,200 L40,20 Z"
                    fill="currentColor"
                    strokeWidth="2"
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
