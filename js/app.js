import { QuizEngine } from "./quizEngine.js";

const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const finalResult = document.getElementById("finalResult");

const engine = new QuizEngine();

startBtn.addEventListener("click", async () => {
  await engine.loadQuestions();

  startScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  render();
});

function render() {
  const q = engine.getCurrentQuestion();

  if (!q) {
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");
    finalResult.textContent = `Poäng: ${engine.score}`;
    return;
  }

  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";

  q.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.textContent = answer;

    btn.onclick = () => {
      engine.answer(index);
      render();
    };

    optionsEl.appendChild(btn);
  });
}
