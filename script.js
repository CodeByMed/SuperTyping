const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const loginContainer = document.getElementById('login-container');

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

// Get a random word
function getRandomWord() {
  const index = Math.floor(Math.random() * words.length);
  return words[index];
}

// Load next word
function loadNewWord() {
  currentWord = getRandomWord();
  textDisplay.textContent = currentWord;
  textInput.value = '';
  textInput.focus();
  startTime = new Date();
}

// Update WPM and accuracy
function updateStats() {
  const now = new Date();
  const timeElapsed = (now - startTime) / 1000 / 60; // in minutes
  const wpm = Math.round((correctChars / 5) / timeElapsed);
  const accuracy = Math.round((correctChars / totalTyped) * 100);
  document.getElementById('wpm').textContent = isFinite(wpm) ? wpm : 0;
  document.getElementById('accuracy').textContent = isFinite(accuracy) ? `${accuracy}%` : '100%';
  return { wpm, accuracy };
}

// Save stats to IndexedDB
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
  request.onerror = () => {
    console.error("Error saving stats");
  };
}

// Input typing logic
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

// Simple login system
function login() {
  const username = document.getElementById('username').value;
  if (username.trim()) {
    localStorage.setItem('supertyping_user', username);
    loginContainer.style.display = 'none';
    loadNewWord();
  }
}

// On load check login
window.onload = () => {
  const user = localStorage.getItem('supertyping_user');
  if (user) {
    loginContainer.style.display = 'none';
    loadNewWord();
  }
};
