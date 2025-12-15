import { QuizEngine } from "./quizEngine.js";

const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const finalResult = document.getElementById("finalResult");

let engine;

startBtn.addEventListener("click", async () => {
  engine = new QuizEngine();
  await engine.loadQuestions();

  startScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  render();
});

function render() {
  const q = engine.current();

  // SLUT PÅ QUIZ
  if (!q) {
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");
    finalResult.textContent = `Poäng: ${engine.score} / ${engine.questions.length}`;
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
      render();
    };

    optionsEl.appendChild(btn);
  });
}
