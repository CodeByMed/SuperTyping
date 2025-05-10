// Elements
const textDisplay = document.getElementById("text-display");
const textInput = document.getElementById("text-input");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");
const notification = document.getElementById("notification");

const loginContainer = document.getElementById("login-container");
const registerContainer = document.getElementById("register-container");

const statsDashboard = document.getElementById("stats-dashboard");
const statsBody = document.getElementById("stats-body");

let startTime = null;
let currentText = "";
let typedCharacters = 0;
let correctCharacters = 0;

// -------------------- Text Handling --------------------
async function loadRandomText() {
  try {
    const response = await fetch("https://api.quotable.io/random");
    const data = await response.json();
    currentText = data.content;
    textDisplay.textContent = currentText;
    resetTyping();
  } catch (error) {
    showNotification("Failed to load text. Please try again.");
    console.error("Error loading text:", error);
  }
}

function resetTyping() {
  textInput.value = "";
  typedCharacters = 0;
  correctCharacters = 0;
  startTime = null;
  updateStats(0, 100);
  textInput.focus();
}

// -------------------- Typing Logic --------------------
textInput.addEventListener("input", () => {
  if (!startTime) startTime = new Date();

  const input = textInput.value;
  typedCharacters = input.length;
  correctCharacters = countCorrectCharacters(input, currentText);

  const timeElapsed = (new Date() - startTime) / 1000 / 60; // minutes
  const wpm = Math.round((correctCharacters / 5) / timeElapsed || 0);
  const accuracy = Math.round((correctCharacters / typedCharacters) * 100) || 0;

  updateStats(wpm, accuracy);

  if (input === currentText) {
    showNotification("Well done! Loading new text...");
    saveStats(wpm, accuracy);
    setTimeout(loadRandomText, 1500);
  }
});

function countCorrectCharacters(input, reference) {
  let correct = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === reference[i]) correct++;
  }
  return correct;
}

function updateStats(wpm, accuracy) {
  wpmDisplay.textContent = wpm;
  accuracyDisplay.textContent = `${accuracy}%`;
}

// -------------------- Notification --------------------
function showNotification(message) {
  notification.textContent = message;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// -------------------- Stats Dashboard --------------------
function saveStats(wpm, accuracy) {
  const stats = JSON.parse(localStorage.getItem("typingStats")) || [];
  stats.push({
    date: new Date().toLocaleString(),
    wpm,
    accuracy
  });
  localStorage.setItem("typingStats", JSON.stringify(stats));
  loadStats();
}

function loadStats() {
  const stats = JSON.parse(localStorage.getItem("typingStats")) || [];
  statsBody.innerHTML = "";

  stats.reverse().slice(0, 10).forEach(stat => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stat.date}</td>
      <td>${stat.wpm}</td>
      <td>${stat.accuracy}%</td>
    `;
    statsBody.appendChild(row);
  });
}

// -------------------- Auth Simulation --------------------
function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    showNotification("Please enter username and password.");
    return;
  }

  loginContainer.hidden = true;
  showNotification(`Welcome, ${username}!`);
  loadRandomText();
  loadStats();
}

function register() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  if (!username || !password) {
    showNotification("Please fill in all fields.");
    return;
  }

  registerContainer.hidden = true;
  loginContainer.hidden = false;
  showNotification("Account created! Please log in.");
}

function toggleRegister(showRegister) {
  registerContainer.hidden = !showRegister;
  loginContainer.hidden = showRegister;
}

// -------------------- Init --------------------
window.addEventListener("load", () => {
  loginContainer.hidden = false;
});
