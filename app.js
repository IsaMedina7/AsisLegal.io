
// Apuntamos a local (HTTP), ruta 'v1' para evitar bloqueos
const API_URL = 'http://127.0.0.1:8080/api/v1';
const DOC_URL = 'http://127.0.0.1:8080/api/documents';

let currentChatId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("Conectando a:", API_URL);
    
    // Cargar lista inicial
    loadList();

    // BOTONES
    const startBtn = document.getElementById('start-btn'); // Botón de bienvenida
    const sendBtn = document.getElementById('send-btn');   // Botón enviar mensaje
    const uploadBtn = document.getElementById('upload-btn'); // Botón subir
    const fileInput = document.getElementById('file-input'); // Input archivo

    // Evento Bienvenida
    if(startBtn) startBtn.onclick = () => {
        document.getElementById('welcome-screen').classList.add('d-none');
        document.getElementById('chat-screen').classList.remove('d-none');
        loadList();
    };

    // Evento Subir
    if(uploadBtn && fileInput) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if(e.target.files[0]) uploadFile(e.target.files[0]);
        };
    }

    // Evento Chat
    if(sendBtn) sendBtn.onclick = sendMessage;
});

// --- 1. SUBIR ARCHIVO ---
async function uploadFile(file) {
    if(file.type !== 'application/pdf') return alert('Solo PDF');
    
    document.getElementById('files-list').innerHTML = 'Subiendo...';
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('titulo', file.name.replace('.pdf', ''));

    try {
        const res = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await res.json();
        
        if(data.status === 'success') {
            await loadList();
            openChat(data.data.id_chat);
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        alert('Error de conexión. Revisa que el backend corra en el puerto 8080.');
    }
}

// --- 2. LISTAR DOCUMENTOS ---
async function loadList() {
    const list = document.getElementById('files-list');
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        
        list.innerHTML = '';
        if(data.data && data.data.length > 0) {
            data.data.forEach(chat => {
                list.innerHTML += `
                    <div class="p-2 border-bottom d-flex justify-content-between">
                        <span onclick="openChat(${chat.id_chat})" style="cursor:pointer; font-weight:bold;">
                            ${chat.title}
                        </span>
                        <a href="${DOC_URL}/${chat.id_document}/download" target="_blank">⬇</a>
                    </div>`;
            });
        } else {
            list.innerHTML = '<div class="text-muted p-2">Sin documentos</div>';
        }
    } catch (e) {
        console.error(e);
        list.innerHTML = '<div class="text-danger">Backend desconectado (8080)</div>';
    }
}

// --- 3. ABRIR CHAT ---
window.openChat = async function(id) {
    document.getElementById('welcome-screen').classList.add('d-none');
    document.getElementById('chat-screen').classList.remove('d-none');
    currentChatId = id;
    
    const box = document.getElementById('messages');
    box.innerHTML = 'Cargando...';

    try {
        const res = await fetch(`${API_URL}/${id}`);
        const data = await res.json();
        box.innerHTML = '';
        
        if(data.data.messages) {
            data.data.messages.forEach(m => addMsg(m.sender, m.content));
        }
    } catch (e) {
        box.innerHTML = 'Error al cargar mensajes';
    }
};

// --- 4. ENVIAR MENSAJE ---
async function sendMessage() {
    const input = document.getElementById('question-input');
    const text = input.value;
    if(!text || !currentChatId) return;

    addMsg('user', text);
    input.value = '';

    try {
        const res = await fetch(`${API_URL}/${currentChatId}/mensaje`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content: text})
        });
        const data = await res.json();
        
        if(data.status === 'success') {
            addMsg('IA', data.ai_message.content);
            if(data.audio_base64) {
                 // Auto-reproducir audio o habilitar botón
                 new Audio("data:audio/mp3;base64," + data.audio_base64).play();
            }
        }
    } catch (e) {
        addMsg('IA', 'Error de conexión con la IA');
    }
}

function addMsg(sender, text) {
    const box = document.getElementById('messages');
    box.innerHTML += `<div class="mb-2 p-2 rounded ${sender==='user'?'bg-primary text-white text-end':'bg-light border'}">${text}</div>`;
}
