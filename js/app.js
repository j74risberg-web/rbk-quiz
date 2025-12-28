import { QuizEngine } from "./quizEngine.js";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://pfmdzhcvwdcgqghaztwg.supabase.co",
  "sb_publishable_WQ1HxUZhPTJ6kN-2QRuKAA_J3ztNKWJ"
);

/* =====================
   DOM
===================== */
const nameInput = document.getElementById("playerNameInput");
const startBtn = document.getElementById("startBtn");

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const scoreBoardScreen = document.getElementById("scoreBoardScreen");

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
   IKONER (v2.1)
===================== */
const CATEGORY_ICONS = {
  hotell: "🛏️",
  restauranger: "🍽️",
  nattklubbar: "💃",
  teatrar_biografer: "🎭",
  huvudkontor: "💼",
  ambassader: "🏛️",
  ovrigt: "🏆", // ✅ NY KATEGORI
};

const DEFAULT_ICON = "📍";

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || DEFAULT_ICON;
}

showScoreBoard();

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

  console.log(supabase);

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
  scoreBoardScreen.classList.add("hidden");
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
async function renderQuestion() {
  stopTimer();

  if (engine.isFinished()) {
    showResult();
    await insertScore();
    await showScoreBoard();
    return;
  }

  locked = false;

  const q = engine.currentQuestion();

  questionEl.innerHTML = `
    <span style="margin-right:8px;">${getCategoryIcon(q.category)}</span>
    <span>${q.question}</span>
  `;

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

async function insertScore() {
  const playerName = localStorage.getItem("rbkPlayerName");
  const score = engine.getScore();
  const total = engine.getTotal();

  const { data, error } = await supabase.from("score").insert([
    {
      user: playerName.toLowerCase(),
      score: score,
      max_score: total,
    },
  ]);

  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Inserted:", data);
  }
}

async function showScoreBoard() {
  scoreBoardScreen.classList.remove("hidden");

  const tbody = document.getElementById("scoreBody");

  // Clear existing rows
  tbody.innerHTML = "";

  console.log("Supabase ready", supabase);
  const { data, error } = await supabase.from("score").select();
  console.log(data);

  // Loop through rows
  data.forEach((row) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
    <td>${row.user}</td>
    <td>${row.score}</td>
  `;

    tbody.appendChild(tr);
  });

  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
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
