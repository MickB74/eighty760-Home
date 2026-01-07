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
                <defs>
                    <pattern id="panhandle_grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-600" />
                    </pattern>
                </defs>

                {/* Panhandle (Grid) */}
                <path
                    d="M 130,40 L 230,40 L 230,140 L 130,140 Z"
                    fill="url(#panhandle_grid)"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-400 dark:text-gray-500 stroke-gray-300 dark:stroke-slate-600"
                />

                {/* West (Gray) */}
                <path
                    d="M 130,140 L 230,140 L 230,220 L 180,260 L 150,320 L 150,350 L 120,310 L 20,220 L 130,220 Z"
                    fill="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="text-gray-400 dark:text-gray-500 stroke-white dark:stroke-slate-800 hover:opacity-80 transition-opacity"
                />

                {/* North (Blue) */}
                <path
                    d="M 230,40 L 230,100 L 260,105 L 300,95 L 330,110 L 360,110 L 350,180 L 290,230 L 230,220 L 230,140 L 230,40 Z"
                    fill="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="text-energy-green dark:text-energy-green stroke-white dark:stroke-slate-800 hover:opacity-80 transition-opacity"
                />

                {/* South (Amber/Yellow) */}
                <path
                    d="M 180,260 L 230,220 L 290,230 L 310,210 L 350,180 L 330,220 L 260,390 L 200,320 L 180,260 Z"
                    fill="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="text-amber-300 dark:text-amber-500 stroke-white dark:stroke-slate-800 hover:opacity-80 transition-opacity"
                />

                {/* Houston (Darker Gray/Slate) - Overlay on South/North border */}
                <path
                    d="M 290,230 L 310,210 L 350,180 L 330,220 L 310,250 Z"
                    fill="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="text-slate-400 dark:text-slate-600 stroke-white dark:stroke-slate-800 hover:opacity-80 transition-opacity"
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
