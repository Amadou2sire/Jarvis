import fs from 'fs';
import { Groq } from 'groq-sdk';
import { config } from './config.js';

const groq = new Groq({
    apiKey: config.GROQ_API_KEY,
});

/**
 * Transcribes an audio file into text using Groq's Whisper model.
 * Supports mp3, mp4, mpeg, mpga, m4a, wav, and webm.
 */
export async function speechToText(audioPath: string): Promise<string> {
    try {
        if (!fs.existsSync(audioPath)) {
            throw new Error(`Audio file not found at: ${audioPath}`);
        }

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: 'whisper-large-v3-turbo', // Très rapide et précis
            response_format: 'text',
            language: 'fr', // On force en français pour une meilleure précision
        });

        const text = transcription as unknown as string;
        console.log(`[STT] Transcription complete: "${text.substring(0, 50)}..."`);
        return text;
    } catch (error) {
        console.error('[STT] Error during transcription:', error);
        throw new Error('Je n\'ai pas réussi à comprendre votre message vocal.');
    }
}
