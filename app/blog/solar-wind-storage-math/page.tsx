import ArticleComingSoon from '@/components/ArticleComingSoon';
import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'Solar + Wind + Storage: The Math Behind 24/7 CFE | Eighty760',
    description: 'How complementary generation sources and battery storage create balanced 24/7 carbon-free energy portfolios.',
};

export default function Page() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
            <Navigation />
            <ArticleComingSoon
                title="Solar + Wind + Storage: The Math Behind a Balanced Portfolio"
                description="How complementary generation sources and battery storage create 24/7 carbon-free energy portfolios."
            />
        </main>
    );
}
