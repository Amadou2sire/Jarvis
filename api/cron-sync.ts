import { scanMenuFromDrive } from '../src/tools/scan_menu.js';
import { config } from '../src/config.js';

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Protection Vercel Cron (Optionnel mais recommandé)
    // const authHeader = req.headers.authorization;
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return res.status(401).json({ error: 'Unauthorized' }); }

    try {
        console.log('[Sync] Starting scheduled menu sync (Vercel Cron)...');
        if (config.MENU_FOLDER_ID) {
            const result = await scanMenuFromDrive(config.MENU_FOLDER_ID);
            console.log(`[Sync] Result: ${result}`);
            return res.status(200).json({ success: true, result });
        } else {
            console.warn('[Sync] No MENU_FOLDER_ID configured.');
            return res.status(200).json({ success: false, reason: "No folder ID configured" });
        }
    } catch (e: any) {
        console.error("[Sync Error]:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
}
