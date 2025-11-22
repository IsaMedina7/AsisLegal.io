/**
 * ============================================================================
<<<<<<< HEAD
 * AsisLegal Frontend - app.js (VERSIÓN CON INTEGRACIÓN BACKEND)
 * ============================================================================
 * 
 * Este archivo contiene la lógica JavaScript para:
 * 1. Conectar con API REST en Laravel (Backend)
 * 2. Subir documentos (PDFs)
 * 3. Mostrar historial de chats
 * 4. Enviar preguntas a IA
 * 5. Reproducir respuestas de audio
 * 
 * API Base URL: http://127.0.0.1:8080/api
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
};

// ─────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────────────────

const state = {
  files: [],              // {name, type, content?}
  currentChatId: null,    // ID del chat actualmente abierto
  lastBotResponse: '',    // Última respuesta del bot
  audioBase64: null,      // Audio base64 de la última respuesta
  chats: []               // Lista de chats del usuario
};

// ─────────────────────────────────────────────────────────────────────────
// SELECTORES DEL DOM
// ─────────────────────────────────────────────────────────────────────────

=======
 * AsisLegal Frontend - app.js (CORREGIDO Y FINAL)
 * ============================================================================
 */

// 1. CONFIGURACIÓN (Apunta a Laravel, no a Python)
const API_BASE_URL = 'http://127.0.0.1:8080/api'; 

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  // NO enviar Content-Type aquí para que FormData funcione automáticamente
};

// 2. ESTADO GLOBAL
const state = {
  currentChatId: null,    // ID del chat actual
  lastBotResponse: '',    // Texto para leer en voz alta
  audioBase64: null,      // Audio binario
  chats: []               // Lista para el sidebar
};

// 3. SELECTORES DEL DOM
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
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
<<<<<<< HEAD
// EVENTOS - NAVEGACIÓN
// ─────────────────────────────────────────────────────────────────────────

=======
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log(`🚀 Conectando a Backend: ${API_BASE_URL}`);
  loadChatsList(); // Cargar historial al iniciar
});

// ─────────────────────────────────────────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────────────────────────────────────────

// Botón "Comenzar" (Si existe en tu HTML)
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
startBtn?.addEventListener('click', () => {
  showChat();
  loadChatsList();
});

<<<<<<< HEAD
=======
// Botón "Volver" (Del chat al home)
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
backBtn?.addEventListener('click', () => {
  showWelcome();
  state.currentChatId = null;
});

function showChat() {
<<<<<<< HEAD
  welcomeScreen.classList.add('d-none');
  chatScreen.classList.remove('d-none');
}

function showWelcome() {
  chatScreen.classList.add('d-none');
  welcomeScreen.classList.remove('d-none');
}

// ─────────────────────────────────────────────────────────────────────────
// EVENTOS - GESTIÓN DE ARCHIVOS
// ─────────────────────────────────────────────────────────────────────────

uploadBtn?.addEventListener('click', () => {
  fileInput.click();
});

fileInput?.addEventListener('change', (e) => {
  const selected = Array.from(e.target.files || []);
  if (selected.length > 0) {
    handleFileUpload(selected[0]); // Tomar primer archivo
  }
});

/**
 * Sube un documento PDF a través de la API
 * POST /api/chats
 */
async function handleFileUpload(file) {
  // Validación
  if (file.type !== 'application/pdf') {
    showError('❌ Solo se aceptan archivos PDF');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showError('❌ El archivo no debe superar 10MB');
    return;
  }

  showLoading('⏳ Subiendo documento...');

  try {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('titulo', `Chat: ${file.name}`);

    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      body: formData
      // NO incluir Content-Type, el navegador lo hace automáticamente
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.errors || `Error HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    if (data.status === 'success') {
      showSuccess(`✅ Documento "${file.name}" cargado correctamente`);

      // Abrir el chat creado
      await openChat(data.data.id_chat);

      // Recargar lista de chats
      await loadChatsList();
    }
  } catch (error) {
    console.error('Error al subir documento:', error);
    showError(`❌ Error: ${error.message}`);
  } finally {
    hideLoading();
    fileInput.value = ''; // Limpiar input
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GESTIÓN DE CHATS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Carga la lista de chats del usuario
 * GET /api/chats
 */
async function loadChatsList() {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success') {
      state.chats = data.data || [];
      renderChatsList(state.chats);
    }
  } catch (error) {
    console.error('Error al cargar chats:', error);
    showError('⚠️ No se pudieron cargar los chats');
  }
}

/**
 * Renderiza la lista de chats en el sidebar
 */
function renderChatsList(chats) {
  filesList.innerHTML = '';

  if (chats.length === 0) {
    filesList.innerHTML = '<div class="text-muted">📂 No hay documentos. Sube uno.</div>';
    return;
  }

  chats.forEach((chat) => {
    const div = document.createElement('div');
    div.className = 'file-item d-flex align-items-start justify-content-between mb-2';

    const fecha = new Date(chat.created_at).toLocaleDateString('es-ES');
    const titulo = escapeHtml(chat.title);

    div.innerHTML = `
      <div>
        <strong>${titulo}</strong>
        <div class="text-muted small">${fecha}</div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" data-chat-id="${chat.id_chat}">
        📖
      </button>
    `;

    filesList.appendChild(div);
  });

  // Delegación: escuchar clics en botones
  filesList.querySelectorAll('button[data-chat-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const chatId = Number(e.currentTarget.getAttribute('data-chat-id'));
      openChat(chatId);
=======
  if(welcomeScreen) welcomeScreen.classList.add('d-none');
  if(chatScreen) chatScreen.classList.remove('d-none');
}

function showWelcome() {
  if(chatScreen) chatScreen.classList.add('d-none');
  if(welcomeScreen) welcomeScreen.classList.remove('d-none');
}

// ─────────────────────────────────────────────────────────────────────────
// GESTIÓN DE ARCHIVOS (UPLOAD)
// ─────────────────────────────────────────────────────────────────────────

uploadBtn?.addEventListener('click', () => fileInput.click());

fileInput?.addEventListener('change', (e) => {
  const selected = Array.from(e.target.files || []);
  if (selected.length > 0) {
    handleFileUpload(selected[0]);
  }
});

async function handleFileUpload(file) {
  // Validaciones Frontend
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
    formData.append('pdf_file', file); // Debe coincidir con Laravel ($request->file('pdf_file'))
    formData.append('titulo', file.name.replace('.pdf', '')); // Título automático

    // Petición al Backend
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
        // OJO: No poner Content-Type aquí, fetch lo pone solo para Multipart
      }
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Error al subir archivo');

    showSuccess('✅ Documento cargado exitosamente');
    
    // Actualizar la UI
    await loadChatsList();
    
    // Entrar directamente al chat creado
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
// HISTORIAL DE CHATS
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
  }
}

function renderChatsList(chats) {
  if (!filesList) return;
  filesList.innerHTML = '';

  if (chats.length === 0) {
    filesList.innerHTML = '<div class="text-muted p-2">No hay documentos subidos.</div>';
    return;
  }

  chats.forEach(chat => {
    const div = document.createElement('div');
    // Estilos Bootstrap básicos
    div.className = 'p-2 border-bottom d-flex justify-content-between align-items-center';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div class="text-truncate" style="max-width: 200px;">
        <strong>${escapeHtml(chat.title || 'Sin título')}</strong><br>
        <small class="text-muted">${new Date(chat.created_at).toLocaleDateString()}</small>
      </div>
      <button class="btn btn-sm btn-primary">Abrir</button>
    `;
    
    // Click en todo el elemento o el botón
    div.addEventListener('click', () => openChat(chat.id_chat));
    filesList.appendChild(div);
  });
}

<<<<<<< HEAD
/**
 * Abre un chat y carga su historial
 * GET /api/chats/{id}
 */
async function openChat(chatId) {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success') {
      const chat = data.data;
      state.currentChatId = chatId;
      state.audioBase64 = null;
      state.lastBotResponse = '';

      // Actualizar header
      const header = document.querySelector('.card-header h5');
      const subheader = document.querySelector('.card-header small');
      if (header) header.textContent = chat.title;
      if (subheader) subheader.textContent = chat.document?.nombre || 'Documento';

      // Cargar mensajes
      messages.innerHTML = '';

      if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach((msg) => {
          appendMessage(
            msg.sender === 'user' ? 'user' : 'bot',
            msg.content
          );
        });
        // Guardar última respuesta del bot para audio
        const lastBotMsg = [...chat.messages].reverse().find(m => m.sender === 'IA');
        if (lastBotMsg) state.lastBotResponse = lastBotMsg.content;
      } else {
        messages.innerHTML = '<div class="text-center text-muted mt-3">💬 Inicia una conversación</div>';
      }

      // Mostrar pantalla de chat
      showChat();
    }
  } catch (error) {
    console.error('Error al abrir chat:', error);
    showError('⚠️ No se pudo abrir el chat');
=======
async function openChat(chatId) {
  showLoading('Cargando conversación...');
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);
    const data = await response.json();

    if(data.status === 'success') {
      state.currentChatId = chatId;
      state.audioBase64 = null; // Reset audio
      
      // Renderizar mensajes antiguos
      messages.innerHTML = '';
      const chatData = data.data;
      
      // Cambiar a pantalla de chat
      showChat();

      // Título del chat en la UI (si tienes un elemento para eso)
      // document.getElementById('chat-title').innerText = chatData.title;

      if(chatData.messages && chatData.messages.length > 0) {
        chatData.messages.forEach(msg => {
          // Mapeamos 'IA' (base de datos) a 'bot' (clase CSS)
          const tipo = msg.sender === 'user' ? 'user' : 'bot';
          appendMessage(tipo, msg.content);
          
          // Guardar el último mensaje de IA para reproducir
          if(msg.sender === 'IA') state.lastBotResponse = msg.content;
        });
      } else {
        messages.innerHTML = '<div class="text-center text-muted mt-4">Inicia la conversación preguntando sobre el documento.</div>';
      }
    }
  } catch (error) {
    showError('No se pudo cargar el chat');
  } finally {
    hideLoading();
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
  }
}

// ─────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
// ENVÍO DE MENSAJES
=======
// ENVIAR MENSAJES (LÓGICA PRINCIPAL)
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
// ─────────────────────────────────────────────────────────────────────────

sendBtn?.addEventListener('click', onSend);
questionInput?.addEventListener('keydown', (e) => {
<<<<<<< HEAD
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
});

/**
 * Envía un mensaje a la IA
 * POST /api/chats/{id}/mensaje
 */
async function onSend() {
  const text = questionInput.value.trim();

  if (!text) return;

  if (!state.currentChatId) {
    showError('⚠️ No hay chat abierto');
    return;
  }

  // Mostrar mensaje del usuario
  appendMessage('user', text);
  questionInput.value = '';

  // Mostrar indicador de procesamiento
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot';
  loadingDiv.innerHTML = '<em>🤖 IA procesando...</em>';
  messages.appendChild(loadingDiv);
  messages.scrollTop = messages.scrollHeight;

  // Desabilitar input mientras se procesa
  questionInput.disabled = true;
  sendBtn.disabled = true;

  try {
    const response = await fetch(
      `${API_BASE_URL}/chats/${state.currentChatId}/mensaje`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ content: text })
      }
    );

    // Remover indicador de carga
    loadingDiv.remove();

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Error HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    if (data.status === 'success') {
      // Mostrar respuesta de IA
      const aiResponse = data.ai_message.content;
      appendMessage('bot', aiResponse);
      state.lastBotResponse = aiResponse;

      // Guardar audio si está disponible
      if (data.audio_base64) {
        state.audioBase64 = data.audio_base64;
        playAudioBtn.disabled = false;
      } else {
        playAudioBtn.disabled = true;
      }
    }
  } catch (error) {
    // Remover indicador de carga
    loadingDiv.remove();
    console.error('Error al enviar mensaje:', error);
    appendMessage('bot', `❌ Error: ${error.message}`);
  } finally {
    // Rehabilitar input
    questionInput.disabled = false;
    sendBtn.disabled = false;
=======
  if (e.key === 'Enter') onSend();
});

async function onSend() {
  const text = questionInput.value.trim();
  if (!text || !state.currentChatId) return;

  // 1. UI Inmediata
  appendMessage('user', text);
  questionInput.value = '';
  questionInput.disabled = true; // Evitar doble envío
  
  // 2. Loading falso (UX)
  const loadingId = 'temp-loading-' + Date.now();
  const loadingDiv = document.createElement('div');
  loadingDiv.id = loadingId;
  loadingDiv.className = 'message bot';
  loadingDiv.innerHTML = '<em>Escribiendo...</em>';
  messages.appendChild(loadingDiv);
  messages.scrollTop = messages.scrollHeight;

  try {
    // 3. Petición al Backend
    const response = await fetch(`${API_BASE_URL}/chats/${state.currentChatId}/mensaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ content: text })
    });

    const data = await response.json();
    
    // Quitar mensaje de "Escribiendo..."
    document.getElementById(loadingId)?.remove();

    if(data.status === 'success') {
      // 4. Mostrar respuesta real
      const aiText = data.ai_message.content;
      appendMessage('bot', aiText);
      
      state.lastBotResponse = aiText;
      state.audioBase64 = data.audio_base64 || null; // Guardar audio si viene

      // Habilitar botón de audio si hay audio
      if(playAudioBtn) playAudioBtn.disabled = !state.audioBase64;
    } else {
        appendMessage('bot', '❌ Error: La IA no pudo responder.');
    }

  } catch (error) {
    document.getElementById(loadingId)?.remove();
    appendMessage('bot', '❌ Error de conexión con el servidor.');
  } finally {
    questionInput.disabled = false;
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
    questionInput.focus();
  }
}

<<<<<<< HEAD
/**
 * Añade un mensaje a la UI
 */
function appendMessage(kind, text) {
  const safe = escapeHtml(text).replace(/\n/g, '<br>');
=======
function appendMessage(kind, text) {
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
  const div = document.createElement('div');
  // Clases CSS asumidas: .message, .user (derecha/azul), .bot (izquierda/gris)
  div.className = `message ${kind}`; 
  // Procesar saltos de línea y seguridad
  div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
// REPRODUCCIÓN DE AUDIO
// ─────────────────────────────────────────────────────────────────────────

playAudioBtn?.addEventListener('click', () => {
  if (state.audioBase64) {
    playAudioFromBase64(state.audioBase64);
  } else if (state.lastBotResponse) {
    // Fallback: usar Web Speech API
    speakText(state.lastBotResponse);
  } else {
    showError('❌ No hay audio para reproducir');
  }
});

/**
 * Reproduce audio desde string base64
 */
function playAudioFromBase64(base64String) {
  try {
    const audioBlob = base64ToBlob(base64String);
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio();
    audio.src = audioUrl;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      showSuccess('✅ Audio finalizado');
    };

    audio.onerror = (error) => {
      console.error('Error reproduciendo audio:', error);
      // Fallback
      speakText(state.lastBotResponse);
    };

    audio.play().catch((err) => {
      console.error('Error al reproducir:', err);
      speakText(state.lastBotResponse);
    });
  } catch (error) {
    console.error('Error con audio base64:', error);
    speakText(state.lastBotResponse);
  }
}

/**
 * Convierte base64 a Blob
 */
function base64ToBlob(base64String) {
  const byteCharacters = atob(base64String);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'audio/mp3' });
}

/**
 * Fallback: usa Web Speech API para síntesis de voz
 */
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    showError('❌ Tu navegador no soporta síntesis de voz');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  showSuccess('🔊 Reproduciendo...');
}

// ─────────────────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Trunca un string a N caracteres
 */
function truncate(s, n) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n) + '...';
}

/**
 * Muestra mensaje de error
 */
function showError(message) {
  const alertContainer = document.querySelector('.container');
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger alert-dismissible fade show mt-3';
  alert.setAttribute('role', 'alert');
  alert.innerHTML = `
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertContainer.insertBefore(alert, alertContainer.firstChild);

  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

/**
 * Muestra mensaje de éxito
 */
function showSuccess(message) {
  const alertContainer = document.querySelector('.container');
  const alert = document.createElement('div');
  alert.className = 'alert alert-success alert-dismissible fade show mt-3';
  alert.setAttribute('role', 'alert');
  alert.innerHTML = `
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertContainer.insertBefore(alert, alertContainer.firstChild);

  // Auto-cerrar después de 3 segundos
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

/**
 * Muestra indicador de carga
 */
function showLoading(message) {
  const alertContainer = document.querySelector('.container');
  const alert = document.createElement('div');
  alert.className = 'alert alert-info mt-3';
  alert.setAttribute('role', 'status');
  alert.id = 'loading-alert';
  alert.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>
    ${escapeHtml(message)}
  `;
  alertContainer.insertBefore(alert, alertContainer.firstChild);
}

/**
 * Oculta indicador de carga
 */
function hideLoading() {
  const loadingAlert = document.getElementById('loading-alert');
  if (loadingAlert) {
    loadingAlert.remove();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────

// Cargar chats cuando se abre la pantalla de chat
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 AsisLegal cargado');
  console.log(`📡 API Base: ${API_BASE_URL}`);
});
=======
// AUDIO
// ─────────────────────────────────────────────────────────────────────────

playAudioBtn?.addEventListener('click', () => {
    if (state.audioBase64) {
        playAudioFromBase64(state.audioBase64);
    } else if (state.lastBotResponse) {
        // Fallback si no hay audio de Gemini pero hay texto
        speakText(state.lastBotResponse);
    }
});

function playAudioFromBase64(b64) {
    try {
        const audio = new Audio("data:audio/mp3;base64," + b64);
        audio.play();
    } catch (e) {
        console.error("Error reproduciendo audio", e);
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
// UTILIDADES UI
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

function showLoading(msg) {
    // Implementa tu overlay de carga aquí o usa alert simple por ahora
    // console.log("Loading...", msg);
}
function hideLoading() {
    // Ocultar overlay
}
function showError(msg) {
    alert(msg);
}
function showSuccess(msg) {
    console.log(msg);
}
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
