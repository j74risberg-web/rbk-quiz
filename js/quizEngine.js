export class QuizEngine {
  constructor() {
    this.questions = [];
    this.index = 0;
    this.score = 0;
  }

  async loadQuestions(url = "./data/questions.json") {
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("questions.json måste vara en array");
    }

    this.questions = data;
    this.index = 0;
    this.score = 0;

    console.log("Frågor laddade:", this.questions.length);
  }

  getCurrentQuestion() {
    return this.questions[this.index] ?? null;
  }

  answer(choiceIndex) {
    const q = this.getCurrentQuestion();
    if (!q) return true;

    if (choiceIndex === q.correct) {
      this.score++;
    }

    this.index++;
    return this.index >= this.questions.length;
  }
}
