import { QuizEngine } from "/rbk-quiz/js/quizEngine.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


const SUPABASE_URL = "https://pfmdzhcvwdcgqghaztwg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WQ1HxUZhPTJ6kN-2QRuKAA_J3ztNKWJ";


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* =====================
   DOM
===================== */
const nameInput = document.getElementById("playerNameInput");
const highScoreText = document.getElementById("highScoreText");
const weeklyWinnerText = document.getElementById("weeklyWinnerText");
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


// Aktivera startknappen när namn skrivs
if (nameInput) {
  nameInput.addEventListener("input", () => {
    startBtn.disabled = nameInput.value.trim().length < 2;
  });
}
function getWeekKey() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now - firstDay) / 86400000 + firstDay.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${week}`;
}



/* =====================
   STATE
===================== */
let engine = null;
let timer = null;
let timeLeft = 10;
let locked = false;
let totalTime = 0;
let questionStartTime = 0;

/* =====================
   LJUD
===================== */
const tickSound = new Audio("./sounds/tick.mp3");
tickSound.volume = 0.5;

/* =====================
   START
===================== */
startBtn.onclick = async () => {
  const playerName = nameInput.value.trim();
  if (playerName.length < 2) return;

  localStorage.setItem("rbkPlayerName", playerName);

  // 🔓 iOS: lås upp ljud
  tickSound.currentTime = 0;
  tickSound.volume = 0;
  tickSound.play().catch(() => {});
  tickSound.pause();
  tickSound.volume = 0.5;

 engine = new QuizEngine();
await engine.loadQuestions();

// 🔄 NOLLSTÄLL SPELSTATE
totalTime = 0;
questionStartTime = 0;

startScreen.classList.add("hidden");
resultScreen.classList.add("hidden");
quizScreen.classList.remove("hidden");

renderQuestion();
};


/* =====================
   TIMER
===================== */
function stopTimer() {
  if (timer) {
   clearInterval(timer);

    timer = null;
  }

  // stoppa tick-ljud om det spelas
  tickSound.pause();
  tickSound.currentTime = 0;
}

function startTimer() {
  stopTimer();
  timeLeft = 10;
  updateTimer();

  questionStartTime = Date.now();

  timer = setInterval(() => {
    timeLeft--;

    if (timeLeft <= 3 && timeLeft > 0) {
      tickSound.currentTime = 0;
      tickSound.play();
    }

    updateTimer();

    if (timeLeft <= 0) {
      stopTimer();

      totalTime += Math.floor((Date.now() - questionStartTime) / 1000);

      locked = true;
      engine.answer(-1);
      setTimeout(renderQuestion, 800);
    }
  }, 1000);
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
  // ⛔ stoppa ALLTID eventuell gammal timer
  clearInterval(timer);

  if (engine.isFinished()) {
    showResult();
    return;
  }

  locked = false;

  const q = engine.currentQuestion();
  questionEl.innerHTML = q.question;
  optionsEl.innerHTML = "";

  startTimer(); // ✅ starta NY timer här
 
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
   
   totalTime += Math.floor((Date.now() - questionStartTime) / 1000);

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
  const name = localStorage.getItem("rbkPlayerName") || "Okänd";

  // 🏅 Medalj – procentbaserad
  let medal = "";
  const percent = score / total;

  if (percent === 1) medal = "🥇";
  else if (percent >= 0.8) medal = "🥈";
  else if (percent >= 0.6) medal = "🥉";

  // Titel
  if (resultTitle) {
    resultTitle.textContent = `Grattis ${name}!`;
  }

  // Resultattext
  finalResultEl.innerHTML = `
    <div style="text-align:center; font-size:64px; margin-bottom:16px;">
      ${medal}
    </div>
    <p style="text-align:center; font-size:18px;">
      ${score} / ${total} rätt
    </p>
  `;

  // 🏆 GLOBAL highscore (Supabase)
  await saveHighscore(name, score);
  await renderTopFiveGlobal();
}


/* =====================
   SUPABASE – HIGHSCORE
===================== */

async function saveHighscore(name, score) {
  if (!name || typeof score !== "number") return;

  const { error } = await supabase
    .from("highscores")
    .insert([{ name, score }]);

  if (error) {
    console.error("Supabase save error:", error.message);
  }
}

async function loadTopFive() {
  const { data, error } = await supabase
    .from("highscores")
    .select("name, score")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Supabase load error:", error.message);
    return [];
  }

  return data;
}

async function renderTopFiveGlobal() {
  if (!topFiveList) return;

  const list = await loadTopFive();
  topFiveList.innerHTML = "";

  list.forEach((item, index) => {
    let medal = "🎖️";
    if (index === 0) medal = "🥇";
    else if (index === 1) medal = "🥈";
    else if (index === 2) medal = "🥉";

    const li = document.createElement("li");
    li.innerHTML = `
      ${medal} <strong>${item.name}</strong> – ${item.score} poäng
    `;
    topFiveList.appendChild(li);
  });
}

 



