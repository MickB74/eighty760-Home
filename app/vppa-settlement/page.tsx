import VPPAClient from './VPPAClient';

export const metadata = {
    title: 'VPPA Settlement Calculator | EightySevenSixty',
    description: 'Compare Virtual Power Purchase Agreement scenarios in ERCOT markets',
};

export default function VPPASettlementPage() {
    return <VPPAClient />;
}
