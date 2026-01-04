// Export utility functions for CSV and JSON

export interface ExportConfig {
    filename: string;
    data: any;
    type: 'csv' | 'json';
}

/**
 * Convert object array to CSV
 */
export function arrayToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            // Escape commas and quotes
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Convert hourly data to CSV
 */
export function hourlyDataToCSV(data: Record<string, number[]>, year: number = 2024): string {
    const hours = data[Object.keys(data)[0]].length;
    const rows: any[] = [];

    // Generate datetime index
    const startDate = new Date(year, 0, 1, 0, 0, 0);

    for (let h = 0; h < hours; h++) {
        const timestamp = new Date(startDate.getTime() + h * 3600000);
        const row: any = {
            Datetime: timestamp.toISOString(),
            Hour: h
        };

        // Add all data columns
        for (const [key, values] of Object.entries(data)) {
            row[key] = values[h].toFixed(2);
        }

        rows.push(row);
    }

    return arrayToCSV(rows);
}

/**
 * Export data as downloadable file
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export CSV
 */
export function exportCSV(filename: string, data: any[] | Record<string, number[]>, isHourly: boolean = false) {
    let csv: string;

    if (isHourly) {
        csv = hourlyDataToCSV(data as Record<string, number[]>);
    } else {
        csv = arrayToCSV(data as any[]);
    }

    downloadFile(filename, csv, 'text/csv');
}

/**
 * Export JSON
 */
export function exportJSON(filename: string, data: any) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(filename, json, 'application/json');
}

/**
 * Parse uploaded CSV file
 */
export async function parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(l => l.trim());

            if (lines.length < 2) {
                reject(new Error('CSV file is empty or invalid'));
                return;
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
                    // Try to parse as number
                    const num = parseFloat(val);
                    row[headers[j]] = isNaN(num) ? val : num;
                }

                data.push(row);
            }

            resolve(data);
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
