import { QuizEngine } from "./quizEngine.js";

/* =====================
   DOM
===================== */
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const finalResultEl = document.getElementById("finalResult");
const timerEl = document.getElementById("timer");

/* =====================
   LJUD
===================== */
const tickSound = new Audio("./sounds/tick.mp3");
tickSound.volume = 0.4;

/* =====================
   STATE
===================== */
let engine;
let timer;
let timeLeft = 10;
let locked = false;

/* =====================
   START
===================== */
startBtn.onclick = async () => {
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
  clearInterval(timer);
  timeLeft = 10;
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;

    // 🔊 tick vid 3,2,1
    if (timeLeft <= 3 && timeLeft > 0) {
      tickSound.currentTime = 0;
      tickSound.play();
    }

    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timer);
      if (!locked) {
        locked = true;
        revealCorrect();
        setTimeout(renderQuestion, 1000);
      }
    }
  }, 1000);
}

function updateTimer() {
  if (timerEl) {
    timerEl.textContent = `⏱ ${timeLeft}s`;
  }
}

/* =====================
   VISA FRÅGA
===================== */
function renderQuestion() {
  if (engine.isFinished()) {
    showResult();
    return;
  }

  locked = false;
  clearInterval(timer);

  const q = engine.getCurrentQuestion();
  if (!q) return;

  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";

  startTimer();

  q.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = answer;

    btn.onclick = () => handleAnswer(btn, index);

    optionsEl.appendChild(btn);
  });
}

/* =====================
   SVAR
===================== */
function handleAnswer(btn, index) {
  if (locked) return;
  locked = true;
  clearInterval(timer);

  const q = engine.getCurrentQuestion();
  const correct = q.correct;

  if (index === correct) {
    btn.classList.add("correct");
  } else {
    btn.classList.add("wrong");
    optionsEl.children[correct].classList.add("correct");
  }

  engine.answer(index);
  setTimeout(renderQuestion, 1000);
}

function revealCorrect() {
  const q = engine.getCurrentQuestion();
  if (!q) return;
  optionsEl.children[q.correct].classList.add("correct");
  engine.answer(-1);
}

/* =====================
   RESULTAT
===================== */
function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const score = engine.getScore();
  const total = engine.questions.length;
  const percent = Math.round((score / total) * 100);

  let medal = "🥉";
  if (percent >= 80) medal = "🥇";
  else if (percent >= 60) medal = "🥈";

  finalResultEl.innerHTML = `
    <h2>${medal} Resultat</h2>
    <p><strong>${score}</strong> / ${total} rätt</p>
    <p>${percent}%</p>
    <button onclick="location.reload()">Spela igen</button>
  `;
}

