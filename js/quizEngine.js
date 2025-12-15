export class QuizEngine {
  constructor() {
    this.allQuestions = [];
    this.questions = [];
    this.index = 0;
    this.score = 0;

    this.categories = [
      "hotell",
      "restauranger",
      "nattklubbar",
      "teatrar_biografer",
      "huvudkontor"
    ];
  }

  async loadQuestions() {
    const res = await fetch("./data/questions.json");
    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("questions.json måste vara en array");
    }

    this.allQuestions = data;

    // 🎯 välj 4 slumpade frågor från olika kategorier
    this.questions = this.pickQuestionsByCategory(4);

    this.index = 0;
    this.score = 0;

    console.log("Utvalda frågor:", this.questions);
  }

  /* =====================
     SLUMPLOGIK
  ===================== */
  pickQuestionsByCategory(count) {
    const result = [];
    const shuffledCategories = [...this.categories]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    shuffledCategories.forEach((category) => {
      const pool = this.allQuestions.filter(
        (q) => q.category === category
      );

      if (pool.length === 0) return;

      const randomQuestion =
        pool[Math.floor(Math.random() * pool.length)];

      result.push(randomQuestion);
    });

    return result;
  }

  /* =====================
     QUIZ-FUNKTIONER
  ===================== */
  currentQuestion() {
    return this.questions[this.index] || null;
  }

  answer(answerIndex) {
    const q = this.currentQuestion();
    if (!q) return false;

    if (answerIndex === q.correct) {
      this.score++;
    }

    this.index++;
    return true;
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

