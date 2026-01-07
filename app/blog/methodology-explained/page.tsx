import ArticleComingSoon from '@/components/ArticleComingSoon';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'The Eighty760 Methodology: How We Model Hourly Carbon | Eighty760',
    description: 'A transparent look at our data sources, modeling approach, and validation process for hourly carbon accounting.',
};

export default function Page() {
    return <ArticleComingSoon
        title="The Eighty760 Methodology: How We Model Hourly Carbon"
        description="A transparent look at our data sources, modeling approach, and validation process for hourly carbon accounting."
    />;
}
