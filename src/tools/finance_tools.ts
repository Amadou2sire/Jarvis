import { google } from 'googleapis';
import { config } from '../config.js';
import { getGoogleAuth } from '../auth.js';

const auth = getGoogleAuth(['https://www.googleapis.com/auth/spreadsheets']);

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_NAME = 'Feuille 2'; 

export const financeToolsDefinitions = [
    {
        type: "function",
        function: {
            name: "get_financial_status",
            description: "Obtient le budget, les dépenses et le solde restant pour un mois donné depuis le Google Sheet de salaire.",
            parameters: {
                type: "object",
                properties: {
                    month: {
                        type: "string",
                        description: "Le mois à consulter, ex: 'Avril', 'mai', 'juin'."
                    }
                },
                required: ["month"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_financial_expense",
            description: "Ajoute une dépense à une certaine catégorie pour un mois donné dans le Google Sheet.",
            parameters: {
                type: "object",
                properties: {
                    month: {
                        type: "string",
                        description: "Le mois concerné, ex: 'Avril'."
                    },
                    category: {
                        type: "string",
                        description: "La catégorie de dépense, ex: 'Habillement', 'Nourriture', ou une nouvelle catégorie appropriée (ex: 'Technologie')."
                    },
                    amount: {
                        type: "number",
                        description: "Le montant à ajouter."
                    }
                },
                required: ["month", "category", "amount"]
            }
        }
    }
];

export async function getFinancialStatus(month: string): Promise<string> {
    try {
        const spreadsheetId = config.SALARY_DOC_ID;
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${SHEET_NAME}'!A:Z`,
        });
        
        const rows = res.data.values;
        if (!rows || rows.length === 0) return "Le tableau est vide.";
        
        const headers = rows[0];
        const monthFilter = month.toLowerCase();
        
        let targetRow = null;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] && rows[i][0].toLowerCase() === monthFilter) {
                targetRow = rows[i];
                break;
            }
        }
        
        if (!targetRow) return `Aucune donnée trouvée pour le mois de ${month}.`;
        
        let salary = 0;
        let expenses = 0;
        let details = "";
        
        for (let j = 1; j < headers.length; j++) {
            const val = parseFloat(targetRow[j] && targetRow[j].replace(',', '.') || '0');
            const cat = headers[j];
            if (cat.toLowerCase() === 'salaire') {
                salary = val;
            } else if (cat !== '') {
                if (!isNaN(val)) {
                    expenses += val;
                    if (val > 0) details += `- ${cat}: ${val} dinars\n`;
                }
            }
        }
        
        const rest = salary - expenses;
        
        // Contexte journalier pour le LLM
        let adviceContext = "";
        const now = new Date();
        const currentMonthName = now.toLocaleString('fr-FR', { month: 'long' });
        
        if (monthFilter === currentMonthName.toLowerCase()) {
            const currentYear = now.getFullYear();
            const currentMonthIndex = now.getMonth();
            const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
            const currentDay = now.getDate();
            const daysRemaining = daysInMonth - currentDay;
            
            if (daysRemaining > 0) {
                const budgetPerDay = (rest / daysRemaining).toFixed(2);
                adviceContext = `\n\n📌 [NOTE POUR JARVIS] : Nous sommes aujourd'hui le ${currentDay} ${month}, il reste donc ${daysRemaining} jours avant la fin du mois. Le budget journalier restant est de ${budgetPerDay} dinars. Utilise absolument cette information pour prévenir l'utilisateur si la dépense risque de causer une fin de mois difficile !`;
            } else {
                adviceContext = `\n\n📌 [NOTE POUR JARVIS] : C'est le dernier jour du mois !`;
            }
        }

        return `Bilan financier pour ${month}:\n- Salaire: ${salary} dinars\n- Dépenses totales: ${expenses} dinars\n${details}- Reste à vivre immédiat: ${rest} dinars${adviceContext}`;
        
    } catch (error: any) {
        console.error("Sheet read error: ", error.message);
        return "Erreur lors de l'accès au Google Sheet. Attention, dis à l'utilisateur qu'il doit absolument activer l'API Google Sheets en cliquant sur le lien fourni précédemment sinon je ne peux pas lire/écrire !";
    }
}

export async function addFinancialExpense(month: string, category: string, amount: number): Promise<string> {
    try {
        const spreadsheetId = config.SALARY_DOC_ID;
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${SHEET_NAME}'!A:Z`,
        });
        
        const rows = res.data.values;
        if (!rows || rows.length === 0) return "Le tableau est vide.";
        
        const headers = rows[0] as string[];
        const monthFilter = month.toLowerCase();
        
        let rowIndex = -1;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] && rows[i][0].toLowerCase() === monthFilter) {
                rowIndex = i;
                break;
            }
        }
        
        if (rowIndex === -1) return `Mois ${month} introuvable.`;
        
        let colIndex = -1;
        for (let j = 1; j < headers.length; j++) {
            if (headers[j] && headers[j].toLowerCase() === category.toLowerCase()) {
                colIndex = j;
                break;
            }
        }
        
        if (colIndex === -1) {
            colIndex = headers.length; 
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${SHEET_NAME}'!${getColumnLetter(colIndex)}1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[category]] }
            });
        }
        
        const row = rows[rowIndex];
        const currentVal = parseFloat(row[colIndex] && row[colIndex].replace(',', '.') || '0');
        const newVal = currentVal + amount;
        
        await sheets.spreadsheets.values.update({
             spreadsheetId,
             range: `'${SHEET_NAME}'!${getColumnLetter(colIndex)}${rowIndex + 1}`,
             valueInputOption: 'USER_ENTERED',
             requestBody: { values: [[newVal]] }
        });
        
        return `Ok ! La dépense de ${amount} dinars a été ajoutée avec succès à la catégorie '${category}' pour le mois de ${month}. Le nouveau total pour cette catégorie est ${newVal} dinars.`;
    } catch (error: any) {
        console.error("Sheet write error: ", error.message);
        return "Erreur d'écriture dans le fichier Google Sheet. L'utilisateur DOIT activer l'API Google Sheets avec son compte Google Cloud sur le lien que je lui ai donné pour que j'y sois autorisé !";
    }
}

function getColumnLetter(colIndex: number): string {
    let letter = '';
    while (colIndex >= 0) {
        letter = String.fromCharCode((colIndex % 26) + 65) + letter;
        colIndex = Math.floor(colIndex / 26) - 1;
    }
    return letter;
}
