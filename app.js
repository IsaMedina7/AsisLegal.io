/**
 * ============================================================================
 * AsisLegal Frontend - app.js (VERSIÓN FINAL & LIMPIA)
 * ============================================================================
 * Conecta con Laravel en el puerto 8080.
 * Gestiona: Subidas, Chat, Mensajes, Audio y DESCARGA DE DOCUMENTOS.
 */

// ─────────────────────────────────────────────────────────────────────────
// 1. CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────

// IMPORTANTE: Puerto 8080 (Laravel)
const API_BASE_URL = 'http://127.0.0.1:8080/api';

// ─────────────────────────────────────────────────────────────────────────
// 2. ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────────────────

const state = {
  currentChatId: null,    // ID del chat abierto
  lastBotResponse: '',    // Texto para leer en voz alta
  audioBase64: null,      // Audio binario mp3
  chats: []               // Lista de chats cargados
};

// ─────────────────────────────────────────────────────────────────────────
// 3. SELECTORES DEL DOM (Coinciden con tu HTML)
// ─────────────────────────────────────────────────────────────────────────

const welcomeScreen = document.getElementById('welcome-screen');
const chatScreen = document.getElementById('chat-screen');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');

const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const filesList = document.getElementById('files-list');

const sendBtn = document.getElementById('send-btn');
const questionInput = document.getElementById('question-input');
const messages = document.getElementById('messages');
const playAudioBtn = document.getElementById('play-audio');

// ─────────────────────────────────────────────────────────────────────────
// 4. INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  console.log(`🚀 AsisLegal Iniciado. Conectando a: ${API_BASE_URL}`);
  loadChatsList(); // Cargar la barra lateral al iniciar
});

// ─────────────────────────────────────────────────────────────────────────
// 5. NAVEGACIÓN
// ─────────────────────────────────────────────────────────────────────────

// Botón "Crear consulta" (Pantalla bienvenida)
startBtn?.addEventListener('click', () => {
  showChat();
  loadChatsList();
});

// Botón "Volver" (Pantalla chat)
backBtn?.addEventListener('click', () => {
  showWelcome();
  state.currentChatId = null;
});

function showChat() {
  if (welcomeScreen) welcomeScreen.classList.add('d-none');
  if (chatScreen) chatScreen.classList.remove('d-none');
}

function showWelcome() {
  if (chatScreen) chatScreen.classList.add('d-none');
  if (welcomeScreen) welcomeScreen.classList.remove('d-none');
}

// ─────────────────────────────────────────────────────────────────────────
// 6. GESTIÓN DE ARCHIVOS (SUBIDA)
// ─────────────────────────────────────────────────────────────────────────

// Al hacer clic en el botón verde "Subir documentos", activamos el input oculto
uploadBtn?.addEventListener('click', () => {
  fileInput.click();
});

// Cuando el usuario selecciona el archivo
fileInput?.addEventListener('change', (e) => {
  const selected = Array.from(e.target.files || []);
  if (selected.length > 0) {
    // Tomamos solo el primero, ya que nuestra API crea 1 chat por 1 documento
    handleFileUpload(selected[0]);
  }
});

async function handleFileUpload(file) {
  // Validaciones
  if (file.type !== 'application/pdf') {
    showError('❌ Solo se aceptan archivos PDF');
    fileInput.value = '';
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showError('❌ El archivo es muy grande (Máx 10MB)');
    fileInput.value = '';
    return;
  }

  showLoading('Subiendo y analizando documento...');

  try {
    const formData = new FormData();
    formData.append('pdf_file', file);
    // Usamos el nombre del archivo como título inicial
    formData.append('titulo', file.name.replace('.pdf', ''));

    // Petición POST a Laravel
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al subir archivo');
    }

    showSuccess(`✅ Documento "${file.name}" cargado correctamente`);

    // Recargar la lista del sidebar
    await loadChatsList();

    // Abrir inmediatamente el chat creado
    if (data.data && data.data.id_chat) {
      openChat(data.data.id_chat);
    }

  } catch (error) {
    console.error(error);
    showError(`Error: ${error.message}`);
  } finally {
    hideLoading();
    fileInput.value = ''; // Limpiar input para poder subir el mismo archivo si se desea
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 7. LISTA DE DOCUMENTOS / CHATS (SIDEBAR)
// ─────────────────────────────────────────────────────────────────────────

async function loadChatsList() {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`);
    const data = await response.json();

    if (data.status === 'success') {
      state.chats = data.data;
      renderChatsList(state.chats);
    }
  } catch (error) {
    console.error('Error cargando chats:', error);
    showError('No se pudo cargar el historial de documentos.');
  }
}

function renderChatsList(chats) {
  if (!filesList) return;
  filesList.innerHTML = '';

  if (chats.length === 0) {
    filesList.innerHTML = '<div class="text-muted p-2">📂 No hay documentos cargados.</div>';
    return;
  }

  chats.forEach(chat => {
    // Crear elemento visual para la lista
    const div = document.createElement('div');
    div.className = 'file-item p-2 border-bottom d-flex justify-content-between align-items-center';
    
    const fecha = new Date(chat.created_at).toLocaleDateString();
    
    // URL para descargar el documento original
    // Nota: Usamos id_document que viene en la respuesta del chat
    const downloadUrl = `${API_BASE_URL}/documents/${chat.id_document}/download`;

    div.innerHTML = `
      <div class="text-truncate flex-grow-1" style="cursor: pointer;" onclick="openChat(${chat.id_chat})">
        <strong>${escapeHtml(chat.title || 'Sin título')}</strong><br>
        <small class="text-muted">${fecha}</small>
      </div>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-primary" onclick="openChat(${chat.id_chat})" title="Abrir Chat">💬</button>
        <a href="${downloadUrl}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Descargar PDF">⬇️</a>
      </div>
    `;

    filesList.appendChild(div);
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 8. LÓGICA DEL CHAT (ABRIR Y MENSAJES)
// ─────────────────────────────────────────────────────────────────────────

// Exponemos la función al scope global para que el onclick del HTML funcione
window.openChat = async function(chatId) {
  showLoading('Cargando conversación...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);
    const data = await response.json();

    if (data.status === 'success') {
      state.currentChatId = chatId;
      state.audioBase64 = null;
      state.lastBotResponse = '';

      const chatData = data.data;

      // Actualizar Título del Header del Chat
      const headerTitle = document.querySelector('.card-header h5');
      const headerSubtitle = document.querySelector('.card-header small');
      
      if(headerTitle) headerTitle.textContent = chatData.title;
      if(headerSubtitle) headerSubtitle.textContent = chatData.document ? chatData.document.nombre : 'Documento';

      // Limpiar área de mensajes
      messages.innerHTML = '';

      // Renderizar historial
      if (chatData.messages && chatData.messages.length > 0) {
        chatData.messages.forEach(msg => {
          const tipo = msg.sender === 'user' ? 'user' : 'bot';
          appendMessage(tipo, msg.content);
          
          if (msg.sender === 'IA') state.lastBotResponse = msg.content;
        });
        // Scroll al final
        messages.scrollTop = messages.scrollHeight;
      } else {
        messages.innerHTML = '<div class="text-center text-muted mt-5">💬 Chat iniciado. Pregunta algo sobre el documento.</div>';
      }

      showChat(); // Asegurar que estamos en la pantalla de chat
    }
  } catch (error) {
    showError('No se pudo abrir el chat');
    console.error(error);
  } finally {
    hideLoading();
  }
};

// Enviar mensaje al presionar Enter o click
sendBtn?.addEventListener('click', onSend);
questionInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') onSend();
});

async function onSend() {
  const text = questionInput.value.trim();
  if (!text || !state.currentChatId) return;

  // 1. Mostrar mensaje de usuario inmediatamente (UX)
  appendMessage('user', text);
  questionInput.value = '';
  questionInput.disabled = true;
  sendBtn.disabled = true;

  // 2. Mostrar "Escribiendo..."
  const loadingId = 'loading-' + Date.now();
  const loadingDiv = document.createElement('div');
  loadingDiv.id = loadingId;
  loadingDiv.className = 'd-flex justify-content-start mb-3'; // Estilo Bootstrap
  loadingDiv.innerHTML = `
      <div class="p-3 rounded bg-light border text-secondary">
          <em>🤖 Analizando documento...</em>
      </div>
  `;
  messages.appendChild(loadingDiv);
  messages.scrollTop = messages.scrollHeight;

  try {
    // 3. Enviar a Laravel
    const response = await fetch(`${API_BASE_URL}/chats/${state.currentChatId}/mensaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ content: text })
    });

    const data = await response.json();
    
    // Quitar "Escribiendo..."
    document.getElementById(loadingId)?.remove();

    if (data.status === 'success') {
      const aiText = data.ai_message.content;
      appendMessage('bot', aiText);

      state.lastBotResponse = aiText;
      state.audioBase64 = data.audio_base64 || null;

    } else {
      appendMessage('bot', '❌ Error: La IA no respondió correctamente.');
    }

  } catch (error) {
    document.getElementById(loadingId)?.remove();
    appendMessage('bot', '❌ Error de conexión con el servidor.');
    console.error(error);
  } finally {
    questionInput.disabled = false;
    sendBtn.disabled = false;
    questionInput.focus();
  }
}

// Renderizar una burbuja de mensaje
function appendMessage(kind, text) {
  const div = document.createElement('div');
  
  // Clases Bootstrap para alinear
  // User: Derecha, Azul
  // Bot: Izquierda, Gris/Blanco
  if (kind === 'user') {
      div.className = 'd-flex justify-content-end mb-3';
      div.innerHTML = `
          <div class="p-3 rounded bg-primary text-white" style="max-width: 80%;">
              ${escapeHtml(text).replace(/\n/g, '<br>')}
          </div>
      `;
  } else {
      div.className = 'd-flex justify-content-start mb-3';
      div.innerHTML = `
          <div class="p-3 rounded bg-light border" style="max-width: 80%;">
              ${escapeHtml(text).replace(/\n/g, '<br>')}
          </div>
      `;
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────
// 9. REPRODUCCIÓN DE AUDIO
// ─────────────────────────────────────────────────────────────────────────

playAudioBtn?.addEventListener('click', () => {
  if (state.audioBase64) {
    playAudioFromBase64(state.audioBase64);
  } else if (state.lastBotResponse) {
    speakText(state.lastBotResponse);
  } else {
    showSystemMessage('No hay texto para reproducir.', 'warning');
  }
});

function playAudioFromBase64(b64) {
  try {
    const audio = new Audio("data:audio/mp3;base64," + b64);
    audio.play();
  } catch (e) {
    console.error("Fallo audio base64", e);
    speakText(state.lastBotResponse);
  }
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'es-ES';
    window.speechSynthesis.speak(ut);
  } else {
    alert('Tu navegador no soporta audio.');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 10. UTILIDADES
// ─────────────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Alertas flotantes bonitas con Bootstrap
function showSystemMessage(msg, type = 'info') {
    const container = document.querySelector('.container') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top m-3 shadow`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '500px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    
    alertDiv.innerHTML = `
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insertar al principio del container
    if(container.firstChild) {
        container.insertBefore(alertDiv, container.firstChild);
    } else {
        container.appendChild(alertDiv);
    }
    
    setTimeout(() => alertDiv.remove(), 4000);
}

function showLoading(msg) {
    // Opcional: Mostrar spinner global
}
function hideLoading() {}

function showError(msg) { showSystemMessage(msg, 'danger'); }
function showSuccess(msg) { showSystemMessage(msg, 'success'); }
