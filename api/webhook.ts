import { bot } from '../src/bot.js';
import { webhookCallback } from 'grammy';

export default async function handler(req: any, res: any) {
  try {
    return await webhookCallback(bot, 'http')(req, res);
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
