'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
    const [darkMode, setDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        setDarkMode(savedTheme === 'dark');
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        const newTheme = newMode ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newMode);
    };

    const isActive = (path: string) => pathname === path;

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'ERCOT Aggregation', path: '/aggregation' },
        { name: 'Analysis', path: '/analysis' },
        { name: 'Methodology', path: '/whitepaper' },
    ];

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-3">
                    <div className="flex flex-row items-center gap-4">
                        <Link href="/" className="flex items-center">
                            <Image src="/image.png" alt="Eighty760 Logo" width={240} height={120} className="w-auto object-contain h-[40px] md:h-[60px]" priority />
                        </Link>

                        {/* Dark Mode Toggle - Visible on all screens, but improved layout */}
                        <label className="theme-switch flex items-center gap-2 cursor-pointer ml-2">
                            <input
                                type="checkbox"
                                checked={darkMode}
                                onChange={toggleTheme}
                                className="sr-only"
                            />
                            <div className="w-10 h-5 bg-gray-300 dark:bg-slate-600 rounded-full relative transition-colors duration-200">
                                <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${darkMode ? 'translate-x-5' : ''}`}></div>
                            </div>
                            <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                                {darkMode ? 'Dark' : 'Light'}
                            </span>
                        </label>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`font-medium transition duration-200 ${isActive(link.path)
                                    ? 'text-brand dark:text-brand-light'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-600 dark:text-gray-300 hover:text-brand dark:hover:text-brand-light focus:outline-none p-2"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 absolute w-full left-0 z-40 shadow-lg">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`block px-3 py-3 rounded-md text-base font-medium transition duration-200 ${isActive(link.path)
                                    ? 'bg-blue-50 dark:bg-slate-800 text-brand dark:text-brand-light'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-brand dark:hover:text-brand-light'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}

