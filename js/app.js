import { QuizEngine } from "./quizEngine.js";

// DOM
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const finalResultEl = document.getElementById("finalResult");

let engine;

// Start
startBtn.addEventListener("click", async () => {
  engine = new QuizEngine();

  await engine.loadQuestions();

  startScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  render();
});

function render() {
  const question = engine.getCurrentQuestion();

  // Slut på quiz
  if (!question) {
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    finalResultEl.textContent =
      `Du fick ${engine.getScore()} av ${engine.getTotal()} rätt`;

    return;
  }

  // Visa fråga
  questionEl.textContent = question.question;
  optionsEl.innerHTML = "";

  question.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = answer;

    btn.addEventListener("click", () => {
      engine.answer(index);
      render();
    });

    optionsEl.appendChild(btn);
  });
}
