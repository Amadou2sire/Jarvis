import { Bot, InputFile } from 'grammy';
import { config } from './config.js';
import { processUserMessage } from './agent.js';
import { clearHistory, getFullHistory, getConversationStats, updateUserProfile } from './memory.js';
import { textToSpeech } from './voice.js';
import { speechToText } from './stt.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// ─── Helper to download files ────────────────────────────────────────────────

async function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

// ─── Auth Middleware ───────────────────────────────────────────────────────────

bot.use(async (ctx, next) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    if (!config.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
        console.log(`[Bot] Unauthorized access attempt from userId: ${userId}`);
        return;
    }

    await updateUserProfile(userId, {
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
    }).catch(err => console.error('[Bot] Failed to update user profile:', err));

    await next();
});

// ─── Commands ─────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || 'Monsieur';
    await ctx.reply(
        `🤖 *Bonjour ${firstName} !* Je suis *Jarvis*, ton agent personnel IA.\n\n` +
        `🎤 Tu peux me parler par texte ou m'envoyer des *messages vocaux* !\n\n` +
        `📋 *Commandes disponibles :*\n` +
        `/start — Message d'accueil\n` +
        `/history — Voir les derniers messages\n` +
        `/stats — Statistiques de la conversation\n` +
        `/clear — Effacer la mémoire\n\n` +
        `Comment puis-je t'aider aujourd'hui ?`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('clear', async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (userId) {
        await ctx.replyWithChatAction('typing');
        await clearHistory(userId);
        await ctx.reply('🗑️ Mémoire effacée ! Je repars sur une page blanche.');
    }
});

bot.command('history', async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    await ctx.replyWithChatAction('typing');

    const messages = await getFullHistory(userId, 20);
    if (messages.length === 0) {
        await ctx.reply("📭 Aucun historique trouvé. Commençons à discuter !");
        return;
    }

    const lines: string[] = [`📜 *Derniers messages*\n`];
    for (const msg of messages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
            const icon = msg.role === 'user' ? '👤' : '🤖';
            const shortContent = msg.content.length > 120
                ? msg.content.substring(0, 120) + '…'
                : msg.content;
            const time = msg.timestamp.toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
            });
            lines.push(`${icon} _(${time})_ ${shortContent}`);
        }
    }

    const fullText = lines.join('\n');
    await ctx.reply(fullText.substring(0, 4000), { parse_mode: 'Markdown' });
});

bot.command('stats', async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    await ctx.replyWithChatAction('typing');

    const stats = await getConversationStats(userId);
    if (!stats) {
        await ctx.reply("📊 Aucune statistique disponible.");
        return;
    }

    await ctx.reply(
        `📊 *Statistiques de ta conversation*\n\n` +
        `💬 Messages : *${stats.totalMessages}*\n` +
        `📅 Début : *${stats.firstMessage?.toLocaleDateString('fr-FR')}*\n` +
        `🕐 Dernier : *${stats.lastMessage?.toLocaleDateString('fr-FR')}*`,
        { parse_mode: 'Markdown' }
    );
});

// ─── Text Messages ────────────────────────────────────────────────────────────

bot.on('message:text', async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;
    const text = ctx.message.text;

    await ctx.replyWithChatAction('typing');

    try {
        const responseText = await processUserMessage(userId, text);
        const audioPath = await textToSpeech(responseText);
        if (audioPath) {
            await ctx.replyWithChatAction('upload_voice');
            await ctx.replyWithVoice(new InputFile(audioPath));
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        }
    } catch (e: any) {
        console.error('[Bot] Error processing message:', e);
        await ctx.reply('⚠️ Erreur lors du traitement du message.');
    }
});

// ─── Voice Messages ────────────────────────────────────────────────────────────

bot.on('message:voice', async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    await ctx.replyWithChatAction('typing');

    try {
        // 1. Get file URL from Telegram
        const file = await ctx.getFile();
        const fileUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
        
        // 2. Download to temp
        const tempPath = path.join(os.tmpdir(), `jarvis_${Date.now()}.ogg`);
        await downloadFile(fileUrl, tempPath);

        // 3. Transcribe
        const text = await speechToText(tempPath);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        if (!text || text.trim().length < 2) {
            await ctx.reply("💬 Je n'ai pas bien saisi votre message vocal.");
            return;
        }

        // 4. Process
        const responseText = await processUserMessage(userId, text);

        // 5. Response as Voice
        const audioPath = await textToSpeech(responseText);
        if (audioPath) {
            await ctx.replyWithChatAction('upload_voice');
            await ctx.replyWithVoice(new InputFile(audioPath));
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        }
    } catch (e: any) {
        console.error('[Bot] Voice error:', e);
        await ctx.reply('⚠️ Impossible de comprendre le message vocal.');
    }
});
