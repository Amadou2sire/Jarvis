import { google } from 'googleapis';
import { config } from './config.js';
import fs from 'fs';

const auth = new google.auth.GoogleAuth({
    keyFile: config.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

export async function listFiles(folderId: string) {
    try {
        console.log(`[Drive] Listing files in folder: ${folderId}`);
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            pageSize: 10
        });
        console.log(`[Drive] Found ${response.data.files?.length || 0} files.`);
        return response.data.files || [];
    } catch (error) {
        console.error('Error listing files from Drive:', error);
        throw error;
    }
}

export async function getFileContent(fileId: string, mimeType: string): Promise<string> {
    try {
        if (mimeType === 'application/vnd.google-apps.document') {
            // Export Google Doc as text
            const res = await drive.files.export({
                fileId: fileId,
                mimeType: 'text/plain',
            });
            return res.data as string;
        } else {
            // Download other files (assuming they are text-based or can be handled)
            // For images/PDFs we might need OCR, which we'll handle separately
            const res = await drive.files.get({
                fileId: fileId,
                alt: 'media',
            }, { responseType: 'text' });
            return res.data as string;
        }
    } catch (error) {
        console.error(`Error getting content for file ${fileId}:`, error);
        return "";
    }
}
