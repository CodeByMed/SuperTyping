// -------------------- Elements --------------------
const textDisplay = document.getElementById("text-display");
const textInput = document.getElementById("text-input");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");
const notification = document.getElementById("notification");

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

// -------------------- Init --------------------
window.addEventListener("load", () => {
  loadRandomText();
});
