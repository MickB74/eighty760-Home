export default function ControlInput({
    label,
    value,
    setValue,
    max,
    step = 1,
    unit
}: {
    label: string,
    value: number,
    setValue: (v: number) => void,
    max: number,
    step?: number,
    unit: string
}) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {label}
                </label>
                <span className="text-sm font-mono px-2 py-1 rounded text-energy-green bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                    {value} {unit}
                </span>
            </div>
            <input
                type="range"
                min="0"
                max={max}
                step={step}
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value))}
                className="w-full accent-energy-green"
            />
        </div>
    );
}
