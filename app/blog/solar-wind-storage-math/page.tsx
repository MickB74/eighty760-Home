import ArticleComingSoon from '@/components/ArticleComingSoon';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Solar + Wind + Storage: The Math Behind a Balanced Portfolio | Eighty760',
    description: 'How complementary generation sources and battery storage create 24/7 carbon-free energy portfolios.',
};

export default function Page() {
    return <ArticleComingSoon
        title="Solar + Wind + Storage: The Math Behind a Balanced Portfolio"
        description="How complementary generation sources and battery storage create 24/7 carbon-free energy portfolios."
    />;
}
