import { listFiles, getFileContent } from '../drive.js';
import { saveMenu } from '../restaurant.js';
import { config } from '../config.js';

export const scanMenuToolDefinition = {
    type: "function",
    function: {
        name: "scan_menu_from_drive",
        description: "Scanne les documents d'un dossier Google Drive pour extraire et enregistrer le menu du jour ou de la semaine.",
        parameters: {
            type: "object",
            properties: {
                folderId: {
                    type: "string",
                    description: "L'ID du dossier Google Drive. Si non fourni, utilise le dossier par défaut."
                }
            }
        }
    }
};

export async function scanMenuFromDrive(folderId?: string) {
    try {
        const targetFolderId = folderId && folderId !== "votre_id_de_dossier_google_drive" 
            ? folderId 
            : config.MENU_FOLDER_ID;

        if (!targetFolderId) {
            return "Erreur : Aucun ID de dossier n'est configuré ou fourni.";
        }

        const files = await listFiles(targetFolderId);
        if (files.length === 0) {
            return "Aucun fichier trouvé dans ce dossier.";
        }

        // Sort by id or name to get the latest (heuristic)
        const latestFile = files[0]; 
        const content = await getFileContent(latestFile.id!, latestFile.mimeType!);

        if (!content) {
            return `Impossible de lire le contenu du fichier: ${latestFile.name}`;
        }

        // Save to database
        await saveMenu({
            date: new Date().toISOString(),
            content: content,
            sourceFileId: latestFile.id!,
            type: content.toLowerCase().includes('semaine') ? 'week' : 'day'
        });

        return `Menu scanné et enregistré avec succès à partir du fichier "${latestFile.name}".\n\nContenu :\n${content.substring(0, 500)}...`;
    } catch (error: any) {
        return `Erreur lors du scan du menu : ${error.message}`;
    }
}
