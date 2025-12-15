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

    if (timeLeft <= 3 && timeLeft > 0) {
      tickSound.currentTime = 0;
      tickSound.play();
    }

    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timer);
      locked = true;
      if (timeLeft <= 0) {
  clearInterval(timer);
  locked = true;

  // visa rätt svar visuellt
  const q = engine.currentQuestion();
  if (q && optionsEl.children[q.correct]) {
    optionsEl.children[q.correct].classList.add("correct");
  }

  setTimeout(renderQuestion, 800);
}

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
  if (engine.isFinished()) {
    showResult();
    return;
  }

  locked = false;
  clearInterval(timer);

  const q = engine.currentQuestion(); // 🔒 ENDA TILLÅTNA

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

/* =====================
   SVAR
===================== */
function handleAnswer(index, btn) {
  if (locked) return;
  locked = true;
  clearInterval(timer);

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
  const percent = Math.round((score / total) * 100);

  finalResultEl.innerHTML = `
    <h2>Resultat</h2>
    <p>${score} / ${total} rätt</p>
    <p>${percent}%</p>
    <button onclick="location.reload()">Spela igen</button>
  `;
}


