import { QuizEngine } from "./quizEngine.js";

/* =====================
   HÄMTA DOM-ELEMENT
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
   RENDERA FRÅGA
===================== */
function renderQuestion() {
  const q = engine.current();

  // Inga fler frågor → visa resultat
  if (!q) {
    showResult();
    return;
  }

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
   RESULTATVY
===================== */
function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const total = engine.state.questions.length;
  const score = engine.state.score;
  const percent = Math.round((score / total) * 100);

  let medal = "🥉";
  if (percent >= 80) medal = "🥇";
  else if (percent >= 60) medal = "🥈";

  finalResultEl.innerHTML = `
    <div class="result-box">
      <h2>${medal} Resultat</h2>
      <p><strong>Poäng:</strong> ${score} / ${total}</p>
      <p><strong>Rätt:</strong> ${percent}%</p>
      <p class="result-msg">
        ${
          percent >= 80
            ? "Grymt jobbat! 🔥"
            : percent >= 60
            ? "Bra kämpat 💪"
            : "Ny omgång imorgon 😉"
        }
      </p>
      <button id="restartBtn">Spela igen</button>
    </div>
  `;

  document.getElementById("restartBtn").onclick = () => {
    location.reload();
  };
}
