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
      saveStatsToLocalStorage(currentUser, wpm, accuracy);
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

// -------------------- LocalStorage Functions --------------------

// Register the user and store in localStorage
function register() {
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value;

  if (!username || !password) {
    return showNotification("Please fill in both fields.");
  }

  const users = JSON.parse(localStorage.getItem("users")) || {};
  if (users[username]) {
    return showNotification("Username already exists.");
  }

  users[username] = { password };
  localStorage.setItem("users", JSON.stringify(users));

  showNotification("Account created!");
  toggleRegister(false);
}

// Login
function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    return showNotification("Please enter username and password.");
  }

  const users = JSON.parse(localStorage.getItem("users")) || {};
  const user = users[username];

  if (!user || user.password !== password) {
    return showNotification("Invalid credentials.");
  }

  currentUser = username;
  localStorage.setItem("supertyping_user", username);

  loginContainer.hidden = true;
  registerContainer.hidden = true;
  showNotification(`Welcome, ${username}!`);

  loadRandomText();
  loadStatsFromLocalStorage(username);
}

// -------------------- Load Stats from LocalStorage --------------------
function loadStatsFromLocalStorage(user) {
  const stats = JSON.parse(localStorage.getItem("stats")) || [];
  statsBody.innerHTML = "";

  stats.filter(stat => stat.user === user)
       .sort((a, b) => b.timestamp - a.timestamp)
       .slice(0, 10)
       .forEach(stat => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(stat.timestamp).toLocaleString()}</td>
      <td>${stat.wpm}</td>
      <td>${stat.accuracy}%</td>
    `;
    statsBody.appendChild(row);
  });
}

// -------------------- Save Stats to LocalStorage --------------------
function saveStatsToLocalStorage(user, wpm, accuracy) {
  const stats = JSON.parse(localStorage.getItem("stats")) || [];
  stats.push({
    user,
    wpm,
    accuracy,
    timestamp: Date.now()
  });
  localStorage.setItem("stats", JSON.stringify(stats));

  loadStatsFromLocalStorage(user);
}

// -------------------- Init --------------------
window.addEventListener("load", () => {
  loginContainer.hidden = false;
});
