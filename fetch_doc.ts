import { google } from 'googleapis';
import { config } from './src/config.js';

const auth = new google.auth.GoogleAuth({
    keyFile: config.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

async function main() {
    try {
        const fileId = "1wyUdWUfsyEzTKsbr92NZ3Wud06mUVF7KHNA5xxp0ank";
        const gid = "470775055"; // La feuille 2 indiquée par l'utilisateur
        
        const client = await auth.getClient();
        
        const url = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv&gid=${gid}`;
        console.log("Fetching: " + url);
        
        const res = await client.request({
            url,
            method: 'GET',
            responseType: 'text'
        });
        
        console.log("\n=== CONTENU DE LA FEUILLE 2 ===");
        console.log(res.data);
        console.log("===============================\n");
        
    } catch (e) {
        console.error("Erreur lors de la récupération :", e);
    }
}
main();
