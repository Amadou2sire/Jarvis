import { createOrder, getUserOrders, getLatestMenu } from '../restaurant.js';

export const restaurantToolsDefinitions = [
    {
        type: "function",
        function: {
            name: "get_menu",
            description: "Récupère le dernier menu enregistré (du jour ou de la semaine).",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "place_order",
            description: "Passe une commande pour l'utilisateur.",
            parameters: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: { type: "string" },
                        description: "Liste des plats commandés."
                    },
                    totalPrice: {
                        type: "number",
                        description: "Prix total estimé."
                    }
                },
                required: ["items"]
            }
        }
    }
];

export async function getMenu() {
    const menu = await getLatestMenu();
    if (!menu) return "Aucun menu n'est disponible pour le moment.";
    return `Menu (${menu.type === 'week' ? 'Semaine' : 'Jour'}) :\n\n${menu.content}`;
}

export async function placeOrder(userId: string, items: string[], totalPrice: number = 0) {
    try {
        const orderId = await createOrder({
            userId,
            items,
            totalPrice,
            status: 'pending'
        });
        return `Commande passée avec succès ! (ID: ${orderId}). Vos plats : ${items.join(', ')}.`;
    } catch (error: any) {
        return `Erreur lors de la commande : ${error.message}`;
    }
}
