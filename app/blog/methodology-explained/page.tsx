import ArticleComingSoon from '@/components/ArticleComingSoon';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'The Eighty760 Methodology Explained | Hourly Carbon Modeling',
    description: 'A transparent look at our data sources, modeling approach, and validation process for hourly carbon accounting.',
};

export default function Page() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
            <Navigation />
            <ArticleComingSoon
                title="The Eighty760 Methodology: How We Model Hourly Carbon"
                description="A transparent look at our data sources, modeling approach, and validation process for hourly carbon accounting."
            />
        </main>
    );
}
