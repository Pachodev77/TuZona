// Message Service
// Real-time messaging between buyers and sellers using Firestore.
// Conversations are stored at conversations/{convId} and messages in a
// conversations/{convId}/messages subcollection.

import { db } from '../firebase-config.js';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

// Deterministic conversation id so a buyer/seller pair always reuses the same thread for an ad
const conversationId = (adId, uidA, uidB) => `${adId}__${[uidA, uidB].sort().join('__')}`;

/**
 * Get an existing conversation or create a new one.
 * @returns {Promise<string>} The conversation id
 */
export const getOrCreateConversation = async ({ buyerId, buyerName, buyerPhoto, sellerId, sellerName, sellerPhoto, adId, adTitle, adImage }) => {
    const convId = conversationId(adId, buyerId, sellerId);
    const ref = doc(db, 'conversations', convId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            id: convId,
            adId,
            adTitle: adTitle || '',
            adImage: adImage || '',
            participants: [buyerId, sellerId],
            participantInfo: {
                [buyerId]: { name: buyerName || 'Usuario', photoURL: buyerPhoto || '' },
                [sellerId]: { name: sellerName || 'Usuario', photoURL: sellerPhoto || '' }
            },
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            lastSenderId: ''
        });
    } else {
        // Update photoURLs in case they changed since the conversation was created
        const updates = {};
        const data = snap.data();
        if (!data.participantInfo?.[buyerId]?.photoURL && buyerPhoto) {
            updates[`participantInfo.${buyerId}.photoURL`] = buyerPhoto;
        }
        if (!data.participantInfo?.[sellerId]?.photoURL && sellerPhoto) {
            updates[`participantInfo.${sellerId}.photoURL`] = sellerPhoto;
        }
        if (Object.keys(updates).length) {
            await updateDoc(ref, updates);
        }
    }
    return convId;
};

/**
 * Get all conversations for a user (most recent first).
 * Sorted client-side to avoid requiring a composite Firestore index.
 */
export const getConversations = async (userId) => {
    const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
            const ta = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate() : new Date(a.lastMessageAt || 0);
            const tb = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate() : new Date(b.lastMessageAt || 0);
            return tb - ta;
        });
};

/**
 * Get all messages in a conversation (oldest first).
 */
export const getMessages = async (convId) => {
    const q = query(
        collection(db, 'conversations', convId, 'messages'),
        orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Send a message in a conversation.
 */
export const sendMessage = async (convId, { senderId, text }) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return { success: false, error: 'El mensaje está vacío' };

    await addDoc(collection(db, 'conversations', convId, 'messages'), {
        senderId,
        text: trimmed,
        createdAt: serverTimestamp(),
        read: false
    });

    await updateDoc(doc(db, 'conversations', convId), {
        lastMessage: trimmed,
        lastMessageAt: serverTimestamp(),
        lastSenderId: senderId
    });

    return { success: true };
};

/**
 * Delete a conversation and all of its messages.
 */
export const deleteConversation = async (convId) => {
    const messagesRef = collection(db, 'conversations', convId, 'messages');
    const snapshot = await getDocs(messagesRef);
    const deletions = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletions);
    await deleteDoc(doc(db, 'conversations', convId));
    return { success: true };
};
