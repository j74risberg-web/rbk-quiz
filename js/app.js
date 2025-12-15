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
      // lås alla knappar
      const buttons = document.querySelectorAll(".option");
      buttons.forEach(b => (b.disabled = true));

      // markera rätt / fel
      if (index === q.correct) {
        btn.classList.add("correct");
      } else {
        btn.classList.add("wrong");
        buttons[q.correct].classList.add("correct");
      }

      engine.answer(index);

      // nästa fråga efter kort paus
      setTimeout(() => {
        renderQuestion();
      }, 900);
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
