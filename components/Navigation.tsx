'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Navigation() {
    const [darkMode, setDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Load saved theme - but default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setDarkMode(savedTheme === 'dark');
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');

        // Handle scroll for backdrop blur effect
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
        { name: 'Methodology', path: '/whitepaper' },
    ];

    return (
        <motion.nav
            className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
                    ? 'backdrop-blur-md bg-navy-950/80 border-b border-white/10 shadow-lg'
                    : 'bg-transparent border-b border-transparent'
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex flex-row items-center gap-4">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/image.png"
                                alt="Eighty760 Logo"
                                width={240}
                                height={120}
                                className="w-auto object-contain h-[80px] md:h-[100px]"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`font-medium transition duration-200 ${isActive(link.path)
                                        ? 'text-energy-green'
                                        : 'text-slate-300 hover:text-energy-green'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* High-contrast CTA */}
                        <a
                            href="mailto:contact@eighty760.com"
                            className="px-6 py-2 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition-all hover:scale-105"
                        >
                            Request Demo
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-slate-300 hover:text-energy-green focus:outline-none p-2"
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

            {/* Mobile Navigation Menu with Glassmorphism */}
            {isMobileMenuOpen && (
                <motion.div
                    className="md:hidden bg-navy-950/95 backdrop-blur-lg border-t border-white/10 absolute w-full left-0 z-40 shadow-xl"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`block px-4 py-3 rounded-lg text-base font-medium transition duration-200 ${isActive(link.path)
                                        ? 'bg-energy-green/10 text-energy-green border border-energy-green/20'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-energy-green'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <a
                            href="mailto:contact@eighty760.com"
                            className="block px-4 py-3 mt-4 bg-energy-green text-navy-950 font-bold rounded-lg text-center hover:bg-energy-green/90 transition"
                        >
                            Request Demo
                        </a>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
}
