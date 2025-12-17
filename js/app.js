import { QuizEngine } from "./quizEngine.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const IS_ADMIN = new URLSearchParams(window.location.search).has("admin");

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
    Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function getWeekLabel() {
  return `Vecka ${getISOWeekKey().split("-W")[1]}`;
}

function formatName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function clearLocalHighscores() {
  localStorage.removeItem("rbkLocalHighscores");
}

function setLocalHighscores(data) {
  localStorage.setItem("rbkLocalHighscores", JSON.stringify(data));
}

function getLocalHighscores() {
  const raw = localStorage.getItem("rbkLocalHighscores");
  return raw ? JSON.parse(raw) : null;
}

function getWeekOverride() {
  return localStorage.getItem("rbkWeekOverride");
}

function setWeekOverride(weekKey) {
  localStorage.setItem("rbkWeekOverride", weekKey);
}

function clearWeekOverride() {
  localStorage.removeItem("rbkWeekOverride");
}

function getActiveWeekKey() {
  return getWeekOverride() ?? getISOWeekKey();
}

function getActiveWeekLabel() {
  return `Vecka ${getActiveWeekKey().split("-W")[1]}`;
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

  questionEl.innerHTML = q.question;

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

  resultTitle.textContent = `RBK Quiz – ${getActiveWeekLabel()}`;

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
  const week = getActiveWeekKey();

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
  const local = getLocalHighscores();
  let data;

  if (local) {
    data = local;
  } else {
    const res = await supabase
      .from("weekly_scores")
      .select("name, total_score")
      .eq("week", getActiveWeekKey())
      .order("total_score", { ascending: false })
      .limit(5);

    data = res.data;
  }

  topFiveList.innerHTML = "";

  data?.forEach((row, i) => {
    const medal = ["🥇", "🥈", "🥉"][i] || "🎖️";
    const li = document.createElement("li");
    li.innerHTML = `${medal} <strong>${formatName(row.name)}</strong> – ${
      row.total_score
    }`;
    const strong = document.createElement("strong");
    strong.textContent = formatName(row.name);
    li.append(`${medal} `, strong, ` – ${row.total_score}`);
    topFiveList.appendChild(li);
  });
}
function test() {
  console.log("hej");
}

/* =====================
   TITEL
===================== */
startTitle.textContent = `RBK Quiz – ${getActiveWeekLabel()}`;

/* =====================
   ADMIN / TEST
===================== */
if (IS_ADMIN) {
  // Visa adminpanel
  const panel = document.getElementById("adminPanel");
  if (panel) panel.style.display = "block";

  const label = document.getElementById("adminWeekLabel");
  if (label) label.textContent = getActiveWeekLabel();

  // Nästa fråga
  document.getElementById("adminNext")?.addEventListener("click", () => {
    if (!engine) return;
    engine.index++;
    renderQuestion();
  });

  // Hoppa till resultat
  document.getElementById("adminResult")?.addEventListener("click", () => {
    if (!engine) return;
    showResult();
  });

  // Sätt maxpoäng
  document.getElementById("adminMax")?.addEventListener("click", () => {
    if (!engine) return;
    engine.score = engine.questions.length;
  });

  // Starta / resetta spel
  document.getElementById("adminReset")?.addEventListener("click", async () => {
    engine = new QuizEngine();
    await engine.loadQuestions();

    startScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

    renderQuestion();
  });

  // +1 vecka (simulering)
  document.getElementById("adminNextWeek")?.addEventListener("click", () => {
    const current = getActiveWeekKey();
    const [year, week] = current.split("-W").map(Number);
    setWeekOverride(`${year}-W${week + 1}`);

    startTitle.textContent = `RBK Quiz – ${getActiveWeekLabel()}`;
    alert(`Simulerar ${getActiveWeekLabel()}`);
  });

  // Rensa veckosimulering
  document.getElementById("adminClearWeek")?.addEventListener("click", () => {
    clearWeekOverride();
    startTitle.textContent = `RBK Quiz – ${getActiveWeekLabel()}`;
    alert("Veckosimulering avstängd");
  });

  // Nollställ highscores lokalt
  document.getElementById("adminClearScores")?.addEventListener("click", () => {
    setLocalHighscores([]);
    renderTopFive();
    alert("Highscores nollställda (lokalt)");
  });

  // Minimera adminpanel
  //document.getElementById("adminToggle")?.addEventListener("click", () => {
  //document
  //.querySelectorAll("#adminPanel .admin-group")
  //.forEach(el => el.classList.toggle("hidden"));
  //});

  // Auto-start i adminläge (valfritt men smidigt)
  if (!engine) {
    engine = new QuizEngine();
    engine.loadQuestions().then(() => {
      startScreen.classList.add("hidden");
      resultScreen.classList.add("hidden");
      quizScreen.classList.remove("hidden");
      renderQuestion();
    });
  }
}
