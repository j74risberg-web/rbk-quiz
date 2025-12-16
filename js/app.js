import { QuizEngine } from "./quizEngine.js";

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

function showResult() {
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
   <!--
  <p style="text-align:center; color:var(--text-muted);">
    Grattis, veckans trisslott kommer som ett SMS 🎉
  </p>
  -->
`;

  // 🏆 Uppdatera high score & veckans vinnare
  handleTopFive(name, score);
handleWeeklyWinner();
}
function handleTopFive(name, score) {
  const key = "rbkTopFive";
  const saved = JSON.parse(localStorage.getItem(key)) || [];

  saved.push({
    name,
    score,
    time: totalTime
  });

  saved.sort((a, b) =>
    b.score - a.score || a.time - b.time
  );

  const topFive = saved.slice(0, 5);

  localStorage.setItem(key, JSON.stringify(topFive));
  renderTopFive(topFive);
}

function renderTopFive(list) {
  if (!topFiveList) return;

  topFiveList.innerHTML = "";

  list.forEach((item, index) => {
    const li = document.createElement("li");

    let medal = "";

    if (index === 0) medal = "🥇";
    else if (index === 1) medal = "🥈";
    else if (index === 2) medal = "🥉";
    else medal = "🎖️"; // 4:e & 5:e plats

    li.innerHTML = `
      ${medal} <strong>${item.name}</strong> – ${item.score} poäng
    `;

    topFiveList.appendChild(li);
  });
}



function handleWeeklyWinner() {
  const weekKey = `rbkWeekly-${getWeekKey()}`;

  // Hämta topplistan
  const topFive = JSON.parse(localStorage.getItem("rbkTopFive")) || [];

  // Ingen vinnare om listan är tom
  if (!topFive.length) return;

  // 🥇 Plats 1 = veckans vinnare
  const winner = topFive[0];

  // Spara veckans vinnare (valfritt men bra)
  localStorage.setItem(weekKey, JSON.stringify(winner));

  // Visa i UI
  if (weeklyWinnerText) {
    weeklyWinnerText.textContent =
      `⭐ ${winner.name} – ${winner.score} poäng`;

  }
}


