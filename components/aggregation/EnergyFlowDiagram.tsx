'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EnergyFlowProps {
    hour: number;
    solar: number;
    wind: number;
    nuclear: number;
    geothermal: number;
    ccs: number;
    battery: number;
    load: number;
    gridDeficit: number;
    surplus?: number; // Excess generation
}

interface Particle {
    id: number;
    source: 'solar' | 'wind' | 'nuclear' | 'geothermal' | 'ccs' | 'battery' | 'grid';
    progress: number;
}

export default function EnergyFlowDiagram({ hour, solar, wind, nuclear, geothermal, ccs, battery, load, gridDeficit, surplus = 0 }: EnergyFlowProps) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [particleId, setParticleId] = useState(0);

    // Generate particles based on power flows
    useEffect(() => {
        const interval = setInterval(() => {
            const newParticles: Particle[] = [];

            // Solar particles
            if (solar > 0) {
                const count = Math.ceil(solar / 50);
                for (let i = 0; i < Math.min(count, 3); i++) {
                    newParticles.push({
                        id: particleId + i,
                        source: 'solar',
                        progress: 0
                    });
                }
            }

            // Wind particles
            if (wind > 0) {
                const count = Math.ceil(wind / 50);
                for (let i = 0; i < Math.min(count, 3); i++) {
                    newParticles.push({
                        id: particleId + 1000 + i,
                        source: 'wind',
                        progress: 0
                    });
                }
            }

            // Nuclear particles (steady baseload)
            if (nuclear > 0) {
                newParticles.push({
                    id: particleId + 2000,
                    source: 'nuclear',
                    progress: 0
                });
            }

            // Geothermal particles (steady baseload)
            if (geothermal > 0) {
                newParticles.push({
                    id: particleId + 3000,
                    source: 'geothermal',
                    progress: 0
                });
            }

            // CCS Gas particles
            if (ccs > 0) {
                newParticles.push({
                    id: particleId + 4000,
                    source: 'ccs',
                    progress: 0
                });
            }

            // Battery particles
            if (battery > 0) {
                newParticles.push({
                    id: particleId + 5000,
                    source: 'battery',
                    progress: 0
                });
            }

            // Grid particles (if deficit)
            if (gridDeficit > 0) {
                const count = Math.ceil(gridDeficit / 50);
                for (let i = 0; i < Math.min(count, 2); i++) {
                    newParticles.push({
                        id: particleId + 6000 + i,
                        source: 'grid',
                        progress: 0
                    });
                }
            }

            setParticles(prev => [...prev.filter(p => p.progress < 1), ...newParticles]);
            setParticleId(prev => prev + 7000);
        }, 1000);

        return () => clearInterval(interval);
    }, [solar, wind, nuclear, geothermal, ccs, battery, gridDeficit, particleId]);

    // Animate particles
    useEffect(() => {
        const interval = setInterval(() => {
            setParticles(prev =>
                prev.map(p => ({ ...p, progress: p.progress + 0.02 }))
                    .filter(p => p.progress <= 1)
            );
        }, 50);

        return () => clearInterval(interval);
    }, []);

    const getParticleColor = (source: string) => {
        switch (source) {
            case 'solar': return '#fbbf24'; // yellow
            case 'wind': return '#3b82f6'; // blue
            case 'nuclear': return '#8b5cf6'; // purple
            case 'geothermal': return '#f97316'; // orange
            case 'ccs': return '#a78bfa'; // light purple
            case 'battery': return '#10b981'; // green
            case 'grid': return '#ef4444'; // red
            default: return '#64748b';
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Live Energy Flow</h3>
                <p className="text-sm text-slate-400">Real-time visualization of power sources to load</p>
            </div>

            {/* SVG Diagram */}
            <svg viewBox="0 0 800 400" className="w-full h-64">
                <defs>
                    {/* Gradient for paths */}
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                {/* Source Nodes (Left) */}
                <g id="sources">
                    {/* Solar */}
                    <circle cx="80" cy="80" r="30" fill="#fbbf24" opacity="0.2" />
                    <text x="80" y="85" textAnchor="middle" fill="white" fontSize="24">☀️</text>
                    <text x="80" y="50" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="600">
                        Solar
                    </text>
                    <text x="80" y="125" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold">
                        {solar.toFixed(0)} MWh
                    </text>

                    {/* Wind */}
                    <circle cx="80" cy="200" r="30" fill="#3b82f6" opacity="0.2" />
                    <text x="80" y="205" textAnchor="middle" fill="white" fontSize="24">💨</text>
                    <text x="80" y="170" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="600">
                        Wind
                    </text>
                    <text x="80" y="245" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                        {wind.toFixed(0)} MWh
                    </text>

                    {/* Nuclear */}
                    <circle cx="80" cy="280" r="30" fill="#8b5cf6" opacity="0.2" />
                    <text x="80" y="285" textAnchor="middle" fill="white" fontSize="24">⚛️</text>
                    <text x="80" y="250" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">
                        Nuclear
                    </text>
                    <text x="80" y="325" textAnchor="middle" fill="#8b5cf6" fontSize="14" fontWeight="bold">
                        {nuclear.toFixed(0)} MWh
                    </text>

                    {/* Geothermal */}
                    <circle cx="200" cy="80" r="30" fill="#f97316" opacity="0.2" />
                    <text x="200" y="85" textAnchor="middle" fill="white" fontSize="24">🌋</text>
                    <text x="200" y="50" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="600">
                        Geothermal
                    </text>
                    <text x="200" y="125" textAnchor="middle" fill="#f97316" fontSize="14" fontWeight="bold">
                        {geothermal.toFixed(0)} MWh
                    </text>

                    {/* CCS Gas */}
                    <circle cx="200" cy="280" r="30" fill="#a78bfa" opacity="0.2" />
                    <text x="200" y="285" textAnchor="middle" fill="white" fontSize="24">🏭</text>
                    <text x="200" y="250" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="600">
                        CCS Gas
                    </text>
                    <text x="200" y="325" textAnchor="middle" fill="#a78bfa" fontSize="14" fontWeight="bold">
                        {ccs.toFixed(0)} MWh
                    </text>
                </g>

                {/* Battery (Middle) */}
                <g id="battery">
                    <rect x="330" y="170" width="80" height="60" rx="10" fill="#10b981" opacity="0.2" stroke="#10b981" strokeWidth="2" />
                    <text x="370" y="210" textAnchor="middle" fill="white" fontSize="32">🔋</text>
                    <text x="370" y="150" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="600">
                        Battery
                    </text>
                    <text x="370" y="260" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="bold">
                        {battery.toFixed(0)} MWh
                    </text>
                </g>

                {/* Load (Right) */}
                <g id="load">
                    <rect x="630" y="170" width="90" height="60" rx="10" fill="#22c55e" opacity="0.2" stroke="#22c55e" strokeWidth="2" />
                    <text x="675" y="210" textAnchor="middle" fill="white" fontSize="32">🏭</text>
                    <text x="675" y="150" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="600">
                        Load
                    </text>
                    <text x="675" y="260" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                        {load.toFixed(0)} MWh
                    </text>
                </g>

                {/* Grid (Bottom Right) */}
                {gridDeficit > 0 && (
                    <g id="grid">
                        <circle cx="675" cy="340" r="25" fill="#ef4444" opacity="0.2" stroke="#ef4444" strokeWidth="2" />
                        <text x="675" y="345" textAnchor="middle" fill="white" fontSize="20">⚡</text>
                        <text x="675" y="380" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
                            Grid: {gridDeficit.toFixed(0)} MWh
                        </text>

                        {/* Grid to Load path */}
                        <path
                            d="M 675 315 L 675 230"
                            stroke="#ef4444"
                            strokeWidth="3"
                            fill="none"
                            opacity="0.5"
                            strokeDasharray="5,5"
                        />
                    </g>
                )}

                {/* Excess Generation (below battery) */}
                {surplus > 0 && (
                    <g id="excess">
                        <circle cx="370" cy="340" r="25" fill="#fbbf24" opacity="0.2" stroke="#fbbf24" strokeWidth="2" />
                        <text x="370" y="345" textAnchor="middle" fill="white" fontSize="20">⚡</text>
                        <text x="370" y="380" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">
                            Excess: {surplus.toFixed(0)} MWh
                        </text>

                        {/* Battery to Excess  path */}
                        <path
                            d="M 370 230 L 370 315"
                            stroke="#fbbf24"
                            strokeWidth="3"
                            fill="none"
                            opacity="0.5"
                            strokeDasharray="5,5"
                        />
                    </g>
                )}


                {/* Paths */}
                <g id="paths" opacity="0.3">
                    {/* Solar to Battery */}
                    <path d="M 110 80 Q 220 130 330 190" stroke="#fbbf24" strokeWidth={Math.max(2, solar / 30)} fill="none" />

                    {/* Wind to Battery */}
                    <path d="M 110 200 Q 220 200 330 200" stroke="#3b82f6" strokeWidth={Math.max(2, wind / 30)} fill="none" />

                    {/* Nuclear to Battery */}
                    <path d="M 110 280 Q 220 240 330 210" stroke="#8b5cf6" strokeWidth={Math.max(2, nuclear / 30)} fill="none" />

                    {/* Geothermal to Battery */}
                    <path d="M 230 80 Q 280 130 330 190" stroke="#f97316" strokeWidth={Math.max(2, geothermal / 30)} fill="none" />

                    {/* CCS to Battery */}
                    <path d="M 230 280 Q 280 240 330 210" stroke="#a78bfa" strokeWidth={Math.max(2, ccs / 30)} fill="none" />

                    {/* Battery to Load */}
                    <path d="M 410 200 L 630 200" stroke="#10b981" strokeWidth={Math.max(2, (solar + wind + nuclear + geothermal + ccs + battery) / 30)} fill="none" />
                </g>

                {/* Animated Particles */}
                {particles.map(particle => {
                    let path: [number, number][] = [];

                    if (particle.source === 'solar') {
                        path = [[110, 80], [220, 130], [330, 190], [410, 200], [630, 200]];
                    } else if (particle.source === 'wind') {
                        path = [[110, 200], [220, 200], [330, 200], [410, 200], [630, 200]];
                    } else if (particle.source === 'nuclear') {
                        path = [[110, 280], [220, 240], [330, 210], [410, 200], [630, 200]];
                    } else if (particle.source === 'geothermal') {
                        path = [[230, 80], [280, 130], [330, 190], [410, 200], [630, 200]];
                    } else if (particle.source === 'ccs') {
                        path = [[230, 280], [280, 240], [330, 210], [410, 200], [630, 200]];
                    } else if (particle.source === 'battery') {
                        path = [[370, 200], [410, 200], [630, 200]];
                    } else if (particle.source === 'grid') {
                        path = [[675, 315], [675, 230]];
                    }

                    const index = Math.floor(particle.progress * (path.length - 1));
                    const nextIndex = Math.min(index + 1, path.length - 1);
                    const segmentProgress = (particle.progress * (path.length - 1)) - index;

                    const [x1, y1] = path[index];
                    const [x2, y2] = path[nextIndex];
                    const x = x1 + (x2 - x1) * segmentProgress;
                    const y = y1 + (y2 - y1) * segmentProgress;

                    return (
                        <circle
                            key={particle.id}
                            cx={x}
                            cy={y}
                            r="4"
                            fill={getParticleColor(particle.source)}
                        >
                            <animate attributeName="opacity" values="0;1;1;0" dur="1s" />
                        </circle>
                    );
                })}
            </svg>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div className="bg-navy-950/50 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">Clean Generation</div>
                    <div className="text-energy-green font-bold">{(solar + wind + nuclear + geothermal + ccs).toFixed(1)} MWh</div>
                </div>
                <div className="bg-navy-950/50 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">CFE Match Rate</div>
                    <div className={`font-bold ${gridDeficit === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {load > 0 ? ((load - gridDeficit) / load * 100).toFixed(1) : 0}%
                    </div>
                </div>
            </div>
        </div>
    );
}
