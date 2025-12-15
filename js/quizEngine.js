export class QuizEngine {
  constructor(options = {}) {
    this.dataUrl = options.dataUrl || "./data/questions.json";

    this.questions = [];
    this.index = 0;
    this.score = 0;
  }

  async loadQuestions() {
    const response = await fetch(this.dataUrl);
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("questions.json måste vara en array");
    }

    this.questions = data;
    this.index = 0;
    this.score = 0;

    console.log("Frågor laddade:", this.questions.length);
  }

  current() {
    if (this.index >= this.questions.length) {
      return null;
    }
    return this.questions[this.index];
  }

  answer(answerIndex) {
    const question = this.current();
    if (!question) return;

    if (answerIndex === question.correct) {
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

  getTotal() {
    return this.questions.length;
  }
}
