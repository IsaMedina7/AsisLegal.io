/**
 * AsisLegal Frontend - app.js
 * Versión limpia y estable apuntando a Laravel en
 * http://127.0.0.1:8080/api
 */

// CONFIG
const API_BASE_URL = 'http://127.0.0.1:8080/api';
const DEFAULT_HEADERS = { 'Accept': 'application/json' };

// ESTADO GLOBAL
const state = {
  currentChatId: null,
  lastBotResponse: '',
  audioBase64: null,
  chats: []
};

// SELECTORES
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

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  console.log(`🚀 Conectando a Backend: ${API_BASE_URL}`);
  loadChatsList();
});

// NAVEGACIÓN
startBtn?.addEventListener('click', () => { showChat(); loadChatsList(); });
backBtn?.addEventListener('click', () => { showWelcome(); state.currentChatId = null; });

function showChat() { if (welcomeScreen) welcomeScreen.classList.add('d-none'); if (chatScreen) chatScreen.classList.remove('d-none'); }
function showWelcome() { if (chatScreen) chatScreen.classList.add('d-none'); if (welcomeScreen) welcomeScreen.classList.remove('d-none'); }

// UPLOAD
uploadBtn?.addEventListener('click', () => fileInput.click());
fileInput?.addEventListener('change', (e) => { const selected = Array.from(e.target.files || []); if (selected.length > 0) handleFileUpload(selected[0]); });

async function handleFileUpload(file) {
  if (!file) return;
  if (file.type !== 'application/pdf') { showError('❌ Solo se aceptan archivos PDF'); return; }
  if (file.size > 10 * 1024 * 1024) { showError('❌ El archivo es muy grande (Máx 10MB)'); return; }

  showLoading('Subiendo y analizando documento...');
  try {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('titulo', file.name.replace(/\.pdf$/i, ''));

    const res = await fetch(`${API_BASE_URL}/chats`, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

    showSuccess(`✅ Documento "${file.name}" cargado correctamente`);
    await loadChatsList();
    if (data.data?.id_chat) openChat(data.data.id_chat);
  } catch (err) { console.error('Error al subir documento:', err); showError(`❌ Error: ${err.message}`); }
  finally { hideLoading(); if (fileInput) fileInput.value = ''; }
}

// CHATS
async function loadChatsList() {
  try {
    const res = await fetch(`${API_BASE_URL}/chats`, { headers: DEFAULT_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'success') { state.chats = data.data || []; renderChatsList(state.chats); }
    else { state.chats = []; renderChatsList([]); }
  } catch (err) { console.error('Error cargando chats:', err); showError('⚠️ No se pudieron cargar los chats'); }
}

function renderChatsList(chats) {
  if (!filesList) return;
  filesList.innerHTML = '';
  if (!chats || chats.length === 0) { filesList.innerHTML = '<div class="text-muted p-2">No hay documentos subidos.</div>'; return; }
  chats.forEach(chat => {
    const div = document.createElement('div');
    div.className = 'p-2 border-bottom d-flex justify-content-between align-items-center';
    div.style.cursor = 'pointer';
    div.innerHTML = `\n      <div class="text-truncate" style="max-width: 200px;">\n        <strong>${escapeHtml(chat.title || 'Sin título')}</strong><br>\n        <small class="text-muted">${new Date(chat.created_at).toLocaleDateString()}</small>\n      </div>\n      <button class="btn btn-sm btn-primary">Abrir</button>\n    `;
    div.addEventListener('click', () => openChat(chat.id_chat));
    filesList.appendChild(div);
  });
}

async function openChat(chatId) {
  if (!chatId) return;
  showLoading('Cargando conversación...');
  try {
    const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, { headers: DEFAULT_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'success') {
      const chat = data.data; state.currentChatId = chatId; state.audioBase64 = null; state.lastBotResponse = '';
      const header = document.querySelector('.card-header h5'); const sub = document.querySelector('.card-header small');
      if (header) header.textContent = chat.title || ''; if (sub) sub.textContent = chat.document?.nombre || '';
      messages.innerHTML = '';
      if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach(msg => { const tipo = msg.sender === 'user' ? 'user' : 'bot'; appendMessage(tipo, msg.content); if (msg.sender === 'IA') state.lastBotResponse = msg.content; });
      } else { messages.innerHTML = '<div class="text-center text-muted mt-3">💬 Inicia la conversación</div>'; }
      showChat();
    }
  } catch (err) { console.error('Error al abrir chat:', err); showError('⚠️ No se pudo abrir el chat'); }
  finally { hideLoading(); }
}

// MENSAJES
sendBtn?.addEventListener('click', onSend);
questionInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } });

async function onSend() {
  const text = questionInput?.value?.trim(); if (!text) return; if (!state.currentChatId) { showError('⚠️ No hay chat abierto'); return; }
  appendMessage('user', text); if (questionInput) questionInput.value = ''; if (questionInput) questionInput.disabled = true;
  const loadingId = 'tmp-' + Date.now(); const loadingDiv = document.createElement('div'); loadingDiv.id = loadingId; loadingDiv.className = 'message bot'; loadingDiv.innerHTML = '<em>🤖 IA procesando...</em>'; messages.appendChild(loadingDiv); messages.scrollTop = messages.scrollHeight;
  try {
    const res = await fetch(`${API_BASE_URL}/chats/${state.currentChatId}/mensaje`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ content: text }) });
    const data = await res.json(); document.getElementById(loadingId)?.remove(); if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    if (data.status === 'success') { const aiText = data.ai_message?.content || ''; appendMessage('bot', aiText); state.lastBotResponse = aiText; state.audioBase64 = data.audio_base64 || null; if (playAudioBtn) playAudioBtn.disabled = !state.audioBase64; } else { appendMessage('bot', '❌ Error: La IA no pudo responder.'); }
  } catch (err) { document.getElementById(loadingId)?.remove(); console.error('Error al enviar mensaje:', err); appendMessage('bot', `❌ Error: ${err.message}`); }
  finally { if (questionInput) { questionInput.disabled = false; questionInput.focus(); } }
}

function appendMessage(kind, text) { const div = document.createElement('div'); div.className = `message ${kind}`; div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>'); messages.appendChild(div); messages.scrollTop = messages.scrollHeight; }

// AUDIO
playAudioBtn?.addEventListener('click', () => { if (state.audioBase64) playAudioFromBase64(state.audioBase64); else if (state.lastBotResponse) speakText(state.lastBotResponse); else showError('❌ No hay audio para reproducir'); });
function playAudioFromBase64(b64) { try { const audio = new Audio('data:audio/mp3;base64,' + b64); audio.play().catch(err => { console.error('Error reproducir audio', err); speakText(state.lastBotResponse); }); } catch (err) { console.error(err); speakText(state.lastBotResponse); } }
function speakText(text) { if (!('speechSynthesis' in window)) { showError('❌ Tu navegador no soporta síntesis de voz'); return; } const u = new SpeechSynthesisUtterance(text); u.lang = 'es-ES'; u.rate = 1; u.pitch = 1; u.volume = 1; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }

// UTIL
function escapeHtml(s) { if (s === undefined || s === null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function showError(message) { const container = document.querySelector('.container') || document.body; const alert = document.createElement('div'); alert.className = 'alert alert-danger alert-dismissible fade show mt-3'; alert.setAttribute('role', 'alert'); alert.innerHTML = `${escapeHtml(message)} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`; container.insertBefore(alert, container.firstChild); setTimeout(() => alert.remove(), 5000); }
function showSuccess(message) { const container = document.querySelector('.container') || document.body; const alert = document.createElement('div'); alert.className = 'alert alert-success alert-dismissible fade show mt-3'; alert.setAttribute('role', 'alert'); alert.innerHTML = `${escapeHtml(message)} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`; container.insertBefore(alert, container.firstChild); setTimeout(() => alert.remove(), 3000); }
function showLoading(message) { const container = document.querySelector('.container') || document.body; if (document.getElementById('loading-alert')) return; const alert = document.createElement('div'); alert.id = 'loading-alert'; alert.className = 'alert alert-info mt-3'; alert.setAttribute('role', 'status'); alert.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> ${escapeHtml(message)}`; container.insertBefore(alert, container.firstChild); }
function hideLoading() { const a = document.getElementById('loading-alert'); if (a) a.remove(); }

// FIN

