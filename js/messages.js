import { auth, db, onAuthStateChanged } from './firebase-config.js';
import {
    collection,
    doc,
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
let messagesUnsub = null;
let conversationsUnsub = null;

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
        avatar: (info.name || 'U').substring(0, 2).toUpperCase()
    };
};

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
        return `
            <div class="conversation ${active}" data-conversation-id="${conv.id}">
                <div class="conversation-avatar">${other.avatar}</div>
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
        el.addEventListener('click', () => openConversation(el.dataset.conversationId, conversations));
    });
};

const renderMessages = (messages) => {
    if (!messagesContainer) return;

    if (!messages.length) {
        messagesContainer.innerHTML = `
            <div class="no-conversation-selected">
                <i class="far fa-comment-dots"></i>
                <h3>Sin mensajes</h3>
                <p>Envía un mensaje para iniciar la conversación</p>
            </div>`;
        return;
    }

    messagesContainer.innerHTML = messages.map(msg => {
        const isMe = msg.senderId === currentUser.uid;
        return `
            <div class="message ${isMe ? 'sent' : 'received'}">
                <div class="message-bubble">${msg.text}</div>
                <div class="message-time">${formatTime(msg.createdAt)}</div>
            </div>`;
    }).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

const openConversation = (conversationId, conversations = []) => {
    currentConversationId = conversationId;

    document.querySelectorAll('.conversation').forEach(c => {
        c.classList.toggle('active', c.dataset.conversationId === conversationId);
    });

    // Update the recipient name in the header
    if (messageRecipient && currentUser) {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
            const otherUid = (conv.participants || []).find(uid => uid !== currentUser.uid);
            const name = conv.participantInfo?.[otherUid]?.name || 'Usuario';
            const adTitle = conv.adTitle ? ` · ${conv.adTitle}` : '';
            messageRecipient.textContent = name + adTitle;
        }
    }

    if (messagesUnsub) messagesUnsub();

    const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
    );
    messagesUnsub = onSnapshot(q, (snapshot) => {
        renderMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
        console.error('Error al escuchar mensajes:', error);
    });

    if (messageForm) messageForm.style.display = 'flex';
    if (window.innerWidth <= 768) {
        conversationsList.style.display = 'none';
        messageDetail.classList.add('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (backToConversations) {
        backToConversations.addEventListener('click', () => {
            conversationsList.style.display = 'block';
            messageDetail.classList.remove('active');
        });
    }

    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            if (!text || !currentConversationId || !currentUser) return;

            messageInput.value = '';
            messageInput.style.height = 'auto';
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

        // Enter sends, Shift+Enter adds a new line
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                messageForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    if (deleteConversationBtn) {
        deleteConversationBtn.addEventListener('click', async () => {
            if (currentConversationId && confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
                const id = currentConversationId;
                currentConversationId = null;
                if (messagesUnsub) messagesUnsub();
                try {
                    await deleteConversation(id);
                } catch (error) {
                    console.error('Error al eliminar conversación:', error);
                }
                messagesContainer.innerHTML = `
                    <div class="no-conversation-selected">
                        <i class="far fa-comment-dots"></i>
                        <h3>Selecciona una conversación</h3>
                        <p>Elige una conversación para ver los mensajes</p>
                    </div>`;
                if (messageForm) messageForm.style.display = 'none';
                if (messageRecipient) messageRecipient.textContent = 'Selecciona una conversación';
            }
        });
    }

    window.addEventListener('resize', () => {
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

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = user;

        conversationsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Cargando conversaciones...</p></div>';

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', user.uid)
        );
        conversationsUnsub = onSnapshot(q, (snapshot) => {
            const conversations = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const ta = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate() : new Date(a.lastMessageAt || 0);
                    const tb = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate() : new Date(b.lastMessageAt || 0);
                    return tb - ta;
                });
            renderConversations(conversations);

            // Open the conversation from the URL hash/param if present
            const params = new URLSearchParams(window.location.search);
            const convParam = params.get('conv');
            if (convParam && conversations.some(c => c.id === convParam)) {
                openConversation(convParam, conversations);
            } else if (!currentConversationId && conversations.length) {
                openConversation(conversations[0].id, conversations);
            }
        }, (error) => {
            console.error('Error al cargar conversaciones:', error);
            conversationsList.innerHTML = '<p class="error">Error al cargar las conversaciones.</p>';
        });
    });
});
