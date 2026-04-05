import { bot } from './bot.js';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { webhookCallback } from 'grammy';
import express from 'express';
import { scanMenuFromDrive } from './tools/scan_menu.js';
import { config } from './config.js';

// ─── Cloud Functions Setup ──────────────────────────────────────────────────

const JARVIS_SECRETS = [
    'TELEGRAM_BOT_TOKEN',
    'GROQ_API_KEY',
    'OPENROUTER_API_KEY',
    'ELEVENLABS_API_KEY',
    'SPEECHIFY_API_KEY',
    'OPENWEATHERMAP_API_KEY',
    'TAVILY_API_KEY',
    'SERPAPI_API_KEY'
];

export const jarvis = onRequest({ secrets: JARVIS_SECRETS }, (req, res) => {
    const server = express();
    server.use(express.json());
    server.post('/telegram', webhookCallback(bot, 'express'));
    return server(req, res);
});

// Scheduled task: Sync menu from Drive every hour
export const syncMenu = onSchedule({
    schedule: 'every 1 hours',
    secrets: JARVIS_SECRETS
}, async (event) => {
    console.log('[Sync] Starting scheduled menu sync...');
    if (config.MENU_FOLDER_ID) {
        const result = await scanMenuFromDrive(config.MENU_FOLDER_ID);
        console.log(`[Sync] Result: ${result}`);
    } else {
        console.warn('[Sync] No MENU_FOLDER_ID configured.');
    }
});

// ─── Support pour le développement local (Long Polling) ─────────────────────

// On ne lance le bot en mode long polling que si on n'est pas dans l'environnement Firebase
// et qu'on n'est pas en production.
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_CONFIG) {
    console.log("[Bot] Démarrage en mode développement (Long Polling)...");
    
    bot.start({
        onStart: (botInfo) => {
            console.log(`[Bot] Agent démarré sous @${botInfo.username}`);
        },
        drop_pending_updates: true // Évite de traiter les vieux messages accumulés
    }).catch(err => {
        console.error("[Bot] Erreur lors du démarrage du Long Polling:", err);
    });
}
