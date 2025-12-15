export class QuizEngine {
  constructor() {
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
  }

  async loadQuestions(url = "./data/questions.json") {
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Inga giltiga frågor hittades");
    }

    this.questions = data;
    this.currentIndex = 0;
    this.score = 0;

    console.log("Frågor laddade:", this.questions.length);
  }

  getCurrentQuestion() {
    return this.questions[this.currentIndex] || null;
  }

  answer(answerIndex) {
    const q = this.getCurrentQuestion();
    if (!q) return false;

    if (answerIndex === q.correct) {
      this.score++;
    }

    this.currentIndex++;
    return this.currentIndex < this.questions.length;
  }

  isFinished() {
    return this.currentIndex >= this.questions.length;
  }

  getScore() {
    return this.score;
  }
}
