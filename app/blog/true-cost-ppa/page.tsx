import ArticleComingSoon from '@/components/ArticleComingSoon';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'How to Calculate the True Cost of a PPA | Eighty760',
    description: 'Beyond the strike price: understanding basis risk, settlement value, and REC revenue in power purchase agreements.',
};

export default function Page() {
    return <ArticleComingSoon
        title="How to Calculate the True Cost of a PPA"
        description="Beyond the strike price: understanding basis risk, settlement value, and REC revenue in power purchase agreements."
    />;
}
