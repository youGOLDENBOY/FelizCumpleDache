/* =============================================
   DACHE BIRTHDAY — app.js
   ============================================= */

// ─── CONFIGURACIÓN ───────────────────────────
const CONFIG = {
  BIRTHDAY:    new Date('2026-03-30T00:00:00'),
  SECRET_CODE: '0880',
  SONG_TITLE:  'Tu canción especial',
  SONG_ARTIST: '',
};
// ──────────────────────────────────────────────


// ---- FIREBASE ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, orderBy, query, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDfuFrYuyYdqNcipB9usS6X5_1OvLjIruA",
  authDomain:        "dache-birthday.firebaseapp.com",
  projectId:         "dache-birthday",
  storageBucket:     "dache-birthday.firebasestorage.app",
  messagingSenderId: "976446287016",
  appId:             "1:976446287016:web:8467df8cd40058edb6e69d"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);


// ---- REPRODUCTOR DE AUDIO ----
const audio       = document.getElementById('bg-audio');
const playBtn     = document.getElementById('ap-play-btn');
const apIcon      = document.getElementById('ap-icon');
const apFill      = document.getElementById('ap-fill');
const apCurrent   = document.getElementById('ap-current');
const apDuration  = document.getElementById('ap-duration');
const apVolume    = document.getElementById('ap-volume');
const apPlayer    = document.getElementById('audio-player');
const apTitle     = document.getElementById('ap-song-title');
const apArtist    = document.getElementById('ap-song-artist');
const progressBar = document.querySelector('.ap-progress-bar');

apTitle.textContent  = CONFIG.SONG_TITLE;
apArtist.textContent = CONFIG.SONG_ARTIST;
audio.volume = 0.7;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2,'0')}`;
}

playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().catch(() => {});
    apIcon.textContent = '⏸';
    apPlayer.classList.add('playing');
  } else {
    audio.pause();
    apIcon.textContent = '▶';
    apPlayer.classList.remove('playing');
  }
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  apFill.style.width = pct + '%';
  apCurrent.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  apDuration.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('click', e => {
  const rect = progressBar.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

apVolume.addEventListener('input', () => {
  audio.volume = apVolume.value;
});

audio.addEventListener('ended', () => {
  apIcon.textContent = '▶';
  apPlayer.classList.remove('playing');
});


// ---- PÉTALOS ----
const petalsContainer = document.getElementById('petals');
const petalEmojis = ['🌸', '🌺', '✿', '❀', '🌷'];

function createPetal() {
  const p = document.createElement('span');
  p.className = 'petal';
  p.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];
  p.style.left     = Math.random() * 100 + 'vw';
  p.style.fontSize = (0.8 + Math.random() * 1) + 'rem';
  p.style.opacity  = 0.4 + Math.random() * 0.4;
  p.style.animationDuration = (6 + Math.random() * 8) + 's';
  p.style.animationDelay    = (Math.random() * 5) + 's';
  petalsContainer.appendChild(p);
  setTimeout(() => p.remove(), 15000);
}

setInterval(createPetal, 600);
for (let i = 0; i < 10; i++) createPetal();


// ---- CUENTA REGRESIVA ----
function pad(n) { return String(n).padStart(2, '0'); }

function updateCountdown() {
  const now  = new Date();
  const diff = CONFIG.BIRTHDAY - now;

  if (diff <= 0) {
    document.getElementById('countdown').style.display = 'none';
    document.getElementById('birthday-msg').classList.remove('hidden');
    document.querySelector('.countdown-section .section-label').textContent = '¡hoy es el gran día!';
    return;
  }

  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);
  const secs  = Math.floor((diff % 60000)    / 1000);

  document.getElementById('cd-days').textContent  = pad(days);
  document.getElementById('cd-hours').textContent = pad(hours);
  document.getElementById('cd-mins').textContent  = pad(mins);
  document.getElementById('cd-secs').textContent  = pad(secs);
}

updateCountdown();
setInterval(updateCountdown, 1000);


// ---- MENSAJES (FIREBASE) ----
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderMessages(msgs) {
  const grid = document.getElementById('messages-grid');
  grid.innerHTML = '';

  if (msgs.length === 0) {
    grid.innerHTML = '<p class="no-messages">Aún no hay mensajes... ¡sé el primero en escribirle a Dache! 🌸</p>';
    return;
  }

  msgs.forEach(m => {
    const date = m.timestamp?.toDate
      ? m.timestamp.toDate().toLocaleDateString('es-DO')
      : new Date().toLocaleDateString('es-DO');
    const card = document.createElement('div');
    card.className = 'msg-card';
    card.innerHTML = `
      <p class="msg-name">${escapeHtml(m.name)} · ${date}</p>
      <p class="msg-text">${escapeHtml(m.text)}</p>
    `;
    grid.appendChild(card);
  });
}

// Escucha en tiempo real
const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
onSnapshot(q, snapshot => {
  const msgs = snapshot.docs.map(d => d.data());
  renderMessages(msgs);
});

async function saveMessage(name, text) {
  await addDoc(collection(db, 'messages'), {
    name,
    text,
    timestamp: serverTimestamp()
  });
}


// ---- FORMULARIO ----
const formContainer = document.getElementById('form-container');
const stepCode      = document.getElementById('step-code');
const stepMsg       = document.getElementById('step-msg');
const codeInput     = document.getElementById('code-input');
const codeError     = document.getElementById('code-error');
const nameInput     = document.getElementById('name-input');
const msgInput      = document.getElementById('msg-input');
const charCount     = document.getElementById('char-count');

document.getElementById('open-form-btn').addEventListener('click', () => {
  formContainer.classList.remove('hidden');
  stepCode.classList.remove('hidden');
  stepMsg.classList.add('hidden');
  codeInput.value = '';
  codeError.classList.add('hidden');
});

document.getElementById('close-form-btn').addEventListener('click', closeForm);
formContainer.addEventListener('click', e => { if (e.target === formContainer) closeForm(); });

function closeForm() {
  formContainer.classList.add('hidden');
  nameInput.value = '';
  msgInput.value  = '';
  charCount.textContent = '0';
}

document.getElementById('verify-code-btn').addEventListener('click', () => {
  if (codeInput.value.trim() === CONFIG.SECRET_CODE) {
    stepCode.classList.add('hidden');
    stepMsg.classList.remove('hidden');
    codeError.classList.add('hidden');
    nameInput.focus();
  } else {
    codeError.classList.remove('hidden');
    codeInput.value = '';
    codeInput.focus();
    codeInput.style.borderColor = '#c0392b';
    setTimeout(() => codeInput.style.borderColor = '', 1500);
  }
});

codeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('verify-code-btn').click();
});

document.getElementById('back-btn').addEventListener('click', () => {
  stepMsg.classList.add('hidden');
  stepCode.classList.remove('hidden');
  codeInput.value = '';
});

msgInput.addEventListener('input', () => {
  charCount.textContent = msgInput.value.length;
});

document.getElementById('submit-msg-btn').addEventListener('click', async () => {
  const name = nameInput.value.trim();
  const text = msgInput.value.trim();

  if (!name) { nameInput.focus(); nameInput.style.borderColor = '#c0392b'; setTimeout(() => nameInput.style.borderColor = '', 1500); return; }
  if (!text) { msgInput.focus();  msgInput.style.borderColor  = '#c0392b'; setTimeout(() => msgInput.style.borderColor  = '', 1500); return; }

  const btn = document.getElementById('submit-msg-btn');
  btn.textContent = 'Enviando... 🌸';
  btn.disabled = true;

  await saveMessage(name, text);

  closeForm();
  for (let i = 0; i < 20; i++) createPetal();
  document.querySelector('.messages-section').scrollIntoView({ behavior: 'smooth' });

  btn.textContent = 'Enviar mensaje 🌸';
  btn.disabled = false;
});
