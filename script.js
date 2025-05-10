const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');

const words = [
  "monkey", "keyboard", "banana", "jungle", "fast", "typing", "practice", "random", "sentence", "gold",
  "dark", "mode", "speed", "accuracy", "learn", "focus", "skill", "improve", "challenge", "code"
];

let currentWord = '';
let startTime;
let correctChars = 0;
let totalTyped = 0;

// IndexedDB Setup
let db;
const request = indexedDB.open("SuperTypingDB", 1);

request.onerror = (event) => {
  console.error("IndexedDB error:", event.target.error);
};

request.onsuccess = (event) => {
  db = event.target.result;
  console.log("DB connected");
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const store = db.createObjectStore("typingStats", { keyPath: "id", autoIncrement: true });
  store.createIndex("user", "user", { unique: false });
  store.createIndex("timestamp", "timestamp", { unique: false });
};

function getRandomWord() {
  const index = Math.floor(Math.random() * words.length);
  return words[index];
}

function loadNewWord() {
  currentWord = getRandomWord();
  textDisplay.textContent = currentWord;
  textInput.value = '';
  textInput.focus();
  startTime = new Date();
}

function updateStats() {
  const now = new Date();
  const timeElapsed = (now - startTime) / 1000 / 60;
  const wpm = Math.round((correctChars / 5) / timeElapsed);
  const accuracy = Math.round((correctChars / totalTyped) * 100);
  document.getElementById('wpm').textContent = isFinite(wpm) ? wpm : 0;
  document.getElementById('accuracy').textContent = isFinite(accuracy) ? `${accuracy}%` : '100%';
  return { wpm, accuracy };
}

function saveStatsToDB(wpm, accuracy) {
  if (!db) return;
  const user = localStorage.getItem('supertyping_user');
  const transaction = db.transaction(["typingStats"], "readwrite");
  const store = transaction.objectStore("typingStats");
  const data = {
    user,
    wpm,
    accuracy,
    timestamp: new Date().toISOString()
  };
  const request = store.add(data);
  request.onsuccess = () => {
    console.log("Stats saved:", data);
  };
}

textInput.addEventListener('input', () => {
  const typed = textInput.value;
  totalTyped++;
  if (typed === currentWord) {
    correctChars += currentWord.length;
    const stats = updateStats();
    saveStatsToDB(stats.wpm, stats.accuracy);
    loadNewWord();
  }
});

// LOGIN/REGISTER SYSTEM
function showNotification(message) {
  const notif = document.getElementById('notification');
  notif.textContent = message;
  notif.style.display = 'block';
  setTimeout(() => notif.style.display = 'none', 3000);
}

function toggleRegister(show) {
  registerContainer.style.display = show ? 'flex' : 'none';
  loginContainer.style.display = show ? 'none' : 'flex';
}

function register() {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;

  if (!username || !password) {
    showNotification("Username and password required.");
    return;
  }

  if (localStorage.getItem(`user_${username}`)) {
    showNotification("Username already exists.");
    return;
  }

  localStorage.setItem(`user_${username}`, password);
  showNotification("Account created!");
  toggleRegister(false);
}

function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const storedPassword = localStorage.getItem(`user_${username}`);

  if (storedPassword && storedPassword === password) {
    localStorage.setItem('supertyping_user', username);
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'none';
    loadNewWord();
    showNotification(`Welcome, ${username}!`);
  } else {
    showNotification("Invalid credentials.");
  }
}

// SHOW STATS IN CONSOLE
function getUserStats(callback) {
  const user = localStorage.getItem('supertyping_user');
  if (!db) return;

  const transaction = db.transaction(["typingStats"], "readonly");
  const store = transaction.objectStore("typingStats");
  const index = store.index("user");
  const request = index.getAll(IDBKeyRange.only(user));

  request.onsuccess = () => {
    callback(request.result);
  };
}

// On load
window.onload = () => {
  const user = localStorage.getItem('supertyping_user');
  if (user) {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'none';
    loadNewWord();
  }
};
