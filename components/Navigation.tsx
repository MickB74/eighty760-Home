'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navigation() {
    const { data: session } = useSession();
    const [darkMode, setDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        setIsProfileOpen(false);
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
        { name: 'Home', path: '/', section: null },
        // Tools Section
        // Tools Section
        { name: '24/7 CFE Calculator', path: '/aggregation', section: 'tools' },

        // Learn Section
        { name: 'Resources', path: '/blog', section: 'learn' },
        { name: 'Methodology', path: '/whitepaper', section: 'learn' },
        // Company Section
        { name: 'About', path: '/about', section: 'company' },
    ];

    return (
        <motion.nav
            className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
                ? 'backdrop-blur-md bg-white/80 dark:bg-navy-950/80 border-b border-slate-200/50 dark:border-white/10 shadow-lg supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-navy-950/60'
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
                                src="/logo.png"
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
                                    ? 'text-energy-green-dark dark:text-energy-green'
                                    : 'text-gray-700 dark:text-slate-300 hover:text-energy-green-dark dark:hover:text-energy-green'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                            aria-label="Toggle theme"
                        >
                            {darkMode ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {/* User Menu / Sign In */}
                        {session ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    {session.user?.image ? (
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-energy-green/50">
                                            <Image
                                                src={session.user.image}
                                                alt={session.user.name || 'User'}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-energy-green/20 flex items-center justify-center text-energy-green font-bold">
                                            {session.user?.name?.[0] || 'U'}
                                        </div>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-950 rounded-lg shadow-xl border border-gray-200 dark:border-white/10 py-1 overflow-hidden"
                                        >
                                            <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5">
                                                <p className="text-sm font-medium text-navy-950 dark:text-white truncate">{session.user?.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{session.user?.email}</p>
                                            </div>
                                            <button
                                                onClick={() => signOut()}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                            >
                                                Sign Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn('google')}
                                className="hidden md:block text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-energy-green-dark dark:hover:text-energy-green transition-colors"
                            >
                                Sign In
                            </button>
                        )}


                        {/* High-contrast CTA */}
                        <a
                            href="mailto:contact@eighty760.com"
                            className="px-6 py-2 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition-all hover:scale-105"
                        >
                            Request Demo
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        {/* Mobile User Icon (if logged in) */}
                        {session && (
                            <div className="w-8 h-8 rounded-full bg-energy-green/20 flex items-center justify-center text-energy-green font-bold">
                                {session.user?.image ? (
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-energy-green/50">
                                        <Image src={session.user.image} alt="User" fill className="object-cover" />
                                    </div>
                                ) : (
                                    session.user?.name?.[0] || 'U'
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-700 dark:text-slate-300 hover:text-energy-green focus:outline-none p-2"
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
                    className="md:hidden bg-white/95 dark:bg-navy-950/95 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 absolute w-full left-0 z-40 shadow-xl"
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
                                    ? 'bg-emerald-50 dark:bg-energy-green/10 text-energy-green-dark dark:text-energy-green border border-emerald-200 dark:border-energy-green/20'
                                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-energy-green-dark dark:hover:text-energy-green'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Mobile Auth Actions */}
                        {session ? (
                            <button
                                onClick={() => signOut()}
                                className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                Sign Out ({session.user?.name})
                            </button>
                        ) : (
                            <button
                                onClick={() => signIn('google')}
                                className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Sign In
                            </button>
                        )}

                        {/* Theme Toggle Mobile */}
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 transition-all"
                        >
                            {darkMode ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Light Mode
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                    Dark Mode
                                </>
                            )}
                        </button>

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
