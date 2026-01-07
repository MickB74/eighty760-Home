import ArticleComingSoon from '@/components/ArticleComingSoon';
import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'How to Calculate the True Cost of a PPA | Eighty760',
    description: 'Beyond the strike price: understanding basis risk, settlement value, and REC revenue in power purchase agreements.',
};

export default function Page() {
    return (
        <main className="min-h-screen bg-navy-950">
            <Navigation />
            <ArticleComingSoon
                title="How to Calculate the True Cost of a PPA"
                description="Beyond the strike price: understanding basis risk, settlement value, and REC revenue in power purchase agreements."
            />
        </main>
    );
}
