/**
 * AsisLegal Frontend - app.js
 * RUTA SEGURA: /api/legal (Evita AdBlock)
 */

// 1. CONFIGURACIÓN: Fíjate que la URL termina en /legal
// Esto hace que todas las peticiones vayan a http://127.0.0.1:8080/api/legal
const API_BASE = 'http://127.0.0.1:8080/api'; 
const ENDPOINT = 'legal'; // Palabra segura

const DEFAULT_HEADERS = { 'Accept': 'application/json' };

const state = {
    currentChatId: null,
    lastBotResponse: '',
    audioBase64: null,
    chats: []
};

document.addEventListener('DOMContentLoaded', () => {
    console.log(`🚀 Conectando a: ${API_BASE}/${ENDPOINT}`);
    
    const startBtn = document.getElementById('start-btn');
    const backBtn = document.getElementById('back-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const sendBtn = document.getElementById('send-btn');
    const questionInput = document.getElementById('question-input');
    const playAudioBtn = document.getElementById('play-audio');

    // Navegación
    if(startBtn) startBtn.addEventListener('click', () => { showChat(); loadList(); });
    if(backBtn) backBtn.addEventListener('click', () => { showWelcome(); state.currentChatId = null; });

    // Upload
    if(uploadBtn) uploadBtn.addEventListener('click', () => fileInput?.click());
    if(fileInput) fileInput.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if(f) handleUpload(f);
    });

    // Chat
    if(sendBtn) sendBtn.addEventListener('click', onSend);
    if(questionInput) questionInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
    });

    // Audio
    if(playAudioBtn) playAudioBtn.addEventListener('click', handlePlayAudio);

    loadList();
});

function showChat() {
    document.getElementById('welcome-screen')?.classList.add('d-none');
    document.getElementById('chat-screen')?.classList.remove('d-none');
}
function showWelcome() {
    document.getElementById('chat-screen')?.classList.add('d-none');
    document.getElementById('welcome-screen')?.classList.remove('d-none');
}

// --- SUBIR ARCHIVO ---
async function handleUpload(file) {
    if(file.type !== 'application/pdf') return alert('Solo PDF');
    
    const btn = document.getElementById('upload-btn');
    const originalText = btn.innerText;
    btn.innerText = "Subiendo...";

    try {
        const formData = new FormData();
        formData.append('pdf_file', file);
        formData.append('titulo', file.name.replace('.pdf',''));

        // Petición a /api/legal
        const res = await fetch(`${API_BASE}/${ENDPOINT}`, { 
            method: 'POST', 
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await res.json();
        if(!res.ok) throw new Error(data.message || 'Error subiendo');

        await loadList();
        if(data.data?.id_chat) openChat(data.data.id_chat);

    } catch (e) {
        console.error(e);
        alert('Error: ' + e.message);
    } finally {
        btn.innerText = originalText;
        document.getElementById('file-input').value = '';
    }
}

// --- LISTAR ---
async function loadList() {
    const list = document.getElementById('files-list');
    try {
        const res = await fetch(`${API_BASE}/${ENDPOINT}`, { headers: DEFAULT_HEADERS });
        const data = await res.json();
        
        if(data.data && data.data.length > 0) {
            list.innerHTML = '';
            data.data.forEach(chat => {
                const div = document.createElement('div');
                div.className = 'p-2 border-bottom d-flex justify-content-between align-items-center';
                div.innerHTML = `
                    <span style="cursor:pointer" onclick="openChat(${chat.id_chat})">
                        <strong>${chat.title}</strong>
                    </span>
                    <a href="${API_BASE}/documents/${chat.id_document}/download" target="_blank">⬇</a>
                `;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = '<div class="text-muted p-2">Sin documentos.</div>';
        }
    } catch (e) {
        console.error(e); // Si sale error aquí es CORS o Servidor Apagado
        list.innerHTML = '<div class="text-danger small">Error de conexión</div>';
    }
}

// --- ABRIR CHAT ---
window.openChat = async function(id) {
    showChat();
    const msgs = document.getElementById('messages');
    msgs.innerHTML = '<div class="text-center mt-3">Cargando...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/${ENDPOINT}/${id}`, { headers: DEFAULT_HEADERS });
        const data = await res.json();
        
        if(data.status === 'success') {
            state.currentChatId = id;
            state.audioBase64 = null;
            
            const chat = data.data;
            // Header
            const h = document.querySelector('.card-header h5');
            if(h) h.innerText = chat.title;

            msgs.innerHTML = '';
            if(chat.messages) {
                chat.messages.forEach(m => appendMsg(m.sender, m.content));
            }
        }
    } catch (e) {
        msgs.innerHTML = '<div class="text-danger text-center">Error cargando chat</div>';
    }
};

// --- ENVIAR ---
async function onSend() {
    const input = document.getElementById('question-input');
    const text = input.value.trim();
    if(!text || !state.currentChatId) return;

    appendMsg('user', text);
    input.value = '';
    input.disabled = true;

    const msgs = document.getElementById('messages');
    const loader = document.createElement('div');
    loader.innerHTML = '<em>IA pensando...</em>';
    msgs.appendChild(loader);
    msgs.scrollTop = msgs.scrollHeight;

    try {
        const res = await fetch(`${API_BASE}/${ENDPOINT}/${state.currentChatId}/mensaje`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ content: text })
        });
        const data = await res.json();
        loader.remove();

        if(data.status === 'success') {
            appendMsg('IA', data.ai_message.content);
            state.audioBase64 = data.audio_base64;
            state.lastBotResponse = data.ai_message.content;
        } else {
            appendMsg('IA', 'Error en respuesta');
        }
    } catch (e) {
        loader.remove();
        appendMsg('IA', 'Error de conexión');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

function appendMsg(sender, text) {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message ${sender==='user'?'user':'bot'} mt-2 p-2 rounded ${sender==='user'?'bg-primary text-white ms-auto':'bg-light border me-auto'}`;
    div.style.maxWidth = '80%';
    div.innerHTML = text.replace(/\n/g, '<br>');
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

// --- AUDIO ---
function handlePlayAudio() {
    if(state.audioBase64) new Audio("data:audio/mp3;base64," + state.audioBase64).play();
    else if(state.lastBotResponse) {
        const u = new SpeechSynthesisUtterance(state.lastBotResponse);
        window.speechSynthesis.speak(u);
    }
}
