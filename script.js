// -------------------- Elements --------------------
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
let currentUser = null;

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

function resetTyping() {
  textInput.value = "";
  startTime = null;
  typedCharacters = 0;
  correctCharacters = 0;
  updateStats(0, 0);
}

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
    if (currentUser) {
      saveStatsToDB(currentUser, wpm, accuracy);
    }
    setTimeout(loadRandomText, 1500);
  }
});

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

// -------------------- IndexedDB Setup --------------------
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

  // Create 'users' store if not exists
  if (!db.objectStoreNames.contains("users")) {
    const usersStore = db.createObjectStore("users", { keyPath: "username" });
    usersStore.createIndex("username", "username", { unique: true });
  }

  // Create 'stats' store if not exists
  if (!db.objectStoreNames.contains("stats")) {
    const statsStore = db.createObjectStore("stats", { keyPath: "id", autoIncrement: true });
    statsStore.createIndex("user", "user");
    statsStore.createIndex("timestamp", "timestamp");
  }
};

// -------------------- Auth Simulation --------------------
async function register() {
  await waitForDB();

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
  await waitForDB();

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    return showNotification("Please enter username and password.");
  }

  const user = await getUser(username);
  if (!user || user.password !== password) {
    return showNotification("Invalid credentials.");
  }

  currentUser = username;
  localStorage.setItem("supertyping_user", username);

  loginContainer.hidden = true;
  registerContainer.hidden = true;
  showNotification(`Welcome, ${username}!`);

  loadRandomText();
  loadStatsFromDB(username);
}

function toggleRegister(showRegister) {
  registerContainer.hidden = !showRegister;
  loginContainer.hidden = showRegister;
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

// -------------------- Stats in IndexedDB --------------------
function saveStatsToDB(user, wpm, accuracy) {
  const tx = db.transaction("stats", "readwrite");
  const store = tx.objectStore("stats");
  store.add({
    user,
    wpm,
    accuracy,
    timestamp: Date.now()
  });
  tx.oncomplete = () => {
    loadStatsFromDB(user);
  };
}

function loadStatsFromDB(user) {
  const tx = db.transaction("stats", "readonly");
  const store = tx.objectStore("stats");
  const index = store.index("user");
  const request = index.getAll(IDBKeyRange.only(user));

  request.onsuccess = () => {
    const stats = request.result;
    statsBody.innerHTML = "";

    stats.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).forEach(stat => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(stat.timestamp).toLocaleString()}</td>
        <td>${stat.wpm}</td>
        <td>${stat.accuracy}%</td>
      `;
      statsBody.appendChild(row);
    });
  };
}

// -------------------- Init --------------------
window.addEventListener("load", () => {
  loginContainer.hidden = false;
});

// Wait for DB to be ready
function waitForDB() {
  return new Promise((resolve) => {
    if (db) return resolve();
    const interval = setInterval(() => {
      if (db) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}
