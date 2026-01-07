'use client';

import React, { useState, useRef } from 'react';

interface FileUploadProps {
    onFileLoaded: (data: any[]) => void;
    accept?: string;
    label?: string;
    description?: string;
}

export default function FileUpload({
    onFileLoaded,
    accept = '.csv',
    label = 'Upload CSV',
    description = 'Upload a CSV file with hourly data'
}: FileUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setFileName(file.name);

        try {
            const reader = new FileReader();

            reader.onload = (event) => {
                const text = event.target?.result as string;
                const lines = text.split('\n').filter(l => l.trim());

                if (lines.length < 2) {
                    throw new Error('CSV file is empty or has no data rows');
                }

                // Parse header
                const headers = lines[0].split(',').map(h => h.trim());

                // Parse data
                const data: any[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',');
                    const row: any = {};

                    for (let j = 0; j < headers.length; j++) {
                        const val = values[j]?.trim();
                        const num = parseFloat(val);
                        row[headers[j]] = isNaN(num) ? val : num;
                    }

                    data.push(row);
                }

                onFileLoaded(data);
                setLoading(false);
            };

            reader.onerror = () => {
                setError('Failed to read file');
                setLoading(false);
            };

            reader.readAsText(file);
        } catch (err: any) {
            setError(err.message || 'Failed to parse file');
            setLoading(false);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />

            <button
                onClick={handleButtonClick}
                disabled={loading}
                className="w-full px-4 py-2 bg-[#285477] text-navy-950 rounded-md hover:bg-[#1d3f5a] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Processing...
                    </>
                ) : (
                    <>
                        📤 {label}
                    </>
                )}
            </button>

            {fileName && !error && (
                <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ Loaded: {fileName}
                </div>
            )}

            {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                    ⚠️ {error}
                </div>
            )}

            {description && !error && !fileName && (
                <p className="text-xs text-[var(--text-secondary)]">{description}</p>
            )}
        </div>
    );
}
