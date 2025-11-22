/**
 * AsisLegal Frontend - app.js
 * Versión FINAL corregida.
 * Conecta con: http://127.0.0.1:8080/api
 */

// ─────────────────────────────────────────────────────────────────────────
// 1. CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────
const API_BASE_URL = 'http://127.0.0.1:8080/api';
// NOTA: Si tienes AdBlock y te sale ERR_BLOCKED_BY_CLIENT, cambia '/chats' por '/expedientes'
// tanto aquí abajo en las peticiones como en tu backend.

const DEFAULT_HEADERS = { 'Accept': 'application/json' };

// ─────────────────────────────────────────────────────────────────────────
// 2. ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────────────────
const state = {
    currentChatId: null,
    lastBotResponse: '',
    audioBase64: null,
    chats: []
};

// ─────────────────────────────────────────────────────────────────────────
// 3. INICIALIZACIÓN (Todo dentro de DOMContentLoaded para seguridad)
// ─────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    console.log(`🚀 Conectando a Backend: ${API_BASE_URL}`);

    // Referencias DOM
    const startBtn = document.getElementById('start-btn');
    const backBtn = document.getElementById('back-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const sendBtn = document.getElementById('send-btn');
    const questionInput = document.getElementById('question-input');
    const playAudioBtn = document.getElementById('play-audio');

    // --- LISTENERS DE NAVEGACIÓN ---
    startBtn?.addEventListener('click', () => { showChat(); loadChatsList(); });
    backBtn?.addEventListener('click', () => { showWelcome(); state.currentChatId = null; });

    // --- LISTENERS DE SUBIDA ---
    uploadBtn?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
        const selected = Array.from(e.target.files || []);
        if (selected.length > 0) handleFileUpload(selected[0]);
    });

    // --- LISTENERS DE MENSAJES ---
    sendBtn?.addEventListener('click', onSend);
    questionInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    });

    // --- LISTENER DE AUDIO ---
    playAudioBtn?.addEventListener('click', handlePlayAudio);

    // Cargar lista inicial
    loadChatsList();
});

// ─────────────────────────────────────────────────────────────────────────
// 4. FUNCIONES DE UI
// ─────────────────────────────────────────────────────────────────────────
function showChat() {
    document.getElementById('welcome-screen')?.classList.add('d-none');
    document.getElementById('chat-screen')?.classList.remove('d-none');
}

function showWelcome() {
    document.getElementById('chat-screen')?.classList.add('d-none');
    document.getElementById('welcome-screen')?.classList.remove('d-none');
}

// ─────────────────────────────────────────────────────────────────────────
// 5. LÓGICA DE SUBIDA
// ─────────────────────────────────────────────────────────────────────────
async function handleFileUpload(file) {
    const fileInput = document.getElementById('file-input');
    if (!file) return;
    
    // Validaciones
    if (file.type !== 'application/pdf') { 
        showError('❌ Solo se aceptan archivos PDF'); 
        if(fileInput) fileInput.value = '';
        return; 
    }
    if (file.size > 10 * 1024 * 1024) { 
        showError('❌ El archivo es muy grande (Máx 10MB)'); 
        if(fileInput) fileInput.value = '';
        return; 
    }

    showLoading('Subiendo y analizando documento...');
    
    try {
        const formData = new FormData();
        formData.append('pdf_file', file);
        formData.append('titulo', file.name.replace(/\.pdf$/i, ''));

        const res = await fetch(`${API_BASE_URL}/chats`, { 
            method: 'POST', 
            body: formData, 
            headers: { 'Accept': 'application/json' } 
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        showSuccess(`✅ Documento "${file.name}" cargado correctamente`);
        
        await loadChatsList();
        
        if (data.data?.id_chat) {
            openChat(data.data.id_chat);
        }
    } catch (err) { 
        console.error('Error al subir documento:', err); 
        showError(`❌ Error: ${err.message}`); 
    } finally { 
        hideLoading(); 
        if (fileInput) fileInput.value = ''; 
    }
}

// ─────────────────────────────────────────────────────────────────────────
// 6. LÓGICA DE LISTADOS Y DESCARGAS
// ─────────────────────────────────────────────────────────────────────────
async function loadChatsList() {
    try {
        const res = await fetch(`${API_BASE_URL}/chats`, { headers: DEFAULT_HEADERS });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (data.status === 'success') { 
            state.chats = data.data || []; 
            renderChatsList(state.chats); 
        } else { 
            state.chats = []; 
            renderChatsList([]); 
        }
    } catch (err) { 
        console.error('Error cargando chats:', err); 
        // No mostramos error en UI para no molestar al inicio si está vacío
    }
}

function renderChatsList(chats) {
    const filesList = document.getElementById('files-list');
    if (!filesList) return;
    
    filesList.innerHTML = '';
    
    if (!chats || chats.length === 0) { 
        filesList.innerHTML = '<div class="text-muted p-2">No hay documentos subidos.</div>'; 
        return; 
    }
    
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = 'p-2 border-bottom d-flex justify-content-between align-items-center';
        
        // URL de descarga
        const downloadUrl = `${API_BASE_URL}/documents/${chat.id_document}/download`;

        div.innerHTML = `
            <div class="text-truncate" style="max-width: 180px; cursor: pointer;" onclick="openChat(${chat.id_chat})">
                <strong>${escapeHtml(chat.title || 'Sin título')}</strong><br>
                <small class="text-muted">${new Date(chat.created_at).toLocaleDateString()}</small>
            </div>
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-primary" onclick="openChat(${chat.id_chat})">Abrir</button>
                <a href="${downloadUrl}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Descargar PDF">⬇</a>
            </div>
        `;
        filesList.appendChild(div);
    });
}

// Exponemos openChat al scope global para que el onclick del HTML funcione
window.openChat = async function(chatId) {
    if (!chatId) return;
    showLoading('Cargando conversación...');
    
    try {
        const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, { headers: DEFAULT_HEADERS });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        
        if (data.status === 'success') {
            const chat = data.data;
            state.currentChatId = chatId;
            state.audioBase64 = null;
            state.lastBotResponse = '';

            // Actualizar Header
            const header = document.querySelector('.card-header h5');
            const sub = document.querySelector('.card-header small');
            if (header) header.textContent = chat.title || '';
            if (sub) sub.textContent = chat.document?.nombre || '';

            // Renderizar Mensajes
            const messages = document.getElementById('messages');
            messages.innerHTML = '';
            
            if (chat.messages && chat.messages.length > 0) {
                chat.messages.forEach(msg => {
                    const tipo = msg.sender === 'user' ? 'user' : 'bot';
                    appendMessage(tipo, msg.content);
                    if (msg.sender === 'IA') state.lastBotResponse = msg.content;
                });
            } else {
                messages.innerHTML = '<div class="text-center text-muted mt-3">💬 Inicia la conversación</div>';
            }
            
            showChat();
        }
    } catch (err) { 
        console.error('Error al abrir chat:', err); 
        showError('⚠️ No se pudo abrir el chat'); 
    } finally { 
        hideLoading(); 
    }
};

// ─────────────────────────────────────────────────────────────────────────
// 7. ENVÍO DE MENSAJES
// ─────────────────────────────────────────────────────────────────────────
async function onSend() {
    const questionInput = document.getElementById('question-input');
    const playAudioBtn = document.getElementById('play-audio');
    const messages = document.getElementById('messages');

    const text = questionInput?.value?.trim();
    if (!text) return;
    if (!state.currentChatId) { showError('⚠️ No hay chat abierto'); return; }

    // UI Optimista
    appendMessage('user', text);
    if (questionInput) {
        questionInput.value = '';
        questionInput.disabled = true;
    }

    // Loader
    const loadingId = 'tmp-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'message bot';
    loadingDiv.innerHTML = '<em>🤖 IA procesando...</em>';
    messages.appendChild(loadingDiv);
    messages.scrollTop = messages.scrollHeight;

    try {
        const res = await fetch(`${API_BASE_URL}/chats/${state.currentChatId}/mensaje`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ content: text })
        });

        const data = await res.json();
        document.getElementById(loadingId)?.remove();

        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        if (data.status === 'success') {
            const aiText = data.ai_message?.content || '';
            appendMessage('bot', aiText);
            state.lastBotResponse = aiText;
            state.audioBase64 = data.audio_base64 || null;
            
            if (playAudioBtn) playAudioBtn.disabled = !state.audioBase64;
        } else {
            appendMessage('bot', '❌ Error: La IA no pudo responder.');
        }
    } catch (err) {
        document.getElementById(loadingId)?.remove();
        console.error('Error al enviar mensaje:', err);
        appendMessage('bot', `❌ Error: ${err.message}`);
    } finally {
        if (questionInput) {
            questionInput.disabled = false;
            questionInput.focus();
        }
    }
}

function appendMessage(kind, text) {
    const messages = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message ${kind}`;
    div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────
// 8. AUDIO
// ─────────────────────────────────────────────────────────────────────────
function handlePlayAudio() {
    if (state.audioBase64) {
        playAudioFromBase64(state.audioBase64);
    } else if (state.lastBotResponse) {
        speakText(state.lastBotResponse);
    } else {
        showError('❌ No hay audio para reproducir');
    }
}

function playAudioFromBase64(b64) {
    try {
        const audio = new Audio('data:audio/mp3;base64,' + b64);
        audio.play().catch(err => {
            console.error('Error reproducir audio', err);
            speakText(state.lastBotResponse);
        });
    } catch (err) {
        console.error(err);
        speakText(state.lastBotResponse);
    }
}

function speakText(text) {
    if (!('speechSynthesis' in window)) {
        showError('❌ Tu navegador no soporta síntesis de voz');
        return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
}

// ─────────────────────────────────────────────────────────────────────────
// 9. UTILIDADES
// ─────────────────────────────────────────────────────────────────────────
function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showError(message) {
    const container = document.querySelector('.container') || document.body;
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show mt-3 fixed-top m-3 shadow';
    alert.style.zIndex = 9999;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `${escapeHtml(message)} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function showSuccess(message) {
    const container = document.querySelector('.container') || document.body;
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show mt-3 fixed-top m-3 shadow';
    alert.style.zIndex = 9999;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `${escapeHtml(message)} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showLoading(message) {
    const container = document.querySelector('.container') || document.body;
    if (document.getElementById('loading-alert')) return;
    const alert = document.createElement('div');
    alert.id = 'loading-alert';
    alert.className = 'alert alert-info mt-3 fixed-top m-3 shadow';
    alert.style.zIndex = 9999;
    alert.setAttribute('role', 'status');
    alert.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> ${escapeHtml(message)}`;
    container.appendChild(alert);
}

function hideLoading() {
    const a = document.getElementById('loading-alert');
    if (a) a.remove();
}
