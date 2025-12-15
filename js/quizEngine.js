export class QuizEngine {
  constructor({ difficulty, weekKey }) {
    this.difficulty = difficulty;
    this.weekKey = weekKey;

    this.state = {
      index: 0,
      score: 0,
      questions: []
    };
  }

  async loadQuestions() {
    const res = await fetch("./data/questions.json");
    const allQuestions = await res.json();

    // filtrera på svårighetsgrad
    const filtered = allQuestions.filter(
      q => q.difficulty === this.difficulty
    );

    // blanda frågorna
    const shuffled = filtered.sort(() => 0.5 - Math.random());

    // hur många frågor per svårighetsgrad
    const config = {
      easy: 3,
      hard: 4,
      brutal: 5
    };

    this.state.questions = shuffled.slice(
      0,
      config[this.difficulty] || 4
    );
  }

  current() {
    return this.state.questions[this.state.index];
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
