const CATEGORY_META = {
  hotell: {
    label: "Hotell",
    icon: "🛏️"
  },
  restauranger: {
    label: "Restaurang",
    icon: "🍽️"
  },
  nattklubbar: {
    label: "Nattklubb",
    icon: "💃"
  },
  teatrar_biografer: {
    label: "Teater / Bio",
    icon: "🎭"
  },
  huvudkontor: {
    label: "Huvudkontor",
    icon: "💼"
  },
  ambassader: {
    label: "Ambassad",
    icon: "🏛️"
  }
};
export class QuizEngine {
  constructor() {
    this.questions = [];
    this.index = 0;
    this.score = 0;
  }

  async loadQuestions() {
    const res = await fetch("./data/places.json");
    const places = await res.json();

    this.questions = this.generateQuestions(places);
    console.log("Genererade frågor:", this.questions.length);
  }

  generateQuestions(places) {
    const categories = Object.keys(places);
    const questions = [];

    // Slumpa max 5 frågor, en per kategori
    shuffle(categories)
      .slice(0, 5)
      .forEach(category => {
        const list = places[category];
        if (!list || list.length < 4) return;

        const correct = randomItem(list);

        const wrongs = shuffle(
          list.filter(p => p.name !== correct.name)
        ).slice(0, 3);

        const answers = shuffle([
          correct.address,
          ...wrongs.map(p => p.address)
        ]);

        const meta = CATEGORY_META[category];

questions.push({
  category,
  question: `${meta.icon} ${meta.label}: Var ligger ${correct.name}?`,
  answers,
  correct: answers.indexOf(correct.address)
});

      });

    return questions;
  }

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

/* =====================
   HJÄLPFUNKTIONER
===================== */
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
