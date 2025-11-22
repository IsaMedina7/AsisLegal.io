/**
 * AsisLegal Frontend - app.js
 * RUTA SEGURA: /api/core
 */

// CONFIGURACIÓN
const API_BASE = 'https://tu-codigo-raro.ngrok-free.app/api';
const ENDPOINT = 'core'; // <--- CAMBIO IMPORTANTE

const state = {
    currentChatId: null,
    chats: []
};

document.addEventListener('DOMContentLoaded', () => {
    console.log(`🚀 Conectando a: ${API_BASE}/${ENDPOINT}`);
    
    // Listeners
    const startBtn = document.getElementById('start-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const sendBtn = document.getElementById('send-btn');
    const backBtn = document.getElementById('back-btn');
    const questionInput = document.getElementById('question-input');
    
    if(startBtn) startBtn.onclick = () => { showChat(); loadList(); };
    if(backBtn) backBtn.onclick = () => { showWelcome(); };
    
    if(uploadBtn && fileInput) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if(e.target.files[0]) handleUpload(e.target.files[0]);
        };
    }

    if(sendBtn) sendBtn.onclick = onSend;
    
    // Carga inicial
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

// --- SUBIR ---
async function handleUpload(file) {
    if(file.type !== 'application/pdf') return alert('Solo PDF');
    
    const list = document.getElementById('files-list');
    list.innerHTML = '<div class="text-primary">Subiendo...</div>';

    try {
        const formData = new FormData();
        formData.append('pdf_file', file);
        formData.append('titulo', file.name.replace('.pdf',''));

        // PETICIÓN A /api/core
        const res = await fetch(`${API_BASE}/${ENDPOINT}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        if(data.status === 'success') {
            await loadList();
            openChat(data.data.id_chat);
        } else {
            alert('Error: ' + (data.message || 'Error desconocido'));
            loadList();
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión (Backend bloqueado o apagado)');
        loadList();
    }
}

// --- LISTAR ---
async function loadList() {
    const list = document.getElementById('files-list');
    try {
        const res = await fetch(`${API_BASE}/${ENDPOINT}`);
        const data = await res.json();
        
        list.innerHTML = '';
        if(data.data && data.data.length > 0) {
            data.data.forEach(chat => {
                const div = document.createElement('div');
                div.className = 'p-2 border-bottom d-flex justify-content-between';
                div.innerHTML = `
                    <span onclick="window.openChat(${chat.id_chat})" style="cursor:pointer">
                        <strong>${chat.title}</strong>
                    </span>
                    <a href="${API_BASE}/documents/${chat.id_document}/download" target="_blank">⬇</a>
                `;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = '<div class="text-muted p-2">Sin documentos</div>';
        }
    } catch (e) {
        console.error(e);
        list.innerHTML = '<div class="text-danger small">Error conectando a /api/core</div>';
    }
}

// --- ABRIR CHAT ---
window.openChat = async function(id) {
    showChat();
    state.currentChatId = id;
    const msgs = document.getElementById('messages');
    msgs.innerHTML = '<div class="text-center mt-3">Cargando...</div>';

    try {
        const res = await fetch(`${API_BASE}/${ENDPOINT}/${id}`);
        const data = await res.json();
        
        msgs.innerHTML = '';
        if(data.data.messages) {
            data.data.messages.forEach(m => appendMsg(m.sender, m.content));
        }
    } catch (e) {
        msgs.innerHTML = 'Error al cargar historial';
    }
};

// --- ENVIAR ---
async function onSend() {
    const input = document.getElementById('question-input');
    const text = input.value;
    if(!text || !state.currentChatId) return;

    appendMsg('user', text);
    input.value = '';
    
    try {
        const res = await fetch(`${API_BASE}/${ENDPOINT}/${state.currentChatId}/mensaje`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content: text})
        });
        const data = await res.json();
        if(data.status === 'success') {
            appendMsg('IA', data.ai_message.content);
            if(data.audio_base64) {
                const btn = document.getElementById('play-audio');
                if(btn) {
                    btn.onclick = () => new Audio("data:audio/mp3;base64," + data.audio_base64).play();
                    // alert("Audio listo para reproducir");
                }
            }
        }
    } catch (e) {
        appendMsg('IA', 'Error de conexión');
    }
}

function appendMsg(sender, text) {
    const box = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'text-end mb-2' : 'text-start mb-2';
    div.innerHTML = `<span class="d-inline-block p-2 rounded ${sender==='user'?'bg-primary text-white':'bg-light border'}">${text}</span>`;
    box.appendChild(div);
}
