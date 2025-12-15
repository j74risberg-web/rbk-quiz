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

let engine;

/* =====================
   STARTA QUIZ
===================== */
startBtn.addEventListener("click", async () => {
  engine = new QuizEngine();
  await engine.loadQuestions();

  console.log("Quiz startat");

  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  renderQuestion();
});

/* =====================
   VISA FRÅGA
===================== */
function renderQuestion() {
  if (engine.isFinished()) {
    showResult();
    return;
  }

  const q = engine.getCurrentQuestion();

  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";

  q.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = answer;

    btn.onclick = () => {
      engine.answer(index);
      renderQuestion();
    };

    optionsEl.appendChild(btn);
  });
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
    <h3>${medal} Resultat</h3>
    <p><strong>${score}</strong> av <strong>${total}</strong> rätt</p>
    <p>${percent}%</p>
  `;
}
