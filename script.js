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

textInput.addEventListener('input', () => {
  const typed = textInput.value;
  totalTyped++;

  if (typed === currentWord) {
    correctChars += currentWord.length;
    updateStats();
    loadNewWord();
  }
});

function updateStats() {
  const now = new Date();
  const timeElapsed = (now - startTime) / 1000 / 60; // in minutes
  const wpm = Math.round((correctChars / 5) / timeElapsed);
  const accuracy = Math.round((correctChars / totalTyped) * 100);
  document.getElementById('wpm').textContent = isFinite(wpm) ? wpm : 0;
  document.getElementById('accuracy').textContent = isFinite(accuracy) ? `${accuracy}%` : '100%';
}

function login() {
  const username = document.getElementById('username').value;
  if (username.trim()) {
    localStorage.setItem('supertyping_user', username);
    loginContainer.style.display = 'none';
    loadNewWord();
  }
}

window.onload = () => {
  const user = localStorage.getItem('supertyping_user');
  if (user) {
    loginContainer.style.display = 'none';
    loadNewWord();
  }
};
