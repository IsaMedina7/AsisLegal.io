/**
 * AsisLegal Frontend - app.js
 * Versión Reparada: Navegación Garantizada
 */

const API_BASE_URL = 'http://127.0.0.1:8080/api';
const DEFAULT_HEADERS = { 'Accept': 'application/json' };

const state = {
    currentChatId: null,
    lastBotResponse: '',
    audioBase64: null,
    chats: []
};

// ESPERAR A QUE CARGUE EL HTML
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 AsisLegal Iniciado");

    // --- REFERENCIAS ---
    const startBtn = document.getElementById('start-btn');
    const backBtn = document.getElementById('back-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatScreen = document.getElementById('chat-screen');
    
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const sendBtn = document.getElementById('send-btn');
    const questionInput = document.getElementById('question-input');
    const playAudioBtn = document.getElementById('play-audio');

    // --- NAVEGACIÓN (El arreglo importante) ---
    if(startBtn) {
        startBtn.onclick = function() { // Usamos onclick directo para asegurar
            console.log("Entrando al chat...");
            welcomeScreen.classList.add('d-none');
            chatScreen.classList.remove('d-none');
            loadChatsList();
        };
    }

    if(backBtn) {
        backBtn.onclick = function() {
            chatScreen.classList.add('d-none');
            welcomeScreen.classList.remove('d-none');
            state.currentChatId = null;
        };
    }

    // --- UPLOAD ---
    if(uploadBtn && fileInput) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const selected = Array.from(e.target.files || []);
            if (selected.length > 0) handleFileUpload(selected[0]);
        };
    }

    // --- CHAT ---
    if(sendBtn) sendBtn.onclick = onSend;
    if(questionInput) {
        questionInput.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
            }
        };
    }

    // --- AUDIO ---
    if(playAudioBtn) playAudioBtn.onclick = handlePlayAudio;

    // Carga inicial
    loadChatsList();
});

// ---------------- FUNCIONES LÓGICAS ----------------

async function handleFileUpload(file) {
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('Solo PDF');
    
    // Feedback visual simple
    const list = document.getElementById('files-list');
    list.innerHTML = '<div class="text-primary">Subiendo...</div>';

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
        
        if(data.status === 'success') {
            await loadChatsList();
            if(data.data?.id_chat) openChat(data.data.id_chat);
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión al subir');
    }
}

async function loadChatsList() {
    const list = document.getElementById('files-list');
    try {
        const res = await fetch(`${API_BASE_URL}/chats`);
        const data = await res.json();
        
        if(data.data && data.data.length > 0) {
            list.innerHTML = '';
            data.data.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'p-2 border-bottom d-flex justify-content-between';
                item.innerHTML = `
                    <span style="cursor:pointer" onclick="window.openChat(${chat.id_chat})">
                        <strong>${chat.title}</strong>
                    </span>
                    <a href="${API_BASE_URL}/documents/${chat.id_document}/download" target="_blank">⬇</a>
                `;
                list.appendChild(item);
            });
        } else {
            list.innerHTML = '<div class="text-muted">Sin documentos</div>';
        }
    } catch (e) {
        list.innerHTML = '<div class="text-danger">Error backend</div>';
    }
}

// Exponemos al window para que el onclick del HTML generado funcione
window.openChat = async function(id) {
    document.getElementById('welcome-screen').classList.add('d-none');
    document.getElementById('chat-screen').classList.remove('d-none');
    
    const msgs = document.getElementById('messages');
    msgs.innerHTML = '<div class="text-center">Cargando...</div>';
    state.currentChatId = id;

    try {
        const res = await fetch(`${API_BASE_URL}/chats/${id}`);
        const data = await res.json();
        const chat = data.data;

        msgs.innerHTML = '';
        if(chat.messages) {
            chat.messages.forEach(m => appendMsg(m.sender, m.content));
        }
    } catch (e) {
        msgs.innerHTML = 'Error cargando chat';
    }
};

async function onSend() {
    const input = document.getElementById('question-input');
    const text = input.value;
    if(!text || !state.currentChatId) return;

    appendMsg('user', text);
    input.value = '';
    
    // Loading dummy
    const msgs = document.getElementById('messages');
    const loadDiv = document.createElement('div');
    loadDiv.innerHTML = '<em>Pensando...</em>';
    msgs.appendChild(loadDiv);

    try {
        const res = await fetch(`${API_BASE_URL}/chats/${state.currentChatId}/mensaje`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content: text})
        });
        const data = await res.json();
        loadDiv.remove();
        
        if(data.status === 'success') {
            appendMsg('IA', data.ai_message.content);
            state.audioBase64 = data.audio_base64;
            state.lastBotResponse = data.ai_message.content;
        }
    } catch (e) {
        loadDiv.remove();
        appendMsg('IA', 'Error de conexión');
    }
}

function appendMsg(sender, text) {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'text-end mb-2' : 'text-start mb-2';
    div.innerHTML = `<span class="d-inline-block p-2 rounded ${sender==='user'?'bg-primary text-white':'bg-light border'}">${text}</span>`;
    msgs.appendChild(div);
}

function handlePlayAudio() {
    if(state.audioBase64) new Audio("data:audio/mp3;base64," + state.audioBase64).play();
    else if(state.lastBotResponse) {
        const u = new SpeechSynthesisUtterance(state.lastBotResponse);
        window.speechSynthesis.speak(u);
    }
}
