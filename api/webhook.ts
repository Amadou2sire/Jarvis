import { bot } from '../src/bot.js';
import { webhookCallback } from 'grammy';

export default function handler(req: any, res: any) {
  return webhookCallback(bot, 'http')(req, res);
}
