import { QuizEngine } from "/rbk-quiz/js/quizEngine.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =====================
   SUPABASE
===================== */
const SUPABASE_URL = "https://pfmdzhcvwdcgqghaztwg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WQ1HxUZhPTJ6kN-2QRuKAA_J3ztNKWJ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =====================
   DOM
===================== */
const startTitle = document.getElementById("startTitle");
const nameInput = document.getElementById("playerNameInput");
const resultTitle = document.getElementById("resultTitle");

const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const finalResultEl = document.getElementById("finalResult");
const timerEl = document.getElementById("timer");

const topFiveList = document.getElementById("topFiveList");

/* =====================
   HJÄLPFUNKTIONER – VECKA
===================== */
function getWeekKey() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${week}`;
}

function getWeekLabel() {
  return `Vecka ${getWeekKey().split("-W")[1]}`;
}

function formatName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

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
tickSound.volume = 0.5;

/* =====================
   START
===================== */
if (nameInput) {
  nameInput.addEventListener("input", () => {
    startBtn.disabled = nameInput.value.trim().length < 2;
  });
}

startBtn.onclick = async () => {
  const name = nameInput.value.trim().toLowerCase();
  if (name.length < 2) return;

  localStorage.setItem("rbkPlayerName", name);

  // iOS unlock
  tickSound.play().catch(() => {});
  tickSound.pause();

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
function stopTimer() {
  clearInterval(timer);
  tickSound.pause();
  tickSound.currentTime = 0;
}

function startTimer() {
  stopTimer();
  timeLeft = 10;
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;

    if (timeLeft <= 3 && timeLeft > 0) {
      tickSound.currentTime = 0;
      tickSound.play();
    }

    updateTimer();

    if (timeLeft <= 0) {
      stopTimer();
      locked = true;
      engine.answer(-1);
      setTimeout(renderQuestion, 800);
    }
  }, 1000);
}

function updateTimer() {
  if (timerEl) timerEl.textContent = `⏱ ${timeLeft}s`;
}

/* =====================
   RENDER FRÅGA
===================== */
function renderQuestion() {
  clearInterval(timer);

  if (engine.isFinished()) {
    showResult();
    return;
  }

  locked = false;
  const q = engine.currentQuestion();

  questionEl.innerHTML = q.question;
  optionsEl.innerHTML = "";

  startTimer();

  q.answers.forEach((answer, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = answer;
    btn.onclick = () => handleAnswer(i, btn);
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
async function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const score = engine.getScore();
  const total = engine.getTotal();
  const name = localStorage.getItem("rbkPlayerName");

  const percent = score / total;
  const medal =
    percent === 1 ? "🥇" :
    percent >= 0.8 ? "🥈" :
    percent >= 0.6 ? "🥉" : "";

  resultTitle.textContent = `RBK Quiz – ${getWeekLabel()}`;

  finalResultEl.innerHTML = `
    <div style="text-align:center;font-size:64px">${medal}</div>
    <p style="text-align:center">${score} / ${total} rätt</p>
  `;

  await saveDailyScore(name, score);
  await renderTopFive();
}

/* =====================
   SUPABASE – DAGENS POÄNG
===================== */
async function saveDailyScore(name, score) {
  const today = new Date().toISOString().split("T")[0];
  const week = getWeekKey();

  // 🔒 stäng ev. gammal vecka
  await supabase.rpc("maybe_close_week", {
    current_week: week
  });

  const { error } = await supabase
    .from("daily_scores")
    .insert([{ name, score, date: today, week }]);

  if (error && error.code === "23505") {
    finalResultEl.insertAdjacentHTML(
      "beforeend",
      `<p style="text-align:center;opacity:0.7">
        Endast första spelet per dag räknas
      </p>`
    );
  }
}

/* =====================
   TOPPLISTA – DENNA VECKA
===================== */
async function renderTopFive() {
  if (!topFiveList) return;

  const week = getWeekKey();

  const { data } = await supabase
    .from("weekly_scores")
    .select("name, total_score")
    .eq("week", week)
    .order("total_score", { ascending: false })
    .limit(5);

  topFiveList.innerHTML = "";

  data?.forEach((row, i) => {
    const medal = ["🥇", "🥈", "🥉"][i] || "🎖️";
    const li = document.createElement("li");
    li.innerHTML = `${medal} <strong>${formatName(row.name)}</strong> – ${row.total_score}`;
    topFiveList.appendChild(li);
  });
}

/* =====================
   TITEL START
===================== */
if (startTitle) {
  startTitle.textContent = `RBK Quiz – ${getWeekLabel()}`;
}
