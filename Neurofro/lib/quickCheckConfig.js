export const MEMORY_DISPLAY_SECONDS = 5;

const ORIENTATION_BANK = [
  {
    id: "day",
    question: "What day is today?",
    category: "orientation",
    points: 1,
    getOptions: () => {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const correct = days[new Date().getDay()];
      const wrong = shuffleArray(days.filter(d => d !== correct)).slice(0, 3);
      return shuffleArray([correct, ...wrong]);
    },
    getCorrect: () => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()],
  },
  {
    id: "month",
    question: "What month is it?",
    category: "orientation",
    points: 1,
    getOptions: () => {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const correct = months[new Date().getMonth()];
      const wrong = shuffleArray(months.filter(m => m !== correct)).slice(0, 3);
      return shuffleArray([correct, ...wrong]);
    },
    getCorrect: () => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][new Date().getMonth()],
  },
  {
    id: "year",
    question: "What year is it?",
    category: "orientation",
    points: 1,
    getOptions: () => {
      const y = new Date().getFullYear();
      const options = [y, y - 1, y + 1, y - 2].map(String);
      return shuffleArray(options);
    },
    getCorrect: () => String(new Date().getFullYear()),
  },
  {
    id: "time",
    question: "What time of day is it generally?",
    category: "orientation",
    points: 1,
    getOptions: () => shuffleArray(["Morning", "Afternoon", "Evening", "Night"]),
    getCorrect: () => {
      const h = new Date().getHours();
      if (h >= 5 && h < 12) return "Morning";
      if (h >= 12 && h < 17) return "Afternoon";
      if (h >= 17 && h < 21) return "Evening";
      return "Night";
    },
  }
];

const WORD_POOL = [
  "Apple", "Chair", "River", "Dog", "Table", "Sky", 
  "Book", "Car", "Tree", "Phone", "Glass", "Road", 
  "Flower", "Pen", "House", "Bird", "Cup", "Hat",
  "Shoe", "Sun", "Cloud", "Star", "Bread", "Clock", 
  "Grass", "Train", "Plane", "Coin", "Key", "Door"
];

const ATTENTION_BANK = [
  { id: "att1", question: "100 - 7 = ?", correct: "93", distractors: ["86", "97", "107"], category: "attention", points: 2 },
  { id: "att2", question: "50 + 25 = ?", correct: "75", distractors: ["65", "85", "70"], category: "attention", points: 2 },
  { id: "att3", question: "30 - 12 = ?", correct: "18", distractors: ["16", "22", "8"], category: "attention", points: 2 },
  { id: "att4", question: "15 × 2 = ?", correct: "30", distractors: ["25", "35", "20"], category: "attention", points: 2 },
  { id: "att5", question: "60 ÷ 5 = ?", correct: "12", distractors: ["10", "15", "14"], category: "attention", points: 2 },
];

const LOGIC_BANK = [
  { id: "log1", question: "What comes next: 2, 4, 6, __", correct: "8", distractors: ["7", "10", "12"], category: "logic", points: 2 },
  { id: "log2", question: "What comes next: 5, 10, 15, __", correct: "20", distractors: ["25", "30", "18"], category: "logic", points: 2 },
  { id: "log3", question: "What comes next: 1, 3, 5, __", correct: "7", distractors: ["6", "8", "9"], category: "logic", points: 2 },
  { id: "log4", question: "What comes next: 10, 20, 30, __", correct: "40", distractors: ["50", "35", "100"], category: "logic", points: 2 },
];

const LANGUAGE_BANK = [
  { id: "lan1", question: "Which word is different?", correct: "Apple", distractors: ["Dog", "Cat", "Cow"], category: "language", points: 2 },
  { id: "lan2", question: "Choose the correct spelling:", correct: "Receive", distractors: ["Recieve", "Recive", "Receve"], category: "language", points: 2 },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function processStaticBank(bank) {
  return bank.map(q => ({
    ...q,
    options: shuffleArray([q.correct, ...q.distractors])
  }));
}

export function generateSessionData() {
  if (typeof window === "undefined") return null;
  // History structure: { memoryWords: [...last3], questions: [...last3] }
  let history = { memoryWords: [], questions: [] };
  try {
    const stored = localStorage.getItem("quickCheckHistory");
    if (stored) {
      const parsed = JSON.parse(stored);
      history.memoryWords = parsed.memoryWords || [];
      history.questions = parsed.questions || [];
    }
  } catch(e) {}

  const filterPool = (pool, historyList) => {
    let available = pool.filter(item => !historyList.includes(item.id));
    if (available.length === 0) available = pool; // fallback
    return available;
  };

  // 1. Pick memory words
  let availMem = WORD_POOL.filter(w => !history.memoryWords.includes(w));
  if (availMem.length < 3) availMem = WORD_POOL;
  const selectedMemWords = shuffleArray(availMem).slice(0, 3);

  // 2. Pick ORIENTATION (2)
  let availOri = filterPool(ORIENTATION_BANK, history.questions);
  if (availOri.length < 2) availOri = ORIENTATION_BANK;
  const selectedOri = shuffleArray(availOri).slice(0, 2).map(q => ({
    ...q,
    options: q.getOptions(),
    correct: q.getCorrect()
  }));

  // 3. Pick ATTENTION (2)
  let availAtt = filterPool(ATTENTION_BANK, history.questions);
  if (availAtt.length < 2) availAtt = ATTENTION_BANK;
  const selectedAtt = processStaticBank(shuffleArray(availAtt).slice(0, 2));

  // 4. Pick LOGIC (1)
  let availLog = filterPool(LOGIC_BANK, history.questions);
  const selectedLog = processStaticBank(shuffleArray(availLog).slice(0, 1));

  // 5. Pick LANGUAGE (1)
  let availLan = filterPool(LANGUAGE_BANK, history.questions);
  const selectedLan = processStaticBank(shuffleArray(availLan).slice(0, 1));

  const sessionQuestions = [...selectedOri, ...selectedAtt, ...selectedLog, ...selectedLan];

  // Update history
  const newHist = {
    memoryWords: [...selectedMemWords, ...history.memoryWords].slice(0, 9), // Keep last 9 words away to avoid immediate repeats
    questions: [...sessionQuestions.map(q => q.id), ...history.questions].slice(0, 15) // store last ~15 Qs
  };
  localStorage.setItem("quickCheckHistory", JSON.stringify(newHist));

  return {
    memoryWords: selectedMemWords,
    questions: sessionQuestions,
  };
}

// 2 ori (1x2), 2 att (2x2), 1 logic (2x1), 1 lang (2x1), 1 memory recall (3 words = 3x1)
export const MAX_POINTS = 2 + 4 + 2 + 2 + 3; 
