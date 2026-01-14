export default function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${color}`}></div> {label}
        </div>
    );
}
