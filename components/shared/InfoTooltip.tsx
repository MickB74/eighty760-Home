import React from 'react';

interface InfoTooltipProps {
    text: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function InfoTooltip({ text, size = 'sm', className = '' }: InfoTooltipProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 text-xs',
        md: 'w-5 h-5 text-sm',
        lg: 'w-6 h-6 text-base'
    };

    return (
        <div className={`relative inline-flex items-center group ${className}`}>
            <div className={`
                ${sizeClasses[size]} 
                flex items-center justify-center 
                rounded-full 
                border border-[var(--text-tertiary)] text-[var(--text-tertiary)]
                group-hover:border-[var(--brand-color)] group-hover:text-[var(--brand-color)]
                cursor-help transition-colors
            `}>
                <span className="font-serif italic font-bold">i</span>
            </div>

            {/* Tooltip Bubble */}
            <div className="
                absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 
                hidden group-hover:block 
                w-64 p-2 
                bg-gray-800 text-white text-xs rounded shadow-lg
                pointer-events-none animate-in fade-in zoom-in-95 duration-200
            ">
                {text}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
        </div>
    );
}
