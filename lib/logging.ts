import fs from 'fs';
import path from 'path';

/**
 * Logs a user sign-in to a CSV file in the project root.
 */
export async function logUserSignIn(user: any) {
    try {
        const logFile = path.join(process.cwd(), 'user_log.csv');
        const timestamp = new Date().toISOString();
        const line = `"${timestamp}","${user.name || ''}","${user.email || ''}","${user.id || ''}"\n`;

        // Check if file exists to add header
        if (!fs.existsSync(logFile)) {
            const header = '"Timestamp","Name","Email","User ID"\n';
            fs.writeFileSync(logFile, header);
        }

        fs.appendFileSync(logFile, line);
        console.log(`[UserLog] Logged sign-in for ${user.email}`);
    } catch (error) {
        console.error('[UserLog] Failed to log user sign-in:', error);
    }
}
