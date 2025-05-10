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
// -------------------- Text Handling --------------------
async function loadRandomText() {
  try {
    const response = await fetch("https://api.quotable.io/random");
    const data = await response.json();
    currentText = data.content;
    renderText(currentText);
    resetTyping();
  } catch (error) {
    showNotification("Failed to load text. Please try again.");
    console.error("Error loading text:", error);
  }
}

function renderText(text) {
  textDisplay.innerHTML = "";
  [...text].forEach((char, idx) => {
    const span = document.createElement("span");
    span.textContent = char;
    if (idx === 0) span.classList.add("active");
    textDisplay.appendChild(span);
  });
}


// -------------------- Typing Logic --------------------
// -------------------- Typing Logic --------------------
textInput.addEventListener("input", () => {
  const input = textInput.value;
  const spans = textDisplay.querySelectorAll("span");

  if (!startTime) startTime = new Date();

  let correct = 0;

  spans.forEach((span, i) => {
    const typedChar = input[i];

    if (typedChar == null) {
      span.classList.remove("correct", "incorrect", "active");
    } else if (typedChar === span.textContent) {
      span.classList.add("correct");
      span.classList.remove("incorrect");
      correct++;
    } else {
      span.classList.add("incorrect");
      span.classList.remove("correct");
    }

    span.classList.remove("active");
  });

  if (spans[input.length]) {
    spans[input.length].classList.add("active");
  }

  typedCharacters = input.length;
  correctCharacters = correct;

  const timeElapsed = (new Date() - startTime) / 1000 / 60;
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
// --- IndexedDB Setup ---
let db = null;
const DB_NAME = "SuperTypingDB";
const DB_VERSION = 1;

const openRequest = indexedDB.open(DB_NAME, DB_VERSION);

openRequest.onerror = (e) => {
  console.error("IndexedDB error:", e.target.error);
};

openRequest.onsuccess = (e) => {
  db = e.target.result;
  console.log("✅ DB connected");
};

openRequest.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("users")) {
    const usersStore = db.createObjectStore("users", { keyPath: "username" });
    usersStore.createIndex("username", "username", { unique: true });
  }

  if (!db.objectStoreNames.contains("stats")) {
    const statsStore = db.createObjectStore("stats", { keyPath: "id", autoIncrement: true });
    statsStore.createIndex("user", "user");
    statsStore.createIndex("timestamp", "timestamp");
  }
};

// --- Auth functions ---
async function register() {
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value;

  if (!username || !password) {
    return showNotification("Please fill in both fields.");
  }

  const userExists = await getUser(username);
  if (userExists) {
    return showNotification("Username already exists.");
  }

  const tx = db.transaction("users", "readwrite");
  const store = tx.objectStore("users");
  store.add({ username, password });

  tx.oncomplete = () => {
    showNotification("Account created!");
    toggleRegister(false);
  };
}

async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    return showNotification("Please enter username and password.");
  }

  const user = await getUser(username);
  if (!user || user.password !== password) {
    return showNotification("Invalid credentials.");
  }

  localStorage.setItem("supertyping_user", username);
  loginContainer.hidden = true;
  registerContainer.hidden = true;
  showNotification(`Welcome, ${username}!`);
  loadRandomText();
  loadStatsFromDB(username);
}

function getUser(username) {
  return new Promise((resolve) => {
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const req = store.get(username);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function toggleRegister(showRegister) {
  registerContainer.hidden = !showRegister;
  loginContainer.hidden = showRegister;
}


// -------------------- Init --------------------
window.addEventListener("load", () => {
  loginContainer.hidden = false;
});
