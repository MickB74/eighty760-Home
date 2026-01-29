
import React from 'react';

interface TexasNodeMapProps {
    className?: string;
    selectedNode?: string;
    onNodeSelect?: (node: string) => void;
    highlightedNode?: string; // Optional secondary highlight (e.g. Reference)
}

const NODES = [
    // Hubs
    { id: 'HB_NORTH', x: 260, y: 130, label: 'North Hub', type: 'Hub' },
    { id: 'HB_SOUTH', x: 230, y: 280, label: 'South Hub', type: 'Hub' },
    { id: 'HB_WEST', x: 150, y: 240, label: 'West Hub', type: 'Hub' },
    { id: 'HB_HOUSTON', x: 310, y: 230, label: 'Houston Hub', type: 'Hub' },
    { id: 'HB_PAN', x: 180, y: 70, label: 'Panhandle', type: 'Hub' },

    // Load Zones (Approximate locations)
    { id: 'LZ_AEN', x: 245, y: 240, label: 'Austin (AEN)', type: 'Zone' },
    { id: 'LZ_CPS', x: 220, y: 290, label: 'San Antonio (CPS)', type: 'Zone' },
    { id: 'LZ_HOUSTON', x: 325, y: 220, label: 'Houston Z', type: 'Zone' },
    { id: 'LZ_LCRA', x: 210, y: 250, label: 'LCRA', type: 'Zone' },
    { id: 'LZ_NORTH', x: 275, y: 115, label: 'North Z', type: 'Zone' },
    { id: 'LZ_RAYBN', x: 340, y: 160, label: 'Rayburn', type: 'Zone' },
    { id: 'LZ_SOUTH', x: 230, y: 320, label: 'South Z', type: 'Zone' },
    { id: 'LZ_WEST', x: 130, y: 250, label: 'West Z', type: 'Zone' }
];

export default function TexasNodeMap({ className = "", selectedNode, onNodeSelect, highlightedNode }: TexasNodeMapProps) {
    return (
        <div className={`relative ${className}`}>
            <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-sm filter">
                {/* Background Map Shapes (Simplified Texas Regions) */}
                <path
                    d="M 130,40 L 230,40 L 230,140 L 130,140 Z"
                    fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-200 dark:text-gray-700"
                />
                <path
                    d="M 230,40 L 230,100 L 260,105 L 300,95 L 330,110 L 360,110 L 350,180 L 290,230 L 230,220 L 230,140 L 230,40 Z"
                    fill="#eff6ff" stroke="currentColor" strokeWidth="1" className="text-gray-200 dark:text-gray-700 dark:fill-navy-900"
                />
                <path
                    d="M 130,140 L 230,140 L 230,220 L 180,260 L 150,320 L 150,350 L 120,310 L 20,220 L 130,220 Z"
                    fill="#f0fdf4" stroke="currentColor" strokeWidth="1" className="text-gray-200 dark:text-gray-700 dark:fill-navy-800"
                />
                <path
                    d="M 180,260 L 230,220 L 290,230 L 310,210 L 350,180 L 330,220 L 260,390 L 200,320 L 180,260 Z"
                    fill="#fefce8" stroke="currentColor" strokeWidth="1" className="text-gray-200 dark:text-gray-700 dark:fill-navy-900"
                />

                {/* Nodes */}
                {NODES.map((node) => {
                    const isSelected = selectedNode === node.id;
                    const isHighlighted = highlightedNode === node.id;
                    const isHub = node.type === 'Hub';

                    return (
                        <g
                            key={node.id}
                            onClick={() => onNodeSelect && onNodeSelect(node.id)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r={isHub ? (isSelected ? 10 : 6) : (isSelected ? 7 : 4)}
                                className={`transition-all duration-300 stroke-whitestroke-2
                                    ${isSelected ? 'fill-blue-600 stroke-white' :
                                        isHighlighted ? 'fill-orange-500 stroke-white' :
                                            isHub ? 'fill-navy-900 dark:fill-gray-300' : 'fill-gray-400 dark:fill-gray-600'
                                    }
                                `}
                            />
                            {/* Label only for Hubs or Selected */}
                            {(isHub || isSelected || isHighlighted) && (
                                <text
                                    x={node.x}
                                    y={node.y + (isHub ? 18 : 14)}
                                    textAnchor="middle"
                                    className={`text-[8px] font-sans pointer-events-none select-none
                                        ${isSelected ? 'fill-blue-600 font-bold' :
                                            isHighlighted ? 'fill-orange-500 font-bold' :
                                                'fill-gray-600 dark:fill-gray-400'
                                        }`}
                                >
                                    {node.label}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-black/50 p-2 rounded text-[10px] text-gray-500">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-navy-900 dark:bg-gray-300"></span> Hub</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Load Zone</div>
            </div>
        </div>
    );
}
