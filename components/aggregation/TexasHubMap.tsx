import React from 'react';

interface TexasHubMapProps {
    className?: string;
    selectedHub?: string; // 'North', 'South', 'West', 'Houston', 'Panhandle'
    onHubSelect?: (hub: string) => void;
}

const HUBS = [
    { id: 'North', x: 260, y: 130, label: 'North (DFW)' },
    { id: 'South', x: 230, y: 280, label: 'South (San Antonio)' },
    { id: 'West', x: 150, y: 240, label: 'West (Midland)' },
    { id: 'Houston', x: 310, y: 230, label: 'Houston' },
    { id: 'Panhandle', x: 180, y: 70, label: 'Panhandle' },
];

export default function TexasHubMap({ className = "", selectedHub, onHubSelect }: TexasHubMapProps) {
    return (
        <div className={`relative ${className}`}>
            <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-sm filter">
                {/* Texas Outline (Improved V2) */}
                <path
                    d="M 130,40 L 230,40 L 230,100 L 260,105 L 300,95 L 330,110 L 360,110 L 350,180 L 330,220 L 260,390 L 200,320 L 150,320 L 150,350 L 120,310 L 20,220 L 130,220 Z"
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
