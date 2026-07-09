import { auth, db, onAuthStateChanged } from './firebase-config.js';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import {
    sendMessage,
    deleteConversation
} from './services/message-service.js';

const conversationsList = document.getElementById('conversations-list');
const messageDetail = document.getElementById('message-detail');
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messageRecipient = document.getElementById('message-recipient');
const backToConversations = document.getElementById('back-to-conversations');
const deleteConversationBtn = document.getElementById('delete-conversation');

let currentUser = null;
let currentConversationId = null;
let currentParticipantInfo = {};
let messagesUnsub = null;
let conversationsUnsub = null;

// In-memory cache of conversations so openConversation always has fresh data
// even when called from outside the snapshot callback
let cachedConversations = [];

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatTime = (value) => {
    if (!value) return '';
    const date = value?.toDate ? value.toDate() : new Date(value);
    if (isNaN(date.getTime())) return '';
    const diffDays = Math.floor(Math.abs(new Date() - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

const otherParticipant = (conv) => {
    const otherUid = (conv.participants || []).find(uid => uid !== currentUser.uid);
    const info = conv.participantInfo?.[otherUid] || {};
    return {
        uid: otherUid,
        name: info.name || 'Usuario',
        photoURL: info.photoURL || '',
        avatar: (info.name || 'U').substring(0, 2).toUpperCase()
    };
};

const buildAvatar = (info) => {
    if (info?.photoURL) {
        return `<img src="${info.photoURL}" alt="${info.name || 'Usuario'}" class="msg-avatar-img"
                     onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
                <span class="msg-avatar-initials" style="display:none">${(info.name || 'U').substring(0, 2).toUpperCase()}</span>`;
    }
    return `<span class="msg-avatar-initials">${(info?.name || 'U').substring(0, 2).toUpperCase()}</span>`;
};

// ─── Render ──────────────────────────────────────────────────────────────────

const renderConversations = (conversations) => {
    if (!conversationsList) return;

    if (!conversations.length) {
        conversationsList.innerHTML = `
            <div class="no-conversations">
                <i class="far fa-comments"></i>
                <h3>No tienes mensajes</h3>
                <p>Cuando tengas conversaciones, aparecerán aquí.</p>
            </div>`;
        return;
    }

    conversationsList.innerHTML = conversations.map(conv => {
        const other = otherParticipant(conv);
        const active = conv.id === currentConversationId ? 'active' : '';
        const avatarContent = other.photoURL
            ? `<img src="${other.photoURL}" alt="${other.name}" class="conv-avatar-img"
                    onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
               <span class="conv-avatar-initials" style="display:none">${other.avatar}</span>`
            : `<span class="conv-avatar-initials">${other.avatar}</span>`;

        return `
            <div class="conversation ${active}" data-conversation-id="${conv.id}">
                <div class="conversation-avatar">${avatarContent}</div>
                <div class="conversation-details">
                    <div class="conversation-header">
                        <span class="conversation-name">${other.name}</span>
                        <span class="conversation-time">${formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <div class="conversation-preview">${conv.lastMessage || 'Inicia la conversación'}</div>
                    <div class="conversation-ad"><small>${conv.adTitle || ''}</small></div>
                </div>
            </div>`;
    }).join('');

    conversationsList.querySelectorAll('.conversation').forEach(el => {
        el.addEventListener('click', () => openConversation(el.dataset.conversationId));
    });
};

const renderMessages = (messages) => {
    if (!messagesContainer) return;

    if (!messages.length) {
        messagesContainer.innerHTML = `
            <div class="no-conversation-selected">
                <i class="far fa-comment-dots"></i>
                <h3>Sin mensajes aún</h3>
                <p>Envía un mensaje para iniciar la conversación</p>
            </div>`;
        return;
    }

    messagesContainer.innerHTML = messages.map(msg => {
        const isMe = msg.senderId === currentUser.uid;
        const senderInfo = currentParticipantInfo[msg.senderId] || {};
        const avatarHTML = buildAvatar(senderInfo);

        return `
            <div class="message ${isMe ? 'sent' : 'received'}">
                ${!isMe ? `<div class="msg-avatar">${avatarHTML}</div>` : ''}
                <div class="message-body">
                    <div class="message-bubble">${msg.text}</div>
                    <div class="message-time">${formatTime(msg.createdAt)}</div>
                </div>
                ${isMe ? `<div class="msg-avatar">${avatarHTML}</div>` : ''}
            </div>`;
    }).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// ─── Open conversation ───────────────────────────────────────────────────────

/**
 * Opens (or re-opens) a conversation by id.
 * Looks up participantInfo from the in-memory cache so it works even when
 * called outside the conversations snapshot callback.
 */
const openConversation = (conversationId) => {
    if (!conversationId) return;

    currentConversationId = conversationId;

    // Highlight active row in the list
    document.querySelectorAll('.conversation').forEach(c => {
        c.classList.toggle('active', c.dataset.conversationId === conversationId);
    });

    // Update header and participant info from cache
    const conv = cachedConversations.find(c => c.id === conversationId);
    if (conv && currentUser) {
        currentParticipantInfo = conv.participantInfo || {};
        if (messageRecipient) {
            const otherUid = (conv.participants || []).find(uid => uid !== currentUser.uid);
            const name = currentParticipantInfo[otherUid]?.name || 'Usuario';
            const adTitle = conv.adTitle ? ` · ${conv.adTitle}` : '';
            messageRecipient.textContent = name + adTitle;
        }
    }

    // Cancel any existing messages listener before creating a new one
    if (messagesUnsub) {
        messagesUnsub();
        messagesUnsub = null;
    }

    // Show a loading state while the first snapshot arrives
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="no-conversation-selected">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando mensajes...</p>
            </div>`;
    }

    const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
    );

    messagesUnsub = onSnapshot(
        q,
        { includeMetadataChanges: false },
        (snapshot) => {
            // Guard: ignore stale callbacks if the conversation changed
            if (currentConversationId !== conversationId) return;
            renderMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        (error) => {
            console.error('Error al escuchar mensajes:', error);
        }
    );

    if (messageForm) messageForm.style.display = 'flex';

    // Mobile: hide list, show detail
    if (window.innerWidth <= 768) {
        if (conversationsList) conversationsList.style.display = 'none';
        if (messageDetail) messageDetail.classList.add('active');
    }
};

// ─── Event listeners ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    if (backToConversations) {
        backToConversations.addEventListener('click', () => {
            if (conversationsList) conversationsList.style.display = 'block';
            if (messageDetail) messageDetail.classList.remove('active');
        });
    }

    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = messageInput?.value.trim();
            if (!text || !currentConversationId || !currentUser) return;

            if (messageInput) {
                messageInput.value = '';
                messageInput.style.height = 'auto';
            }
            try {
                await sendMessage(currentConversationId, { senderId: currentUser.uid, text });
            } catch (error) {
                console.error('Error al enviar mensaje:', error);
            }
        });
    }

    if (messageInput) {
        messageInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                messageForm?.dispatchEvent(new Event('submit'));
            }
        });
    }

    if (deleteConversationBtn) {
        deleteConversationBtn.addEventListener('click', async () => {
            if (!currentConversationId) return;
            if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) return;

            const id = currentConversationId;
            currentConversationId = null;
            currentParticipantInfo = {};

            if (messagesUnsub) { messagesUnsub(); messagesUnsub = null; }

            try {
                await deleteConversation(id);
            } catch (error) {
                console.error('Error al eliminar conversación:', error);
            }

            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="no-conversation-selected">
                        <i class="far fa-comment-dots"></i>
                        <h3>Selecciona una conversación</h3>
                        <p>Elige una conversación para ver los mensajes</p>
                    </div>`;
            }
            if (messageForm) messageForm.style.display = 'none';
            if (messageRecipient) messageRecipient.textContent = 'Selecciona una conversación';
        });
    }

    window.addEventListener('resize', () => {
        if (!conversationsList || !messageDetail) return;
        if (window.innerWidth > 768) {
            conversationsList.style.display = 'block';
            messageDetail.style.display = 'flex';
        } else if (currentConversationId) {
            conversationsList.style.display = 'none';
            messageDetail.style.display = 'flex';
        } else {
            conversationsList.style.display = 'block';
            messageDetail.style.display = 'none';
        }
    });

    // ─── Auth & conversations listener ──────────────────────────────────────
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = user;

        if (conversationsList) {
            conversationsList.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando conversaciones...</p>
                </div>`;
        }

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', user.uid)
        );

        conversationsUnsub = onSnapshot(
            q,
            { includeMetadataChanges: false },
            (snapshot) => {
                const conversations = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => {
                        const ta = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate() : new Date(a.lastMessageAt || 0);
                        const tb = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate() : new Date(b.lastMessageAt || 0);
                        return tb - ta;
                    });

                // Update the cache every time Firestore pushes changes
                cachedConversations = conversations;

                // Re-render the list (preserves the active highlight)
                renderConversations(conversations);

                // Decide which conversation to open:
                const params = new URLSearchParams(window.location.search);
                const convParam = params.get('conv');

                if (convParam && conversations.some(c => c.id === convParam)) {
                    // URL param takes priority — only open once on first load
                    if (!currentConversationId) {
                        openConversation(convParam);
                    }
                } else if (!currentConversationId && conversations.length) {
                    // Auto-open the most recent conversation on first load
                    openConversation(conversations[0].id);
                }
                // If a conversation is already open, do NOT re-open it.
                // The messages listener is independent and keeps running fine.
            },
            (error) => {
                console.error('Error al cargar conversaciones:', error);
                if (conversationsList) {
                    conversationsList.innerHTML = '<p class="error">Error al cargar las conversaciones.</p>';
                }
            }
        );
    });
});
