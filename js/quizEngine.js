export class QuizEngine {
  constructor() {
    this.questions = [];
    this.index = 0;
    this.score = 0;
  }

  async loadQuestions() {
    const res = await fetch("./data/questions.json");
    this.questions = await res.json();
    console.log("Frågor laddade:", this.questions.length);
  }

  currentQuestion() {
    return this.questions[this.index] || null;
  }

  answer(answerIndex) {
    const q = this.currentQuestion();
    if (!q) return false;

    const correct = answerIndex === q.correct;
    if (correct) this.score++;

    this.index++;
    return correct;
  }

  isFinished() {
    return this.index >= this.questions.length;
  }

  getScore() {
    return this.score;
  }

  getTotal() {
    return this.questions.length;
  }
}
