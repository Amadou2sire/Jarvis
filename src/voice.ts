import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import * as googleTTS from 'google-tts-api';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechifyClient } from '@speechify/api';

// Check if credentials file exists
const hasGoogleCreds = fs.existsSync(config.GOOGLE_APPLICATION_CREDENTIALS);
const client = hasGoogleCreds ? new TextToSpeechClient() : null;

// Speechify Client
// Note: SDK uses 'token' instead of 'apiKey'
const speechify = config.SPEECHIFY_API_KEY ? new SpeechifyClient({ token: config.SPEECHIFY_API_KEY }) : null;

export async function textToSpeech(text: string): Promise<string | null> {
    // 1. Try Speechify (User priority)
    if (speechify) {
        try {
            console.log("Generating voice with Speechify (Raphaël)...");
            
            const response = await speechify.tts.audio.speech({
                input: text,
                voiceId: "raphael", 
                audioFormat: "mp3",
                model: "simba-multilingual"
            });

            if (response && (response.audioData || (response as any).audio_data)) {
                const tempFilePath = path.join(tmpdir(), `jarvis_speechify_${Date.now()}.mp3`);
                const data = response.audioData || (response as any).audio_data;
                
                // If it's a string, it's base64. If it's already a Buffer/Uint8Array, use it directly.
                const buffer = typeof data === 'string' ? Buffer.from(data, 'base64') : Buffer.from(data as any);
                
                fs.writeFileSync(tempFilePath, buffer);
                return tempFilePath;
            } else {
                console.warn('Speechify SDK returned no audio data, falling back...');
            }
        } catch (error: any) {
            console.error('Speechify SDK failed:', error.message);
        }
    }

    // 2. Try Google Cloud TTS (Premium quality)
    if (client) {
        try {
            console.log("Generating premium male voice with Google Cloud TTS...");
            const request = {
                input: { text: text },
                voice: { languageCode: 'fr-FR', name: 'fr-FR-Standard-B', ssmlGender: 'MALE' as const },
                audioConfig: { audioEncoding: 'MP3' as const },
            };

            const [response] = await client.synthesizeSpeech(request);
            if (response.audioContent) {
                const tempFilePath = path.join(tmpdir(), `jarvis_cloud_${Date.now()}.mp3`);
                fs.writeFileSync(tempFilePath, response.audioContent as Buffer);
                return tempFilePath;
            }
        } catch (error) {
            console.error('Google Cloud TTS error:', error);
        }
    }

    // 3. Fallback to ElevenLabs
    if (config.ELEVENLABS_API_KEY) {
        try {
            let voiceId = '4p5WXd3ZuWR9pPtRQuxC';
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': config.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                }),
            });

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const tempFilePath = path.join(tmpdir(), `jarvis_eleven_${Date.now()}.mp3`);
                fs.writeFileSync(tempFilePath, buffer);
                return tempFilePath;
            }
        } catch (error) {
            console.error('ElevenLabs fallback error:', error);
        }
    }

    // 4. Last Resort: Google Translate TTS
    try {
        console.log("Last resort: Google Translate TTS...");
        const url = googleTTS.getAudioUrl(text, {
            lang: 'fr',
            slow: false,
            host: 'https://translate.google.com',
        });
        
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const tempFilePath = path.join(tmpdir(), `jarvis_free_${Date.now()}.mp3`);
        fs.writeFileSync(tempFilePath, buffer);
        
        return tempFilePath;
    } catch (error) {
        console.error('All TTS methods failed:', error);
        return null;
    }
}
