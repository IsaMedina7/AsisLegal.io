/**
 * ============================================================================
 * AsisLegal Frontend - app.js (VERSIÓN FINAL FUSIONADA)
 * ============================================================================
 * * Lógica completa para conectar con Laravel (Puerto 8080).
 */

// ─────────────────────────────────────────────────────────────────────────
// 1. CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────

// IMPORTANTE: Apuntar al puerto 8080 donde corre Laravel
const API_BASE_URL = 'http://127.0.0.1:8080/api';

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  // NOTA: No definimos Content-Type globalmente para permitir FormData automático
};

// ─────────────────────────────────────────────────────────────────────────
// 2. ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────────────────

const state = {
  currentChatId: null,    // ID del chat abierto
  lastBotResponse: '',    // Texto para TTS (Text-to-Speech)
  audioBase64: null,      // Audio binario mp3
  chats: []               // Cache de lista de chats
};

// ─────────────────────────────────────────────────────────────────────────
// 3. SELECTORES DEL DOM
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
// 4. INICIALIZACIÓN Y NAVEGACIÓN
// ─────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  console.log(`🚀 AsisLegal Iniciado. Backend: ${API_BASE_URL}`);
  loadChatsList(); // Cargar historial al abrir
});

// Botón "Comenzar"
startBtn?.addEventListener('click', () => {
  showChat();
  loadChatsList();
});

// Botón "Volver"
backBtn?.addEventListener('click', () => {
  showWelcome();
  state.currentChatId = null;
});

function showChat() {
  if(welcomeScreen) welcomeScreen.classList.add('d-none');
  if(chatScreen) chatScreen.classList.remove('d-none');
}

function showWelcome() {
  if(chatScreen) chatScreen.classList.add('d-none');
  if(welcomeScreen) welcomeScreen.classList.remove('d-none');
}

// ─────────────────────────────────────────────────────────────────────────
// 5. GESTIÓN DE ARCHIVOS (SUBIDA)
// ─────────────────────────────────────────────────────────────────────────

uploadBtn?.addEventListener('click', () => fileInput.click());

fileInput?.addEventListener('change', (e) => {
  const selected = Array.from(e.target.files || []);
  if (selected.length > 0) {
    handleFileUpload(selected[0]);
  }
});

async function handleFileUpload(file) {
  // Validaciones
  if (file.type !== 'application/pdf') {
    showError('❌ Solo se aceptan archivos PDF'); 
    return; 
  }
  if (file.size > 10 * 1024 * 1024) { 
    showError('❌ El archivo es muy grande (Máx 10MB)'); 
    return; 
  }

  showLoading('Subiendo y analizando documento...');

  try {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('titulo', file.name.replace('.pdf', '')); // Título sugerido

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

    showSuccess(`✅ Documento "${file.name}" subido correctamente`);
    
    // Recargar lista y abrir el chat creado
    await loadChatsList();
    if(data.data && data.data.id_chat) {
        openChat(data.data.id_chat);
    }

  } catch (error) {
    console.error(error);
    showError(`Error: ${error.message}`);
  } finally {
    hideLoading();
    fileInput.value = ''; 
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 6. HISTORIAL DE CHATS
// ─────────────────────────────────────────────────────────────────────────

async function loadChatsList() {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`);
    const data = await response.json();

    if(data.status === 'success') {
      state.chats = data.data;
      renderChatsList(state.chats);
    }
  } catch (error) {
    console.error('Error cargando chats:', error);
    showError('No se pudo cargar el historial');
  }
}

function renderChatsList(chats) {
  if (!filesList) return;
  filesList.innerHTML = '';

  if (chats.length === 0) {
    filesList.innerHTML = '<div class="text-muted p-2">📂 No hay documentos. Sube uno.</div>';
    return;
  }

  chats.forEach(chat => {
    const div = document.createElement('div');
    // Estilos compatibles con Bootstrap
    div.className = 'p-2 border-bottom d-flex justify-content-between align-items-center file-item';
    div.style.cursor = 'pointer';
    
    const fecha = new Date(chat.created_at).toLocaleDateString();
    
    div.innerHTML = `
      <div class="text-truncate" style="max-width: 70%;">
        <strong>${escapeHtml(chat.title || 'Sin título')}</strong><br>
        <small class="text-muted">${fecha}</small>
      </div>
      <button class="btn btn-sm btn-outline-primary abrir-chat-btn" data-id="${chat.id_chat}">Abrir</button>
    `;
    
    // Listener al div completo o botón
    div.addEventListener('click', () => openChat(chat.id_chat));
    filesList.appendChild(div);
  });
}

async function openChat(chatId) {
  showLoading('Cargando conversación...');
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);
    const data = await response.json();

    if(data.status === 'success') {
      state.currentChatId = chatId;
      state.audioBase64 = null; 
      state.lastBotResponse = '';
      
      const chatData = data.data;

      // Actualizar Título UI (Si tienes un elemento para el título)
      const headerTitle = document.querySelector('.chat-header-title'); 
      if(headerTitle) headerTitle.textContent = chatData.title;

      // Limpiar y renderizar mensajes
      messages.innerHTML = '';
      
      if(chatData.messages && chatData.messages.length > 0) {
        chatData.messages.forEach(msg => {
          // Mapeo: 'IA' en BD -> 'bot' en CSS
          const tipo = msg.sender === 'user' ? 'user' : 'bot';
          appendMessage(tipo, msg.content);
          
          if(msg.sender === 'IA') state.lastBotResponse = msg.content;
        });
      } else {
        messages.innerHTML = '<div class="text-center text-muted mt-4">💬 Chat iniciado. Pregunta algo sobre el documento.</div>';
      }

      showChat();
    }
  } catch (error) {
    showError('No se pudo abrir el chat');
  } finally {
    hideLoading();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 7. ENVÍO DE MENSAJES
// ─────────────────────────────────────────────────────────────────────────

sendBtn?.addEventListener('click', onSend);
questionInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') onSend();
});

async function onSend() {
  const text = questionInput.value.trim();
  if (!text || !state.currentChatId) return;

  // 1. Mostrar mensaje usuario inmediatamente
  appendMessage('user', text);
  questionInput.value = '';
  questionInput.disabled = true; 
  sendBtn.disabled = true;
  
  // 2. Mostrar indicador de "Escribiendo..."
  const loadingId = 'loading-' + Date.now();
  const loadingDiv = document.createElement('div');
  loadingDiv.id = loadingId;
  loadingDiv.className = 'message bot';
  loadingDiv.innerHTML = '<em>🤖 Analizando...</em>';
  messages.appendChild(loadingDiv);
  messages.scrollTop = messages.scrollHeight;

  try {
    // 3. Enviar a Laravel (Puerto 8080)
    const response = await fetch(`${API_BASE_URL}/chats/${state.currentChatId}/mensaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ content: text })
    });

    const data = await response.json();
    
    // Quitar loading
    document.getElementById(loadingId)?.remove();

    if(data.status === 'success') {
      // 4. Mostrar respuesta IA
      const aiText = data.ai_message.content;
      appendMessage('bot', aiText);
      
      state.lastBotResponse = aiText;
      state.audioBase64 = data.audio_base64 || null;

      // Habilitar botón de audio
      if(playAudioBtn) playAudioBtn.disabled = !state.audioBase64;

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

function appendMessage(kind, text) {
  const div = document.createElement('div');
  div.className = `message ${kind}`; // Clases: .message.user o .message.bot
  div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────
// 8. AUDIO
// ─────────────────────────────────────────────────────────────────────────

playAudioBtn?.addEventListener('click', () => {
    if (state.audioBase64) {
        playAudioFromBase64(state.audioBase64);
    } else if (state.lastBotResponse) {
        // Fallback a voz del navegador
        speakText(state.lastBotResponse);
    } else {
        showError('No hay audio disponible para reproducir.');
    }
});

function playAudioFromBase64(b64) {
    try {
        const audio = new Audio("data:audio/mp3;base64," + b64);
        audio.play();
    } catch (e) {
        console.error("Error reproduciendo audio base64", e);
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
// 9. UTILIDADES UI (ALERTAS)
// ─────────────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  if(!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Función para mostrar alertas Bootstrap
function showSystemMessage(msg, type = 'info') {
    const container = document.querySelector('.container') || document.body;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 4000);
}

function showLoading(msg) {
    // Puedes implementar un spinner aquí si quieres
    console.log("Cargando...", msg);
}

function hideLoading() {
    // Ocultar spinner
}

function showError(msg) {
    showSystemMessage(msg, 'danger');
}

function showSuccess(msg) {
    showSystemMessage(msg, 'success');
}
