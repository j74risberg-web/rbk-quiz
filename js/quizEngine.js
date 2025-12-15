export class QuizEngine {
  constructor() {
    this.state = {
      index: 0,
      score: 0,
      questions: []
    };
  }

  async loadQuestions() {
    const res = await fetch("./data/questions.json");
    const data = await res.json();

    // FÖR SÄKERHET: tvinga array
    this.state.questions = Array.isArray(data) ? data : [];
  }

  current() {
    return this.state.questions[this.state.index] || null;
  }

  answer(choiceIndex) {
    const q = this.current();
    if (!q) return true;

    if (choiceIndex === q.correct) {
      this.state.score++;
    }

    this.state.index++;
    return this.state.index >= this.state.questions.length;
  }
}
