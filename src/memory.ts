import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { config } from './config.js';
import { readFileSync, existsSync } from 'fs';

// ─── Firebase Admin Initialization ────────────────────────────────────────────

function initFirebase() {
    if (getApps().length === 0) {
        if (!existsSync(config.GOOGLE_APPLICATION_CREDENTIALS)) {
            throw new Error(
                `Firebase service account not found at: ${config.GOOGLE_APPLICATION_CREDENTIALS}\n` +
                `Please download it from Firebase Console > Project Settings > Service Accounts.`
            );
        }
        const serviceAccount = JSON.parse(
            readFileSync(config.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8')
        );
        initializeApp({ credential: cert(serviceAccount) });
    }
    return getFirestore();
}

const db = initFirebase();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp?: Timestamp;
}

export interface UserProfile {
    userId: string;
    firstSeen: Timestamp;
    lastSeen: Timestamp;
    totalMessages: number;
    totalSessions: number;
    username?: string;
    firstName?: string;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

/**
 * Update or create the user profile metadata.
 */
export async function updateUserProfile(
    userId: string,
    info?: { username?: string; firstName?: string }
): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
        await userRef.set({
            userId,
            firstSeen: Timestamp.now(),
            lastSeen: Timestamp.now(),
            totalMessages: 0,
            totalSessions: 1,
            username: info?.username || null,
            firstName: info?.firstName || null,
        });
    } else {
        await userRef.update({
            lastSeen: Timestamp.now(),
            ...(info?.username && { username: info.username }),
            ...(info?.firstName && { firstName: info.firstName }),
        });
    }
}

/**
 * Get the user profile.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists ? (doc.data() as UserProfile) : null;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Add a message to a user's conversation history in Firestore.
 */
export async function addMessage(
    userId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string
): Promise<void> {
    const messagesRef = db
        .collection('conversations')
        .doc(userId)
        .collection('messages');

    // Save the message
    await messagesRef.add({
        role,
        content,
        timestamp: Timestamp.now(),
    });

    // Increment the message counter on the user profile
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        await userRef.update({
            totalMessages: FieldValue.increment(1),
            lastSeen: Timestamp.now(),
        });
    }

    // Update conversation metadata
    const convRef = db.collection('conversations').doc(userId);
    const convDoc = await convRef.get();
    if (!convDoc.exists) {
        await convRef.set({
            userId,
            createdAt: Timestamp.now(),
            lastMessageAt: Timestamp.now(),
            messageCount: 1,
        });
    } else {
        await convRef.update({
            lastMessageAt: Timestamp.now(),
            messageCount: FieldValue.increment(1),
        });
    }
}

/**
 * Get the last N messages from a user's conversation history.
 */
export async function getHistory(
    userId: string,
    limit: number = 20
): Promise<{ role: string; content: string }[]> {
    const messagesRef = db
        .collection('conversations')
        .doc(userId)
        .collection('messages');

    const snapshot = await messagesRef
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

    const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return { role: data.role, content: data.content };
    });

    return messages.reverse(); // Chronological order
}

/**
 * Get the full conversation history with timestamps (for display).
 */
export async function getFullHistory(
    userId: string,
    limit: number = 50
): Promise<{ role: string; content: string; timestamp: Date }[]> {
    const messagesRef = db
        .collection('conversations')
        .doc(userId)
        .collection('messages');

    const snapshot = await messagesRef
        .orderBy('timestamp', 'asc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            role: data.role,
            content: data.content,
            timestamp: (data.timestamp as Timestamp).toDate(),
        };
    });
}

/**
 * Get conversation statistics for a user.
 */
export async function getConversationStats(userId: string): Promise<{
    totalMessages: number;
    firstMessage: Date | null;
    lastMessage: Date | null;
} | null> {
    const convRef = db.collection('conversations').doc(userId);
    const convDoc = await convRef.get();

    if (!convDoc.exists) {
        return null;
    }

    const data = convDoc.data()!;
    return {
        totalMessages: data.messageCount || 0,
        firstMessage: data.createdAt ? (data.createdAt as Timestamp).toDate() : null,
        lastMessage: data.lastMessageAt ? (data.lastMessageAt as Timestamp).toDate() : null,
    };
}

/**
 * Delete all messages for a user (clear memory).
 */
export async function clearHistory(userId: string): Promise<void> {
    const messagesRef = db
        .collection('conversations')
        .doc(userId)
        .collection('messages');

    // Delete in batches of 500
    let snapshot = await messagesRef.limit(500).get();
    while (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        snapshot = await messagesRef.limit(500).get();
    }

    // Reset conversation metadata
    await db.collection('conversations').doc(userId).update({
        messageCount: 0,
        lastMessageAt: Timestamp.now(),
    });

    console.log(`[Memory] Cleared history for user ${userId}`);
}
