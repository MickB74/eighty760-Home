'use client';

import React, { useState, useRef } from 'react';

interface InfoTooltipProps {
    text: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function InfoTooltip({ text, size = 'sm', className = '' }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const sizeClasses = {
        sm: 'w-4 h-4 text-xs',
        md: 'w-5 h-5 text-sm',
        lg: 'w-6 h-6 text-base'
    };

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top - 8, // 8px spacing above
                left: rect.left + rect.width / 2
            });
            setIsVisible(true);
        }
    };

    return (
        <>
            <div
                ref={triggerRef}
                className={`inline-flex items-center justify-center rounded-full border border-gray-400 dark:border-slate-500 text-gray-400 dark:text-slate-500 hover:border-brand dark:hover:border-brand-light hover:text-brand dark:hover:text-brand-light cursor-help transition-colors ${sizeClasses[size]} ${className}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsVisible(false)}
            >
                <span className="font-serif italic font-bold">i</span>
            </div>

            {isVisible && text && (
                <div
                    className="fixed z-[9999] px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{ top: position.top, left: position.left }}
                >
                    {text}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            )}
        </>
    );
}
