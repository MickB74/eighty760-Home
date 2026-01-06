'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
    const [darkMode, setDarkMode] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        setDarkMode(savedTheme === 'dark');
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }, []);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        const newTheme = newMode ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newMode);
    };

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-sm bg-opacity-90" style={{ backgroundColor: 'var(--nav-bg)', borderBottom: '1px solid var(--border-color)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-3">
                    <div className="flex flex-row items-center gap-4">
                        <Link href="/" className="flex items-center">
                            <Image src="/image.png" alt="Eighty760 Logo" width={240} height={120} className="w-auto object-contain" style={{ height: '120px' }} priority />
                        </Link>
                        <label className="theme-switch flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={darkMode}
                                onChange={toggleTheme}
                                className="sr-only"
                            />
                            <span className="slider round"></span>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Dark Mode
                            </span>
                        </label>
                    </div>

                    <div className="hidden sm:flex items-center space-x-8">
                        {[
                            { name: 'Home', path: '/' },
                            { name: 'Aggregation', path: '/aggregation' },
                            { name: 'Methodology', path: '/whitepaper' },
                        ].map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`font-medium transition hover:text-[var(--brand-color)]`}
                                style={{
                                    color: isActive(link.path) ? 'var(--brand-color)' : 'var(--text-secondary)'
                                }}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
