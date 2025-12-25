import { QuizEngine } from "./quizEngine.js";

/* =====================
   DOM
===================== */
const nameInput = document.getElementById("playerNameInput");
const startBtn = document.getElementById("startBtn");

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const finalResultEl = document.getElementById("finalResult");
const timerEl = document.getElementById("timer");

/* =====================
   STATE
===================== */
let engine = null;
let timer = null;
let timeLeft = 10;
let locked = false;

/* =====================
   LJUD
===================== */
const tickSound = new Audio("./sounds/tick.mp3");
tickSound.loop = true;
tickSound.volume = 0.5;

/* =====================
   IKONER (steg 1)
===================== */
const CATEGORY_ICONS = {
  hotell: "🛏️",
  restauranger: "🍽️",
  nattklubbar: "💃",
  teatrar_biografer: "🎭",
  huvudkontor: "💼",
  ambassader: "🏛️",
};

const DEFAULT_ICON = "📍";

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || DEFAULT_ICON;
}

/* =====================
   START
===================== */
if (nameInput) {
  nameInput.addEventListener("input", () => {
    startBtn.disabled = nameInput.value.trim().length < 2;
  });
}

startBtn.onclick = async () => {
  const playerName = nameInput.value.trim();
  if (playerName.length < 2) return;

  localStorage.setItem("rbkPlayerName", playerName);

  // 🔓 iOS audio unlock
  tickSound.muted = true;
  await tickSound.play().catch(() => {});
  tickSound.pause();
  tickSound.muted = false;

  engine = new QuizEngine();
  await engine.loadQuestions();

  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  renderQuestion();
};

/* =====================
   TIMER
===================== */
function startTimer() {
  stopTimer();

  timeLeft = 10;
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft === 3) {
      tickSound.currentTime = 0;
      tickSound.play().catch(() => {});
    }

    if (timeLeft <= 0) {
      stopTimer();
      locked = true;
      engine.answer(-1);
      setTimeout(renderQuestion, 800);
    }
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  tickSound.pause();
  tickSound.currentTime = 0;
}

function updateTimer() {
  if (timerEl) {
    timerEl.textContent = `⏱ ${timeLeft}s`;
  }
}

/* =====================
   RENDER FRÅGA
===================== */
function renderQuestion() {
  stopTimer();

  if (engine.isFinished()) {
    showResult();
    return;
  }

  locked = false;

  const q = engine.currentQuestion();

  // 🔍 STEG 1: logga exakt hur frågan ser ut
  console.log("QUESTION OBJECT:", q);

  questionEl.textContent = `${getCategoryIcon(q.category)} ${q.question}`;

  optionsEl.innerHTML = "";

  startTimer();

  q.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = answer;
    btn.onclick = () => handleAnswer(index, btn);
    optionsEl.appendChild(btn);
  });
}

/* =====================
   SVAR
===================== */
function handleAnswer(index, btn) {
  if (locked) return;
  locked = true;

  stopTimer();

  const q = engine.currentQuestion();

  if (index === q.correct) {
    btn.classList.add("correct");
  } else {
    btn.classList.add("wrong");
    optionsEl.children[q.correct].classList.add("correct");
  }

  engine.answer(index);
  setTimeout(renderQuestion, 800);
}

/* =====================
   RESULTAT
===================== */
function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const score = engine.getScore();
  const total = engine.getTotal();

  let medal = "";
  if (score === 5) medal = "🥇";
  else if (score === 4) medal = "🥈";
  else if (score === 3) medal = "🥉";

  finalResultEl.innerHTML = `
    <div style="text-align:center; font-size:64px; margin-bottom:16px;">
      ${medal}
    </div>
    <p style="text-align:center; font-size:18px;">
      ${score} / ${total} rätt
    </p>
  `;
}
