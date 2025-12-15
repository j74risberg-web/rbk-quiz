export class QuizEngine {
  constructor() {
    this.questions = [];
    this.index = 0;
    this.score = 0;
  }

  async loadQuestions() {
    const res = await fetch("./data/questions.json");
    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("questions.json attaching är felaktig");
    }

    this.questions = data;
    console.log("Frågor laddade:", this.questions.length);
  }

  getCurrentQuestion() {
    return this.questions[this.index] || null;
  }

  answer(answerIndex) {
    const q = this.getCurrentQuestion();
    if (!q) return;

    if (answerIndex === q.correct) {
      this.score++;
    }

    this.index++;
  }

  isFinished() {
    return this.index >= this.questions.length;
  }

  getScore() {
    return this.score;
  }
}
