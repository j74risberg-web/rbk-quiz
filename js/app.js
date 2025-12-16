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

// Aktivera startknappen när namn skrivs
if (nameInput) {
  nameInput.addEventListener("input", () => {
    startBtn.disabled = nameInput.value.trim().length < 2;
  });
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
          // ⛔ stoppa eventuell gammal timer
  timeLeft = 10;
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;

    // 🔊 Tick vid 3, 2, 1
    if (timeLeft <= 3 && timeLeft > 0) {
      tickSound.currentTime = 0;
      tickSound.play();
    }

    updateTimer();

    // ⏱ TIDEN SLUT
    if (timeLeft <= 0) {
      stopTimer();
      // ⛔ VIKTIGT: stoppa timern
     
      locked = true;

      engine.answer(-1);         // räknas som fel / timeout
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
  questionEl.textContent = q.question;
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
function getWeekKey() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now - firstDay) / 86400000 + firstDay.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${week}`;
}

function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const score = engine.getScore();
  const total = engine.getTotal();
  const name = localStorage.getItem("rbkPlayerName") || "Okänd";

  let medal = "";
  const percent = score / total;

  if (percent === 1) medal = "🥇";
  else if (percent >= 0.8) medal = "🥈";
  else if (percent >= 0.6) medal = "🥉";

  if (resultTitle) {
    resultTitle.textContent = `Grattis ${name}!`;
  }

  finalResultEl.innerHTML = `
    <div style="text-align:center; font-size:64px; margin-bottom:16px;">
      ${medal}
    </div>
    <p style="text-align:center; font-size:18px;">
      ${score} / ${total} rätt
    </p>
    <p style="text-align:center; color:var(--text-muted);">
      Grattis, veckans trisslott kommer som ett SMS 🎉
    </p>
  `;

  handleHighScore(name, score);
  handleWeeklyWinner(name, score);
}


