export default function KpiCard({ label, value, sub }: { label: string, value: string, sub: string }) {
    return (
        <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-700 transition-colors duration-300 border border-gray-100 dark:border-slate-600">
            <div className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</div>
            <div className="font-mono text-2xl font-bold text-energy-green">{value}</div>
            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {sub}
            </div>
        </div>
    );
}
