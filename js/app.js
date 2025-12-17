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
const startBtn = document.getElementById("startBtn");

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const timerEl = document.getElementById("timer");

const resultTitle = document.getElementById("resultTitle");
const finalResultEl = document.getElementById("finalResult");
const topFiveList = document.getElementById("topFiveList");

/* =====================
   HJÄLPFUNKTIONER
===================== */
function getISOWeekKey() {
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
  return `Vecka ${getISOWeekKey().split("-W")[1]}`;
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
   START
===================== */
nameInput.addEventListener("input", () => {
  startBtn.disabled = nameInput.value.trim().length < 2;
});

startBtn.onclick = async () => {
  const name = nameInput.value.trim().toLowerCase();
  if (name.length < 2) return;

  localStorage.setItem("rbkPlayerName", name);

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

    if (timeLeft <= 0) {
      stopTimer();
      locked = true;
      engine.answer(-1);
      setTimeout(renderQuestion, 800);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function updateTimer() {
  timerEl.textContent = `⏱ ${timeLeft}s`;
}

/* =====================
   QUIZ
===================== */
function renderQuestion() {
  stopTimer();

  if (engine.isFinished()) {
    showResult();
    return;
  }

  locked = false;
  const q = engine.currentQuestion();

  questionEl.textContent = q.question;
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

  let medal = "";
  const pct = score / total;
  if (pct === 1) medal = "🥇";
  else if (pct >= 0.8) medal = "🥈";
  else if (pct >= 0.6) medal = "🥉";

  resultTitle.textContent = `RBK Quiz – ${getWeekLabel()}`;

  finalResultEl.innerHTML = `
    <div style="font-size:64px;text-align:center">${medal}</div>
    <p style="text-align:center">${score} / ${total} rätt</p>
  `;

  await saveDailyScore(name, score);
  await renderTopFive();
}

/* =====================
   SUPABASE
===================== */
async function saveDailyScore(name, score) {
  const today = new Date().toISOString().split("T")[0];
  const week = getISOWeekKey();

  const { error } = await supabase
    .from("highscores")
    .insert([{ name, score, play_date: today, week }]);

  if (error?.code === "23505") {
    finalResultEl.insertAdjacentHTML(
      "beforeend",
      `<p style="opacity:.7;text-align:center">
        Endast första spelet per dag räknas
      </p>`
    );
  }
}

async function renderTopFive() {
  const { data } = await supabase
    .from("weekly_scores")
    .select("name, total_score")
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
   TITEL
===================== */
startTitle.textContent = `RBK Quiz – ${getWeekLabel()}`;
