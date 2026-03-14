import dotenv from 'dotenv';
dotenv.config();

export const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
    TELEGRAM_ALLOWED_USER_IDS: (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(','),
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openrouter/free',
    DB_PATH: process.env.DB_PATH || './memory.db',
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
    SPEECHIFY_API_KEY: process.env.SPEECHIFY_API_KEY || '',
    OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY || '',
    TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY || '',
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
};

if (!config.TELEGRAM_BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN");
if (!config.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
