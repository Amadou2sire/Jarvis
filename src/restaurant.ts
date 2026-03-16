import { Timestamp } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export interface Menu {
    id?: string;
    date: string; // ISO string for the day or week start
    content: string; // The scanned text or structured menu
    sourceFileId: string;
    type: 'day' | 'week';
}

export interface Order {
    id?: string;
    userId: string;
    items: string[];
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'delivered';
    createdAt: Timestamp;
}

export async function saveMenu(menu: Menu) {
    const menusRef = db.collection('menus');
    
    // Check if duplicate
    const existing = await menusRef.where('sourceFileId', '==', menu.sourceFileId).get();
    if (!existing.empty) {
        console.log(`[Restaurant] Menu for file ${menu.sourceFileId} already exists. Skipping.`);
        return;
    }

    await menusRef.add({
        ...menu,
        createdAt: Timestamp.now()
    });
    console.log(`[Restaurant] New menu saved from file ${menu.sourceFileId}`);
}

export async function getLatestMenu(): Promise<Menu | null> {
    const menusRef = db.collection('menus');
    const snapshot = await menusRef.orderBy('createdAt', 'desc').limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Menu;
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>) {
    const ordersRef = db.collection('orders');
    const docRef = await ordersRef.add({
        ...order,
        createdAt: Timestamp.now()
    });
    return docRef.id;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}
