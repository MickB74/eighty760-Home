'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

interface FileUploadProps {
    onFileLoaded: (data: any[]) => void;
    accept?: string;
    label?: string;
    description?: string;
    maxFileSizeMB?: number;
}

export default function FileUpload({
    onFileLoaded,
    accept = '.csv',
    label = 'Upload CSV',
    description = 'Upload a CSV file with hourly data',
    maxFileSizeMB = 10
}: FileUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setError(`File size exceeds ${maxFileSizeMB}MB limit`);
            return;
        }

        setLoading(true);
        setError(null);
        setFileName(file.name);

        try {
            // Use PapaParse for robust CSV parsing
            Papa.parse(file, {
                header: true,
                dynamicTyping: true, // Automatically convert numbers
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        const errorMsg = results.errors[0].message;
                        setError(`CSV parsing error: ${errorMsg}`);
                        setLoading(false);
                        return;
                    }

                    if (!results.data || results.data.length === 0) {
                        setError('CSV file is empty or has no data rows');
                        setLoading(false);
                        return;
                    }

                    onFileLoaded(results.data);
                    setLoading(false);
                },
                error: (error) => {
                    setError(`Failed to parse file: ${error.message}`);
                    setLoading(false);
                }
            });
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
