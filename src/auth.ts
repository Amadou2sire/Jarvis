import fs from 'fs';
import { cert, ServiceAccount } from 'firebase-admin/app';
import { google } from 'googleapis';
import { config } from './config.js';

/**
 * Lit les credentials Firebase/Google depuis la variable d'environnement (Vercel)
 * ou à défaut, depuis le fichier local service-account.json.
 */
export function getGoogleCredentialsData(): ServiceAccount | any {
    if (config.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            return JSON.parse(config.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch (e) {
            console.error("Erreur parsing FIREBASE_SERVICE_ACCOUNT_JSON:", e);
            throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON est invalide.");
        }
    } else if (fs.existsSync(config.GOOGLE_APPLICATION_CREDENTIALS)) {
        return JSON.parse(fs.readFileSync(config.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'));
    } else {
        throw new Error("No Google Credentials found. Please set FIREBASE_SERVICE_ACCOUNT_JSON or provide service-account.json");
    }
}

/**
 * Helper for Firebase Admin cert()
 */
export function getFirebaseAdminCert() {
    return cert(getGoogleCredentialsData());
}

/**
 * Helper for Googleapis Auth (Drive, Sheets)
 */
export function getGoogleAuth(scopes: string[]) {
    return new google.auth.GoogleAuth({
        credentials: getGoogleCredentialsData(),
        scopes: scopes
    });
}
